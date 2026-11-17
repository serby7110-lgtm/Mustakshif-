import { storage } from '../data/storage';
import { logAnalyticsEvent } from '../lib/firebase';

export const PLAY_SUBSCRIPTIONS_URL =
  'https://play.google.com/store/account/subscriptions?package=com.sink.mustakshif';

export const SUBSCRIPTION_BENEFITS = [
  'فتح كل القصص الطويلة',
  'إزالة كل الإعلانات',
] as const;

export const TIP_PRODUCTS = [
  { id: 'tip_1', label: 'دعم بسيط', labelKey: 'subscription.tipSmall', fallbackPrice: '٣٫٩٩ ر.س' },
  { id: 'tip_3', label: 'دعم متوسط', labelKey: 'subscription.tipMedium', fallbackPrice: '١١٫٩٩ ر.س' },
  { id: 'tip_5', label: 'دعم سخي', labelKey: 'subscription.tipLarge', fallbackPrice: '١٨٫٩٩ ر.س' },
] as const;

export type TipProductId = (typeof TIP_PRODUCTS)[number]['id'];

export interface BillingActionResult {
  success: boolean;
  message: string;
  messageKey: string;
}

export function startPremiumSubscriptionPurchase(): BillingActionResult {
  logAnalyticsEvent('subscribe_start', { product_id: 'premium_monthly' });
  const details = storage.getSubscriptionDetails();

  if (!details.isBillingAvailable) {
    return {
      success: false,
      message: 'خدمة الاشتراك غير متاحة على هذا الجهاز',
      messageKey: 'subscription.billingUnavailable',
    };
  }

  // Optional native Android Play Billing bridge when running inside WebView
  const bridge =
    typeof window !== 'undefined'
      ? (window as unknown as {
          MustakshifBilling?: {
            subscribeMonthly?: () => boolean;
          };
        }).MustakshifBilling
      : undefined;

  if (bridge && typeof bridge.subscribeMonthly === 'function') {
    const launched = bridge.subscribeMonthly();
    if (!launched) {
      return {
        success: false,
        message: 'خدمة الاشتراك غير متاحة على هذا الجهاز',
        messageKey: 'subscription.billingUnavailable',
      };
    }
  }

  storage.setPremiumMonthly(true, {
    price: details.price,
    period: details.period,
  });
  logAnalyticsEvent('subscribe_success', { product_id: 'premium_monthly' });

  return {
    success: true,
    message: 'تم تفعيل Premium',
    messageKey: 'subscription.activatedToast',
  };
}

export function restorePremiumPurchases(): BillingActionResult {
  logAnalyticsEvent('restore_purchases');
  const details = storage.getSubscriptionDetails();

  if (!details.isBillingAvailable) {
    return {
      success: false,
      message: 'خدمة الاشتراك غير متاحة على هذا الجهاز',
      messageKey: 'subscription.billingUnavailable',
    };
  }

  const bridge =
    typeof window !== 'undefined'
      ? (window as unknown as {
          MustakshifBilling?: {
            queryPurchasesAsync?: () => boolean;
          };
        }).MustakshifBilling
      : undefined;

  if (bridge && typeof bridge.queryPurchasesAsync === 'function') {
    const restored = Boolean(bridge.queryPurchasesAsync());
    storage.setPremiumMonthly(restored);
    return {
      success: restored,
      message: restored ? 'تم تفعيل Premium' : 'لا توجد مشتريات نشطة للاستعادة',
      messageKey: restored ? 'subscription.activatedToast' : 'subscription.noActivePurchases',
    };
  }

  const hasExisting = storage.hasPremiumMonthly();
  if (hasExisting) {
    storage.setPremiumMonthly(true);
    return {
      success: true,
      message: 'تم تفعيل Premium',
      messageKey: 'subscription.activatedToast',
    };
  }

  return {
    success: false,
    message: 'لا توجد مشتريات نشطة للاستعادة',
    messageKey: 'subscription.noActivePurchases',
  };
}

export function purchaseConsumableTip(productId: TipProductId): BillingActionResult {
  const details = storage.getSubscriptionDetails();
  if (!details.isBillingAvailable) {
    return {
      success: false,
      message: 'خدمة الاشتراك غير متاحة على هذا الجهاز',
      messageKey: 'subscription.billingUnavailable',
    };
  }

  const bridge =
    typeof window !== 'undefined'
      ? (window as unknown as {
          MustakshifBilling?: {
            purchaseTip?: (id: string) => boolean;
          };
        }).MustakshifBilling
      : undefined;

  if (bridge && typeof bridge.purchaseTip === 'function') {
    const launched = bridge.purchaseTip(productId);
    if (!launched) {
      return {
        success: false,
        message: 'خدمة الاشتراك غير متاحة على هذا الجهاز',
        messageKey: 'subscription.billingUnavailable',
      };
    }
  }

  logAnalyticsEvent('tip_purchase', { product_id: productId });
  return {
    success: true,
    message: 'شكراً لدعمك مستكشف!',
    messageKey: 'subscription.tipThanks',
  };
}
