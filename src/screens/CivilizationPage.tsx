/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Civilization Detail Page (صفحة تفاصيل الحضارة)
 * Long-form historical storytelling with classical Arab aesthetics.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ArrowRight,
  Landmark,
  BookOpen,
  Coins,
  Users,
  Scroll,
  Sparkles,
  MapPin,
  Calendar,
  FileCode,
  FileText,
  Check,
  Info,
} from 'lucide-react';
import { Civilization, formatCivilizationNarrative } from '../data/civTypes';
import { getEntryById } from '../data/seed';
import { useTheme } from '../theme/ThemeContext';
import { Card } from '../components/primitives/Card';
import { getCivImageUrl } from '../utils/assets';
import { storage } from '../data/storage';
import { MethodologyScreen } from './MethodologyScreen';

import { useI18n } from '../i18n/i18n';
import { getLocalizedCivilization, getLocalizedEntry } from '../content';
import { copyTextSafely } from '../utils/clipboard';
export interface CivilizationPageProps {
  civilization: Civilization;
  onBack: () => void;
  onSelectMythId?: (mythId: string) => void;
  onOpenMethodology?: () => void;
}

export const CivilizationPage: React.FC<CivilizationPageProps> = ({
  civilization: rawCivilization,
  onBack,
  onSelectMythId,
  onOpenMethodology,
}) => {
  const { t, lang, dir } = useI18n();
  const { tokens, isDark } = useTheme();

  const civilization = useMemo(
    () => (rawCivilization ? getLocalizedCivilization(rawCivilization, lang) : null),
    [rawCivilization, lang]
  );

  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  const [narrativeView, setNarrativeView] = useState<'tradition' | 'archaeology'>(() => {
    return storage.getDualNarrativeView();
  });

  const handleSelectNarrative = (view: 'tradition' | 'archaeology') => {
    setNarrativeView(view);
    storage.setDualNarrativeView(view);
  };

  const hasTradition = Boolean(civilization?.traditionView && civilization.traditionView.trim().length > 0);
  const hasArchaeology = Boolean(civilization?.archaeologyView && civilization.archaeologyView.trim().length > 0);
  const showDualSection = hasTradition || hasArchaeology;

  // Fallback if only one narrative is present
  const effectiveNarrativeView: 'tradition' | 'archaeology' = !hasArchaeology
    ? 'tradition'
    : !hasTradition
    ? 'archaeology'
    : narrativeView;

  // Creator export toasts and clipboard actions
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const copyToClipboard = async (text: string, successToast: string) => {
    const copied = await copyTextSafely(text);
    showToast(copied ? successToast : t('common.copyError'));
  };

  const handleCopyJson = () => {
    if (!civilization) return;
    const jsonString = JSON.stringify(civilization, null, 2);
    copyToClipboard(jsonString, t('civ.copiedJson') || 'نُسخ ملف الحضارة');
  };

  const handleCopyNarrative = () => {
    if (!civilization) return;
    const narrativeString = formatCivilizationNarrative(civilization);
    copyToClipboard(narrativeString, t('civ.copiedNarrative') || 'نُسخ السرد النصي');
  };

  if (isMethodologyOpen) {
    return <MethodologyScreen onBack={() => setIsMethodologyOpen(false)} />;
  }

  if (!civilization) {
    return (
      <article className="space-y-6 pb-12 animate-in fade-in duration-200 relative" dir={dir}>
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onBack}
            style={{
              backgroundColor: tokens.card,
              color: tokens.deepAccent,
              borderColor: tokens.border,
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-xs cursor-pointer"
            aria-label={t('common.back')}
          >
            <ArrowRight size={16} className={dir === 'ltr' ? 'rotate-180' : ''} />
            <span>{t('common.back')}</span>
          </button>
        </div>
        <Card variant="white" elevation="subtle" className="p-8 text-center space-y-3 rounded-2xl">
          <Landmark size={32} className="mx-auto" style={{ color: tokens.textSecondary }} />
          <p style={{ color: tokens.textPrimary }} className="text-sm font-['Cairo',sans-serif]">
            {t('civ.noChaptersYet')}
          </p>
        </Card>
      </article>
    );
  }

  const safeChapters = Array.isArray(civilization.chapters) ? civilization.chapters : [];
  const safeCities = Array.isArray(civilization.cities) ? civilization.cities : [];
  const safeQuranRefs = Array.isArray(civilization.quranRefs) ? civilization.quranRefs : [];
  const safeArchaeology = Array.isArray(civilization.archaeology) ? civilization.archaeology : [];
  const safeRelatedMyths = Array.isArray(civilization.relatedMyths) ? civilization.relatedMyths : [];

  return (
    <article className="space-y-6 pb-12 animate-in fade-in duration-200 relative" dir={dir}>
      {/* Banner only when lang !== 'ar' AND some content fell back to Arabic */}
      {lang !== 'ar' && Boolean(civilization.hasMissingTranslation) && (
        <div
          style={{
            backgroundColor: isDark ? 'rgba(127, 209, 174, 0.12)' : '#E8F7F0',
            borderColor: tokens.primaryMint,
            color: tokens.deepAccent,
          }}
          className="p-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs"
        >
          <span>{t('article.fallbackArabicNotice')}</span>
        </div>
      )}
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.coolBlueAccent,
            color: tokens.textPrimary,
          }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl border shadow-xl flex items-center gap-2.5 backdrop-blur-md animate-in slide-in-from-top-2"
        >
          <div
            style={{ backgroundColor: isDark ? 'rgba(74, 144, 217, 0.2)' : 'rgba(74, 144, 217, 0.15)' }}
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          >
            <Check size={14} style={{ color: tokens.coolBlueAccent }} />
          </div>
          <span className="text-xs font-semibold font-['Cairo',sans-serif]">{toastMessage}</span>
        </div>
      )}

      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          style={{
            backgroundColor: tokens.card,
            color: tokens.deepAccent,
            borderColor: tokens.border,
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-xs hover:opacity-90 cursor-pointer transition-all active:scale-95"
          aria-label={t('common.back')}
        >
          <ArrowRight size={16} className={dir === 'ltr' ? 'rotate-180' : ''} />
          <span>{t('common.back')}</span>
        </button>

        {civilization.latinName && (
          <span
            style={{ color: tokens.textSecondary }}
            className="text-xs font-mono opacity-80"
          >
            {civilization.latinName}
          </span>
        )}
      </div>

      {/* 1) Header: name huge (display font), pills for era + region */}
      <header className="space-y-4 pt-2">
        {/* Hero image banner */}
        {getCivImageUrl(civilization.id) && (
          <div
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="relative p-2 rounded-[22px] border shadow-sm overflow-hidden"
          >
            <div className="relative h-52 sm:h-64 w-full rounded-[16px] overflow-hidden">
              <img
                src={getCivImageUrl(civilization.id)}
                alt={civilization.name}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-white text-xs">
                <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full font-medium border border-white/20">
                  {civilization.region ?? ''}
                </span>
                {civilization.latinName && (
                  <span className="font-mono text-white/90 bg-black/50 backdrop-blur-xs px-2.5 py-0.5 rounded-md">
                    {civilization.latinName}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/* Era pill */}
          <span
            style={{
              backgroundColor: isDark ? 'rgba(74, 144, 217, 0.2)' : '#E8F1FB',
              color: isDark ? '#7FD1AE' : '#2A69AC',
              borderColor: isDark ? 'rgba(74, 144, 217, 0.4)' : '#CFE2F7',
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs"
          >
            <Calendar size={12} />
            <span>{civilization.era || t('common.undated')}</span>
          </span>

          {/* Region pill */}
          {civilization.region && (
            <span
              style={{
                backgroundColor: isDark ? 'rgba(127, 209, 174, 0.15)' : '#F2FBF7',
                color: isDark ? '#7FD1AE' : '#0E5C4D',
                borderColor: tokens.border,
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs"
            >
              <MapPin size={12} />
              <span>{civilization.region}</span>
            </span>
          )}
        </div>

        <h1
          style={{ color: tokens.deepAccent }}
          className="font-['Aref_Ruqaa',serif] text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
        >
          {civilization.name ?? ''}
        </h1>

        {civilization.latinName && (
          <p
            style={{ color: tokens.textSecondary }}
            className="text-sm tracking-wide font-sans opacity-75"
          >
            {civilization.latinName}
          </p>
        )}
      </header>

      {/* 2) "القصة": chapters as reading blocks with ornamental dividers (or calm empty notice) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen size={18} style={{ color: tokens.deepAccent }} />
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-xl font-bold"
          >
            {/* القصة */}
            {t('civ.story')}
          </h2>
        </div>

        {safeChapters.length > 0 ? (
          <div className="space-y-4">
            {safeChapters.map((chapter, idx) => (
              <React.Fragment key={idx}>
                <Card
                  variant="white"
                  elevation="subtle"
                  className="p-5 sm:p-6 space-y-3 rounded-2xl"
                >
                  <h3
                    style={{ color: tokens.deepAccent }}
                    className="font-['Aref_Ruqaa',serif] text-lg font-bold"
                  >
                    {chapter?.title ?? ''}
                  </h3>
                  <div
                    style={{ color: tokens.textPrimary }}
                    className="font-['Cairo',sans-serif] text-sm sm:text-base leading-relaxed text-start whitespace-pre-line"
                  >
                    {chapter?.text ?? ''}
                  </div>
                </Card>

                {/* Ornamental divider between chapters */}
                {idx < safeChapters.length - 1 && (
                  <div className="flex items-center justify-center my-2 gap-3" aria-hidden="true">
                    <div
                      style={{
                        background: `linear-gradient(to left, transparent, ${tokens.borderSubtle}, transparent)`,
                      }}
                      className="h-px flex-1 max-w-[80px]"
                    />
                    <div className="flex items-center gap-1.5 opacity-80" style={{ color: tokens.deepAccent }}>
                      <span style={{ backgroundColor: tokens.primaryMint }} className="w-1 h-1 rounded-full" />
                      <span className="text-xs font-serif inline-block">❦</span>
                      <span style={{ backgroundColor: tokens.primaryMint }} className="w-1 h-1 rounded-full" />
                    </div>
                    <div
                      style={{
                        background: `linear-gradient(to right, transparent, ${tokens.borderSubtle}, transparent)`,
                      }}
                      className="h-px flex-1 max-w-[80px]"
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <Card variant="white" elevation="subtle" className="p-5 rounded-2xl text-xs sm:text-sm font-['Cairo',sans-serif]">
            <span style={{ color: tokens.textSecondary }}>{t('civ.noChaptersYet')}</span>
          </Card>
        )}
      </section>

      {/* 3) "المدن": chips row */}
      {safeCities.length > 0 && (
        <section className="space-y-2.5">
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-lg font-bold"
          >
            {/* المدن */}
            {t('civ.cities') || 'المدن والحواضر'}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {safeCities.map((city, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor: tokens.card,
                  color: tokens.textPrimary,
                  borderColor: tokens.border,
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border shadow-xs inline-flex items-center gap-1"
              >
                <Landmark size={12} style={{ color: tokens.deepAccent }} />
                <span>{city}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 4) "الاقتصاد والمجتمع": card with economy + society text */}
      {(civilization.economy || civilization.society) && (
        <section className="space-y-2.5">
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-lg font-bold"
          >
            {/* الاقتصاد والمجتمع */}
            {t('civ.economy')}
          </h2>
          <Card variant="white" elevation="subtle" className="p-4 sm:p-5 space-y-3 rounded-2xl">
            {civilization.economy && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: tokens.deepAccent }}>
                  <Coins size={14} />
                  <span>{t('civ.economy')}</span>
                </div>
                <p style={{ color: tokens.textPrimary }} className="text-sm font-['Cairo',sans-serif] leading-relaxed">
                  {civilization.economy}
                </p>
              </div>
            )}
            {civilization.economy && civilization.society && (
              <div style={{ borderColor: tokens.borderSubtle }} className="border-t pt-2" />
            )}
            {civilization.society && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: tokens.deepAccent }}>
                  <Users size={14} />
                  <span>{t('civ.society')}</span>
                </div>
                <p style={{ color: tokens.textPrimary }} className="text-sm font-['Cairo',sans-serif] leading-relaxed">
                  {civilization.society}
                </p>
              </div>
            )}
          </Card>
        </section>
      )}

      {/* 5) "الدين": card */}
      {civilization.religion && (
        <section className="space-y-2.5">
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-lg font-bold"
          >
            {/* الدين */}
            {t('civ.religion') || 'الدين والمعتقدات'}
          </h2>
          <Card variant="white" elevation="subtle" className="p-4 sm:p-5 rounded-2xl">
            <p style={{ color: tokens.textPrimary }} className="text-sm font-['Cairo',sans-serif] leading-relaxed">
              {civilization.religion}
            </p>
          </Card>
        </section>
      )}

      {/* 6) "النبي المرسل": highlighted mint card (hide if prophet empty) */}
      {civilization.prophet && civilization.prophet.trim().length > 0 && (
        <section className="space-y-2.5">
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-lg font-bold"
          >
            {/* النبي المرسل */}
            {t('civ.prophet')}
          </h2>
          <div
            style={{
              backgroundColor: isDark ? 'rgba(127, 209, 174, 0.15)' : '#E2F7ED',
              borderColor: isDark ? 'rgba(127, 209, 174, 0.4)' : '#A3E2C4',
              color: isDark ? '#A3E2C4' : '#0B483B',
            }}
            className="p-4 sm:p-5 rounded-2xl border shadow-xs space-y-1"
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              <Sparkles size={16} />
              <span className="font-['Aref_Ruqaa',serif] text-base">{civilization.prophet}</span>
            </div>
          </div>
        </section>
      )}

      {/* 7) "في القرآن": chips of quranRefs */}
      {safeQuranRefs.length > 0 && (
        <section className="space-y-2.5">
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-lg font-bold"
          >
            {/* في القرآن */}
            {t('civ.quran') || 'في القرآن الكريم'}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {safeQuranRefs.map((ref, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor: isDark ? 'rgba(18, 51, 45, 0.6)' : '#F2FBF7',
                  color: isDark ? '#7FD1AE' : '#0E5C4D',
                  borderColor: tokens.border,
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border shadow-xs inline-flex items-center gap-1.5 font-['Cairo',sans-serif]"
              >
                <Scroll size={13} style={{ color: tokens.deepAccent }} />
                <span>{ref}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 8) "الآثار اليوم": list of archaeology items with small column icons */}
      {safeArchaeology.length > 0 && (
        <section className="space-y-2.5">
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-lg font-bold"
          >
            {/* الآثار اليوم */}
            {t('civ.archaeology')}
          </h2>
          <Card variant="white" elevation="subtle" className="p-4 sm:p-5 rounded-2xl">
            <ul className="space-y-2.5">
              {safeArchaeology.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <div
                    style={{
                      backgroundColor: tokens.surface,
                      borderColor: tokens.border,
                      color: tokens.deepAccent,
                    }}
                    className="p-1 rounded-md border shrink-0 mt-0.5"
                  >
                    <Landmark size={14} />
                  </div>
                  <span style={{ color: tokens.textPrimary }} className="leading-relaxed font-['Cairo',sans-serif]">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {/* القراءة التاريخية: Dual-narrative mode (tradition vs archaeology) */}
      {showDualSection && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2
                style={{ color: tokens.deepAccent }}
                className="font-['Aref_Ruqaa',serif] text-lg font-bold"
              >
                {/* القراءة التاريخية */}
                {t('article.historicalReading')}
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (onOpenMethodology) {
                    onOpenMethodology();
                  } else {
                    setIsMethodologyOpen(true);
                  }
                }}
                title={t('method.title')}
                aria-label={t('method.title')}
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.border,
                  color: tokens.textSecondary,
                }}
                className="p-1 rounded-full border hover:text-[#7FD1AE] hover:border-[#7FD1AE] transition-all cursor-pointer inline-flex items-center justify-center min-w-[26px] min-h-[26px]"
              >
                <Info size={14} />
              </button>
            </div>
            {hasTradition && hasArchaeology && (
              <span
                style={{ color: tokens.textSecondary }}
                className="text-xs font-['Cairo',sans-serif] opacity-80"
              >
                {t('civ.dualSub')}
              </span>
            )}
          </div>

          {/* Toggle buttons: "رواية التراث" (mint active) and "رواية الآثار" (blue active) */}
          {hasTradition && hasArchaeology && (
            <div
              style={{
                backgroundColor: tokens.surface,
                borderColor: tokens.border,
              }}
              className="flex items-center gap-2 p-1 rounded-2xl border"
              role="tablist"
              aria-label={t('article.historicalReading')}
            >
              <button
                type="button"
                role="tab"
                aria-selected={effectiveNarrativeView === 'tradition'}
                onClick={() => handleSelectNarrative('tradition')}
                style={{
                  backgroundColor: effectiveNarrativeView === 'tradition'
                    ? (isDark ? 'rgba(127, 209, 174, 0.22)' : tokens.primaryMint)
                    : 'transparent',
                  color: effectiveNarrativeView === 'tradition'
                    ? (isDark ? '#7FD1AE' : '#0B483B')
                    : tokens.textSecondary,
                  borderColor: effectiveNarrativeView === 'tradition'
                    ? (isDark ? '#7FD1AE' : '#64C19A')
                    : 'transparent',
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-150 inline-flex items-center justify-center gap-1.5 cursor-pointer font-['Cairo',sans-serif] ${
                  effectiveNarrativeView === 'tradition' ? 'shadow-xs scale-[1.01]' : 'hover:opacity-80'
                }`}
              >
                <Scroll size={14} />
                <span>{t('civ.tradition') || 'رواية التراث'}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={effectiveNarrativeView === 'archaeology'}
                onClick={() => handleSelectNarrative('archaeology')}
                style={{
                  backgroundColor: effectiveNarrativeView === 'archaeology'
                    ? (isDark ? 'rgba(74, 144, 217, 0.24)' : '#DCEBFB')
                    : 'transparent',
                  color: effectiveNarrativeView === 'archaeology'
                    ? (isDark ? '#8ABDF8' : '#1A4D7C')
                    : tokens.textSecondary,
                  borderColor: effectiveNarrativeView === 'archaeology'
                    ? (isDark ? '#4A90D9' : '#85B6EA')
                    : 'transparent',
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-150 inline-flex items-center justify-center gap-1.5 cursor-pointer font-['Cairo',sans-serif] ${
                  effectiveNarrativeView === 'archaeology' ? 'shadow-xs scale-[1.01]' : 'hover:opacity-80'
                }`}
              >
                <Landmark size={14} />
                <span>{t('civ.archaeologyView') || 'رواية الآثار'}</span>
              </button>
            </div>
          )}

          {/* Selected view text card */}
          <div
            style={{
              backgroundColor: tokens.card,
              borderColor: isDark
                ? (effectiveNarrativeView === 'tradition' ? 'rgba(127, 209, 174, 0.35)' : 'rgba(74, 144, 217, 0.35)')
                : (effectiveNarrativeView === 'tradition' ? '#C0E9DA' : '#CADFF8'),
            }}
            className="p-4 sm:p-5 rounded-2xl border shadow-xs transition-colors duration-200"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span
                style={{
                  backgroundColor: effectiveNarrativeView === 'tradition'
                    ? (isDark ? 'rgba(127, 209, 174, 0.2)' : '#E9F9F2')
                    : (isDark ? 'rgba(74, 144, 217, 0.2)' : '#EDF4FC'),
                  color: effectiveNarrativeView === 'tradition'
                    ? (isDark ? '#7FD1AE' : '#0E5C4D')
                    : (isDark ? '#8ABDF8' : '#1C5489'),
                  borderColor: effectiveNarrativeView === 'tradition'
                    ? (isDark ? 'rgba(127, 209, 174, 0.3)' : '#B5E8D4')
                    : (isDark ? 'rgba(74, 144, 217, 0.3)' : '#C0DBF8'),
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border font-['Cairo',sans-serif]"
              >
                {effectiveNarrativeView === 'tradition' ? <Scroll size={13} /> : <Landmark size={13} />}
                <span>
                  {effectiveNarrativeView === 'tradition'
                    ? (t('civ.tradition') || 'رواية التراث')
                    : (t('civ.archaeologyView') || 'رواية الآثار')}
                </span>
              </span>
            </div>

            <p
              style={{ color: tokens.textPrimary }}
              className="text-xs sm:text-sm font-['Cairo',sans-serif] leading-relaxed text-start"
            >
              {effectiveNarrativeView === 'tradition'
                ? civilization.traditionView
                : civilization.archaeologyView}
            </p>
          </div>
        </section>
      )}

      {/* 9) "ملاحظة المؤرخ": italic muted card (hide if absent) */}
      {civilization.historianNote && civilization.historianNote.trim().length > 0 && (
        <section className="space-y-2.5">
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-lg font-bold"
          >
            {/* ملاحظة المؤرخ */}
            {t('civ.historian')}
          </h2>
          <div
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
              color: tokens.textSecondary,
            }}
            className="p-4 sm:p-5 rounded-2xl border shadow-xs italic text-xs sm:text-sm font-['Cairo',sans-serif] leading-relaxed"
          >
            «{civilization.historianNote}»
          </div>
        </section>
      )}

      {/* 10) "الإرث": closing paragraph */}
      {civilization.legacy && civilization.legacy.trim().length > 0 && (
        <section className="space-y-3">
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-lg font-bold"
          >
            {/* الإرث */}
            {t('civ.legacy') || 'الإرث الحضاري'}
          </h2>
          <div
            style={{
              backgroundColor: isDark ? 'rgba(74, 144, 217, 0.1)' : '#F6F9FD',
              borderColor: tokens.border,
            }}
            className="p-4 sm:p-5 rounded-2xl border shadow-xs"
          >
            <p
              style={{ color: tokens.textPrimary }}
              className="text-sm font-['Cairo',sans-serif] leading-relaxed text-start"
            >
              {civilization.legacy}
            </p>
          </div>
        </section>
      )}

      {/* Creator Export: Two buttons in a row */}
      <div className="flex flex-row items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleCopyJson}
          style={{
            backgroundColor: isDark ? 'rgba(74, 144, 217, 0.08)' : 'rgba(74, 144, 217, 0.06)',
            borderColor: tokens.coolBlueAccent,
            color: tokens.coolBlueAccent,
            minHeight: '44px',
          }}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer min-h-[44px] hover:opacity-85 active:scale-98 font-['Cairo',sans-serif]"
          title={t('article.copyJson')}
        >
          <FileCode size={16} />
          <span>{t('article.copyJson')}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyNarrative}
          style={{
            backgroundColor: isDark ? 'rgba(74, 144, 217, 0.08)' : 'rgba(74, 144, 217, 0.06)',
            borderColor: tokens.coolBlueAccent,
            color: tokens.coolBlueAccent,
            minHeight: '44px',
          }}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer min-h-[44px] hover:opacity-85 active:scale-98 font-['Cairo',sans-serif]"
          title={t('civ.copyNarrative')}
        >
          <FileText size={16} />
          {/* انسخ كنص سردي */}
          <span>{t('civ.copyNarrative')}</span>
        </button>
      </div>

      {/* 11) "صلة بالأساطير": chips linking relatedMyths ids to the Article screen */}
      {safeRelatedMyths.length > 0 && (
        <section className="space-y-2.5 pt-2">
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-lg font-bold"
          >
            {/* صلة بالأساطير */}
            {t('civ.relatedMyths')}
          </h2>
          <p style={{ color: tokens.textSecondary }} className="text-xs">
            {t('civ.openMyth')}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {safeRelatedMyths.map((mythId, idx) => {
              const rawMatched = getEntryById(mythId);
              const matchedEntry = rawMatched ? getLocalizedEntry(rawMatched, lang) : undefined;
              const label = matchedEntry ? matchedEntry.name : mythId;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectMythId && onSelectMythId(mythId)}
                  style={{
                    backgroundColor: tokens.card,
                    color: tokens.deepAccent,
                    borderColor: tokens.border,
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border shadow-xs hover:border-[#7FD1AE] hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles size={13} style={{ color: tokens.primaryMint }} />
                  <span>{label}</span>
                  {matchedEntry?.typeLabel && (
                    <span
                      style={{ color: tokens.textSecondary }}
                      className="text-[10px] opacity-75 font-normal"
                    >
                      ({matchedEntry.typeLabel})
                    </span>
                  )}
                  <ChevronLeft size={14} className={`opacity-60 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                </button>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
};
