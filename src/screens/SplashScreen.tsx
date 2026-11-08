/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Splash Screen (شاشة البداية)
 * Shown for ~1.5s on app start.
 * Pure white background #FFFFFF, centered animated Logo (gentle fade-in + scale 0.9 -> 1.0),
 * decorative Arabic display title "مستكشف" in deep teal #0E5C4D, and muted tagline
 * "موسوعة الأساطير العربية". Fully RTL.
 */

import React, { useEffect, useState } from 'react';
import { Logo } from '../components/primitives/Logo';

export interface SplashScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 1500,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Begin smooth fade-out slightly before duration ends
    const fadeOutTimer = setTimeout(() => {
      setIsClosing(true);
    }, Math.max(0, durationMs - 250));

    // Complete transition and trigger onFinish
    const finishTimer = setTimeout(() => {
      onFinish?.();
    }, durationMs);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onFinish]);

  return (
    <div
      dir="rtl"
      lang="ar"
      role="status"
      aria-live="polite"
      aria-label="شاشة التحميل لمستكشف"
      className={`fixed inset-0 z-50 bg-[#FFFFFF] flex flex-col items-center justify-center p-6 select-none transition-opacity duration-300 ease-in-out ${
        isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center text-center max-w-sm animate-in fade-in zoom-in-90 duration-700 ease-out fill-mode-forwards">
        {/* Animated Brand Logo */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Subtle luminous ambient aura */}
          <div className="absolute inset-0 bg-[#7FD1AE]/20 rounded-full blur-xl transform scale-125" />
          <Logo size={100} className="relative z-10" />
        </div>

        {/* App Title in Decorative Arabic Display Font (Aref Ruqaa) in Deep Teal */}
        <h1 className="font-['Aref_Ruqaa',serif] text-4xl sm:text-5xl font-bold text-[#0E5C4D] tracking-wide leading-tight mb-2">
          مستكشف
        </h1>

        {/* Tagline in Muted Gray-Teal Font */}
        <p className="font-['Cairo',sans-serif] text-sm sm:text-base font-medium text-[#6B7C78] tracking-normal">
          موسوعة الأساطير والحضارات العربية
        </p>

        {/* Minimal geometric accent bar */}
        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#7FD1AE] to-transparent mt-4 opacity-75" />
      </div>
    </div>
  );
};

export default SplashScreen;
