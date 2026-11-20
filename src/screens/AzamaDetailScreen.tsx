/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Azama Detail Screen (تفاصيل مدخل كتاب العظمة)
 * Quote rendered in Amiri inside a bordered card with page & world pills,
 * note body text, colored tag pill (مروي mint / متخيَّل violet / مخطوط muted),
 * and tappable related-entry chips. Cool palette only (no gold, no brown).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  BookOpen,
  ScrollText,
  Layers,
  Copy,
  Check,
  Sparkles,
  FileText,
  ShieldAlert,
  Eye,
  Info,
} from 'lucide-react';

import { Card } from '../components/primitives/Card';
import { IconButton } from '../components/primitives/IconButton';
import { AzamaEntry } from '../data/azamaTypes';
import {
  getAzamaEntryById,
  getAzamaCategoryMeta,
  getAzamaTagBadgeStyle,
  getCategoryPillColors,
} from '../utils/azama';
import { storage, FontSize } from '../data/storage';
import { FONT_SETTINGS_EVENT, getBodyTextSizeClass } from '../utils/typography';
import { copyTextSafely } from '../utils/clipboard';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/i18n';

export interface AzamaDetailScreenProps {
  entry: AzamaEntry;
  onBack: () => void;
  onSelectRelated: (entry: AzamaEntry) => void;
}

export const AzamaDetailScreen: React.FC<AzamaDetailScreenProps> = ({
  entry,
  onBack,
  onSelectRelated,
}) => {
  const { t, dir } = useI18n();
  const { tokens, isDark } = useTheme();
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const copyTimerRef = useRef<number | null>(null);
  const [fontSize, setFontSize] = useState<FontSize>(() => storage.getFontSize());

  useEffect(() => {
    const syncFont = () => setFontSize(storage.getFontSize());
    window.addEventListener(FONT_SETTINGS_EVENT, syncFont);
    return () => window.removeEventListener(FONT_SETTINGS_EVENT, syncFont);
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const entryId = entry?.id ?? '';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [entryId]);

  if (!entry) {
    return (
      <article className="space-y-4 pb-10" dir={dir}>
        <button
          type="button"
          onClick={onBack}
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
            color: tokens.deepAccent,
          }}
          className="inline-flex items-center gap-1.5 px-3 h-11 min-h-[44px] rounded-2xl border shadow-xs cursor-pointer text-xs font-bold"
        >
          <ChevronRight size={20} className={`stroke-[2.4] ${dir === 'ltr' ? 'rotate-180' : ''}`} />
          <span>{t('azama.backToList')}</span>
        </button>
      </article>
    );
  }

  const safeTitle = entry.title ?? '';
  const safeQuote = entry.quote ?? '';
  const safeWorld = entry.world ?? 0;
  const safePage = entry.page ?? 0;

  const categoryMeta = getAzamaCategoryMeta(entry.cat);
  const categoryColors = getCategoryPillColors(categoryMeta.color, isDark);
  const tagStyle = getAzamaTagBadgeStyle(entry.tag, isDark);
  const bodySizeClass = getBodyTextSizeClass(fontSize);
  const isSensitive = Boolean(entry.sensitive);
  const isRevealed = !isSensitive || Boolean(revealedIds[entryId]);
  const cautionText = typeof entry.caution === 'string' ? entry.caution.trim() : '';

  const handleRevealSensitive = () => {
    if (!entryId) return;
    setRevealedIds((prev) => ({ ...prev, [entryId]: true }));
  };

  const handleCopyQuote = async () => {
    const payload = `${safeTitle}\n«${safeQuote}»\n— ${t('azama.bannerTitle')} (${t('azama.worldPill', { world: safeWorld })} • ${t('azama.pagePill', { page: safePage })})`;
    const ok = await copyTextSafely(payload);
    if (ok) {
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
      }
      setCopiedQuote(true);
      copyTimerRef.current = window.setTimeout(() => {
        setCopiedQuote(false);
        copyTimerRef.current = null;
      }, 2000);
    }
  };

  return (
    <article
      data-testid="azama-detail-screen"
      className="space-y-4 pb-10 animate-in fade-in duration-200"
      dir={dir}
    >
      {/* Top Bar */}
      <nav aria-label={safeTitle} className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          data-testid="azama-detail-back"
          onClick={onBack}
          aria-label={t('azama.backToList')}
          title={t('azama.backToList')}
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
            color: tokens.deepAccent,
          }}
          className="inline-flex items-center gap-1.5 px-3 h-11 min-h-[44px] min-w-[44px] rounded-2xl border shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer text-xs font-bold"
        >
          <ChevronRight size={20} className={`stroke-[2.4] ${dir === 'ltr' ? 'rotate-180' : ''}`} />
          <span>{t('azama.backToList')}</span>
        </button>

        {isRevealed && (
          <IconButton
            icon={copiedQuote ? <Check size={18} style={{ color: tokens.deepAccent }} /> : <Copy size={18} />}
            label={copiedQuote ? t('common.copied') : t('azama.copyQuote')}
            variant="surface"
            size="md"
            onClick={handleCopyQuote}
          />
        )}
      </nav>

      {/* Source Banner */}
      <div
        data-testid="azama-detail-banner"
        style={{
          backgroundColor: isDark ? 'rgba(74, 144, 217, 0.14)' : '#E8F1FB',
          borderColor: isDark ? 'rgba(127, 178, 232, 0.35)' : 'rgba(74, 144, 217, 0.35)',
        }}
        className="p-3.5 rounded-[18px] border flex items-start gap-2.5 shadow-2xs"
      >
        <div
          style={{
            backgroundColor: isDark ? 'rgba(74, 144, 217, 0.25)' : '#FFFFFF',
            color: isDark ? '#9CC4EE' : '#4A90D9',
          }}
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-black/5"
        >
          <ScrollText size={16} strokeWidth={1.9} />
        </div>
        <div className="min-w-0 space-y-0.5 text-start">
          <p
            style={{ color: isDark ? '#E8F6F0' : '#0E5C4D' }}
            className="text-xs font-bold leading-snug"
          >
            {t('azama.bannerTitle')}
          </p>
          <p
            style={{ color: tokens.textSecondary }}
            className="text-[11px] leading-relaxed"
          >
            {t('azama.bannerNote')}
          </p>
        </div>
      </div>

      {/* Category + Header Title */}
      <header className="space-y-2.5 pt-1 text-start">
        <div className="flex items-center flex-wrap gap-2">
          <span
            style={{
              backgroundColor: categoryColors.bg,
              borderColor: categoryColors.border,
              color: categoryColors.text,
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: categoryColors.dot }}
            />
            <span>{categoryMeta.label}</span>
          </span>

          {/* Tag Pill: مروي mint | متخيَّل violet | مخطوط muted */}
          <span
            data-testid="azama-detail-tag"
            style={{
              backgroundColor: tagStyle.bg,
              borderColor: tagStyle.border,
              color: tagStyle.text,
            }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-bold"
          >
            <Sparkles size={12} />
            <span>{entry.tag}</span>
          </span>
        </div>

        <h1
          lang="ar"
          style={{ color: tokens.deepAccent }}
          className="font-['Aref_Ruqaa',serif] text-2xl sm:text-3xl font-bold leading-snug"
        >
          {entry.title}
        </h1>
      </header>

      {!isRevealed ? (
        <Card
          data-testid="azama-sensitive-gate"
          variant="white"
          elevation="subtle"
          className="p-5 sm:p-6 rounded-[22px] border-2 space-y-4 text-center"
          style={{
            backgroundColor: isDark ? 'rgba(142, 123, 232, 0.12)' : '#F5F2FD',
            borderColor: isDark ? 'rgba(142, 123, 232, 0.45)' : 'rgba(142, 123, 232, 0.4)',
          }}
        >
          <div
            style={{
              backgroundColor: isDark ? 'rgba(142, 123, 232, 0.25)' : '#FFFFFF',
              color: isDark ? '#D5C8F7' : '#583696',
            }}
            className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border border-black/5 shadow-2xs"
          >
            <ShieldAlert size={24} />
          </div>
          <div className="space-y-1.5">
            <h2
              style={{ color: isDark ? '#E9E1FC' : '#3B2269' }}
              className="font-['Aref_Ruqaa',serif] text-lg font-bold"
            >
              {t('azama.sensitiveGate')}
            </h2>
            <p
              style={{ color: tokens.textSecondary }}
              className="text-xs font-['Cairo',sans-serif] leading-relaxed max-w-md mx-auto"
            >
              {t('azama.sensitiveGateHint')}
            </p>
          </div>
          <button
            type="button"
            data-testid="azama-sensitive-reveal"
            onClick={handleRevealSensitive}
            style={{
              backgroundColor: tokens.deepAccent,
              color: isDark ? '#0B2420' : '#FFFFFF',
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer min-h-[44px]"
          >
            <Eye size={16} />
            <span>{t('azama.sensitiveGate')}</span>
          </button>
        </Card>
      ) : (
        <>
          {/* Persistent amber-free cool-blue caution notice bar directly above quote */}
          {cautionText && (
            <div
              data-testid="azama-detail-caution"
              role="note"
              lang="ar"
              dir="rtl"
              style={{
                backgroundColor: isDark ? 'rgba(74, 144, 217, 0.16)' : '#E8F1FB',
                borderColor: '#4A90D9',
                color: isDark ? '#DDF3EC' : '#0E5C4D',
              }}
              className="p-3.5 rounded-[18px] border-2 flex items-start gap-2.5 text-start shadow-2xs"
            >
              <Info
                size={18}
                strokeWidth={2.1}
                style={{ color: '#4A90D9' }}
                className="shrink-0 mt-0.5"
              />
              <p className="text-xs sm:text-sm font-bold leading-relaxed font-['Cairo',sans-serif]">
                {cautionText}
              </p>
            </div>
          )}

          {/* Bordered Quote Card rendered in Amiri with World & Page pills */}
          <Card
            variant="white"
            elevation="subtle"
            className="p-4 sm:p-5 rounded-[22px] border-2 space-y-3.5 text-start"
            style={{
              backgroundColor: isDark ? tokens.card : '#FFFFFF',
              borderColor: isDark ? 'rgba(74, 144, 217, 0.45)' : 'rgba(74, 144, 217, 0.38)',
            }}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span
                style={{ color: tokens.coolBlueAccent }}
                className="inline-flex items-center gap-1.5 text-xs font-bold"
              >
                <BookOpen size={15} strokeWidth={1.9} />
                <span>{t('azama.quoteHeading')}</span>
              </span>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  data-testid="azama-detail-world-pill"
                  style={{
                    backgroundColor: isDark ? 'rgba(74, 144, 217, 0.2)' : '#E8F1FB',
                    color: isDark ? '#9CC4EE' : '#4A90D9',
                    borderColor: isDark ? 'rgba(74, 144, 217, 0.4)' : 'rgba(74, 144, 217, 0.3)',
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold"
                >
                  <Layers size={11} />
                  <span>{t('azama.worldPill', { world: entry.world })}</span>
                </span>

                <span
                  data-testid="azama-detail-page-pill"
                  style={{
                    backgroundColor: tokens.surface,
                    color: tokens.deepAccent,
                    borderColor: tokens.border,
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold"
                >
                  <FileText size={11} />
                  <span>{t('azama.pagePill', { page: entry.page })}</span>
                </span>
              </div>
            </div>

            <blockquote
              data-testid="azama-detail-quote"
              lang="ar"
              dir="rtl"
              style={{
                color: tokens.textPrimary,
                fontFamily: "'Amiri', serif",
                borderColor: tokens.borderSubtle,
              }}
              className="font-['Amiri',serif] text-lg sm:text-xl leading-[2.05] text-start pt-2 border-t"
            >
              «{entry.quote}»
            </blockquote>
          </Card>

          {/* Commentary / Note Body Card */}
          <Card
            variant="white"
            elevation="subtle"
            className="p-4 sm:p-5 rounded-[22px] border space-y-2.5 text-start"
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                style={{ color: tokens.deepAccent }}
                className="font-['Aref_Ruqaa',serif] text-lg font-bold"
              >
                {t('azama.noteHeading')}
              </h2>

              {/* Tag Pill repeated with note context per section flow */}
              <span
                style={{
                  backgroundColor: tagStyle.bg,
                  borderColor: tagStyle.border,
                  color: tagStyle.text,
                }}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-bold"
              >
                {entry.tag}
              </span>
            </div>

            <div
              data-testid="azama-detail-note"
              lang="ar"
              dir="rtl"
              className="reader-body-text"
            >
              <p
                style={{ color: tokens.textPrimary }}
                className={`${bodySizeClass} text-start`}
              >
                {entry.note}
              </p>
            </div>
          </Card>
        </>
      )}

      {/* Related Entries Tappable Chips */}
      {Array.isArray(entry.related) && entry.related.length > 0 && (
        <section
          aria-label={t('azama.relatedHeading')}
          style={{
            backgroundColor: tokens.surface,
            borderColor: tokens.border,
          }}
          className="p-4 rounded-[20px] border space-y-3 text-start"
        >
          <h3
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-base font-bold flex items-center gap-1.5"
          >
            <Layers size={16} />
            <span>{t('azama.relatedHeading')}</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            {entry.related.map((relId) => {
              const target = getAzamaEntryById(relId);
              if (!target) {
                return (
                  <span
                    key={relId}
                    aria-disabled="true"
                    style={{
                      backgroundColor: tokens.card,
                      borderColor: tokens.borderSubtle,
                      color: tokens.textSecondary,
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-medium opacity-70 min-h-[40px]"
                  >
                    <span className="font-mono text-[11px]">{relId}</span>
                    <span className="text-[10px] opacity-80">({t('azama.pendingChip')})</span>
                  </span>
                );
              }

              return (
                <button
                  key={relId}
                  type="button"
                  data-testid={`azama-related-chip-${relId}`}
                  onClick={() => onSelectRelated(target)}
                  style={{
                    backgroundColor: tokens.card,
                    borderColor: isDark ? 'rgba(74, 144, 217, 0.4)' : 'rgba(74, 144, 217, 0.32)',
                    color: tokens.deepAccent,
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-bold shadow-2xs hover:border-[#4A90D9] active:scale-95 transition-all cursor-pointer min-h-[44px]"
                >
                  <span>{target.title}</span>
                  <ChevronLeft size={14} className={`shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                </button>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
};

export default AzamaDetailScreen;
