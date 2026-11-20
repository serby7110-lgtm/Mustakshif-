import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  CheckCircle2,
  Crown,
  RotateCcw,
  ExternalLink,
  Heart,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Card } from '../components/primitives/Card';
import { storage } from '../data/storage';
import { useTheme } from '../theme/ThemeContext';
import { logAnalyticsEvent } from '../lib/firebase';
import {
  PLAY_SUBSCRIPTIONS_URL,
  TipProductId,
  startPremiumSubscriptionPurchase,
  restorePremiumPurchases,
  purchaseConsumableTip,
} from '../services/subscription';
import { useI18n } from '../i18n/i18n';

export interface SubscriptionScreenProps {
  onBack: () => void;
  isPremiumActive?: boolean;
  onEntitlementUpdated?: (active: boolean) => void;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({
  onBack,
  isPremiumActive,
  onEntitlementUpdated,
}) => {
  const { tokens, isDark } = useTheme();
  const { t, dir } = useI18n();
  const [subDetails, setSubDetails] = useState(() => storage.getSubscriptionDetails());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const effectiveActive = isPremiumActive ?? subDetails?.active ?? false;

  useEffect(() => {
    logAnalyticsEvent('paywall_view', { source: 'subscription_screen' });
  }, []);

  useEffect(() => {
    const refresh = () => setSubDetails(storage.getSubscriptionDetails());
    refresh();
    window.addEventListener('mustakshif:entitlement-changed', refresh);
    return () => window.removeEventListener('mustakshif:entitlement-changed', refresh);
  }, [isPremiumActive]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleActivateSubscription = () => {
    const res = startPremiumSubscriptionPurchase();
    setToastMessage(res.messageKey ? t(res.messageKey, { defaultValue: res.message }) : res.message);
    if (res.success) {
      setSubDetails(storage.getSubscriptionDetails());
      onEntitlementUpdated?.(true);
    }
  };

  const handleRestore = () => {
    const res = restorePremiumPurchases();
    setToastMessage(res.messageKey ? t(res.messageKey, { defaultValue: res.message }) : res.message);
    const updated = storage.getSubscriptionDetails();
    setSubDetails(updated);
    onEntitlementUpdated?.(Boolean(updated?.active));
  };

  const handleTipPurchase = (tipId: TipProductId) => {
    const res = purchaseConsumableTip(tipId);
    setToastMessage(res.messageKey ? t(res.messageKey, { defaultValue: res.message }) : res.message);
  };

  const benefits = [t('longForm.benefit1'), t('longForm.benefit2')];
  const tips = [
    { id: 'tip_1' as TipProductId, label: t('subscription.tipSmall'), fallbackPrice: '$1.99' },
    { id: 'tip_3' as TipProductId, label: t('subscription.tipMedium'), fallbackPrice: '$3.99' },
    { id: 'tip_5' as TipProductId, label: t('subscription.tipLarge'), fallbackPrice: '$5.99' },
  ];

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-200" dir={dir}>
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
            color: tokens.textPrimary,
          }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl border shadow-xl flex items-center gap-2.5 backdrop-blur-md"
        >
          <div
            style={{ backgroundColor: 'rgba(61, 220, 151, 0.2)' }}
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          >
            <Check size={14} style={{ color: '#0E5C4D' }} />
          </div>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label={t('common.back')}
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
              color: tokens.deepAccent,
            }}
            className="w-11 h-11 rounded-2xl border shadow-sm flex items-center justify-center cursor-pointer hover:opacity-90"
          >
            <ChevronRight size={22} className={dir === 'ltr' ? 'rotate-180' : ''} />
          </button>
          <div>
            <h1
              style={{ color: tokens.deepAccent }}
              className="font-['Aref_Ruqaa',serif] text-2xl sm:text-3xl font-bold leading-tight"
            >
              {t('subscription.title')}
            </h1>
            <p style={{ color: tokens.textSecondary }} className="text-xs font-['Cairo',sans-serif]">
              {t('subscription.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Billing unavailable fallback notice */}
      {!subDetails?.isBillingAvailable && (
        <div
          role="alert"
          style={{
            backgroundColor: isDark ? 'rgba(74, 144, 217, 0.16)' : '#E8F1FB',
            borderColor: '#4A90D9',
            color: isDark ? '#9FE8CC' : '#0E5C4D',
          }}
          className="p-4 rounded-2xl border flex items-center gap-3 text-xs sm:text-sm font-bold"
        >
          <AlertCircle size={18} style={{ color: '#4A90D9' }} className="shrink-0" />
          <span>{t('subscription.billingUnavailable')}</span>
        </div>
      )}

      {/* Status Card */}
      <Card variant="white" elevation="card" padded="lg" className="rounded-[22px] space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              style={{
                backgroundColor: effectiveActive ? 'rgba(61, 220, 151, 0.18)' : tokens.surface,
                color: effectiveActive ? '#3DDC97' : tokens.textSecondary,
                borderColor: tokens.border,
              }}
              className="w-10 h-10 rounded-xl border flex items-center justify-center"
            >
              <Crown size={20} />
            </div>
            <div>
              <h2
                style={{ color: tokens.textPrimary }}
                className="font-['Aref_Ruqaa',serif] text-lg font-bold"
              >
                {t('subscription.statusTitle')}
              </h2>
              <p style={{ color: tokens.textSecondary }} className="text-xs">
                {subDetails?.productId ?? 'premium_monthly'}
              </p>
            </div>
          </div>

          <span
            data-testid="subscription-status-text"
            style={{
              color: effectiveActive ? '#3DDC97' : tokens.textSecondary,
              backgroundColor: effectiveActive ? 'rgba(61, 220, 151, 0.14)' : tokens.surface,
              borderColor: effectiveActive ? '#3DDC97' : tokens.borderSubtle,
            }}
            className="px-3.5 py-1 rounded-full text-xs font-bold border"
          >
            {effectiveActive ? t('subscription.active') : t('subscription.inactive')}
          </span>
        </div>

        {effectiveActive && (
          <p style={{ color: tokens.textSecondary }} className="text-xs font-['Cairo',sans-serif]">
            {t('subscription.renewalDate')}{' '}
            <span className="font-mono font-bold">
              {subDetails?.renewalDate?.trim() ? subDetails.renewalDate : t('subscription.activeLocally')}
            </span>
          </p>
        )}

        <div
          style={{
            backgroundColor: isDark ? 'rgba(74, 144, 217, 0.15)' : '#E8F1FB',
            borderColor: 'rgba(74, 144, 217, 0.35)',
          }}
          className="p-3.5 rounded-2xl border flex items-center justify-between"
        >
          <span style={{ color: tokens.textPrimary }} className="text-xs font-bold">
            {t('subscription.priceLabel')}
          </span>
          <span style={{ color: '#4A90D9' }} className="text-sm font-bold font-mono">
            {subDetails?.price || '$2.99'} / {t('subscription.monthly')}
          </span>
        </div>
      </Card>

      {/* Benefits Card */}
      <Card variant="white" elevation="card" padded="lg" className="rounded-[22px] space-y-3">
        <h2
          style={{ color: tokens.deepAccent }}
          className="font-['Aref_Ruqaa',serif] text-lg font-bold"
        >
          {t('subscription.benefitsTitle')}
        </h2>
        <ul className="space-y-2.5">
          {benefits.map((benefit) => (
            <li
              key={benefit}
              style={{ color: tokens.textPrimary }}
              className="flex items-center gap-2.5 text-sm font-medium"
            >
              <CheckCircle2 size={18} style={{ color: '#3DDC97' }} className="shrink-0" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Primary Action Buttons */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleActivateSubscription}
          style={{
            backgroundColor: '#4A90D9',
            color: '#FFFFFF',
          }}
          className="w-full py-3.5 px-5 rounded-2xl text-sm font-bold shadow-md hover:opacity-95 active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[50px]"
        >
          <Crown size={18} />
          <span>{t('subscription.activateCta') || 'شحن / تفعيل الاشتراك'}</span>
        </button>

        <button
          type="button"
          onClick={handleRestore}
          style={{
            backgroundColor: tokens.card,
            borderColor: '#4A90D9',
            color: isDark ? '#7FB2E8' : '#4A90D9',
          }}
          className="w-full py-3 px-5 rounded-2xl border text-sm font-bold hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
        >
          <RotateCcw size={16} />
          <span>{t('subscription.restoreCta') || 'استعادة المشتريات'}</span>
        </button>

        <a
          href={PLAY_SUBSCRIPTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => logAnalyticsEvent('manage_subscription')}
          style={{
            backgroundColor: tokens.surface,
            borderColor: tokens.border,
            color: tokens.textPrimary,
          }}
          className="w-full py-3 px-5 rounded-2xl border text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 min-h-[48px]"
        >
          <ExternalLink size={16} />
          <span>{t('subscription.manageCta') || 'إدارة الاشتراك / الإلغاء'}</span>
        </a>
      </div>

      {/* Tips Row: tip_1, tip_3, tip_5 */}
      <Card variant="white" elevation="subtle" padded="lg" className="rounded-[22px] space-y-3">
        <div className="flex items-center gap-2">
          <Heart size={18} style={{ color: '#4A90D9' }} />
          <h3
            style={{ color: tokens.textPrimary }}
            className="font-['Aref_Ruqaa',serif] text-base font-bold"
          >
            {t('subscription.tipsTitle')}
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {tips.map((tip) => (
            <button
              key={tip.id}
              type="button"
              data-product-id={tip.id}
              onClick={() => handleTipPurchase(tip.id)}
              style={{
                backgroundColor: isDark ? tokens.surface : '#F2FBF7',
                borderColor: tokens.border,
                color: tokens.deepAccent,
              }}
              className="p-3 rounded-2xl border text-center hover:border-[#4A90D9] transition-all cursor-pointer space-y-1 min-h-[56px]"
            >
              <span className="block text-xs font-bold">{tip.label}</span>
              <span className="block text-[11px] font-mono" style={{ color: '#4A90D9' }}>
                {tip.fallbackPrice}
              </span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SubscriptionScreen;
