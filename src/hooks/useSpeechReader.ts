/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Multilingual Web Speech API Hook for Mustakshif
 * Supports ar (ar-SA), en (en-US), id (id-ID), and th (th-TH),
 * dynamic reading speed (0.75x - 1.5x), play/pause/resume/stop, and paragraph queue.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AppLang } from '../i18n';

export type SpeechReaderState = 'idle' | 'playing' | 'paused';
export type SpeechSpeed = 0.75 | 1 | 1.25 | 1.5;

const LANG_TO_BCP47: Record<AppLang, string> = {
  ar: 'ar-SA',
  en: 'en-US',
  id: 'id-ID',
  th: 'th-TH',
};

export interface UseSpeechReaderResult {
  speak: (text: string | string[]) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  state: SpeechReaderState;
  speed: SpeechSpeed;
  setSpeed: (speed: SpeechSpeed) => void;
  isSupported: boolean;
  currentIndex: number;
  totalItems: number;
  speechLang: string;
}

export function useSpeechReader(lang: AppLang): UseSpeechReaderResult {
  const [state, setState] = useState<SpeechReaderState>('idle');
  const [speed, setSpeedState] = useState<SpeechSpeed>(1);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);

  const queueRef = useRef<string[]>([]);
  const activeIndexRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const isStoppedRef = useRef<boolean>(false);
  const speedRef = useRef<SpeechSpeed>(1);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speechLang = LANG_TO_BCP47[lang] ?? 'ar-SA';
  const isSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';

  const getVoiceForLang = useCallback(
    (bcp47: string): SpeechSynthesisVoice | null => {
      if (!isSupported) return null;
      try {
        const voices = window.speechSynthesis.getVoices() || [];
        const short = bcp47.split('-')[0]?.toLowerCase() ?? 'ar';
        return (
          voices.find((v) => v.lang.toLowerCase() === bcp47.toLowerCase()) ||
          voices.find((v) => v.lang.toLowerCase().startsWith(short)) ||
          null
        );
      } catch {
        return null;
      }
    },
    [isSupported]
  );

  const stop = useCallback(() => {
    isStoppedRef.current = true;
    isPausedRef.current = false;
    queueRef.current = [];
    activeIndexRef.current = 0;

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    if (isSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore in headless environments
      }
    }

    setState('idle');
    setCurrentIndex(0);
    setTotalItems(0);
  }, [isSupported]);

  const speakIndex = useCallback(
    (index: number) => {
      if (!isSupported) {
        setState('idle');
        return;
      }

      const queue = queueRef.current;
      if (index < 0 || index >= queue.length) {
        setState('idle');
        setCurrentIndex(0);
        return;
      }

      activeIndexRef.current = index;
      setCurrentIndex(index);

      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }

      const textToSpeak = queue[index];
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = speechLang;
      utterance.rate = speedRef.current;
      utterance.pitch = 1;

      const voice = getVoiceForLang(speechLang);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        if (!isStoppedRef.current && !isPausedRef.current) {
          setState('playing');
        }
      };

      utterance.onend = () => {
        if (isStoppedRef.current || isPausedRef.current) return;
        const nextIndex = index + 1;
        if (nextIndex < queueRef.current.length) {
          speakIndex(nextIndex);
        } else {
          setState('idle');
          setCurrentIndex(0);
        }
      };

      utterance.onerror = (event) => {
        if (event.error === 'interrupted' || event.error === 'canceled') {
          return;
        }
        if (isStoppedRef.current) return;

        // Headless fallback timer so Play/Pause state behaves cleanly even without OS audio device
        const baseMs = Math.min(Math.max(textToSpeak.length * 40, 2200), 6500);
        const duration = Math.round(baseMs / speedRef.current);
        fallbackTimerRef.current = setTimeout(() => {
          if (isStoppedRef.current || isPausedRef.current) return;
          const nextIndex = index + 1;
          if (nextIndex < queueRef.current.length) {
            speakIndex(nextIndex);
          } else {
            setState('idle');
            setCurrentIndex(0);
          }
        }, duration);
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        setState('idle');
      }
    },
    [isSupported, speechLang, getVoiceForLang]
  );

  const speak = useCallback(
    (text: string | string[]) => {
      if (!isSupported || text == null) return;
      const rawItems = Array.isArray(text) ? text : [text];
      const items = rawItems
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      if (items.length === 0) {
        setState('idle');
        return;
      }

      try {
        window.speechSynthesis.cancel();
      } catch {
        // noop
      }

      isStoppedRef.current = false;
      isPausedRef.current = false;
      queueRef.current = items;
      activeIndexRef.current = 0;
      setTotalItems(items.length);
      setState('playing');
      speakIndex(0);
    },
    [isSupported, speakIndex]
  );

  const pause = useCallback(() => {
    if (!isSupported) return;
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    try {
      window.speechSynthesis.pause();
    } catch {
      // noop
    }
    isPausedRef.current = true;
    setState('paused');
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    isPausedRef.current = false;
    setState('playing');
    try {
      window.speechSynthesis.resume();
      if (!window.speechSynthesis.speaking && activeIndexRef.current < queueRef.current.length) {
        speakIndex(activeIndexRef.current);
      }
    } catch {
      if (activeIndexRef.current < queueRef.current.length) {
        speakIndex(activeIndexRef.current);
      }
    }
  }, [isSupported, speakIndex]);

  const setSpeed = useCallback(
    (nextSpeed: SpeechSpeed) => {
      speedRef.current = nextSpeed;
      setSpeedState(nextSpeed);
      if (state === 'playing' && queueRef.current.length > 0 && isSupported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // noop
        }
        speakIndex(activeIndexRef.current);
      }
    },
    [state, isSupported, speakIndex]
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop, lang]);

  return {
    speak,
    pause,
    resume,
    stop,
    state,
    speed,
    setSpeed,
    isSupported,
    currentIndex,
    totalItems,
    speechLang,
  };
}
