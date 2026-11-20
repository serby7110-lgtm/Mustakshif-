import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Lock,
  Play,
  Sparkles,
  CheckCircle2,
  Award,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Card } from '../primitives/Card';
import {
  LongFormEntryData,
  LongFormChapter,
  isChapterUnlocked,
} from '../../data/longForm';
import { storage } from '../../data/storage';
import { useTheme } from '../../theme/ThemeContext';
import { logAnalyticsEvent } from '../../lib/firebase';
import {
  SUBSCRIPTION_BENEFITS,
  startPremiumSubscriptionPurchase,
  restorePremiumPurchases,
} from '../../services/subscription';
import { useI18n } from '../../i18n/i18n';
import { isDocumentedEvidenceLabel } from '../../content';

export interface LongFormReaderSectionProps {
  entry: LongFormEntryData;
  bodyTextSizeClass: string;
  isPremiumActive?: boolean;
  onPremiumChange?: (active: boolean) => void;
  onOpenSubscription?: () => void;
}

export const LongFormReaderSection: React.FC<LongFormReaderSectionProps> = ({
  entry,
  bodyTextSizeClass,
  isPremiumActive,
  onPremiumChange,
}) => {
  const { tokens, isDark } = useTheme();
  const { t, lang, dir } = useI18n();
  const [localHasPremiumMonthly, setLocalHasPremiumMonthly] = useState<boolean>(() =>
    storage.hasPremiumMonthly()
  );
  const hasPremiumMonthly = isPremiumActive ?? localHasPremiumMonthly;

  const [subDetails, setSubDetails] = useState(() => storage.getSubscriptionDetails());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const entryId = entry?.id ?? '';
  const chapters = useMemo(
    () => (Array.isArray(entry?.chapters) ? entry.chapters : []),
    [entry]
  );

  const [chapterProgressMap, setChapterProgressMap] = useState<Record<string, number>>(() =>
    storage.getLongFormChapterProgressMap()
  );
  const [resumeState, setResumeState] = useState(() =>
    entryId ? storage.getLongFormResumeState(entryId) : null
  );
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(
    () => (entryId ? storage.getLongFormResumeState(entryId)?.lastChapterIndex : undefined) ?? 0
  );

  useEffect(() => {
    const syncEntitlement = () => {
      const next = storage.hasPremiumMonthly();
      setLocalHasPremiumMonthly(next);
      setSubDetails(storage.getSubscriptionDetails());
    };
    window.addEventListener('mustakshif:entitlement-changed', syncEntitlement);
    return () => window.removeEventListener('mustakshif:entitlement-changed', syncEntitlement);
  }, []);

  useEffect(() => {
    if (entry?.isPremium && !hasPremiumMonthly && entryId) {
      logAnalyticsEvent('paywall_view', { source: `entry:${entryId}` });
    }
  }, [entryId, entry?.isPremium, hasPremiumMonthly]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const overallProgress = useMemo(() => {
    if (!chapters.length || !entryId) return 0;
    const sum = chapters.reduce((acc, ch) => {
      const chId = ch?.id ?? '';
      return acc + (chapterProgressMap[`${entryId}:${chId}`] || 0);
    }, 0);
    return Math.round(sum / chapters.length);
  }, [entryId, chapters, chapterProgressMap]);

  const handleMarkChapterProgress = (ch: LongFormChapter, percent: number) => {
    if (!entryId || !ch) return;
    storage.setLongFormChapterProgress(entryId, ch.id ?? '', ch.index ?? 0, ch.title ?? '', percent);
    setChapterProgressMap(storage.getLongFormChapterProgressMap());
    setResumeState(storage.getLongFormResumeState(entryId));
    setSelectedChapterIdx(ch.index ?? 0);
  };

  const handleResume = () => {
    const idx = resumeState?.lastChapterIndex ?? 0;
    setSelectedChapterIdx(idx);
    const el = document.getElementById(`long-chapter-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleActivatePremium = () => {
    const res = startPremiumSubscriptionPurchase();
    setToastMessage(res.message);
    if (res.success) {
      setLocalHasPremiumMonthly(true);
      setSubDetails(storage.getSubscriptionDetails());
      onPremiumChange?.(true);
    }
  };

  const handleRestorePurchases = () => {
    const res = restorePremiumPurchases();
    setToastMessage(res.message);
    const activeNow = storage.hasPremiumMonthly();
    setLocalHasPremiumMonthly(activeNow);
    setSubDetails(storage.getSubscriptionDetails());
    onPremiumChange?.(activeNow);
  };

  const getEvidenceColors = (label: string) => {
    const isDocumented = isDocumentedEvidenceLabel(label);
    if (isDocumented) {
      return {
        bg: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.28)',
        fg: isDark ? '#9FE8CC' : '#0E5C4D',
        border: isDark ? 'rgba(159, 232, 204, 0.35)' : 'rgba(14, 92, 77, 0.25)',
      };
    }
    return {
      bg: tokens.coolBlueTint,
      fg: tokens.coolBlueAccent,
      border: tokens.border,
    };
  };

  const mainChapters = chapters.filter((c) => !c?.isAppendix).length;
  const appendicesCount = chapters.filter((c) => c?.isAppendix).length;
  const numberLocale = lang === 'ar' ? 'ar-EG' : lang;
  const safeTargetWords = Number.isFinite(entry?.targetWords) ? (entry.targetWords ?? 0) : 0;

  return (
    <section
      aria-label={t('longForm.sectionAria')}
      className="space-y-4 pt-1 text-start"
      dir={dir}
    >
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

      {/* Top Meta + Badges + Resume Card */}
      <Card
        variant="white"
        elevation="card"
        padded="lg"
        className="rounded-[20px] space-y-3"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{
                backgroundColor: tokens.primaryMint,
                color: '#0E5C4D',
              }}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1"
            >
              <BookOpen size={11} />
              <span>{t('longForm.longPill')}</span>
            </span>
            <span
              style={{
                backgroundColor: '#4A90D9',
                color: '#FFFFFF',
              }}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1"
            >
              <Award size={11} />
              <span>{t('longForm.premiumPill')}</span>
            </span>
            <span
              style={{ color: tokens.textSecondary }}
              className="text-[11px] font-['Cairo',sans-serif]"
            >
              {t('longForm.wordGoal', {
                words: safeTargetWords.toLocaleString(numberLocale),
                chapters: mainChapters,
              })}
              {appendicesCount > 0 ? t('longForm.appendices', { count: appendicesCount }) : ''}
            </span>
          </div>

          <span
            style={{ color: tokens.deepAccent }}
            className="text-xs font-bold font-mono"
          >
            {overallProgress}%
          </span>
        </div>

        {/* Overall Progress Bar */}
        <div
          style={{ backgroundColor: tokens.borderSubtle }}
          className="w-full h-2 rounded-full overflow-hidden"
        >
          <div
            style={{
              width: `${overallProgress}%`,
              backgroundColor: tokens.deepAccent,
            }}
            className="h-full transition-all duration-300 rounded-full"
          />
        </div>

        {/* Resume / Start CTA */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <div className="text-xs" style={{ color: tokens.textSecondary }}>
            {resumeState ? (
              <span>
                {t('longForm.lastPosition')}{' '}
                <strong style={{ color: tokens.textPrimary }}>
                  {chapters[resumeState.lastChapterIndex]?.title ?? resumeState.lastChapterTitle ?? ''}
                </strong>{' '}
                ({Number.isFinite(resumeState.chapterProgressPercent) ? resumeState.chapterProgressPercent : 0}%)
              </span>
            ) : (
              <span>{t('longForm.freeChapterNote')}</span>
            )}
          </div>
          {chapters.length > 0 && (
            <button
              type="button"
              onClick={handleResume}
              style={{
                backgroundColor: tokens.deepAccent,
                color: isDark ? '#0B2420' : '#FFFFFF',
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:opacity-90 min-h-[38px]"
            >
              <Play size={13} />
              <span>{resumeState ? t('longForm.resume') : t('longForm.startFree')}</span>
            </button>
          )}
        </div>
      </Card>

      {/* Chapter Cards */}
      <div className="space-y-3.5">
        {chapters.length === 0 ? (
          <Card variant="white" elevation="subtle" className="p-5 rounded-[20px] text-xs font-['Cairo',sans-serif]">
            <span style={{ color: tokens.textSecondary }}>{t('article.noStoryYet')}</span>
          </Card>
        ) : chapters.map((chapter, mapIdx) => {
          const chIndex = chapter?.index ?? mapIdx;
          const chId = chapter?.id ?? `ch-${mapIdx}`;
          const unlocked = isChapterUnlocked(entry, mapIdx, hasPremiumMonthly);
          const chProgress = chapterProgressMap[`${entryId}:${chId}`] || 0;
          const chEvidence = chapter?.evidenceLabel || 'خيال أدبي';
          const evColors = getEvidenceColors(chEvidence);
          const isSelected = selectedChapterIdx === chIndex;
          const paragraphs = Array.isArray(chapter?.paragraphs) ? chapter.paragraphs : [];

          return (
            <Card
              key={chId}
              id={`long-chapter-${chIndex}`}
              variant="white"
              elevation="card"
              padded={false}
              style={{
                borderColor: isSelected ? tokens.deepAccent : tokens.border,
              }}
              className="rounded-[20px] px-4 py-5 space-y-3 border transition-all"
            >
              {/* Chapter Top Pills: Evidence + Free/Lock Status */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span
                  style={{
                    backgroundColor: evColors.bg,
                    color: evColors.fg,
                    borderColor: evColors.border,
                  }}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                >
                  {chEvidence}
                </span>

                <div className="flex items-center gap-2">
                  {chapter?.isAppendix && (
                    <span
                      style={{ color: tokens.textSecondary }}
                      className="text-[11px] font-bold"
                    >
                      {t('longForm.appendix')}
                    </span>
                  )}
                  <span
                    style={{
                      backgroundColor:
                        chIndex === 0 || Boolean(chapter?.isFree)
                          ? 'rgba(127, 209, 174, 0.25)'
                          : '#4A90D9',
                      color:
                        chIndex === 0 || Boolean(chapter?.isFree)
                          ? tokens.deepAccent
                          : '#FFFFFF',
                    }}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1"
                  >
                    {chIndex === 0 || Boolean(chapter?.isFree) ? (
                      <>
                        <Sparkles size={11} />
                        <span>{t('longForm.freeChapterBadge')}</span>
                      </>
                    ) : unlocked ? (
                      <>
                        <CheckCircle2 size={11} />
                        <span>{t('longForm.unlockedBadge')}</span>
                      </>
                    ) : (
                      <>
                        <Lock size={12} strokeWidth={1.9} />
                        <span>{t('longForm.lockedBadge')}</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Chapter Title */}
              <h4
                style={{ color: tokens.deepAccent }}
                className="font-['Aref_Ruqaa',serif] text-lg font-bold leading-snug"
              >
                {chapter?.title ?? ''}
              </h4>

              {/* Per-Chapter Progress Bar */}
              {chProgress > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]" style={{ color: tokens.textSecondary }}>
                    <span>{t('longForm.chapterProgress')}</span>
                    <span className="font-mono font-bold">{chProgress}%</span>
                  </div>
                  <div
                    style={{ backgroundColor: tokens.borderSubtle }}
                    className="w-full h-1.5 rounded-full overflow-hidden"
                  >
                    <div
                      style={{
                        width: `${chProgress}%`,
                        backgroundColor: tokens.primaryMint,
                      }}
                      className="h-full rounded-full transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Chapter Body or Premium Lock Card */}
              {unlocked ? (
                <div className="space-y-3">
                  {paragraphs.length > 0 ? (
                    <div
                      style={{ color: tokens.textPrimary }}
                      className={`space-y-3 reader-body-text font-['Cairo',sans-serif] text-start ${bodyTextSizeClass}`}
                    >
                      {paragraphs.map((p, pIdx) => (
                        <p key={pIdx}>{p ?? ''}</p>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: tokens.coolBlueTint,
                        color: tokens.textSecondary,
                      }}
                      className="p-3 rounded-xl text-xs"
                    >
                      {t('longForm.pendingNotice')}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleMarkChapterProgress(chapter, 100)}
                      style={{
                        backgroundColor: chProgress >= 100 ? tokens.primaryMint : tokens.surface,
                        color: tokens.deepAccent,
                        borderColor: tokens.border,
                      }}
                      className="px-3.5 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={13} />
                      <span>{chProgress >= 100 ? t('longForm.completed100') : t('longForm.markComplete')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: isDark ? 'rgba(74, 144, 217, 0.14)' : '#E8F1FB',
                    borderColor: '#4A90D9',
                  }}
                  className="p-4 rounded-2xl border space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold" style={{ color: tokens.textPrimary }}>
                    <Lock size={16} strokeWidth={1.9} style={{ color: '#4A90D9' }} />
                    <span>{t('longForm.chapter2LockTitle')}</span>
                  </div>

                  {/* Benefits list */}
                  <ul className="space-y-1.5">
                    {SUBSCRIPTION_BENEFITS.map((benefit, idx) => (
                      <li
                        key={benefit}
                        style={{ color: tokens.textPrimary }}
                        className="flex items-center gap-2 text-xs font-medium"
                      >
                        <CheckCircle2 size={14} style={{ color: '#3DDC97' }} className="shrink-0" />
                        <span>{t(`longForm.benefit${idx + 1}`, { defaultValue: benefit })}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Localized Play price */}
                  <div className="text-xs font-bold font-mono" style={{ color: '#4A90D9' }}>
                    {subDetails?.price || '$2.99'} / {t('subscription.monthly')} ({subDetails?.productId ?? 'premium_monthly'})
                  </div>

                  {/* Action Buttons: اشترك الآن + استعادة المشتريات */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleActivatePremium}
                      style={{
                        backgroundColor: '#4A90D9',
                        color: '#FFFFFF',
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer hover:opacity-90 min-h-[42px]"
                    >
                      {t('longForm.subscribeNow') || 'اشترك الآن'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRestorePurchases}
                      style={{
                        backgroundColor: tokens.card,
                        color: isDark ? '#7FB2E8' : '#4A90D9',
                        borderColor: '#4A90D9',
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer hover:opacity-90 min-h-[42px] inline-flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw size={13} />
                      <span>{t('longForm.restorePurchases') || 'استعادة المشتريات'}</span>
                    </button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
};
