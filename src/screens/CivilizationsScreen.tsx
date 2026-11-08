/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Civilizations Screen (تبويب الحضارات)
 * Explorer for ancient Arabian civilizations, kingdoms, and peoples.
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Landmark,
  Search,
  X,
  MapPin,
  Calendar,
  Building2,
  ChevronLeft,
  Sparkles,
  Clock,
  ArrowRight,
  ArrowLeft,
  List,
  Play,
  Pause,
} from 'lucide-react';
import { Civilization, getAllCivilizations } from '../data/civTypes';
import { getEntryById, getAllEntries } from '../data/seed';
import { CivilizationPage } from './CivilizationPage';
import { Card } from '../components/primitives/Card';
import { useTheme } from '../theme/ThemeContext';
import { normalizeArabic } from '../utils/arabicSearch';
import { getCivImageUrl } from '../utils/assets';
import { storage } from '../data/storage';

export interface CivilizationsScreenProps {
  onSelectMythId?: (mythId: string) => void;
  selectedCivId?: string | null;
  onClearSelectedCiv?: () => void;
  onOpenMethodology?: () => void;
}

export const CivilizationsScreen: React.FC<CivilizationsScreenProps> = ({
  onSelectMythId,
  selectedCivId,
  onClearSelectedCiv,
  onOpenMethodology,
}) => {
  const { tokens, isDark } = useTheme();

  // Selected civilization for detail view
  const [activeCiv, setActiveCiv] = useState<Civilization | null>(null);

  // Cinematic auto-tour state
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [isTourPaused, setIsTourPaused] = useState<boolean>(false);
  const [tourOffset, setTourOffset] = useState<number>(0);
  const [currentTourYear, setCurrentTourYear] = useState<number>(-2500);
  const [dwellingCiv, setDwellingCiv] = useState<Civilization | null>(null);
  const [isDwellingCardVisible, setIsDwellingCardVisible] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timelineTrackRef = useRef<HTMLDivElement>(null);

  // Tour mutable animation reference
  const tourRef = useRef<{
    rafId: number | null;
    isPaused: boolean;
    currentIndex: number;
    phase: 'transition' | 'dwell';
    phaseStartTime: number;
    fromOffset: number;
    targetOffset: number;
    fromYear: number;
    targetYear: number;
    trackWidth: number;
    viewportWidth: number;
    maxOffset: number;
    pausedAt: number;
  }>({
    rafId: null,
    isPaused: false,
    currentIndex: 0,
    phase: 'transition',
    phaseStartTime: 0,
    fromOffset: 0,
    targetOffset: 0,
    fromYear: -2500,
    targetYear: -2300,
    trackWidth: 760,
    viewportWidth: 360,
    maxOffset: 400,
    pausedAt: 0,
  });

  // Segment toggle: "القائمة | خط الزمن" (persisted choice)
  const [viewMode, setViewModeState] = useState<'list' | 'timeline'>(() => storage.getCivSegment());

  const handleSetViewMode = (mode: 'list' | 'timeline') => {
    setViewModeState(mode);
    storage.setCivSegment(mode);
  };

  // Selected civilization in Timeline view (for "أساطير من العالم نفسه" related myths chips)
  const [selectedTimelineCiv, setSelectedTimelineCiv] = useState<Civilization | null>(null);

  // Selected Era filter chip
  const [selectedEra, setSelectedEra] = useState<string>('all');

  // Search input query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Timeline: Myth stars toggle (default ON)
  const [showMythStars, setShowMythStars] = useState<boolean>(true);

  // All myths with chronological approxYear data
  const mythsWithYear = useMemo(() => {
    return getAllEntries().filter((m) => typeof m.approxYear === 'number');
  }, []);

  // All civilizations loaded from data
  const allCivilizations = useMemo(() => getAllCivilizations(), []);

  // Sorted civilizations for tour in chronological order (oldest to newest)
  const sortedTourCivs = useMemo(() => {
    return [...allCivilizations].sort((a, b) => (a.startYear ?? -1000) - (b.startYear ?? -1000));
  }, [allCivilizations]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Cleanup RAF on unmount or tab switch
  useEffect(() => {
    return () => {
      if (tourRef.current.rafId) {
        cancelAnimationFrame(tourRef.current.rafId);
      }
    };
  }, []);

  // End Tour handler
  const handleEndTour = useCallback((isNatural = false) => {
    if (tourRef.current.rafId) {
      cancelAnimationFrame(tourRef.current.rafId);
      tourRef.current.rafId = null;
    }
    setIsTourActive(false);
    setIsTourPaused(false);
    tourRef.current.isPaused = false;
    setTourOffset(0);
    setDwellingCiv(null);
    setIsDwellingCardVisible(false);

    if (isNatural) {
      setToastMessage('انتهت الرحلة عند 600م — على أعتاب عصر جديد');
    }
  }, []);

  // Switch away from timeline mode terminates tour
  useEffect(() => {
    if (viewMode !== 'timeline' && isTourActive) {
      handleEndTour(false);
    }
  }, [viewMode, isTourActive, handleEndTour]);

  // Pause / Resume toggle
  const handleToggleTourPause = useCallback(() => {
    if (!isTourActive) return;
    const nextPaused = !tourRef.current.isPaused;
    tourRef.current.isPaused = nextPaused;
    setIsTourPaused(nextPaused);

    if (nextPaused) {
      tourRef.current.pausedAt = performance.now();
    } else {
      const pauseDuration = performance.now() - tourRef.current.pausedAt;
      tourRef.current.phaseStartTime += pauseDuration;
    }
  }, [isTourActive]);

  // Start Tour handler
  const handleStartTour = useCallback(() => {
    if (!scrollContainerRef.current || !timelineTrackRef.current) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const trackWidth = timelineTrackRef.current.scrollWidth || 760;
    const viewportWidth = scrollContainerRef.current.clientWidth || 360;
    const maxOffset = Math.max(0, trackWidth - viewportWidth);

    // Reset container scroll position
    scrollContainerRef.current.scrollLeft = 0;

    setIsTourActive(true);
    setIsTourPaused(false);
    setTourOffset(0);
    setCurrentTourYear(-2500);

    const firstCiv = sortedTourCivs[0];
    const firstMidYear = firstCiv
      ? Math.round(((firstCiv.startYear ?? -2300) + (firstCiv.endYear ?? -1700)) / 2)
      : -2000;
    const firstPct = (firstMidYear - (-2500)) / 3100;
    const firstTargetOffset = Math.max(0, Math.min(maxOffset, firstPct * trackWidth - viewportWidth / 2));

    const now = performance.now();

    tourRef.current = {
      rafId: null,
      isPaused: false,
      currentIndex: 0,
      phase: 'transition',
      phaseStartTime: now,
      fromOffset: 0,
      targetOffset: firstTargetOffset,
      fromYear: -2500,
      targetYear: firstMidYear,
      trackWidth,
      viewportWidth,
      maxOffset,
      pausedAt: 0,
    };

    const animateTour = (timestamp: number) => {
      const state = tourRef.current;
      if (state.isPaused) {
        state.rafId = requestAnimationFrame(animateTour);
        return;
      }

      if (state.phase === 'transition') {
        const transDuration = prefersReducedMotion ? 0 : 1200;
        const elapsed = timestamp - state.phaseStartTime;

        if (elapsed >= transDuration) {
          // Reached target civilization
          setTourOffset(state.targetOffset);
          setCurrentTourYear(state.targetYear);
          const currentCiv = sortedTourCivs[state.currentIndex];
          setDwellingCiv(currentCiv);
          setSelectedTimelineCiv(currentCiv);
          setIsDwellingCardVisible(true);

          state.phase = 'dwell';
          state.phaseStartTime = timestamp;
        } else {
          const t = elapsed / transDuration;
          const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          const curOffset = state.fromOffset + (state.targetOffset - state.fromOffset) * ease;
          const curYear = Math.round(state.fromYear + (state.targetYear - state.fromYear) * ease);

          setTourOffset(curOffset);
          setCurrentTourYear(curYear);
        }
      } else if (state.phase === 'dwell') {
        const dwellDuration = 2500;
        const elapsed = timestamp - state.phaseStartTime;

        if (elapsed >= dwellDuration) {
          setIsDwellingCardVisible(false);

          const nextIndex = state.currentIndex + 1;
          if (nextIndex >= sortedTourCivs.length) {
            // Reached natural end of the tour
            handleEndTour(true);
            return;
          }

          // Advance to next civilization
          const nextCiv = sortedTourCivs[nextIndex];
          const nextMidYear = Math.round(((nextCiv.startYear ?? 0) + (nextCiv.endYear ?? 0)) / 2);
          const nextPct = (nextMidYear - (-2500)) / 3100;
          const nextTargetOffset = Math.max(
            0,
            Math.min(state.maxOffset, nextPct * state.trackWidth - state.viewportWidth / 2)
          );

          state.currentIndex = nextIndex;
          state.phase = 'transition';
          state.phaseStartTime = timestamp;
          state.fromOffset = state.targetOffset;
          state.targetOffset = nextTargetOffset;
          state.fromYear = state.targetYear;
          state.targetYear = nextMidYear;
        }
      }

      state.rafId = requestAnimationFrame(animateTour);
    };

    tourRef.current.rafId = requestAnimationFrame(animateTour);
  }, [sortedTourCivs, handleEndTour]);

  // Sync external selectedCivId if provided
  useEffect(() => {
    if (selectedCivId) {
      const found = allCivilizations.find((c) => c.id === selectedCivId);
      if (found) {
        setActiveCiv(found);
      }
    }
  }, [selectedCivId, allCivilizations]);

  // Unique eras from data
  const uniqueEras = useMemo(() => {
    const set = new Set<string>();
    allCivilizations.forEach((c) => {
      if (c.era && c.era.trim()) {
        set.add(c.era.trim());
      }
    });
    return Array.from(set);
  }, [allCivilizations]);

  // Filtered civilizations by era and search
  const filteredCivilizations = useMemo(() => {
    let list = allCivilizations;

    // Era filter
    if (selectedEra !== 'all') {
      list = list.filter((c) => c.era === selectedEra);
    }

    // Search query
    const q = searchQuery.trim();
    if (q) {
      const normQ = normalizeArabic(q);
      list = list.filter((c) => {
        const normName = normalizeArabic(c.name || '');
        const normLatin = (c.latinName || '').toLowerCase();
        const normRegion = normalizeArabic(c.region || '');
        const normCities = (c.cities || []).map((ct) => normalizeArabic(ct)).join(' ');
        const normEra = normalizeArabic(c.era || '');
        return (
          normName.includes(normQ) ||
          normLatin.includes(normQ) ||
          normRegion.includes(normQ) ||
          normCities.includes(normQ) ||
          normEra.includes(normQ)
        );
      });
    }

    return list;
  }, [allCivilizations, selectedEra, searchQuery]);

  // If viewing a single civilization detail
  if (activeCiv) {
    return (
      <CivilizationPage
        civilization={activeCiv}
        onBack={() => {
          setActiveCiv(null);
          if (onClearSelectedCiv) onClearSelectedCiv();
        }}
        onSelectMythId={onSelectMythId}
        onOpenMethodology={onOpenMethodology}
      />
    );
  }

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200" dir="rtl">
      {/* 1. Header with Title & Icon */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-2xl sm:text-3xl font-bold leading-tight"
          >
            الحضارات والأقوام
          </h2>
          <p
            style={{ color: tokens.textSecondary }}
            className="text-xs font-['Cairo',sans-serif] mt-0.5"
          >
            سجل الممالك القديمة وحواضر شبه الجزيرة العربية ({allCivilizations.length} حضارة)
          </p>
        </div>
        <div
          style={{
            backgroundColor: tokens.surface,
            borderColor: tokens.border,
            color: tokens.deepAccent,
          }}
          className="w-10 h-10 rounded-xl border flex items-center justify-center shadow-xs shrink-0"
        >
          <Landmark size={20} strokeWidth={1.8} />
        </div>
      </div>

      {/* STEP 1: Segment toggle: "القائمة | خط الزمن" (persisted choice) */}
      <div
        style={{
          backgroundColor: tokens.surface,
          borderColor: tokens.border,
        }}
        className="flex items-center rounded-2xl p-1 border shadow-xs"
        role="tablist"
        aria-label="نمط عرض الحضارات"
      >
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'list'}
          onClick={() => handleSetViewMode('list')}
          style={{
            backgroundColor: viewMode === 'list' ? tokens.card : 'transparent',
            color: viewMode === 'list' ? tokens.deepAccent : tokens.textSecondary,
            borderColor: viewMode === 'list' ? tokens.border : 'transparent',
          }}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <List size={15} />
          <span>القائمة</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'timeline'}
          onClick={() => handleSetViewMode('timeline')}
          style={{
            backgroundColor: viewMode === 'timeline' ? tokens.card : 'transparent',
            color: viewMode === 'timeline' ? tokens.deepAccent : tokens.textSecondary,
            borderColor: viewMode === 'timeline' ? tokens.border : 'transparent',
          }}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <Clock size={15} />
          <span>خط الزمن</span>
        </button>
      </div>

      {/* VIEW MODE 1: TIMELINE VIEW */}
      {viewMode === 'timeline' ? (
        <div className="space-y-4 pt-1 animate-in fade-in duration-200">
          {/* Tour Controls HUD during active tour */}
          {isTourActive && (
            <div
              onClick={handleToggleTourPause}
              style={{
                backgroundColor: isDark ? 'rgba(11, 36, 32, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                borderColor: tokens.border,
              }}
              className="p-3 sm:p-3.5 rounded-2xl border shadow-lg backdrop-blur-md flex items-center justify-between gap-3 font-['Cairo',sans-serif] animate-in fade-in duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div
                  style={{ backgroundColor: '#0E5C4D' }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-xs shrink-0"
                >
                  {isTourPaused ? <Play size={16} className="fill-white translate-x-[-0.5px]" /> : <Pause size={16} className="fill-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: tokens.textPrimary }} className="text-xs sm:text-sm font-bold font-['Aref_Ruqaa',serif]">
                      رحلة عبر الزمن
                    </span>
                    <span
                      style={{
                        backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : '#D6F4E7',
                        color: isDark ? '#7FD1AE' : '#0B483B',
                      }}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono"
                    >
                      {currentTourYear < 0 ? `${Math.abs(currentTourYear)} ق.م` : `${currentTourYear} م`}
                    </span>
                  </div>
                  <span style={{ color: tokens.textSecondary }} className="text-[10px] sm:text-[11px] block opacity-85">
                    {isTourPaused ? 'متوقف مؤقتاً — اضغط في أي مكان للمتابعة' : 'جولة سينمائية تلقائية — اضغط في أي مكان للإيقاف المؤقت'}
                  </span>
                </div>
              </div>

              {/* Small "إنهاء" chip */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEndTour(false);
                }}
                style={{
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                  color: isDark ? '#FCA5A5' : '#B91C1C',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
                }}
                className="px-3.5 py-1 rounded-full text-xs font-bold border hover:opacity-85 active:scale-95 transition-all cursor-pointer font-['Cairo',sans-serif] shadow-xs shrink-0"
                title="إنهاء الرحلة والعودة"
              >
                إنهاء
              </button>
            </div>
          )}

          {/* Horizontally scrollable timeline canvas, RTL (oldest eras on the RIGHT) */}
          <div
            onClick={isTourActive ? handleToggleTourPause : undefined}
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className={`p-4 sm:p-5 rounded-[22px] border shadow-sm space-y-3 relative overflow-hidden ${
              isTourActive ? 'cursor-pointer select-none' : ''
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b" style={{ borderColor: tokens.borderSubtle }}>
              <div className="flex items-center gap-2">
                <Clock size={16} style={{ color: tokens.deepAccent }} />
                <h3 style={{ color: tokens.deepAccent }} className="font-['Aref_Ruqaa',serif] text-base font-bold">
                  التسلسل الزمني لممالك وحضارات الجزيرة
                </h3>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Legend line: "★ أسطورة | ▬ حضارة" */}
                <span
                  style={{
                    color: tokens.textSecondary,
                    backgroundColor: tokens.surface,
                    borderColor: tokens.borderSubtle,
                  }}
                  className="text-xs font-['Cairo',sans-serif] px-2.5 py-1 rounded-xl border select-none inline-flex items-center gap-1.5"
                >
                  <span style={{ color: '#7FD1AE' }} className="font-bold">★</span>
                  <span>أسطورة</span>
                  <span className="opacity-30">|</span>
                  <span style={{ color: tokens.coolBlueAccent }} className="font-bold">▬</span>
                  <span>حضارة</span>
                </span>

                {/* Toggle chip: "نجوم الأساطير" (default ON) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMythStars((prev) => !prev);
                  }}
                  style={{
                    backgroundColor: showMythStars
                      ? (isDark ? 'rgba(127, 209, 174, 0.22)' : '#D6F4E7')
                      : tokens.surface,
                    borderColor: showMythStars ? '#7FD1AE' : tokens.border,
                    color: showMythStars
                      ? (isDark ? '#7FD1AE' : '#0B483B')
                      : tokens.textSecondary,
                  }}
                  className="px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-1.5 font-['Cairo',sans-serif] shadow-xs active:scale-95"
                  aria-pressed={showMythStars}
                  title="إظهار أو إخفاء نجوم الأساطير"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={showMythStars ? '#7FD1AE' : 'currentColor'} className="shrink-0">
                    <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2Z" />
                  </svg>
                  <span>نجوم الأساطير</span>
                </button>

                <span style={{ color: tokens.textSecondary }} className="text-[11px] font-mono opacity-80">
                  2500 ق.م – 600 م
                </span>
              </div>
            </div>

            {/* Scrollable Container (pure divs + percentage widths) */}
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto pb-4 pt-2 -mx-2 px-2 no-scrollbar"
              dir="rtl"
            >
              <div
                ref={timelineTrackRef}
                style={{
                  transform: isTourActive ? `translate3d(${tourOffset}px, 0, 0)` : undefined,
                  willChange: isTourActive ? 'transform' : undefined,
                }}
                className="min-w-[760px] relative transition-none"
              >
                {/* 1. Header Gridlines every 500 years with labels */}
                {/* Range: -2500 to 600 => total span 3100 years */}
                {/* In RTL: Right is -2500 (oldest), Left is 600 (newest) */}
                <div className="relative h-7 border-b mb-3" style={{ borderColor: tokens.borderSubtle }}>
                  {[
                    { year: -2500, label: '2500 ق.م' },
                    { year: -2000, label: '2000 ق.م' },
                    { year: -1500, label: '1500 ق.م' },
                    { year: -1000, label: '1000 ق.م' },
                    { year: -500, label: '500 ق.م' },
                    { year: 1, label: '1 م' },
                    { year: 500, label: '500 م' },
                  ].map((tick) => {
                    // Right percentage from -2500
                    const rightPct = ((tick.year - (-2500)) / 3100) * 100;
                    return (
                      <div
                        key={tick.year}
                        style={{ right: `${rightPct}%` }}
                        className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                      >
                        <span
                          style={{ color: tokens.textSecondary }}
                          className="text-[10px] font-mono font-bold whitespace-nowrap"
                        >
                          {tick.label}
                        </span>
                        <div
                          style={{ backgroundColor: tokens.borderSubtle }}
                          className="w-px h-2 mt-0.5"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Vertical background gridlines spanning the rows */}
                <div className="absolute top-7 bottom-0 inset-x-0 pointer-events-none">
                  {[ -2500, -2000, -1500, -1000, -500, 1, 500 ].map((year) => {
                    const rightPct = ((year - (-2500)) / 3100) * 100;
                    return (
                      <div
                        key={`line-${year}`}
                        style={{
                          right: `${rightPct}%`,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                        }}
                        className="absolute top-0 bottom-0 w-px -translate-x-1/2"
                      />
                    );
                  })}
                </div>

                {/* TOP lane titled "نجوم الأساطير" */}
                {showMythStars && (
                  <div className="relative z-20 mb-3 pb-2.5 border-b" style={{ borderColor: tokens.borderSubtle }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#7FD1AE" className="shrink-0">
                          <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2Z" />
                        </svg>
                        <span style={{ color: tokens.deepAccent }} className="font-['Aref_Ruqaa',serif] text-xs font-bold">
                          نجوم الأساطير
                        </span>
                      </div>
                      <span style={{ color: tokens.textSecondary }} className="text-[10px] font-['Cairo',sans-serif] opacity-75">
                        اضغط على أي نجمة لفتح شاشة الأسطورة
                      </span>
                    </div>

                    <div
                      style={{
                        backgroundColor: isDark ? 'rgba(127, 209, 174, 0.08)' : 'rgba(127, 209, 174, 0.14)',
                        borderColor: isDark ? 'rgba(127, 209, 174, 0.35)' : 'rgba(127, 209, 174, 0.45)',
                      }}
                      className="relative h-10 w-full rounded-2xl border"
                    >
                      {mythsWithYear.map((myth) => {
                        const clampedYear = Math.max(-2500, Math.min(600, myth.approxYear!));
                        const rightPct = ((clampedYear - (-2500)) / 3100) * 100;
                        const yearLabel = myth.approxYear! < 0
                          ? `${Math.abs(myth.approxYear!)} ق.م`
                          : `${myth.approxYear!} م`;

                        // Stars passing under the viewport get a brief twinkle scale animation
                        const isTwinkling =
                          isTourActive &&
                          !isTourPaused &&
                          Math.abs(myth.approxYear! - currentTourYear) < 220;

                        return (
                          <button
                            key={myth.id}
                            type="button"
                            onClick={(e) => {
                              if (isTourActive) e.stopPropagation();
                              onSelectMythId && onSelectMythId(myth.id);
                            }}
                            style={{
                              right: `${rightPct}%`,
                              top: '50%',
                            }}
                            className={`absolute -translate-y-1/2 -translate-x-1/2 p-1.5 rounded-full transition-all duration-200 cursor-pointer group z-20 focus:outline-none ${
                              isTwinkling ? 'scale-150 animate-pulse' : 'hover:scale-135 active:scale-95'
                            }`}
                            title={`${myth.name} (${yearLabel}) — اضغط للقراءة`}
                            aria-label={`أسطورة ${myth.name}: نحو ${yearLabel}`}
                          >
                            {/* Four-point star (mint #7FD1AE, 14px) */}
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="#7FD1AE"
                              style={{
                                filter: isTwinkling ? 'drop-shadow(0 0 8px #7FD1AE)' : undefined,
                              }}
                              className={`drop-shadow-xs transition-transform duration-200 group-hover:drop-shadow-md shrink-0 ${
                                isTwinkling ? 'scale-125' : ''
                              }`}
                            >
                              <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2Z" />
                            </svg>

                            {/* Tooltip on hover */}
                            <span
                              style={{
                                backgroundColor: tokens.card,
                                borderColor: tokens.border,
                                color: tokens.textPrimary,
                              }}
                              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-30 font-['Cairo',sans-serif]"
                            >
                              {myth.name} ({yearLabel})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. One lane (row) per civilization */}
                <div className="space-y-3.5 relative z-10 py-1">
                  {allCivilizations.map((civ, index) => {
                    const sYear = civ.startYear !== undefined ? civ.startYear : -1000;
                    const eYear = civ.endYear !== undefined ? civ.endYear : 0;
                    const clampedStart = Math.max(-2500, Math.min(600, sYear));
                    const clampedEnd = Math.max(-2500, Math.min(600, eYear));
                    const rightPct = ((clampedStart - (-2500)) / 3100) * 100;
                    const widthPct = Math.max(7, ((clampedEnd - clampedStart) / 3100) * 100);

                    // Alternating mint (#7FD1AE tint) and cool blue (#4A90D9 tint)
                    const isMint = index % 2 === 0;
                    const isSelected = selectedTimelineCiv?.id === civ.id;
                    const isDwelling = dwellingCiv?.id === civ.id;

                    const barBg = isMint
                      ? (isDark ? 'rgba(127, 209, 174, 0.28)' : '#D6F4E7')
                      : (isDark ? 'rgba(74, 144, 217, 0.28)' : '#E3EEFC');

                    const barBorder = isMint
                      ? (isDark ? 'rgba(127, 209, 174, 0.6)' : '#8EDBC0')
                      : (isDark ? 'rgba(74, 144, 217, 0.6)' : '#ADCFF6');

                    return (
                      <div key={civ.id} className="relative h-12 flex items-center">
                        {/* Floating mini-card while dwelling on this civilization during tour */}
                        {isDwelling && (
                          <div
                            style={{
                              right: `${rightPct}%`,
                              backgroundColor: tokens.card,
                              borderColor: isDark ? '#7FD1AE' : '#0E5C4D',
                              color: tokens.textPrimary,
                            }}
                            className={`absolute bottom-full mb-1 z-40 p-2.5 sm:p-3 rounded-2xl border-2 shadow-2xl backdrop-blur-md transition-all duration-300 pointer-events-none w-[240px] sm:w-[280px] ${
                              isDwellingCardVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <span
                                style={{ color: tokens.textPrimary }}
                                className="font-['Aref_Ruqaa',serif] text-sm sm:text-base font-bold truncate"
                              >
                                {civ.name}
                              </span>
                              <span
                                style={{
                                  backgroundColor: isDark ? 'rgba(74, 144, 217, 0.25)' : '#E3EEFC',
                                  color: isDark ? '#8ABDF8' : '#1A4D7C',
                                  borderColor: isDark ? '#4A90D9' : '#ADCFF6',
                                }}
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 font-['Cairo',sans-serif]"
                              >
                                {civ.era}
                              </span>
                            </div>
                            {civ.legacy && (
                              <p
                                style={{ color: tokens.textSecondary }}
                                className="text-[11px] font-['Cairo',sans-serif] truncate leading-relaxed"
                              >
                                {civ.legacy}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Rounded bar spanning from startYear to endYear */}
                        <button
                          type="button"
                          onClick={(e) => {
                            if (isTourActive) {
                              e.stopPropagation();
                              handleToggleTourPause();
                              return;
                            }
                            setSelectedTimelineCiv(civ);
                            setActiveCiv(civ);
                          }}
                          onMouseEnter={() => !isTourActive && setSelectedTimelineCiv(civ)}
                          style={{
                            right: `${rightPct}%`,
                            width: `${widthPct}%`,
                            backgroundColor: barBg,
                            borderColor: isSelected || isDwelling ? tokens.deepAccent : barBorder,
                            color: '#0E5C4D',
                          }}
                          className={`absolute h-10 px-2.5 rounded-2xl border-2 flex flex-col justify-center text-right cursor-pointer shadow-xs transition-all duration-150 hover:scale-[1.02] hover:shadow-md active:scale-95 group ${
                            isSelected || isDwelling ? 'ring-2 ring-offset-1 ring-[#0E5C4D]' : ''
                          }`}
                          title={`اضغط لفتح صفحة ${civ.name}`}
                          aria-label={`حضارة ${civ.name}: ${civ.era}`}
                        >
                          <div className="flex items-center justify-between gap-1 w-full overflow-hidden">
                            <span
                              style={{ color: isDark ? '#E2F7ED' : '#0B483B' }}
                              className="font-['Aref_Ruqaa',serif] text-xs sm:text-sm font-bold truncate leading-tight group-hover:underline"
                            >
                              {civ.name}
                            </span>
                            <ChevronLeft size={13} style={{ color: tokens.deepAccent }} className="shrink-0 opacity-70 group-hover:opacity-100 group-hover:-translate-x-0.5 transition-transform" />
                          </div>

                          {/* Era text under name inside the bar */}
                          <span
                            style={{ color: isDark ? '#A3E2C4' : '#146353' }}
                            className="text-[10px] font-['Cairo',sans-serif] truncate block leading-none opacity-90"
                          >
                            {civ.era}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* STEP 3: Hint line below canvas */}
            <div
              style={{
                borderColor: tokens.borderSubtle,
                color: tokens.textSecondary,
              }}
              className="pt-2 border-t flex items-center justify-between text-xs font-['Cairo',sans-serif]"
            >
              <div className="flex items-center gap-1.5 font-medium">
                <ArrowRight size={14} style={{ color: tokens.deepAccent }} />
                <span>مرّر لتسافر عبر الزمن</span>
                <ArrowLeft size={14} style={{ color: tokens.deepAccent }} />
              </div>
              <span className="text-[11px] opacity-75">
                اضغط على أي شريط لفتح تفاصيل الحضارة
              </span>
            </div>
          </div>

          {/* STEP 3 (cont): When a bar is selected/focused, show "أساطير من العالم نفسه" related myths chips */}
          {selectedTimelineCiv && selectedTimelineCiv.relatedMyths && selectedTimelineCiv.relatedMyths.length > 0 && (
            <div
              style={{
                backgroundColor: tokens.card,
                borderColor: tokens.border,
              }}
              className="p-4 rounded-2xl border shadow-xs space-y-2.5 animate-in slide-in-from-top-2 duration-150"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={15} style={{ color: tokens.primaryMint }} />
                  <h4 style={{ color: tokens.deepAccent }} className="font-['Aref_Ruqaa',serif] text-sm font-bold">
                    أساطير من العالم نفسه ({selectedTimelineCiv.name})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCiv(selectedTimelineCiv)}
                  style={{ color: tokens.deepAccent }}
                  className="text-xs font-bold hover:underline cursor-pointer"
                >
                  فتح صفحة الحضارة ←
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedTimelineCiv.relatedMyths.map((mythId) => {
                  const matchedEntry = getEntryById(mythId);
                  const label = matchedEntry ? matchedEntry.name : mythId;
                  return (
                    <button
                      key={mythId}
                      type="button"
                      onClick={() => onSelectMythId && onSelectMythId(mythId)}
                      style={{
                        backgroundColor: tokens.surface,
                        borderColor: tokens.border,
                        color: tokens.deepAccent,
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border shadow-xs hover:border-[#7FD1AE] hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Sparkles size={12} style={{ color: tokens.primaryMint }} />
                      <span>{label}</span>
                      {matchedEntry?.typeLabel && (
                        <span style={{ color: tokens.textSecondary }} className="text-[10px] font-normal">
                          ({matchedEntry.typeLabel})
                        </span>
                      )}
                      <ChevronLeft size={13} className="opacity-60" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* VIEW MODE 2: STANDARD LIST VIEW */
        <div className="space-y-4">
          {/* Top Filter Chips built from unique era values */}
          {uniqueEras.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
              <button
                type="button"
                onClick={() => setSelectedEra('all')}
                style={{
                  backgroundColor: selectedEra === 'all' ? tokens.deepAccent : tokens.card,
                  color: selectedEra === 'all'
                    ? (isDark ? '#0B2420' : '#FFFFFF')
                    : tokens.textSecondary,
                  borderColor: selectedEra === 'all' ? tokens.deepAccent : tokens.border,
                }}
                className="shrink-0 px-3.5 py-1.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer hover:opacity-90 active:scale-95"
              >
                <span>الكل</span>
                <span className="text-[10px] mr-1 opacity-80">({allCivilizations.length})</span>
              </button>

              {uniqueEras.map((era) => {
                const isSelected = selectedEra === era;
                const count = allCivilizations.filter((c) => c.era === era).length;
                return (
                  <button
                    key={era}
                    type="button"
                    onClick={() => setSelectedEra(era)}
                    style={{
                      backgroundColor: isSelected ? tokens.deepAccent : tokens.card,
                      color: isSelected
                        ? (isDark ? '#0B2420' : '#FFFFFF')
                        : tokens.textSecondary,
                      borderColor: isSelected ? tokens.deepAccent : tokens.border,
                    }}
                    className="shrink-0 px-3.5 py-1.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer hover:opacity-90 active:scale-95 flex items-center gap-1"
                  >
                    <span>{era}</span>
                    <span className="text-[10px] mr-0.5 opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search Bar */}
          {allCivilizations.length > 2 && (
            <div
              style={{
                backgroundColor: tokens.card,
                borderColor: tokens.border,
              }}
              className="relative flex items-center border rounded-2xl shadow-xs transition-all duration-200"
            >
              <div style={{ color: tokens.deepAccent }} className="pr-3.5 pl-2">
                <Search size={18} strokeWidth={2.2} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، الحاضرة، أو الإقليم..."
                style={{ color: tokens.textPrimary }}
                className="w-full py-2.5 pl-10 pr-1 text-xs sm:text-sm bg-transparent outline-none font-['Cairo',sans-serif]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ color: tokens.textSecondary }}
                  className="absolute left-3 p-1 rounded-full hover:opacity-80 cursor-pointer"
                  aria-label="مسح البحث"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. List of civilization cards (only shown in 'list' mode) */}
      {viewMode === 'list' && (
        filteredCivilizations.length > 0 ? (
          <div className="grid grid-cols-1 gap-3.5 pt-1">
            {filteredCivilizations.map((civ) => {
              const civImg = getCivImageUrl(civ.id);
              return (
                <Card
                  key={civ.id}
                  variant="white"
                  elevation="subtle"
                  interactive
                  onClick={() => setActiveCiv(civ)}
                  className="overflow-hidden rounded-2xl cursor-pointer hover:border-[#7FD1AE] transition-all group border"
                >
                  {/* Visual Header / Thumbnail if available */}
                  {civImg && (
                    <div className="relative h-36 sm:h-44 w-full overflow-hidden border-b border-black/5">
                      <img
                        src={civImg}
                        alt={civ.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 flex-wrap">
                        <span
                          style={{
                            backgroundColor: isDark ? 'rgba(74, 144, 217, 0.4)' : 'rgba(232, 241, 251, 0.95)',
                            color: isDark ? '#A7E5C8' : '#1F5896',
                            borderColor: isDark ? 'rgba(74, 144, 217, 0.5)' : '#CFE2F7',
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-xs backdrop-blur-xs"
                        >
                          <Calendar size={11} />
                          <span>{civ.era}</span>
                        </span>

                        {civ.prophet && (
                          <span
                            style={{
                              backgroundColor: isDark ? 'rgba(127, 209, 174, 0.3)' : 'rgba(226, 247, 237, 0.95)',
                              color: isDark ? '#A3E2C4' : '#0B483B',
                              borderColor: isDark ? 'rgba(127, 209, 174, 0.5)' : '#A3E2C4',
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-xs backdrop-blur-xs"
                          >
                            <Sparkles size={10} />
                            <span>نبي الله {civ.prophet}</span>
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-2.5 right-3 left-3 flex items-end justify-between text-white">
                        <div>
                          <h3 className="font-['Aref_Ruqaa',serif] text-2xl font-bold text-white drop-shadow-md">
                            {civ.name}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-white/90">
                            <MapPin size={12} className="shrink-0 text-[#7FD1AE]" />
                            <span>{civ.region}</span>
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-black/50 backdrop-blur-md border border-white/20 text-white">
                          <Building2 size={12} style={{ color: tokens.primaryMint }} />
                          <span>{(civ.cities || []).length} حواضر</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 sm:p-5 space-y-2">
                    {!civImg && (
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          {/* Era pill */}
                          <div className="flex items-center gap-2">
                            <span
                              style={{
                                backgroundColor: isDark ? 'rgba(74, 144, 217, 0.2)' : '#E8F1FB',
                                color: isDark ? '#7FD1AE' : '#2A69AC',
                                borderColor: isDark ? 'rgba(74, 144, 217, 0.4)' : '#CFE2F7',
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                            >
                              <Calendar size={11} />
                              <span>{civ.era}</span>
                            </span>

                            {civ.prophet && (
                              <span
                                style={{
                                  backgroundColor: isDark ? 'rgba(127, 209, 174, 0.15)' : '#E2F7ED',
                                  color: isDark ? '#A3E2C4' : '#0B483B',
                                  borderColor: isDark ? 'rgba(127, 209, 174, 0.4)' : '#A3E2C4',
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                              >
                                <Sparkles size={10} />
                                <span>نبي الله {civ.prophet}</span>
                              </span>
                            )}
                          </div>

                          <h3
                            style={{ color: tokens.deepAccent }}
                            className="font-['Aref_Ruqaa',serif] text-xl sm:text-2xl font-bold group-hover:text-[#0E5C4D] transition-colors"
                          >
                            {civ.name}
                          </h3>

                          <div
                            style={{ color: tokens.textSecondary }}
                            className="flex items-center gap-1.5 text-xs font-['Cairo',sans-serif]"
                          >
                            <MapPin size={13} className="shrink-0 opacity-70" />
                            <span>{civ.region}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                          <div
                            style={{
                              backgroundColor: tokens.surface,
                              borderColor: tokens.border,
                              color: tokens.textSecondary,
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border"
                          >
                            <Building2 size={12} style={{ color: tokens.deepAccent }} />
                            <span>{(civ.cities || []).length} حواضر</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick teaser if chapters available */}
                    {civ.chapters && civ.chapters[0] && (
                      <p
                        style={{ color: tokens.textPrimary }}
                        className="text-xs font-['Cairo',sans-serif] opacity-80 line-clamp-2 leading-relaxed"
                      >
                        {civ.chapters[0].text}
                      </p>
                    )}

                    <div
                      style={{ color: tokens.deepAccent }}
                      className="pt-2 flex items-center justify-between text-xs font-bold group-hover:opacity-100"
                    >
                      <span>استكشف تاريخ وحضارة {civ.name}</span>
                      <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Empty state when no civilizations exist yet */
          <Card
            variant="white"
            elevation="subtle"
            className="p-8 sm:p-12 text-center space-y-4 rounded-2xl border"
          >
            <div
              style={{
                backgroundColor: tokens.surface,
                borderColor: tokens.border,
                color: tokens.deepAccent,
              }}
              className="w-16 h-16 mx-auto rounded-2xl border flex items-center justify-center shadow-xs"
            >
              <Landmark size={32} strokeWidth={1.5} />
            </div>
            <div className="space-y-1">
              <h3
                style={{ color: tokens.deepAccent }}
                className="font-['Aref_Ruqaa',serif] text-xl font-bold"
              >
                موسوعة الحضارات والأقوام
              </h3>
              <p
                style={{ color: tokens.textSecondary }}
                className="text-xs sm:text-sm font-['Cairo',sans-serif] max-w-sm mx-auto leading-relaxed"
              >
                {searchQuery
                  ? 'لم يتم العثور على حضارات تطابق بحثك. جرّب كلمات أخرى.'
                  : 'يتم حالياً تجهيز الدفعة التوثيقية الشاملة لحضارات وأقوام الجزيرة العربية (عاد، ثمود، سبأ، مدين، والأنباط).'}
              </p>
            </div>
          </Card>
        )
      )}

      {/* STEP 1: Floating play button on the Timeline titled "رحلة عبر الزمن" (play icon, ember-free: deep teal #0E5C4D, white icon, 52px) */}
      {viewMode === 'timeline' && !isTourActive && (
        <button
          type="button"
          onClick={handleStartTour}
          title="رحلة عبر الزمن"
          aria-label="رحلة عبر الزمن"
          style={{
            backgroundColor: '#0E5C4D',
            width: '52px',
            height: '52px',
            boxShadow: '0 8px 24px -4px rgba(14, 92, 77, 0.45), 0 0 12px rgba(127, 209, 174, 0.25)',
          }}
          className="fixed bottom-20 left-4 sm:left-6 z-40 rounded-full flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-xl group border-2 border-white/20"
        >
          <Play size={22} className="fill-white text-white ml-0.5" />
        </button>
      )}

      {/* STEP 4: Toast on natural end: "انتهت الرحلة عند 600م — على أعتاب عصر جديد" */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: '#0E5C4D',
            color: '#FFFFFF',
            boxShadow: '0 12px 30px -4px rgba(14, 92, 77, 0.45)',
          }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold font-['Cairo',sans-serif] shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto border border-[#7FD1AE]/40"
        >
          <Sparkles size={16} className="text-[#7FD1AE] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
