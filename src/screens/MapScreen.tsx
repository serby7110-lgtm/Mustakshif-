/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif 2D Flat Vector Map Screen (خريطة الأساطير والحضارات)
 * Clean 2D flat SVG map of the Arab world (Arabian Peninsula, Levant, Mesopotamia, North Africa, Yemen).
 * Features:
 * - Land fill #F2FBF7 with thin teal outline #7FD1AE (1px)
 * - Sea fill #E8F1FB with subtle wave pattern (thin lines, no gradient)
 * - Faint dashed country hint borders #C9E8D9 (0.5px)
 * - 3% opacity Arabic geometric pattern watermark in corners
 * - SVG-only markers (8px circles, 10x10 rounded squares for civilizations) with 1.5px white stroke
 * - 60fps pan/zoom with requestAnimationFrame, pinch-to-zoom (1x - 3x), and inertia
 * - Bottom-left legend box (120x180px) and bottom-right 32px 4-point compass rose
 * - Top search input with Arabic normalization and scrollable filter chips
 * - RTL bottom sheet (max 40% height) with thumbnail (48x48), display font name, 2-line summary, tags, and "اقرأ القصة"
 * - Themed for light (#FFFFFF / #E8F1FB / #F2FBF7) and dark (#0B2420 / #12332D)
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  Compass,
  MapPin,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

import { Tag, TagVariant } from '../components/primitives/Tag';
import { MythEntry, MythCategory } from '../data/types';
import { Civilization, getAllCivilizations } from '../data/civTypes';
import mythsData from '../data/myths.json';
import { useTheme } from '../theme/ThemeContext';
import { storage } from '../data/storage';
import { normalizeArabic } from '../utils/arabicSearch';
import { getCivImageUrl } from '../utils/assets';
import { useDebounce } from '../hooks/useDebounce';

import { useI18n } from '../i18n/i18n';
export interface MapScreenProps {
  onSelectEntry: (entry: MythEntry) => void;
  onSelectCivilization?: (civId: string) => void;
}

export type MapFilterCategory =
  | 'all'
  | 'gods'
  | 'creatures'
  | 'places'
  | 'heroes'
  | 'personalities'
  | 'rituals'
  | 'civilizations';

export interface MapPosition {
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  arabicRegionShort: string;
}

// Complete geographic coordinate mapping for all myth entries
export const MYTH_MAP_POSITIONS: Record<string, MapPosition> = {
  ghul: { x: 64, y: 46, arabicRegionShort: 'بوادي نجد' },
  anqa: { x: 84, y: 22, arabicRegionShort: 'جبال القفار' },
  irm: { x: 74, y: 76, arabicRegionShort: 'الأحقاف' },
  allat: { x: 58, y: 56, arabicRegionShort: 'الطائف' },
  jinn: { x: 60, y: 39, arabicRegionShort: 'الخرائب والأودية' },
  aluzza: { x: 57, y: 52, arabicRegionShort: 'وادي نخلة' },
  manat: { x: 55, y: 50, arabicRegionShort: 'ساحل قديد' },
  hubal: { x: 56, y: 59, arabicRegionShort: 'مكة المكرمة' },
  wadd: { x: 58, y: 31, arabicRegionShort: 'دومة الجندل' },
  suwa: { x: 55, y: 64, arabicRegionShort: 'رهاط' },
  yaghuth: { x: 63, y: 77, arabicRegionShort: 'اليمن' },
  yauq: { x: 60, y: 73, arabicRegionShort: 'خيوان' },
  nasr: { x: 66, y: 81, arabicRegionShort: 'بلخع' },
  saqlaba: { x: 68, y: 50, arabicRegionShort: 'مفاوز البادية' },
  qutrub: { x: 44, y: 36, arabicRegionShort: 'مقابر الفلوات' },
  umm_duwais: { x: 77, y: 44, arabicRegionShort: 'سواحل الخليج' },
  nasanis: { x: 87, y: 68, arabicRegionShort: 'جزر البحر البعيد' },
  hama: { x: 67, y: 41, arabicRegionShort: 'أطلال البادية' },
  ifrit: { x: 49, y: 46, arabicRegionShort: 'الكهوف العميقة' },
  marid: { x: 52, y: 61, arabicRegionShort: 'بحر القلزم' },
  wad_abqar: { x: 63, y: 49, arabicRegionShort: 'وادي عبقر' },
  qaf: { x: 91, y: 17, arabicRegionShort: 'جبل قاف' },
  city_copper: { x: 24, y: 48, arabicRegionShort: 'الصحراء الكبرى' },
  bahr_rih: { x: 83, y: 83, arabicRegionShort: 'بحر الريح' },
  val_waqwaq: { x: 92, y: 77, arabicRegionShort: 'جزيرة الواقواق' },
  balqis: { x: 64, y: 72, arabicRegionShort: 'عرش مأرب' },
  suleiman: { x: 52, y: 26, arabicRegionShort: 'بيت المقدس' },
  sayf: { x: 61, y: 79, arabicRegionShort: 'صنعاء' },
  antarah: { x: 62, y: 43, arabicRegionShort: 'ديار عبس' },
  zir_salem: { x: 65, y: 35, arabicRegionShort: 'ديار تغلب' },
  juha: { x: 48, y: 21, arabicRegionShort: 'حواضر الشرق' },
  abuzayd: { x: 35, y: 38, arabicRegionShort: 'مسار التغريبة' },
  harut_marut: { x: 65, y: 25, arabicRegionShort: 'أرض بابل' },
  khidr: { x: 45, y: 23, arabicRegionShort: 'مجمع البحرين' },
  malik: { x: 78, y: 17, arabicRegionShort: 'عوالم الغيب' },
  tatayyur: { x: 53, y: 44, arabicRegionShort: 'بوادي الحجاز' },
  iyafa: { x: 59, y: 47, arabicRegionShort: 'طرق القوافل' },
  kahana: { x: 62, y: 28, arabicRegionShort: 'سواد العراق' },
  istisqa: { x: 57, y: 69, arabicRegionShort: 'جبال السروات' },
  anwaa: { x: 70, y: 45, arabicRegionShort: 'مرصد البادية' },
  zuhal: { x: 31, y: 16, arabicRegionShort: 'فلك زحل' },
  suhayl: { x: 69, y: 84, arabicRegionShort: 'أفق الجنوب' },
  thurayya: { x: 71, y: 16, arabicRegionShort: 'عنقود الثريا' },
  qamar_saba: { x: 67, y: 75, arabicRegionShort: 'معبد المقه' },
  ain_zumurrud: { x: 73, y: 62, arabicRegionShort: 'الربع الخالي' },
  samud: { x: 53, y: 37, arabicRegionShort: 'مدائن صالح' },
  sad: { x: 71, y: 71, arabicRegionShort: 'رمال الأحقاف' },
  tuba: { x: 58, y: 83, arabicRegionShort: 'ظفار يريم' },
  sihr: { x: 68, y: 22, arabicRegionShort: 'بابل القديمة' },
  bahr_zulumat: { x: 10, y: 34, arabicRegionShort: 'بحر الظلمات' },
  'zarqa-al-yamama': { x: 67, y: 46, arabicRegionShort: 'اليمامة / نجد' },
};

// Complete geographic coordinate mapping for civilizations
export const CIV_MAP_POSITIONS: Record<string, MapPosition> = {
  'civ-aad': { x: 74, y: 74, arabicRegionShort: 'الأحقاف' },
  'civ-thamud': { x: 54, y: 38, arabicRegionShort: 'الحِجر' },
  'civ-madyan': { x: 50, y: 31, arabicRegionShort: 'مدين' },
  'civ-saba': { x: 64, y: 72, arabicRegionShort: 'مأرب' },
  'civ-himyar': { x: 61, y: 80, arabicRegionShort: 'ظفار' },
  'civ-nabataean': { x: 51, y: 27, arabicRegionShort: 'البتراء' },
  'civ-tasm-jadis': { x: 67, y: 47, arabicRegionShort: 'اليمامة' },
  'civ-lakhm': { x: 68, y: 24, arabicRegionShort: 'الحيرة' },
  'civ-ghassan': { x: 54, y: 22, arabicRegionShort: 'الجابية' },
  'civ-mecca': { x: 56, y: 58, arabicRegionShort: 'مكة' },
};

// Generic map item unifying myths and civilizations for map plotting
export interface MapItem {
  id: string;
  name: string;
  type: 'myth' | 'civilization';
  categoryKey: 'gods' | 'creatures' | 'places' | 'heroes' | 'personalities' | 'rituals' | 'civilizations';
  cx: number;
  cy: number;
  color: string;
  isSquare: boolean;
  rawMyth?: MythEntry;
  rawCiv?: Civilization;
  heroImage?: string;
  summary: string;
  tags: string[];
  region: string;
}

export const MapScreen: React.FC<MapScreenProps> = ({
  onSelectEntry,
  onSelectCivilization,
}) => {
  const { t } = useI18n();
  const { tokens, isDark } = useTheme();

  // Top Bar Search & Filter states (with 300ms debounce)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeFilter, setActiveFilter] = useState<MapFilterCategory>('all');

  // Frustum culling visible bounding box (in SVG coordinates)
  const [visibleBounds, setVisibleBounds] = useState<{
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  }>({ minX: -50, maxX: 1050, minY: -50, maxY: 700 });

  // Bottom Sheet and Hovered tooltip states
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [hoveredItem, setHoveredItem] = useState<MapItem | null>(null);

  // Bottom sheet swipe down gesture state
  const touchStartY = useRef<number | null>(null);

  // All myth entries
  const allMyths = useMemo(() => mythsData as unknown as MythEntry[], []);

  // All civilizations
  const allCivilizations = useMemo(() => getAllCivilizations(), []);

  // Convert myths and civilizations to flat unified map items
  const allMapItems = useMemo<MapItem[]>(() => {
    const items: MapItem[] = [];

    // 1. Myth markers (8px diameter circle -> radius 4)
    allMyths.forEach((myth) => {
      const pos = MYTH_MAP_POSITIONS[myth.id] || {
        x: 50,
        y: 50,
        arabicRegionShort: myth.region,
      };

      let categoryKey: MapItem['categoryKey'] = 'places';
      let color = '#0E5C4D';

      if (myth.category === 'gods') {
        categoryKey = 'gods';
        color = '#7FD1AE';
      } else if (myth.category === 'creatures') {
        categoryKey = 'creatures';
        color = '#4A90D9';
      } else if (myth.category === 'places') {
        categoryKey = 'places';
        color = '#0E5C4D';
      } else if (myth.category === 'heroes') {
        categoryKey = 'heroes';
        color = '#E8602C';
      } else if (myth.category === 'personalities' || myth.category === ('seers' as MythCategory)) {
        categoryKey = 'personalities';
        color = '#9B7EDE';
      } else if (myth.category === 'rituals') {
        categoryKey = 'rituals';
        color = '#D4A24C';
      }

      items.push({
        id: myth.id,
        name: myth.name,
        type: 'myth',
        categoryKey,
        cx: (pos.x / 100) * 1000,
        cy: (pos.y / 100) * 650,
        color,
        isSquare: false,
        rawMyth: myth,
        heroImage: myth.heroImage,
        summary: myth.summary,
        tags: myth.tags || [],
        region: myth.region,
      });
    });

    // 2. Civilization markers (10x10px square with rounded corners in deep teal #0E5C4D)
    allCivilizations.forEach((civ) => {
      const pos = CIV_MAP_POSITIONS[civ.id] || {
        x: 60,
        y: 50,
        arabicRegionShort: civ.region,
      };

      items.push({
        id: civ.id,
        name: civ.name,
        type: 'civilization',
        categoryKey: 'civilizations',
        cx: (pos.x / 100) * 1000,
        cy: (pos.y / 100) * 650,
        color: '#0E5C4D',
        isSquare: true,
        rawCiv: civ,
        heroImage: getCivImageUrl(civ.id),
        summary: civ.chapters?.[0]?.text?.slice(0, 160) || civ.legacy || civ.economy || '',
        tags: [civ.era, civ.region.split(' ')[0]],
        region: civ.region,
      });
    });

    return items;
  }, [allMyths, allCivilizations]);

  // Filter and search markers with Arabic normalization
  const filteredItems = useMemo<MapItem[]>(() => {
    let result = allMapItems;

    // Filter chip filtering
    if (activeFilter !== 'all') {
      result = result.filter((item) => item.categoryKey === activeFilter);
    }

    // Search query filtering (300ms debounced)
    const q = debouncedSearchQuery.trim();
    if (q) {
      const normQ = normalizeArabic(q);
      result = result.filter((item) => {
        const normName = normalizeArabic(item.name);
        const normSummary = normalizeArabic(item.summary);
        const normRegion = normalizeArabic(item.region);
        const normTags = item.tags.map((t) => normalizeArabic(t)).join(' ');

        return (
          normName.includes(normQ) ||
          normSummary.includes(normQ) ||
          normRegion.includes(normQ) ||
          normTags.includes(normQ)
        );
      });
    }

    return result;
  }, [allMapItems, activeFilter, debouncedSearchQuery]);

  // Frustum culling: render only visible markers within current viewport bounds
  const visibleMarkers = useMemo(() => {
    return filteredItems.filter((item) => {
      return (
        item.cx >= visibleBounds.minX &&
        item.cx <= visibleBounds.maxX &&
        item.cy >= visibleBounds.minY &&
        item.cy <= visibleBounds.maxY
      );
    });
  }, [filteredItems, visibleBounds]);

  // Pan, Zoom and RAF inertia engine
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const svgGroupRef = useRef<SVGGElement>(null);

  const stateRef = useRef<{
    scale: number;
    targetScale: number;
    panX: number;
    panY: number;
    targetPanX: number;
    targetPanY: number;
    vx: number;
    vy: number;
    isDragging: boolean;
    dragStartX: number;
    dragStartY: number;
    lastMouseX: number;
    lastMouseY: number;
    lastTime: number;
    touchStartDist: number;
    touchStartScale: number;
    touchMidX: number;
    touchMidY: number;
    rafId: number | null;
  }>({
    scale: 1,
    targetScale: 1,
    panX: 0,
    panY: 0,
    targetPanX: 0,
    targetPanY: 0,
    vx: 0,
    vy: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    lastMouseX: 0,
    lastMouseY: 0,
    lastTime: 0,
    touchStartDist: 0,
    touchStartScale: 1,
    touchMidX: 0,
    touchMidY: 0,
    rafId: null,
  });

  // Apply transform directly to SVGGElement for 60fps performance without React re-renders
  const applyTransform = useCallback((x: number, y: number, s: number) => {
    if (svgGroupRef.current) {
      svgGroupRef.current.setAttribute(
        'transform',
        `translate(${x}, ${y}) scale(${s})`
      );
    }
  }, []);

  // RAF Pan/Zoom engine loop
  const animateEngine = useCallback(() => {
    const s = stateRef.current;

    // Smooth inertia when not dragging
    if (!s.isDragging) {
      s.targetPanX += s.vx;
      s.targetPanY += s.vy;
      s.vx *= 0.92;
      s.vy *= 0.92;
      if (Math.abs(s.vx) < 0.05) s.vx = 0;
      if (Math.abs(s.vy) < 0.05) s.vy = 0;
    }

    // Clamp pan bounds according to current targetScale
    const maxPanX = Math.max(0, (s.targetScale - 1) * 450);
    const maxPanY = Math.max(0, (s.targetScale - 1) * 300);
    s.targetPanX = Math.max(-maxPanX, Math.min(maxPanX, s.targetPanX));
    s.targetPanY = Math.max(-maxPanY, Math.min(maxPanY, s.targetPanY));

    // Smooth interpolation towards targets
    const dScale = (s.targetScale - s.scale) * 0.22;
    const dPanX = (s.targetPanX - s.panX) * 0.22;
    const dPanY = (s.targetPanY - s.panY) * 0.22;

    s.scale += dScale;
    s.panX += dPanX;
    s.panY += dPanY;

    applyTransform(s.panX, s.panY, s.scale);

    // Keep running RAF while animating or moving
    const isMoving =
      Math.abs(dScale) > 0.001 ||
      Math.abs(dPanX) > 0.1 ||
      Math.abs(dPanY) > 0.1 ||
      Math.abs(s.vx) > 0.1 ||
      Math.abs(s.vy) > 0.1 ||
      s.isDragging;

    if (isMoving) {
      s.rafId = requestAnimationFrame(animateEngine);
    } else {
      s.rafId = null;
      // Frustum culling: update visible bounds box when motion stops
      const sVal = s.scale;
      if (sVal > 1.05) {
        const margin = 80;
        const minX = 500 + (-500 - s.panX - margin) / sVal;
        const maxX = 500 + (500 - s.panX + margin) / sVal;
        const minY = 325 + (-325 - s.panY - margin) / sVal;
        const maxY = 325 + (325 - s.panY + margin) / sVal;
        setVisibleBounds({ minX, maxX, minY, maxY });
      } else {
        setVisibleBounds({ minX: -50, maxX: 1050, minY: -50, maxY: 700 });
      }
    }
  }, [applyTransform]);

  const scheduleUpdate = useCallback(() => {
    if (!stateRef.current.rafId) {
      stateRef.current.rafId = requestAnimationFrame(animateEngine);
    }
  }, [animateEngine]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (stateRef.current.rafId) {
        cancelAnimationFrame(stateRef.current.rafId);
      }
    };
  }, []);

  // Zoom buttons handlers
  const handleZoomIn = () => {
    stateRef.current.targetScale = Math.min(3, stateRef.current.targetScale + 0.4);
    scheduleUpdate();
  };

  const handleZoomOut = () => {
    stateRef.current.targetScale = Math.max(1, stateRef.current.targetScale - 0.4);
    scheduleUpdate();
  };

  const handleResetZoom = () => {
    stateRef.current.targetScale = 1;
    stateRef.current.targetPanX = 0;
    stateRef.current.targetPanY = 0;
    stateRef.current.vx = 0;
    stateRef.current.vy = 0;
    scheduleUpdate();
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Left button only
    if (e.button !== 0) return;
    const s = stateRef.current;
    s.isDragging = true;
    s.dragStartX = e.clientX - s.targetPanX;
    s.dragStartY = e.clientY - s.targetPanY;
    s.lastMouseX = e.clientX;
    s.lastMouseY = e.clientY;
    s.lastTime = performance.now();
    s.vx = 0;
    s.vy = 0;
    scheduleUpdate();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const s = stateRef.current;
    if (!s.isDragging) return;

    const now = performance.now();
    const dt = Math.max(1, now - s.lastTime);
    const dx = e.clientX - s.lastMouseX;
    const dy = e.clientY - s.lastMouseY;

    s.vx = (dx / dt) * 14;
    s.vy = (dy / dt) * 14;

    s.targetPanX = e.clientX - s.dragStartX;
    s.targetPanY = e.clientY - s.dragStartY;
    s.lastMouseX = e.clientX;
    s.lastMouseY = e.clientY;
    s.lastTime = now;

    scheduleUpdate();
  };

  const handleMouseUpOrLeave = () => {
    const s = stateRef.current;
    if (s.isDragging) {
      s.isDragging = false;
      scheduleUpdate();
    }
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const nextScale = Math.max(1, Math.min(3, stateRef.current.targetScale * zoomFactor));
    stateRef.current.targetScale = nextScale;
    scheduleUpdate();
  };

  // Touch pan & pinch zoom handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const s = stateRef.current;

    if (e.touches.length === 1) {
      const t = e.touches[0];
      s.isDragging = true;
      s.dragStartX = t.clientX - s.targetPanX;
      s.dragStartY = t.clientY - s.targetPanY;
      s.lastMouseX = t.clientX;
      s.lastMouseY = t.clientY;
      s.lastTime = performance.now();
      s.vx = 0;
      s.vy = 0;
      scheduleUpdate();
    } else if (e.touches.length === 2) {
      s.isDragging = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      s.touchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      s.touchStartScale = s.targetScale;
      s.touchMidX = (t1.clientX + t2.clientX) / 2;
      s.touchMidY = (t1.clientY + t2.clientY) / 2;
      scheduleUpdate();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const s = stateRef.current;

    if (e.touches.length === 1 && s.isDragging) {
      const t = e.touches[0];
      const now = performance.now();
      const dt = Math.max(1, now - s.lastTime);
      const dx = t.clientX - s.lastMouseX;
      const dy = t.clientY - s.lastMouseY;

      s.vx = (dx / dt) * 14;
      s.vy = (dy / dt) * 14;

      s.targetPanX = t.clientX - s.dragStartX;
      s.targetPanY = t.clientY - s.dragStartY;
      s.lastMouseX = t.clientX;
      s.lastMouseY = t.clientY;
      s.lastTime = now;

      scheduleUpdate();
    } else if (e.touches.length === 2 && s.touchStartDist > 0) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = currentDist / s.touchStartDist;
      s.targetScale = Math.max(1, Math.min(3, s.touchStartScale * ratio));
      scheduleUpdate();
    }
  };

  const handleTouchEnd = () => {
    const s = stateRef.current;
    s.isDragging = false;
    s.touchStartDist = 0;
    scheduleUpdate();
  };

  const getTagVariant = (tag: string): TagVariant => {
    if (tag === 'رعب') return 'horror';
    if (tag === 'تاريخ') return 'history';
    if (tag === 'خرافي') return 'supernatural';
    return 'neutral';
  };

  // Helper colors
  const seaColor = isDark ? '#0B2420' : '#E8F1FB';
  const landColor = isDark ? '#12332D' : '#F2FBF7';
  const landOutline = '#7FD1AE';
  const borderDashed = isDark ? 'rgba(127, 209, 174, 0.28)' : '#C9E8D9';

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200" dir="rtl">
      {/* 1. Header with Title & Stats Pill */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-2xl font-bold leading-tight"
          >
            خريطة الأساطير والحضارات
          </h2>
          <p
            style={{ color: tokens.textSecondary }}
            className="text-xs font-['Cairo',sans-serif] mt-0.5"
          >
            استكشف المعالم والكيانات والممالك عبر خريطة مسطحة لدول العالم العربي
          </p>
        </div>

        <div
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
          }}
          className="flex items-center gap-1.5 border px-3 py-1.5 rounded-2xl shadow-xs shrink-0"
        >
          <span
            style={{ backgroundColor: '#7FD1AE' }}
            className="w-2 h-2 rounded-full"
          />
          <span
            style={{ color: tokens.deepAccent }}
            className="text-[11px] font-bold font-mono"
          >
            {filteredItems.length} موقعاً
          </span>
        </div>
      </div>

      {/* STEP 4: Top Bar Search Input + Filter Chips Row */}
      <div className="space-y-2.5">
        {/* Search input with Arabic normalization */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في الخريطة (مثلاً: الغول، عاد، مأرب، دومة الجندل...)"
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
              color: tokens.textPrimary,
            }}
            className="w-full pr-10 pl-9 py-2.5 rounded-2xl border text-xs sm:text-sm font-['Cairo',sans-serif] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#7FD1AE] transition-all"
          />
          <Search
            size={16}
            style={{ color: tokens.textSecondary }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ color: tokens.textSecondary }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-80 cursor-pointer"
              aria-label="مسح البحث"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Scrollable Filter Chips: الكل، آلهة، كائنات، أماكن، أبطال، شخصيات، طقوس، حضارات */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          {[
            { id: 'all' as MapFilterCategory, label: t('map.all') },
            { id: 'gods' as MapFilterCategory, label: 'آلهة' },
            { id: 'creatures' as MapFilterCategory, label: 'كائنات' },
            { id: 'places' as MapFilterCategory, label: 'أماكن' },
            { id: 'heroes' as MapFilterCategory, label: 'أبطال' },
            { id: 'personalities' as MapFilterCategory, label: 'شخصيات' },
            { id: 'rituals' as MapFilterCategory, label: 'طقوس' },
            { id: 'civilizations' as MapFilterCategory, label: 'حضارات' },
          ].map((chip) => {
            const isActive = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveFilter(chip.id)}
                style={{
                  backgroundColor: isActive ? '#7FD1AE' : (isDark ? '#12332D' : '#FFFFFF'),
                  color: isActive ? '#0E5C4D' : (isDark ? '#7FD1AE' : '#0E5C4D'),
                  borderColor: isActive ? '#7FD1AE' : '#7FD1AE',
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shrink-0 min-h-[36px] flex items-center justify-center gap-1 shadow-2xs hover:opacity-90 active:scale-95 select-none"
              >
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Pure SVG 2D Flat Map Container */}
      <div
        ref={mapViewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          backgroundColor: seaColor,
          borderColor: isDark ? 'rgba(127, 209, 174, 0.4)' : '#7FD1AE',
        }}
        className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-[24px] border-2 shadow-sm overflow-hidden select-none cursor-grab active:cursor-grabbing touch-none"
      >
        {/* Top-left Zoom Controls */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-1 bg-white/95 dark:bg-[#12332D]/95 backdrop-blur-md p-1 rounded-2xl border border-[#7FD1AE] shadow-xs pointer-events-auto">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 text-[#0E5C4D] dark:text-[#7FD1AE] hover:bg-[#F2FBF7] dark:hover:bg-[#0B2420] rounded-xl cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors"
            title="تكبير"
            aria-label="تكبير"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 text-[#0E5C4D] dark:text-[#7FD1AE] hover:bg-[#F2FBF7] dark:hover:bg-[#0B2420] rounded-xl cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors"
            title="تصغير"
            aria-label="تصغير"
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 text-[#0E5C4D] dark:text-[#7FD1AE] hover:bg-[#F2FBF7] dark:hover:bg-[#0B2420] rounded-xl cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors"
            title="إعادة ضبط"
            aria-label="إعادة ضبط"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* STEP 5: Bottom-Left Legend Box (small, ~120x180px) */}
        <div
          style={{
            width: '125px',
            backgroundColor: isDark ? '#12332D' : '#FFFFFF',
            borderColor: '#7FD1AE',
          }}
          className="absolute bottom-3 left-3 z-20 p-2.5 rounded-2xl border shadow-sm pointer-events-auto select-none space-y-1.5"
        >
          <h4
            style={{ color: isDark ? '#7FD1AE' : '#0E5C4D' }}
            className="font-['Aref_Ruqaa',serif] text-xs font-bold border-b border-[#7FD1AE]/30 pb-1"
          >
            {t('map.legend')}
          </h4>

          <div className="space-y-1 text-[10px] font-['Cairo',sans-serif] font-medium leading-tight text-[#14312B] dark:text-[#E2F7ED]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7FD1AE] border border-white shrink-0" />
              <span>آلهة</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4A90D9] border border-white shrink-0" />
              <span>كائنات</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0E5C4D] border border-white shrink-0" />
              <span>أماكن</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E8602C] border border-white shrink-0" />
              <span>أبطال</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9B7EDE] border border-white shrink-0" />
              <span>شخصيات</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4A24C] border border-white shrink-0" />
              <span>طقوس</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[#0E5C4D] border border-white shrink-0" />
              <span>حضارات</span>
            </div>
          </div>
        </div>

        {/* STEP 6: Bottom-Right Compass Rose (simple 4-point star, teal, 32px) */}
        <div
          className="absolute bottom-3 right-3 z-20 pointer-events-none select-none flex flex-col items-center justify-center p-1"
          title="بوصلة الجهات"
        >
          <span className="text-[10px] font-bold text-[#0E5C4D] dark:text-[#7FD1AE] font-['Aref_Ruqaa',serif] leading-none mb-0.5">
            ش
          </span>
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            className="w-8 h-8 drop-shadow-2xs"
          >
            {/* 4-point star in deep teal #0E5C4D */}
            <polygon
              points="16,1 19,13 31,16 19,19 16,31 13,19 1,16 13,13"
              fill="#0E5C4D"
              stroke="#7FD1AE"
              strokeWidth="0.8"
            />
            {/* Inner center ring */}
            <circle cx="16" cy="16" r="2.5" fill="#7FD1AE" />
          </svg>
        </div>

        {/* STEP 8: Empty State when no results found */}
        {filteredItems.length === 0 && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2.5 bg-white/80 dark:bg-[#0B2420]/85 backdrop-blur-xs p-6 text-center pointer-events-auto">
            <div
              style={{
                backgroundColor: isDark ? '#12332D' : '#F2FBF7',
                borderColor: '#7FD1AE',
              }}
              className="w-12 h-12 rounded-2xl border flex items-center justify-center text-[#0E5C4D] dark:text-[#7FD1AE] shadow-xs"
            >
              <MapPin size={24} />
            </div>
            <h3
              style={{ color: isDark ? '#7FD1AE' : '#0E5C4D' }}
              className="font-['Aref_Ruqaa',serif] text-base font-bold"
            >
              لا نتائج — جرّب فلتر آخر
            </h3>
            <p
              style={{ color: tokens.textSecondary }}
              className="text-xs font-['Cairo',sans-serif] max-w-xs"
            >
              لم نعثر على مواقع مطابقة للبحث الحالي. يمكنك اختيار تصنيف آخر أو مسح كلمة البحث.
            </p>
          </div>
        )}

        {/* Master Scalable SVG Map Canvas */}
        <svg
          viewBox="0 0 1000 650"
          className="w-full h-full block"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Sea subtle wave pattern: thin lines, no gradient */}
            <pattern
              id="seaWavePattern"
              width="48"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 0,12 Q 12,7 24,12 T 48,12"
                fill="none"
                stroke={isDark ? 'rgba(127, 209, 174, 0.12)' : 'rgba(127, 209, 174, 0.35)'}
                strokeWidth="0.8"
              />
            </pattern>

            {/* Subtle Arabic geometric pattern watermark (very faint, 3% opacity in corners) */}
            <g id="arabicGeometricWatermarkCorner" opacity="0.03">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#7FD1AE" strokeWidth="1.2" />
              <polygon
                points="50,5 63,22 85,22 72,40 85,58 63,58 50,75 37,58 15,58 28,40 15,22 37,22"
                fill="none"
                stroke="#7FD1AE"
                strokeWidth="1"
              />
              <polygon
                points="50,15 75,50 50,85 25,50"
                fill="none"
                stroke="#7FD1AE"
                strokeWidth="1"
              />
              <circle cx="50" cy="50" r="18" fill="none" stroke="#7FD1AE" strokeWidth="0.8" />
            </g>
          </defs>

          {/* Sea background: flat pale blue with subtle thin wave lines */}
          <rect width="1000" height="650" fill={seaColor} />
          <rect width="1000" height="650" fill="url(#seaWavePattern)" pointerEvents="none" />

          {/* Corner Watermarks (3% opacity) */}
          <use href="#arabicGeometricWatermarkCorner" x="10" y="10" pointerEvents="none" />
          <use href="#arabicGeometricWatermarkCorner" x="890" y="10" pointerEvents="none" />
          <use href="#arabicGeometricWatermarkCorner" x="10" y="540" pointerEvents="none" />
          <use href="#arabicGeometricWatermarkCorner" x="890" y="540" pointerEvents="none" />

          {/* SVG Transform Container controlled smoothly via requestAnimationFrame */}
          <g ref={svgGroupRef}>
            {/* 1. LANDMASS: North Africa (Morocco to Egypt & Sudan) */}
            <path
              d="M 60,490
                 C 70,440 75,360 85,290
                 C 90,250 100,215 115,200
                 C 140,195 180,210 225,215
                 C 270,218 300,190 320,180
                 C 335,175 350,215 365,235
                 C 390,255 425,270 450,245
                 C 470,225 490,210 515,215
                 C 530,220 545,235 550,255
                 C 555,270 560,310 575,360
                 C 590,410 615,480 635,550
                 C 640,570 655,585 670,590
                 L 640,650 L 60,650 Z"
              fill={landColor}
              stroke={landOutline}
              strokeWidth="1"
              strokeLinejoin="round"
            />

            {/* 2. LANDMASS: Arabian Peninsula, Levant & Mesopotamia */}
            <path
              d="M 550,255
                 C 555,235 560,195 565,160
                 C 570,135 600,120 645,120
                 C 690,120 730,135 765,160
                 C 785,180 770,230 755,270
                 C 745,285 755,315 770,340
                 C 785,360 805,340 820,325
                 C 835,320 845,345 835,370
                 C 825,395 845,430 870,445
                 C 885,460 875,490 855,515
                 C 825,550 780,570 730,580
                 C 685,590 655,595 640,585
                 C 630,575 625,540 615,480
                 C 605,430 580,360 565,300
                 C 555,275 550,265 550,255 Z"
              fill={landColor}
              stroke={landOutline}
              strokeWidth="1"
              strokeLinejoin="round"
            />

            {/* 3. LANDMASS: Zagros & Gulf North Coast */}
            <path
              d="M 765,160
                 C 800,170 850,185 900,210
                 C 940,230 980,260 1000,290
                 L 1000,380
                 C 960,370 915,350 880,345
                 C 850,340 835,320 820,325
                 C 785,340 785,360 770,340
                 C 755,315 745,285 755,270
                 C 770,230 785,180 765,160 Z"
              fill={landColor}
              stroke={landOutline}
              strokeWidth="1"
              strokeLinejoin="round"
              opacity="0.9"
            />

            {/* Mythical Islands */}
            <ellipse
              cx="925"
              cy="500"
              rx="18"
              ry="10"
              fill={landColor}
              stroke={landOutline}
              strokeWidth="1"
            />
            <ellipse
              cx="940"
              cy="520"
              rx="12"
              ry="7"
              fill={landColor}
              stroke={landOutline}
              strokeWidth="1"
            />

            {/* Country Hint Borders: very faint dashed lines #C9E8D9 (0.5px) */}
            <g
              stroke={borderDashed}
              strokeWidth="0.5"
              strokeDasharray="3,3"
              fill="none"
              pointerEvents="none"
            >
              {/* Egypt / Levant frontier */}
              <path d="M 535,235 L 530,350" />
              {/* Levant / Mesopotamia frontier */}
              <path d="M 610,135 L 615,260" />
              {/* Hejaz / Najd frontier */}
              <path d="M 590,320 L 610,480" />
              {/* Najd / Eastern Arabia */}
              <path d="M 720,290 L 730,470" />
              {/* Yemen frontier */}
              <path d="M 610,545 L 750,530" />
              {/* Oman / Empty quarter */}
              <path d="M 790,440 L 800,530" />
              {/* North African hints */}
              <path d="M 220,215 L 220,400" />
              <path d="M 320,185 L 320,380" />
              <path d="M 440,230 L 440,420" />
            </g>

            {/* Rivers: Tigris, Euphrates & Nile (clean 2D lines) */}
            <g
              fill="none"
              stroke="#7FD1AE"
              strokeWidth="0.8"
              opacity={isDark ? '0.4' : '0.6'}
              pointerEvents="none"
            >
              {/* Tigris & Euphrates */}
              <path d="M 630,125 Q 660,180 710,240" />
              <path d="M 655,125 Q 685,180 725,245" />
              {/* Nile */}
              <path d="M 535,235 Q 530,320 545,410" />
            </g>

            {/* Flat Region Labels in Arabic */}
            <g
              fontFamily="'Aref Ruqaa', serif"
              opacity={isDark ? '0.5' : '0.45'}
              pointerEvents="none"
            >
              <text x="640" y="420" fill={isDark ? '#7FD1AE' : '#0E5C4D'} fontSize="18" fontWeight="bold">
                نَجْدْ
              </text>
              <text x="565" y="420" fill={isDark ? '#7FD1AE' : '#0E5C4D'} fontSize="16" fontWeight="bold">
                الحِجَازْ
              </text>
              <text x="635" y="550" fill={isDark ? '#7FD1AE' : '#0E5C4D'} fontSize="17" fontWeight="bold">
                اليَمَنْ
              </text>
              <text x="730" y="530" fill={isDark ? '#7FD1AE' : '#0E5C4D'} fontSize="15" fontWeight="bold">
                الأَحْقَافْ
              </text>
              <text x="590" y="190" fill={isDark ? '#7FD1AE' : '#0E5C4D'} fontSize="15" fontWeight="bold">
                بِلَادُ الشَّامْ
              </text>
              <text x="680" y="190" fill={isDark ? '#7FD1AE' : '#0E5C4D'} fontSize="15" fontWeight="bold">
                العِرَاقُ وَبَابِل
              </text>
              <text x="460" y="320" fill={isDark ? '#7FD1AE' : '#0E5C4D'} fontSize="17" fontWeight="bold">
                مِصْرُ وَالوَادِي
              </text>
            </g>

            {/* STEP 2 & 7: Render Markers as SVG elements ONLY with Frustum Culling */}
            {visibleMarkers.map((item) => {
              const isHovered = hoveredItem?.id === item.id;
              const isSelected = selectedItem?.id === item.id;

              if (item.isSquare) {
                // Civilizations: square with rounded corners (10x10px, rx=2, ry=2) in deep teal #0E5C4D
                const baseSize = 10;
                const size = isHovered || isSelected ? baseSize * 1.3 : baseSize;
                const half = size / 2;

                return (
                  <rect
                    key={item.id}
                    x={item.cx - half}
                    y={item.cy - half}
                    width={size}
                    height={size}
                    rx="2"
                    ry="2"
                    fill={item.color}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredItem(item)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem(item);
                      setHoveredItem(null);
                      storage.incrementMapSheetsCount();
                    }}
                  >
                    <title>{item.name}</title>
                  </rect>
                );
              }

              // Myths: small elegant circle (8px diameter -> radius 4px)
              const baseR = 4;
              const r = isHovered || isSelected ? baseR * 1.3 : baseR;

              return (
                <circle
                  key={item.id}
                  cx={item.cx}
                  cy={item.cy}
                  r={r}
                  fill={item.color}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredItem(item)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(item);
                    setHoveredItem(null);
                    storage.incrementMapSheetsCount();
                  }}
                >
                  <title>{item.name}</title>
                </circle>
              );
            })}

            {/* STEP 3: Hover Tooltip inside SVG */}
            {hoveredItem && (
              <g
                transform={`translate(${hoveredItem.cx}, ${hoveredItem.cy - 12})`}
                className="pointer-events-none"
              >
                {/* Tooltip Card (white card with teal border) */}
                <rect
                  x="-65"
                  y="-28"
                  width="130"
                  height="26"
                  rx="6"
                  ry="6"
                  fill={isDark ? '#12332D' : '#FFFFFF'}
                  stroke="#7FD1AE"
                  strokeWidth="1.2"
                  filter="drop-shadow(0 2px 5px rgba(0,0,0,0.15))"
                />
                <text
                  x="0"
                  y="-11"
                  textAnchor="middle"
                  fill={isDark ? '#7FD1AE' : '#0E5C4D'}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="'Aref Ruqaa', serif"
                >
                  {hoveredItem.name.length > 20
                    ? hoveredItem.name.slice(0, 19) + '…'
                    : hoveredItem.name}
                </text>
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* STEP 3: RTL Bottom Sheet (max height 40%, slides from bottom) */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedItem(null)}
          dir="rtl"
        >
          <div
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="w-full max-w-md max-h-[40vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] p-4 sm:p-5 shadow-2xl border-t sm:border animate-in slide-in-from-bottom-6 space-y-3 text-right"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              touchStartY.current = e.touches[0].clientY;
            }}
            onTouchMove={(e) => {
              if (touchStartY.current !== null) {
                const deltaY = e.touches[0].clientY - touchStartY.current;
                if (deltaY > 50) {
                  setSelectedItem(null);
                  touchStartY.current = null;
                }
              }
            }}
            onTouchEnd={() => {
              touchStartY.current = null;
            }}
          >
            {/* Sheet Handle for swipe down */}
            <div className="w-10 h-1 bg-black/15 dark:bg-white/20 rounded-full mx-auto -mt-1 mb-2" />

            {/* Header: Thumbnail 48x48 + Name (display font) + Region */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {/* Thumbnail 48x48 */}
                <div
                  style={{
                    backgroundColor: tokens.surface,
                    borderColor: '#7FD1AE',
                  }}
                  className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[#7FD1AE]/50 shadow-xs"
                >
                  {selectedItem.heroImage ? (
                    <img
                      src={selectedItem.heroImage}
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#0E5C4D]">
                      <MapPin size={20} />
                    </div>
                  )}
                </div>

                <div>
                  <h3
                    style={{ color: tokens.deepAccent }}
                    className="font-['Aref_Ruqaa',serif] text-base sm:text-lg font-bold leading-tight"
                  >
                    {selectedItem.name}
                  </h3>
                  <p
                    style={{ color: tokens.textSecondary }}
                    className="text-[11px] font-medium mt-0.5 flex items-center gap-1 font-['Cairo',sans-serif]"
                  >
                    <MapPin size={12} className="text-[#7FD1AE] shrink-0" />
                    <span>{selectedItem.region}</span>
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                aria-label="إغلاق البطاقة"
                style={{
                  backgroundColor: tokens.surface,
                  color: tokens.textSecondary,
                }}
                className="w-8 h-8 rounded-full hover:opacity-80 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Summary: 2 lines max */}
            <p
              style={{ color: tokens.textPrimary }}
              className="text-xs font-['Cairo',sans-serif] leading-relaxed line-clamp-2"
            >
              {selectedItem.summary}
            </p>

            {/* Tag Pills */}
            {selectedItem.tags && selectedItem.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {selectedItem.tags.slice(0, 3).map((tag) => (
                  <Tag key={tag} variant={getTagVariant(tag)} size="sm">
                    {tag}
                  </Tag>
                ))}
              </div>
            )}

            {/* "اقرأ القصة" Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  const item = selectedItem;
                  setSelectedItem(null);

                  if (item.type === 'myth' && item.rawMyth) {
                    onSelectEntry(item.rawMyth);
                  } else if (item.type === 'civilization' && item.rawCiv) {
                    if (onSelectCivilization) {
                      onSelectCivilization(item.rawCiv.id);
                    }
                  }
                }}
                style={{
                  backgroundColor: '#0E5C4D',
                  color: '#FFFFFF',
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:opacity-90 active:scale-98 transition-all cursor-pointer font-['Cairo',sans-serif]"
              >
                <span>{t('article.readStory')}</span>
                <ChevronLeft size={16} className="transform scale-x-[-1]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapScreen;
