/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Accessible Web Speech Audio Reader bar with Play/Pause, Stop,
 * speed selector (0.75x / 1x / 1.25x / 1.5x), and UI language badge.
 */

import React from 'react';
import { Play, Pause, Square, Volume2, Gauge } from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';
import { useI18n } from '../../i18n/i18n';
import type { SpeechReaderState, SpeechSpeed } from '../../hooks/useSpeechReader';

export interface SpeechReaderBarProps {
  state: SpeechReaderState;
  speed: SpeechSpeed;
  speechLang: string;
  isSupported: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onChangeSpeed: (speed: SpeechSpeed) => void;
}

const SPEED_OPTIONS: SpeechSpeed[] = [0.75, 1, 1.25, 1.5];

export const SpeechReaderBar: React.FC<SpeechReaderBarProps> = ({
  state,
  speed,
  speechLang,
  isSupported,
  onPlayPause,
  onStop,
  onChangeSpeed,
}) => {
  const { tokens, isDark } = useTheme();
  const { t, dir } = useI18n();

  if (!isSupported) return null;

  const statusText =
    state === 'playing'
      ? t('speech.playing')
      : state === 'paused'
      ? t('speech.paused')
      : t('speech.ready');

  return (
    <section
      data-testid="speech-reader-bar"
      dir={dir}
      aria-label={t('speech.title')}
      style={{
        backgroundColor: tokens.surface,
        borderColor: tokens.border,
      }}
      className="p-3.5 rounded-[20px] border shadow-xs space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div
            style={{
              backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.28)',
              color: tokens.deepAccent,
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          >
            <Volume2 size={18} className={state === 'playing' ? 'animate-pulse' : ''} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                style={{ color: tokens.deepAccent }}
                className="text-xs font-bold font-['Cairo',sans-serif]"
              >
                {t('speech.title')}
              </span>
              <span
                style={{
                  backgroundColor: tokens.coolBlueTint,
                  color: tokens.coolBlueAccent,
                }}
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
              >
                {speechLang}
              </span>
            </div>
            <p style={{ color: tokens.textSecondary }} className="text-[11px] truncate">
              {statusText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            data-testid="speech-play-pause"
            onClick={onPlayPause}
            style={{
              backgroundColor: tokens.primaryMint,
              color: '#0E5C4D',
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xs hover:opacity-90 active:scale-95 transition-all cursor-pointer min-h-[44px]"
            aria-label={
              state === 'playing'
                ? t('speech.pause')
                : state === 'paused'
                ? t('speech.resume')
                : t('speech.play')
            }
          >
            {state === 'playing' ? <Pause size={15} /> : <Play size={15} />}
            <span>
              {state === 'playing'
                ? t('speech.pause')
                : state === 'paused'
                ? t('speech.resume')
                : t('speech.play')}
            </span>
          </button>

          {state !== 'idle' && (
            <button
              type="button"
              data-testid="speech-stop"
              onClick={onStop}
              style={{
                backgroundColor: tokens.card,
                borderColor: tokens.border,
                color: tokens.textPrimary,
              }}
              className="inline-flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border hover:opacity-85 active:scale-95 transition-all cursor-pointer"
              aria-label={t('speech.stop')}
              title={t('speech.stop')}
            >
              <Square size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Speed Selector Row */}
      <div className="flex items-center justify-between gap-2 pt-1.5 border-t" style={{ borderColor: tokens.borderSubtle }}>
        <span
          style={{ color: tokens.textSecondary }}
          className="inline-flex items-center gap-1 text-[11px] font-bold shrink-0"
        >
          <Gauge size={13} style={{ color: tokens.coolBlueAccent }} />
          <span>{t('speech.speed')}</span>
        </span>

        <div className="flex items-center gap-1 flex-wrap" role="group" aria-label={t('speech.speed')}>
          {SPEED_OPTIONS.map((opt) => {
            const active = speed === opt;
            return (
              <button
                key={opt}
                type="button"
                data-testid={`speech-speed-${opt}`}
                onClick={() => onChangeSpeed(opt)}
                aria-pressed={active}
                style={{
                  backgroundColor: active ? tokens.deepAccent : tokens.card,
                  color: active ? (isDark ? '#0B2420' : '#FFFFFF') : tokens.textSecondary,
                  borderColor: active ? tokens.deepAccent : tokens.borderSubtle,
                }}
                className="px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold transition-all cursor-pointer min-h-[34px]"
              >
                {opt}x
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SpeechReaderBar;
