/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif "فاجئني" (Surprise Me) Floating Action Button
 * Discovers a random myth entry with an interactive card-flip transition.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Dices, Sparkles } from 'lucide-react';
import { MythEntry } from '../../data/types';
import { getAllEntries } from '../../data/seed';
import { useTheme } from '../../theme/ThemeContext';
import { useI18n } from '../../i18n/i18n';

export interface SurpriseMeButtonProps {
  onSelectEntry: (entry: MythEntry) => void;
  className?: string;
}

export const SurpriseMeButton: React.FC<SurpriseMeButtonProps> = ({
  onSelectEntry,
  className = '',
}) => {
  const { tokens, isDark } = useTheme();
  const { t, dir } = useI18n();
  const [isFlipping, setIsFlipping] = useState(false);
  const flipTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (flipTimerRef.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(flipTimerRef.current);
      }
    };
  }, []);

  const handleSurprise = () => {
    if (isFlipping) return;

    const entries = (getAllEntries() ?? []).filter(Boolean);
    if (entries.length === 0) return;

    const randomIndex = Math.floor(Math.random() * entries.length);
    const selected = entries[randomIndex];
    if (!selected) return;

    setIsFlipping(true);

    // Card-flip transition timing
    flipTimerRef.current = window.setTimeout(() => {
      flipTimerRef.current = null;
      setIsFlipping(false);
      onSelectEntry(selected);
    }, 450);
  };

  return (
    <div
      className={`fixed bottom-20 end-4 z-40 max-w-md pointer-events-auto ${className}`}
      dir={dir}
    >
      <button
        type="button"
        onClick={handleSurprise}
        aria-label={t('home.surpriseMe')}
        title={t('home.surpriseMe')}
        style={{
          backgroundColor: isDark ? '#16384C' : '#EAF2FA',
          borderColor: tokens.coolBlueAccent,
          color: tokens.coolBlueAccent,
          boxShadow: isDark
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(127, 178, 232, 0.25)'
            : '0 10px 25px -5px rgba(127, 178, 232, 0.4), 0 0 12px rgba(127, 178, 232, 0.2)',
        }}
        className={`group relative flex items-center gap-2 px-3.5 py-2.5 rounded-full border-2 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer min-h-[46px] select-none ${
          isFlipping ? '[transform:rotateY(180deg)_scale(1.1)] transition-transform duration-500' : ''
        }`}
      >
        {/* Dice Icon with rolling animation on click */}
        <div
          style={{
            backgroundColor: isDark ? 'rgba(127, 178, 232, 0.2)' : 'rgba(127, 178, 232, 0.25)',
          }}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-500 ${
            isFlipping ? 'rotate-[360deg]' : 'group-hover:rotate-45'
          }`}
        >
          <Dices size={17} className="stroke-[2.2]" />
        </div>

        <span className="font-['Aref_Ruqaa',serif] text-sm font-bold tracking-wide">
          {t('home.surpriseMe')}
        </span>

        <Sparkles
          size={12}
          className="opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all"
        />
      </button>
    </div>
  );
};

export default SurpriseMeButton;
