package com.mustakshif.app.data

import android.app.Activity
import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.ConsumeParams
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import com.mustakshif.app.ads.AdManager
import com.mustakshif.app.firebase.AnalyticsManager
import com.mustakshif.app.firebase.CrashlyticsHelper
import com.mustakshif.app.firebase.PlayServicesGuard
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

private val Context.entitlementDataStore: DataStore<Preferences> by preferencesDataStore(
    name = "mustakshif_entitlements_ds"
)

/**
 * Subscription & Tips entitlement manager for Mustakshif.
 * - Single source of truth: Google Play Billing (queryPurchasesAsync for SUBS).
 * - Zero account / login requirement.
 * - Persists verified entitlement in Jetpack DataStore with a 7-day offline grace period.
 * - Manages "premium_monthly" subscription and consumable tips ("tip_1", "tip_3", "tip_5").
 */
object EntitlementManager {

    const val PRODUCT_PREMIUM_MONTHLY = LongFormEntry.PREMIUM_MONTHLY_PRODUCT_ID
    const val PRODUCT_TIP_1 = "tip_1"
    const val PRODUCT_TIP_3 = "tip_3"
    const val PRODUCT_TIP_5 = "tip_5"

    const val MANAGE_SUBSCRIPTIONS_URL =
        "https://play.google.com/store/account/subscriptions?package=com.sink.mustakshif"

    const val OFFLINE_GRACE_PERIOD_MS = 7L * 24L * 60L * 60L * 1000L

    private val KEY_PREMIUM_ACTIVE = booleanPreferencesKey("premium_monthly_active")
    private val KEY_LAST_VERIFIED_AT_MS = longPreferencesKey("premium_last_verified_at_ms")
    private val KEY_RENEWAL_DATE_TEXT = stringPreferencesKey("premium_renewal_date_text")
    private val KEY_PRICE_TEXT = stringPreferencesKey("premium_price_text")
    private val KEY_BILLING_PERIOD = stringPreferencesKey("premium_billing_period")

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val _hasPremiumMonthly = MutableStateFlow(false)
    val hasPremiumMonthly: StateFlow<Boolean> = _hasPremiumMonthly.asStateFlow()

    private val _isBillingAvailable = MutableStateFlow(true)
    val isBillingAvailable: StateFlow<Boolean> = _isBillingAvailable.asStateFlow()

    private val _formattedPrice = MutableStateFlow("")
    val formattedPrice: StateFlow<String> = _formattedPrice.asStateFlow()

    private val _billingPeriodLabel = MutableStateFlow("شهرياً")
    val billingPeriodLabel: StateFlow<String> = _billingPeriodLabel.asStateFlow()

    private val _renewalDateText = MutableStateFlow<String?>(null)
    val renewalDateText: StateFlow<String?> = _renewalDateText.asStateFlow()

    private val _tipPrices = MutableStateFlow<Map<String, String>>(emptyMap())
    val tipPrices: StateFlow<Map<String, String>> = _tipPrices.asStateFlow()

    private val _statusMessage = MutableStateFlow<String?>(null)
    val statusMessage: StateFlow<String?> = _statusMessage.asStateFlow()

    @Volatile
    private var appContext: Context? = null

    @Volatile
    private var billingClient: BillingClient? = null

    @Volatile
    private var cachedSubscriptionDetails: ProductDetails? = null

    private val cachedTipDetails = mutableMapOf<String, ProductDetails>()

    private val purchasesUpdatedListener = PurchasesUpdatedListener { billingResult, purchases ->
        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            processVerifiedPurchases(purchases, isFromNewPurchase = true)
        } else if (
            billingResult.responseCode == BillingClient.BillingResponseCode.BILLING_UNAVAILABLE ||
            billingResult.responseCode == BillingClient.BillingResponseCode.SERVICE_UNAVAILABLE
        ) {
            _isBillingAvailable.value = false
            _statusMessage.value = "خدمة الاشتراك غير متاحة على هذا الجهاز"
        }
    }

    fun init(context: Context) {
        val ctx = context.applicationContext
        appContext = ctx

        scope.launch {
            loadCachedEntitlementFromDataStore(ctx)
        }

        refreshEntitlements(ctx)
    }

    private suspend fun loadCachedEntitlementFromDataStore(ctx: Context) {
        try {
            val prefs = ctx.entitlementDataStore.data.first()
            val cachedActive = prefs[KEY_PREMIUM_ACTIVE] ?: false
            val lastVerifiedAt = prefs[KEY_LAST_VERIFIED_AT_MS] ?: 0L
            val now = System.currentTimeMillis()
            val withinGrace = (now - lastVerifiedAt) <= OFFLINE_GRACE_PERIOD_MS

            val effectiveActive = cachedActive && withinGrace
            _hasPremiumMonthly.value = effectiveActive
            if (effectiveActive) {
                AdManager.clearLoadedAds()
            }
            prefs[KEY_PRICE_TEXT]?.let { if (it.isNotBlank()) _formattedPrice.value = it }
            prefs[KEY_BILLING_PERIOD]?.let { if (it.isNotBlank()) _billingPeriodLabel.value = it }
            _renewalDateText.value = prefs[KEY_RENEWAL_DATE_TEXT]
        } catch (_: Throwable) {
            _hasPremiumMonthly.value = false
        }
    }

    /**
     * Queries Google Play Billing for active subscriptions (BillingClient.ProductType.SUBS)
     * via queryPurchasesAsync and preloads Play product pricing.
     */
    fun refreshEntitlements(context: Context) {
        val ctx = context.applicationContext
        appContext = ctx

        if (!PlayServicesGuard.isGooglePlayServicesAvailable(ctx)) {
            _isBillingAvailable.value = false
            return
        }

        try {
            val client = getOrCreateBillingClient(ctx)
            if (client.isReady) {
                _isBillingAvailable.value = true
                queryActiveSubscriptions(client, isUserRestore = false)
                queryProductCatalog(client)
            } else {
                client.startConnection(object : BillingClientStateListener {
                    override fun onBillingSetupFinished(billingResult: BillingResult) {
                        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                            _isBillingAvailable.value = true
                            queryActiveSubscriptions(client, isUserRestore = false)
                            queryProductCatalog(client)
                        } else if (
                            billingResult.responseCode == BillingClient.BillingResponseCode.BILLING_UNAVAILABLE ||
                            billingResult.responseCode == BillingClient.BillingResponseCode.SERVICE_UNAVAILABLE
                        ) {
                            _isBillingAvailable.value = false
                        }
                    }

                    override fun onBillingServiceDisconnected() {
                        // Reconnect on next refreshEntitlements or action
                    }
                })
            }
        } catch (t: Throwable) {
            _isBillingAvailable.value = false
            CrashlyticsHelper.recordNonFatal("PlayBillingRefresh", t)
        }
    }

    fun restorePurchases(context: Context) {
        AnalyticsManager.logRestorePurchases()
        val ctx = context.applicationContext
        appContext = ctx

        if (!PlayServicesGuard.isGooglePlayServicesAvailable(ctx)) {
            _isBillingAvailable.value = false
            _statusMessage.value = "خدمة الاشتراك غير متاحة على هذا الجهاز"
            return
        }

        try {
            val client = getOrCreateBillingClient(ctx)
            if (client.isReady) {
                queryActiveSubscriptions(client, isUserRestore = true)
            } else {
                client.startConnection(object : BillingClientStateListener {
                    override fun onBillingSetupFinished(billingResult: BillingResult) {
                        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                            _isBillingAvailable.value = true
                            queryActiveSubscriptions(client, isUserRestore = true)
                        } else {
                            _isBillingAvailable.value = false
                            _statusMessage.value = "خدمة الاشتراك غير متاحة على هذا الجهاز"
                        }
                    }

                    override fun onBillingServiceDisconnected() {}
                })
            }
        } catch (t: Throwable) {
            _statusMessage.value = "خدمة الاشتراك غير متاحة على هذا الجهاز"
            CrashlyticsHelper.recordNonFatal("PlayBillingRestore", t)
        }
    }

    private fun getOrCreateBillingClient(context: Context): BillingClient {
        val existing = billingClient
        if (existing != null) return existing

        return synchronized(this) {
            billingClient ?: BillingClient.newBuilder(context.applicationContext)
                .setListener(purchasesUpdatedListener)
                .enablePendingPurchases(
                    PendingPurchasesParams.newBuilder()
                        .enableOneTimeProducts()
                        .build()
                )
                .build()
                .also { billingClient = it }
        }
    }

    private fun queryProductCatalog(client: BillingClient) {
        try {
            val subParams = QueryProductDetailsParams.newBuilder()
                .setProductList(
                    listOf(
                        QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(PRODUCT_PREMIUM_MONTHLY)
                            .setProductType(BillingClient.ProductType.SUBS)
                            .build()
                    )
                )
                .build()

            client.queryProductDetailsAsync(subParams) { result, detailsList ->
                if (result.responseCode == BillingClient.BillingResponseCode.OK && detailsList.isNotEmpty()) {
                    val details = detailsList.first()
                    cachedSubscriptionDetails = details
                    val pricingPhase = details.subscriptionOfferDetails
                        ?.firstOrNull()
                        ?.pricingPhases
                        ?.pricingPhaseList
                        ?.firstOrNull()

                    val price = pricingPhase?.formattedPrice.orEmpty()
                    val periodLabel = when (pricingPhase?.billingPeriod) {
                        "P1M" -> "شهرياً"
                        "P1Y" -> "سنوياً"
                        "P1W" -> "أسبوعياً"
                        else -> "شهرياً"
                    }
                    if (price.isNotBlank()) {
                        _formattedPrice.value = price
                    }
                    _billingPeriodLabel.value = periodLabel

                    val ctx = appContext
                    if (ctx != null) {
                        scope.launch {
                            ctx.entitlementDataStore.edit { prefs ->
                                if (price.isNotBlank()) prefs[KEY_PRICE_TEXT] = price
                                prefs[KEY_BILLING_PERIOD] = periodLabel
                            }
                        }
                    }
                }
            }

            val tipProducts = listOf(PRODUCT_TIP_1, PRODUCT_TIP_3, PRODUCT_TIP_5).map { id ->
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(id)
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build()
            }
            val inAppParams = QueryProductDetailsParams.newBuilder()
                .setProductList(tipProducts)
                .build()

            client.queryProductDetailsAsync(inAppParams) { result, detailsList ->
                if (result.responseCode == BillingClient.BillingResponseCode.OK && detailsList.isNotEmpty()) {
                    val updatedPrices = _tipPrices.value.toMutableMap()
                    for (details in detailsList) {
                        cachedTipDetails[details.productId] = details
                        details.oneTimePurchaseOfferDetails?.formattedPrice?.let { price ->
                            updatedPrices[details.productId] = price
                        }
                    }
                    _tipPrices.value = updatedPrices
                }
            }
        } catch (t: Throwable) {
            CrashlyticsHelper.recordNonFatal("PlayBillingCatalog", t)
        }
    }

    private fun queryActiveSubscriptions(client: BillingClient, isUserRestore: Boolean) {
        try {
            val params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build()

            client.queryPurchasesAsync(params) { billingResult, purchases ->
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    processVerifiedPurchases(purchases, isFromNewPurchase = false)
                    if (isUserRestore) {
                        _statusMessage.value = if (_hasPremiumMonthly.value) {
                            "تم تفعيل Premium"
                        } else {
                            "لا توجد اشتراكات نشطة للاستعادة"
                        }
                    }
                } else if (isUserRestore) {
                    _statusMessage.value = "خدمة الاشتراك غير متاحة على هذا الجهاز"
                }
            }
        } catch (t: Throwable) {
            CrashlyticsHelper.recordNonFatal("PlayBillingQueryPurchases", t)
        }
    }

    private fun processVerifiedPurchases(purchases: List<Purchase>, isFromNewPurchase: Boolean) {
        var activePremium = false
        var latestPurchaseTimeMs = 0L

        for (purchase in purchases) {
            val isPurchased = purchase.purchaseState == Purchase.PurchaseState.PURCHASED
            if (!isPurchased) continue

            if (purchase.products.contains(PRODUCT_PREMIUM_MONTHLY)) {
                activePremium = true
                if (purchase.purchaseTime > latestPurchaseTimeMs) {
                    latestPurchaseTimeMs = purchase.purchaseTime
                }
                if (!purchase.isAcknowledged) {
                    acknowledgePurchaseSafely(purchase)
                }
            }

            if (purchase.products.any { it == PRODUCT_TIP_1 || it == PRODUCT_TIP_3 || it == PRODUCT_TIP_5 }) {
                consumeTipPurchaseSafely(purchase)
            }
        }

        updateCachedEntitlement(activePremium, latestPurchaseTimeMs)

        if (activePremium) {
            AdManager.clearLoadedAds()
            if (isFromNewPurchase) {
                AnalyticsManager.logSubscribeSuccess(PRODUCT_PREMIUM_MONTHLY)
                _statusMessage.value = "تم تفعيل Premium"
            }
        }
    }

    private fun acknowledgePurchaseSafely(purchase: Purchase) {
        val client = billingClient ?: return
        if (!client.isReady) return
        try {
            val ackParams = AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchase.purchaseToken)
                .build()
            client.acknowledgePurchase(ackParams) { }
        } catch (t: Throwable) {
            CrashlyticsHelper.recordNonFatal("PlayBillingAck", t)
        }
    }

    private fun consumeTipPurchaseSafely(purchase: Purchase) {
        val client = billingClient ?: return
        if (!client.isReady) return
        try {
            val consumeParams = ConsumeParams.newBuilder()
                .setPurchaseToken(purchase.purchaseToken)
                .build()
            client.consumeAsync(consumeParams) { result, _ ->
                if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                    val tipId = purchase.products.firstOrNull().orEmpty()
                    if (tipId.isNotBlank()) {
                        AnalyticsManager.logTipPurchase(tipId)
                    }
                    _statusMessage.value = "شكراً لدعمك مستكشف!"
                }
            }
        } catch (t: Throwable) {
            CrashlyticsHelper.recordNonFatal("PlayBillingConsumeTip", t)
        }
    }

    private fun updateCachedEntitlement(active: Boolean, purchaseTimeMs: Long = 0L) {
        _hasPremiumMonthly.value = active
        if (active) {
            AdManager.clearLoadedAds()
        }

        val renewalText = if (active) {
            val baseTime = if (purchaseTimeMs > 0L) purchaseTimeMs else System.currentTimeMillis()
            val nextMonthMs = baseTime + (30L * 24L * 60L * 60L * 1000L)
            java.text.SimpleDateFormat("yyyy/MM/dd", java.util.Locale("ar"))
                .format(java.util.Date(nextMonthMs))
        } else {
            null
        }
        _renewalDateText.value = renewalText

        val ctx = appContext ?: return
        val verifiedNow = System.currentTimeMillis()
        scope.launch {
            try {
                ctx.entitlementDataStore.edit { prefs ->
                    prefs[KEY_PREMIUM_ACTIVE] = active
                    prefs[KEY_LAST_VERIFIED_AT_MS] = verifiedNow
                    if (renewalText != null) {
                        prefs[KEY_RENEWAL_DATE_TEXT] = renewalText
                    } else {
                        prefs.remove(KEY_RENEWAL_DATE_TEXT)
                    }
                }
            } catch (_: Throwable) {
            }
        }
    }

    /**
     * Launches Google Play Billing subscription purchase flow for "premium_monthly".
     * Requires no user account in the app.
     */
    fun launchPurchaseFlow(activity: Activity) {
        AnalyticsManager.logSubscribeStart(PRODUCT_PREMIUM_MONTHLY)
        if (!PlayServicesGuard.isGooglePlayServicesAvailable(activity)) {
            _isBillingAvailable.value = false
            _statusMessage.value = "خدمة الاشتراك غير متاحة على هذا الجهاز"
            return
        }

        try {
            val client = getOrCreateBillingClient(activity.applicationContext)
            val queryAndLaunch = {
                val existingDetails = cachedSubscriptionDetails
                if (existingDetails != null) {
                    launchSubBillingFlowWithDetails(activity, client, existingDetails)
                } else {
                    val productList = listOf(
                        QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(PRODUCT_PREMIUM_MONTHLY)
                            .setProductType(BillingClient.ProductType.SUBS)
                            .build()
                    )
                    val params = QueryProductDetailsParams.newBuilder()
                        .setProductList(productList)
                        .build()

                    client.queryProductDetailsAsync(params) { result, productDetailsList ->
                        if (result.responseCode == BillingClient.BillingResponseCode.OK && productDetailsList.isNotEmpty()) {
                            val details = productDetailsList.first()
                            cachedSubscriptionDetails = details
                            launchSubBillingFlowWithDetails(activity, client, details)
                        } else {
                            _statusMessage.value = "خدمة الاشتراك غير متاحة على هذا الجهاز"
                        }
                    }
                }
            }

            if (client.isReady) {
                queryAndLaunch()
            } else {
                client.startConnection(object : BillingClientStateListener {
                    override fun onBillingSetupFinished(billingResult: BillingResult) {
                        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                            _isBillingAvailable.value = true
                            queryAndLaunch()
                        } else {
                            _isBillingAvailable.value = false
                            _statusMessage.value = "خدمة الاشتراك غير متاحة على هذا الجهاز"
                        }
                    }

                    override fun onBillingServiceDisconnected() {}
                })
            }
        } catch (t: Throwable) {
            _statusMessage.value = "خدمة الاشتراك غير متاحة على هذا الجهاز"
            CrashlyticsHelper.recordNonFatal("PlayBillingLaunch", t)
        }
    }

    private fun launchSubBillingFlowWithDetails(
        activity: Activity,
        client: BillingClient,
        productDetails: ProductDetails
    ) {
        val offerToken = productDetails.subscriptionOfferDetails
            ?.firstOrNull()
            ?.offerToken
        if (offerToken == null) {
            _statusMessage.value = "خدمة الاشتراك غير متاحة على هذا الجهاز"
            return
        }

        val productDetailsParams = BillingFlowParams.ProductDetailsParams.newBuilder()
            .setProductDetails(productDetails)
            .setOfferToken(offerToken)
            .build()

        val flowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(listOf(productDetailsParams))
            .build()

        activity.runOnUiThread {
            if (!activity.isFinishing && !activity.isDestroyed) {
                client.launchBillingFlow(activity, flowParams)
            }
        }
    }

    /**
     * Launches consumable INAPP billing flow for tip_1, tip_3, or tip_5.
     */
    fun launchTipPurchaseFlow(activity: Activity, tipProductId: String) {
        if (tipProductId !in setOf(PRODUCT_TIP_1, PRODUCT_TIP_3, PRODUCT_TIP_5)) return
        if (!PlayServicesGuard.isGooglePlayServicesAvailable(activity)) {
            _isBillingAvailable.value = false
            _statusMessage.value = "خدمة الاشتراك غير متاحة على هذا الجهاز"
            return
        }

        try {
            val client = getOrCreateBillingClient(activity.applicationContext)
            val launchWithDetails = { details: ProductDetails ->
                val productDetailsParams = BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(details)
                    .build()
                val flowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(listOf(productDetailsParams))
                    .build()

                activity.runOnUiThread {
                    if (!activity.isFinishing && !activity.isDestroyed) {
                        client.launchBillingFlow(activity, flowParams)
                    }
                }
            }

            val queryTip = {
                val cached = cachedTipDetails[tipProductId]
                if (cached != null) {
                    launchWithDetails(cached)
                } else {
                    val params = QueryProductDetailsParams.newBuilder()
                        .setProductList(
                            listOf(
                                QueryProductDetailsParams.Product.newBuilder()
                                    .setProductId(tipProductId)
                                    .setProductType(BillingClient.ProductType.INAPP)
                                    .build()
                            )
                        )
                        .build()

                    client.queryProductDetailsAsync(params) { result, detailsList ->
                        if (result.responseCode == BillingClient.BillingResponseCode.OK && detailsList.isNotEmpty()) {
                            val details = detailsList.first()
                            cachedTipDetails[tipProductId] = details
                            launchWithDetails(details)
                        } else {
                            _statusMessage.value = "خدمة الاشتراك غير متاحة على هذا الجهاز"
                        }
                    }
                }
            }

            if (client.isReady) {
                queryTip()
            } else {
                client.startConnection(object : BillingClientStateListener {
                    override fun onBillingSetupFinished(billingResult: BillingResult) {
                        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                            queryTip()
                        } else {
                            _isBillingAvailable.value = false
                            _statusMessage.value = "خدمة الاشتراك غير متاحة على هذا الجهاز"
                        }
                    }

                    override fun onBillingServiceDisconnected() {}
                })
            }
        } catch (t: Throwable) {
            _statusMessage.value = "خدمة الاشتراك غير متاحة على هذا الجهاز"
            CrashlyticsHelper.recordNonFatal("PlayBillingTip", t)
        }
    }

    fun clearStatusMessage() {
        _statusMessage.value = null
    }

    fun isChapterUnlocked(entry: LongFormEntry, chapterIndex: Int): Boolean {
        return entry.isChapterUnlocked(chapterIndex, _hasPremiumMonthly.value)
    }

    fun disconnect() {
        try {
            billingClient?.endConnection()
        } catch (_: Throwable) {
        } finally {
            billingClient = null
        }
    }
}
