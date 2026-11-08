/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif 3-Slide RTL Onboarding (مستكشف)
 * Full RTL, swipeable, with dots indicator, pastel illustrations using Logo star motif
 * in mint/blue tints, and two buttons: "ابدأ الرحلة" (primary mint) and "تخطَّ" (text button).
 */

import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, BookOpen, Compass } from 'lucide-react';
import { ar } from '../i18n/ar';
import { Logo } from '../components/primitives/Logo';
import { useTheme } from '../theme/ThemeContext';

export interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { tokens, isDark } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Touch tracking for swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 40; // minimum pixels threshold

  const slides = [
    {
      id: 'slide-1',
      title: ar.onboarding.slide1.title, // "اكتشف أساطير العرب"
      body: ar.onboarding.slide1.desc, // "رحلة بين الآلهة القديمة والكائنات الخرافية والأماكن المفقودة، في موسوعة عربية تفاعلية."
      badge: 'موسوعة تفاعلية',
      accentColor: tokens.primaryMint,
      secondaryColor: tokens.coolBlueAccent,
      illustrationType: 'star-radiant',
    },
    {
      id: 'slide-2',
      title: ar.onboarding.slide2.title, // "قصص تُروى ولا تُنسى"
      body: ar.onboarding.slide2.desc, // "خمسون أسطورة موثقة بالمصادر القديمة، مكتوبة بأسلوب الحكواتي ومصحوبة بخط زمني لكل حكاية."
      badge: 'توثيق الحكواتي',
      accentColor: tokens.coolBlueAccent,
      secondaryColor: tokens.primaryMint,
      illustrationType: 'star-book',
    },
    {
      id: 'slide-3',
      title: ar.onboarding.slide3.title, // "خريطة الأساطير"
      body: ar.onboarding.slide3.desc, // "تتبّع مواضع الأساطير على خريطة العالم العربي، واحفظ ما يعجبك في مكتبتك الخاصة."
      badge: 'أطلس العالم العربي',
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
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;

    // In RTL, swiping left (negative distance) advances to next, swipe right (positive distance) goes back
    if (distance > minSwipeDistance) {
      // Swiped left in RTL: advance to next
      handleNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped right in RTL: go to previous
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const current = slides[currentSlide];

  return (
    <div
      dir="rtl"
      lang="ar"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        backgroundColor: tokens.background,
        color: tokens.textPrimary,
      }}
      className="min-h-screen flex flex-col justify-between p-6 max-w-md mx-auto relative select-none animate-in fade-in duration-300 font-['Cairo',sans-serif]"
    >
      {/* Top Header: Brand on right (RTL), "تخطَّ" text button on left (RTL) */}
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
            {ar.app.title}
          </span>
        </div>

        {/* Text button "تخطَّ" */}
        <button
          type="button"
          onClick={onComplete}
          style={{ color: tokens.textSecondary }}
          className="text-xs sm:text-sm font-bold hover:opacity-80 px-3 py-2 rounded-xl transition-colors cursor-pointer min-h-[44px] flex items-center"
          aria-label={ar.onboarding.skip}
        >
          {ar.onboarding.skip}
        </button>
      </header>

      {/* Main Slide Carousel Area */}
      <main className="my-auto py-6 text-center space-y-6">
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
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border shadow-xs flex items-center justify-center text-[11px]"
              >
                {currentSlide === 0 && <Sparkles size={12} style={{ color: tokens.primaryMint }} />}
                {currentSlide === 1 && <BookOpen size={12} style={{ color: tokens.coolBlueAccent }} />}
                {currentSlide === 2 && <Compass size={12} style={{ color: tokens.deepAccent }} />}
              </div>
            </div>

            {/* Subtle Arabesque decorative corner stars */}
            <span
              style={{ backgroundColor: tokens.primaryMint }}
              className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full opacity-80"
            />
            <span
              style={{ backgroundColor: tokens.coolBlueAccent }}
              className="absolute bottom-2.5 left-2.5 w-1.5 h-1.5 rounded-full opacity-80"
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
          className="flex items-center justify-center gap-2"
          role="tablist"
          aria-label="مؤشر الشرائح"
        >
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              role="tab"
              aria-selected={currentSlide === idx}
              aria-label={`الشريحة ${idx + 1}`}
              style={{
                backgroundColor: currentSlide === idx ? tokens.deepAccent : tokens.border,
              }}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === idx ? 'w-8' : 'w-2.5 opacity-60 hover:opacity-100'
              }`}
            />
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
              aria-label={ar.onboarding.prev}
            >
              <ChevronRight size={16} />
              <span>{ar.onboarding.prev}</span>
            </button>
          )}

          {/* Primary Action Button: "ابدأ الرحلة" in Primary Mint #7FD1AE */}
          <button
            type="button"
            onClick={handleNext}
            style={{
              backgroundColor: '#7FD1AE', // Primary Mint
              color: '#0E5C4D', // Deep Teal text for readable, high contrast
            }}
            className="flex-1 py-3.5 px-6 rounded-2xl text-sm font-bold shadow-md shadow-[#7FD1AE]/20 hover:brightness-105 active:scale-98 transition-all min-h-[48px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{currentSlide === slides.length - 1 ? 'ابدأ الرحلة' : 'التالي'}</span>
            <ChevronLeft size={18} className="transform scale-x-[-1]" />
          </button>
        </div>

        {/* Secondary Skip button at bottom on early slides */}
        {currentSlide < slides.length - 1 && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onComplete}
              style={{ color: tokens.textSecondary }}
              className="text-xs font-bold hover:underline py-1 px-3 cursor-pointer"
            >
              {ar.onboarding.skip}
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};

export default OnboardingScreen;
