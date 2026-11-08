/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Arabic Text-To-Speech (TTS) Hook for Mustakshif (مستكشف)
 * Configures Web Speech API with ar-SA locale, rate 0.95, pitch 1.0,
 * and provides sequential paragraph queueing, play, pause, resume, and stop.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export type TTSState = 'idle' | 'playing' | 'paused';

export interface UseArabicTTSResult {
  speak: (text: string | string[]) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  state: TTSState;
  isSupported: boolean;
  currentIndex: number;
  totalItems: number;
}

export function useArabicTTS(): UseArabicTTSResult {
  const [state, setState] = useState<TTSState>('idle');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);

  const queueRef = useRef<string[]>([]);
  const activeIndexRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const isStoppedRef = useRef<boolean>(false);
  const fallbackTimerRef = useRef<any>(null);

  // Check Web Speech API availability
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

  // Find preferred Arabic voice if available
  const getArabicVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!isSupported) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    return (
      voices.find((v) => v.lang === 'ar-SA') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('ar')) ||
      null
    );
  }, [isSupported]);

  // Stop all active speech and clear the queue
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
        // Ignore synthesis cancel errors in constrained environments
      }
    }

    setState('idle');
    setCurrentIndex(0);
    setTotalItems(0);
  }, [isSupported]);

  // Speak a specific index from the queue
  const speakIndex = useCallback((index: number) => {
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

    // STEP 2: Configure every utterance with: lang = "ar-SA", rate = 0.95, pitch = 1
    utterance.lang = 'ar-SA';
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const voice = getArabicVoice();
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
      // Ignore user-initiated cancel or pause
      if (event.error === 'interrupted' || event.error === 'canceled') {
        return;
      }
      if (isStoppedRef.current) return;

      // In environments where synthesis engine is headless or has no audio device,
      // maintain playback state and progress gracefully with a simulated cadence
      if (event.error === 'synthesis-failed' || event.error === 'audio-busy') {
        const duration = Math.min(Math.max(textToSpeak.length * 45, 2000), 6000);
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
        return;
      }

      const nextIndex = index + 1;
      if (nextIndex < queueRef.current.length) {
        speakIndex(nextIndex);
      } else {
        setState('idle');
        setCurrentIndex(0);
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      setState('idle');
    }
  }, [isSupported, getArabicVoice]);

  // Start speaking text or array of strings sequentially
  const speak = useCallback((text: string | string[]) => {
    if (!isSupported) return;

    // Normalize input to array of non-empty strings
    const items = Array.isArray(text)
      ? text.map((t) => t.trim()).filter((t) => t.length > 0)
      : [text.trim()].filter((t) => t.length > 0);

    if (items.length === 0) {
      setState('idle');
      return;
    }

    // Cancel any ongoing speech before starting new speech
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
  }, [isSupported, speakIndex]);

  // Pause active speech
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

  // Resume paused speech
  const resume = useCallback(() => {
    if (!isSupported) return;

    isPausedRef.current = false;
    setState('playing');

    try {
      window.speechSynthesis.resume();
    } catch {
      // noop
    }

    // If synth is not speaking (e.g. fallback cadence or browser resume quirk), re-trigger current index
    if (!window.speechSynthesis.speaking && activeIndexRef.current < queueRef.current.length) {
      speakIndex(activeIndexRef.current);
    }
  }, [isSupported, speakIndex]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // Ensure voice list is primed if loaded asynchronously
  useEffect(() => {
    if (!isSupported) return;

    const synth = window.speechSynthesis;
    const handleVoicesChanged = () => {
      // Voices populated
    };

    if ('onvoiceschanged' in synth) {
      synth.onvoiceschanged = handleVoicesChanged;
    }

    return () => {
      if ('onvoiceschanged' in synth) {
        synth.onvoiceschanged = null;
      }
    };
  }, [isSupported]);

  return {
    speak,
    pause,
    resume,
    stop,
    state,
    isSupported,
    currentIndex,
    totalItems,
  };
}
