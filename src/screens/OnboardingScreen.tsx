/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif 3-Slide RTL Onboarding (مستكشف)
 * Full RTL, swipeable, with dots indicator, pastel illustrations using Logo star motif
 * in mint/blue tints, and two buttons: "ابدأ الرحلة" (primary mint) and "تخطَّ" (text button).
 */

import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, BookOpen, Compass, Info } from 'lucide-react';
import { Logo } from '../components/primitives/Logo';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/i18n';

export interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { tokens, isDark } = useTheme();
  const { t, lang, dir } = useI18n();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Touch tracking for swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 40; // minimum pixels threshold

  const slides = [
    {
      id: 'slide-1',
      title: t('onboarding.slide1.title'),
      body: t('onboarding.slide1.desc'),
      badge: t('onboarding.slide1.tag'),
      accentColor: tokens.primaryMint,
      secondaryColor: tokens.coolBlueAccent,
      illustrationType: 'star-radiant',
    },
    {
      id: 'slide-2',
      title: t('onboarding.slide2.title'),
      body: t('onboarding.slide2.desc'),
      badge: t('onboarding.slide2.tag'),
      accentColor: tokens.coolBlueAccent,
      secondaryColor: tokens.primaryMint,
      illustrationType: 'star-book',
    },
    {
      id: 'slide-3',
      title: t('onboarding.slide3.title'),
      body: t('onboarding.slide3.desc'),
      badge: t('onboarding.slide3.tag'),
      accentColor: tokens.deepAccent,
      secondaryColor: tokens.primaryMint,
      illustrationType: 'star-compass',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches?.[0]?.clientX ?? null;
    touchEndX.current = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const clientX = e.targetTouches?.[0]?.clientX;
    if (typeof clientX === 'number') {
      touchEndX.current = clientX;
    }
  };

  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;

    if (Math.abs(distance) > minSwipeDistance) {
      if (dir === 'rtl') {
        if (distance < 0) handleNext();
        else handlePrev();
      } else {
        if (distance > 0) handleNext();
        else handlePrev();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const current = slides[currentSlide] ?? slides[0];

  return (
    <div
      /* dir="rtl" default */
      dir={dir}
      lang={lang}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        backgroundColor: tokens.background,
        color: tokens.textPrimary,
      }}
      className="min-h-screen flex flex-col justify-between p-6 max-w-md mx-auto relative select-none animate-in fade-in duration-300 font-['Cairo',sans-serif]"
    >
      {/* Top Header */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="w-10 h-10 rounded-2xl border flex items-center justify-center shadow-xs"
          >
            <Logo size={24} />
          </div>
          <span
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-xl font-bold tracking-wide"
          >
            {t('app.title')}
          </span>
        </div>

        {/* Skip button */}
        <button
          type="button"
          onClick={onComplete}
          style={{ color: tokens.textSecondary }}
          className="text-xs sm:text-sm font-bold hover:opacity-80 px-3 py-2 rounded-xl transition-colors cursor-pointer min-h-[44px] flex items-center"
          aria-label={t('onboarding.skip')}
        >
          {t('onboarding.skip')}
        </button>
      </header>

      {/* Cultural Heritage First-Launch Notice Banner */}
      <div
        role="note"
        data-testid="onboarding-cultural-notice"
        style={{
          backgroundColor: isDark ? 'rgba(74, 144, 217, 0.16)' : '#E8F1FB',
          borderColor: '#4A90D9',
          color: isDark ? '#9FE8CC' : '#0E5C4D',
        }}
        className="mt-3 px-4 py-3 rounded-2xl border flex items-center gap-2.5 shadow-2xs text-start"
      >
        <Info size={18} style={{ color: '#4A90D9' }} className="shrink-0" />
        <div className="min-w-0">
          <span className="text-[11px] font-bold block opacity-85">
            {t('onboarding.culturalNoticeTitle')}
          </span>
          <p className="text-xs sm:text-sm font-bold leading-snug">
            {t('onboarding.culturalNotice')}
          </p>
        </div>
      </div>

      {/* Main Slide Carousel Area */}
      <main className="my-auto py-5 text-center space-y-6">
        {/* Pastel illustration placeholder using Logo star motif in mint/blue tints */}
        <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
          {/* Concentric Soft Pastel Background Rings */}
          <div
            style={{
              backgroundColor: isDark ? 'rgba(127, 209, 174, 0.08)' : 'rgba(232, 241, 251, 0.7)',
              borderColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.35)',
            }}
            className="absolute inset-0 rounded-[44px] border-2 shadow-sm transition-all duration-500 transform rotate-3"
          />
          <div
            style={{
              backgroundColor: isDark ? 'rgba(74, 144, 217, 0.12)' : 'rgba(242, 251, 247, 0.85)',
              borderColor: isDark ? 'rgba(74, 144, 217, 0.25)' : 'rgba(74, 144, 217, 0.3)',
            }}
            className="absolute inset-2.5 rounded-[38px] border shadow-xs transition-all duration-500 transform -rotate-3"
          />

          {/* Centered Star Motif Emblem Container */}
          <div
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="relative z-10 w-36 h-36 rounded-[32px] border-2 shadow-lg flex flex-col items-center justify-center gap-2 p-3 transition-transform duration-300"
          >
            {/* Rub el Hizb Geometric Star Logo */}
            <div className="relative flex items-center justify-center">
              <Logo size={56} />
              {/* Contextual slide mini-icon badge */}
              <div
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.border,
                  color: tokens.deepAccent,
                }}
                className="absolute -bottom-1 -end-1 w-6 h-6 rounded-full border shadow-xs flex items-center justify-center text-[11px]"
              >
                {currentSlide === 0 && <Sparkles size={12} style={{ color: tokens.primaryMint }} />}
                {currentSlide === 1 && <BookOpen size={12} style={{ color: tokens.coolBlueAccent }} />}
                {currentSlide === 2 && <Compass size={12} style={{ color: tokens.deepAccent }} />}
              </div>
            </div>

            {/* Subtle Arabesque decorative corner stars */}
            <span
              style={{ backgroundColor: tokens.primaryMint }}
              className="absolute top-2.5 end-2.5 w-1.5 h-1.5 rounded-full opacity-80"
            />
            <span
              style={{ backgroundColor: tokens.coolBlueAccent }}
              className="absolute bottom-2.5 start-2.5 w-1.5 h-1.5 rounded-full opacity-80"
            />
          </div>
        </div>

        {/* Text Information Area */}
        <div className="space-y-3 px-3 max-w-sm mx-auto">
          {/* Pill Badge */}
          <span
            style={{
              backgroundColor: isDark ? 'rgba(127, 209, 174, 0.15)' : 'rgba(127, 209, 174, 0.22)',
              borderColor: tokens.border,
              color: tokens.deepAccent,
            }}
            className="inline-block px-3.5 py-1 rounded-full text-xs font-bold border shadow-2xs"
          >
            {current.badge}
          </span>

          {/* Slide Title - Exact Verbatim Arabic */}
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-2xl sm:text-3xl font-bold leading-tight"
          >
            {current.title}
          </h2>

          {/* Slide Body - Exact Verbatim Arabic */}
          <p
            style={{ color: tokens.textSecondary }}
            className="text-xs sm:text-sm leading-relaxed"
          >
            {current.body}
          </p>
        </div>
      </main>

      {/* Bottom Controls: Dots Indicator & Primary Buttons */}
      <footer className="space-y-5 pb-4">
        {/* Dots Indicator */}
        <div
          className="flex items-center justify-center gap-0.5"
          role="tablist"
          aria-label={t('onboarding.dotsLabel')}
        >
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              role="tab"
              aria-selected={currentSlide === idx}
              aria-label={t('onboarding.slideAria', { num: idx + 1 })}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            >
              <span
                style={{
                  backgroundColor: currentSlide === idx ? tokens.deepAccent : tokens.border,
                }}
                className={`block h-2.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? 'w-8' : 'w-2.5 opacity-60 hover:opacity-100'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-3">
          {/* Previous Slide button (if past slide 0) */}
          {currentSlide > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              style={{
                backgroundColor: tokens.card,
                borderColor: tokens.border,
                color: tokens.textSecondary,
              }}
              className="px-4 py-3 rounded-2xl border text-xs font-bold hover:opacity-90 transition-all min-h-[48px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-w-[70px]"
              aria-label={t('onboarding.prev')}
            >
              <ChevronRight size={16} className={dir === 'ltr' ? 'rotate-180' : ''} />
              <span>{t('onboarding.prev')}</span>
            </button>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleNext}
            style={{
              backgroundColor: '#7FD1AE',
              color: '#0E5C4D',
            }}
            className="flex-1 py-3.5 px-6 rounded-2xl text-sm font-bold shadow-md shadow-[#7FD1AE]/20 hover:brightness-105 active:scale-98 transition-all min-h-[48px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{currentSlide === slides.length - 1 ? (t('onboarding.start') || 'ابدأ الرحلة') : t('onboarding.next')}</span>
            <ChevronLeft size={18} className={dir === 'ltr' ? 'rotate-180' : ''} />
          </button>
        </div>

        {/* Secondary Skip button at bottom on early slides */}
        {currentSlide < slides.length - 1 && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onComplete}
              style={{ color: tokens.textSecondary }}
              className="text-xs font-bold hover:underline py-2 px-4 cursor-pointer min-h-[44px] inline-flex items-center justify-center"
            >
              {t('onboarding.skip')}
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};

export default OnboardingScreen;
