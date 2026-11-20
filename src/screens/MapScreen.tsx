/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Interactive Geographic Atlas powered by Leaflet (صفحة الخريطة)
 * Plots every story, myth, cosmology, folklore entry, and Arab civilization
 * by real latitude/longitude. Clicking any marker opens the story preview
 * sheet and launches the full reader.
 * Strictly adheres to Teal / Mint / Cool Blue palette.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  X,
  MapPin,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { Tag, TagVariant } from '../components/primitives/Tag';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/i18n';
import { storage } from '../data/storage';
import { useDebounce } from '../hooks/useDebounce';
import { normalizeArabic } from '../utils/arabicSearch';
import { resolveHeroImageUrl, getCivImageUrl } from '../utils/assets';
import { MythEntry } from '../data/types';
import { Civilization, getAllCivilizations } from '../data/civTypes';
import {
  CONTENT_CATALOG,
  getCultureLabel,
  getTagLabel,
  getTypeLabel,
} from '../content/catalog';
import { ContentItem, ContentType } from '../content/catalogTypes';
import { getEntryById } from '../data/seed';
import { getLocalizedCivilization } from '../content';

export interface MapScreenProps {
  onSelectEntry: (entry: MythEntry) => void;
  onSelectCivilization?: (civId: string) => void;
}

export type MapFilterCategory = 'all' | ContentType | 'civilizations';

interface GeoMapItem {
  id: string;
  title: string;
  kind: ContentType | 'civilization';
  cultureLabel: string;
  regionLabel: string;
  lat: number;
  lng: number;
  color: string;
  isSquare: boolean;
  isPublicDomain?: boolean;
  summary: string;
  image?: string;
  tags: string[];
  rawItem?: ContentItem;
  rawCiv?: Civilization;
  searchIndex: string;
}

const CIV_GEO_COORDS: Record<string, { lat: number; lng: number }> = {
  'civ-aad': { lat: 18.2, lng: 53.5 },
  'civ-thamud': { lat: 26.79, lng: 37.95 },
  'civ-madyan': { lat: 28.5, lng: 35.0 },
  'civ-saba': { lat: 15.42, lng: 45.32 },
  'civ-himyar': { lat: 14.21, lng: 44.4 },
  'civ-nabataean': { lat: 30.33, lng: 35.44 },
  'civ-tasm-jadis': { lat: 24.15, lng: 47.3 },
  'civ-lakhm': { lat: 31.88, lng: 44.49 },
  'civ-ghassan': { lat: 32.88, lng: 36.02 },
  'civ-mecca': { lat: 21.42, lng: 39.83 },
};

const TYPE_PIN_COLORS: Record<ContentType | 'civilization', string> = {
  story: '#0E5C4D',
  myth: '#4A90D9',
  cosmology: '#8E7BE8',
  folklore: '#17877B',
  civilization: '#3DDC97',
};

// Lightweight offline-safe continental land polygons so Leaflet stays clear even without tiles
const WORLD_LANDMASS_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    // North Africa & Nile Valley
    {
      type: 'Feature',
      properties: { name: 'North Africa' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-13, 35], [-5, 36], [10, 37], [25, 32], [32.5, 31.5], [34, 27], [38, 20], [43, 12], [51, 11.5], [40, 2], [-17, 14], [-13, 35]]],
      },
    },
    // Arabian Peninsula, Levant, Mesopotamia & Persia
    {
      type: 'Feature',
      properties: { name: 'Arabia & Fertile Crescent' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[32.5, 31.5], [35.5, 36], [36, 40], [45, 38], [52, 37], [61, 35], [64, 25], [56, 26], [59.8, 22.5], [54, 17], [45, 12.7], [43.3, 12.7], [39, 21.5], [34.8, 29.5], [32.5, 31.5]]],
      },
    },
    // South Asia & Southeast Asia Mainland
    {
      type: 'Feature',
      properties: { name: 'South & Southeast Asia' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[64, 25], [75, 34], [90, 28], [102, 22], [109, 12], [104, 1.5], [100, 5.5], [98.5, 12], [96, 16.5], [91, 22], [85, 19], [77.5, 8], [72, 20], [67, 24.8], [64, 25]]],
      },
    },
    // Nusantara / Indonesian Archipelago (Sumatra, Java, Kalimantan, Sulawesi)
    {
      type: 'Feature',
      properties: { name: 'Sumatra' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[95.3, 5.5], [99.5, 3.2], [104.5, -1.5], [105.8, -5.8], [103.5, -5.9], [98, 0.8], [95.3, 5.5]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Java' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[105.5, -6.1], [114.5, -7.8], [114.2, -8.7], [106, -7.3], [105.5, -6.1]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Borneo' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[109, 1.5], [117.5, 6.8], [118.9, 1], [116, -3.5], [110.2, -3.2], [109, 1.5]]],
      },
    },
    // Southern Europe / Mediterranean North rim
    {
      type: 'Feature',
      properties: { name: 'Mediterranean Rim' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-9, 37], [3, 42], [16, 40], [27, 41], [40, 41], [40, 47], [-9, 46], [-9, 37]]],
      },
    },
  ],
};

export const MapScreen: React.FC<MapScreenProps> = ({
  onSelectEntry,
  onSelectCivilization,
}) => {
  const { t, lang, dir } = useI18n();
  const { tokens, isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [activeFilter, setActiveFilter] = useState<MapFilterCategory>('all');
  const [selectedItem, setSelectedItem] = useState<GeoMapItem | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);

  const allCivilizations = useMemo(() => getAllCivilizations() ?? [], []);

  const allGeoItems = useMemo<GeoMapItem[]>(() => {
    const items: GeoMapItem[] = [];

    for (const item of CONTENT_CATALOG) {
      items.push({
        id: item.id,
        title: item.title[lang] || item.title.ar,
        kind: item.type,
        cultureLabel: getCultureLabel(item.culture, lang),
        regionLabel: item.region.label[lang] || item.region.label.ar,
        lat: item.region.lat,
        lng: item.region.lng,
        color: TYPE_PIN_COLORS[item.type],
        isSquare: false,
        isPublicDomain: item.isPublicDomain,
        summary: item.summary[lang] || item.summary.ar,
        image: resolveHeroImageUrl(item.image),
        tags: item.tags,
        rawItem: item,
        searchIndex: [
          ...Object.values(item.title),
          ...Object.values(item.summary),
          ...Object.values(item.region.label),
          ...item.tags,
          item.culture,
        ].join(' '),
      });
    }

    for (const rawCiv of allCivilizations) {
      const civ = getLocalizedCivilization(rawCiv, lang);
      const coords = CIV_GEO_COORDS[rawCiv.id] ?? { lat: 24.0, lng: 45.0 };
      items.push({
        id: rawCiv.id,
        title: civ.name,
        kind: 'civilization',
        cultureLabel: civ.era || t('map.civilizations'),
        regionLabel: civ.region || t(`map.pinRegions.${rawCiv.id}`, { defaultValue: rawCiv.region }),
        lat: coords.lat,
        lng: coords.lng,
        color: TYPE_PIN_COLORS.civilization,
        isSquare: true,
        summary: civ.chapters?.[0]?.text?.slice(0, 160) || civ.legacy || civ.economy || '',
        image: resolveHeroImageUrl(getCivImageUrl(rawCiv.id)),
        tags: [civ.era || t('map.civilizations')].filter(Boolean),
        rawCiv,
        searchIndex: `${rawCiv.name} ${civ.name} ${rawCiv.region} ${civ.region} ${civ.era}`,
      });
    }

    return items;
  }, [allCivilizations, lang, t]);

  const filteredItems = useMemo(() => {
    let result = allGeoItems;
    if (activeFilter !== 'all') {
      if (activeFilter === 'civilizations') {
        result = result.filter((item) => item.kind === 'civilization');
      } else {
        result = result.filter((item) => item.kind === activeFilter);
      }
    }
    const q = debouncedSearch.trim();
    if (q) {
      const normQ = normalizeArabic(q);
      const lowerQ = q.toLowerCase();
      result = result.filter(
        (item) =>
          normalizeArabic(item.searchIndex).includes(normQ) ||
          item.searchIndex.toLowerCase().includes(lowerQ)
      );
    }
    return result;
  }, [allGeoItems, activeFilter, debouncedSearch]);

  // Initialize Leaflet instance once
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapInstanceRef.current) return;

    const map = L.map(container, {
      center: [21, 56],
      zoom: 3,
      minZoom: 2,
      maxZoom: 12,
      zoomControl: false,
      attributionControl: true,
    });

    // Stylistic vector landmass underlay so map never looks blank offline
    const geoLayer = L.geoJSON(WORLD_LANDMASS_GEOJSON, {
      style: {
        fillColor: isDark ? '#12332D' : '#F2FBF7',
        fillOpacity: 0.92,
        color: '#7FD1AE',
        weight: 1.2,
      },
    }).addTo(map);
    geoLayerRef.current = geoLayer;

    // Live OpenStreetMap raster tiles overlaid softly when network is reachable
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 12,
      opacity: isDark ? 0.25 : 0.45,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markerLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerLayerRef.current = null;
      geoLayerRef.current = null;
    };
  }, []);

  // Sync dark/light styling on landmass polygons without recreating map
  useEffect(() => {
    if (geoLayerRef.current) {
      geoLayerRef.current.setStyle({
        fillColor: isDark ? '#12332D' : '#F2FBF7',
        fillOpacity: 0.92,
        color: '#7FD1AE',
        weight: 1.2,
      });
    }
  }, [isDark]);

  // Update markers whenever filteredItems or selectedItem changes
  useEffect(() => {
    const group = markerLayerRef.current;
    if (!group) return;
    group.clearLayers();

    for (const item of filteredItems) {
      const isSelected = selectedItem?.id === item.id;
      const size = item.isPublicDomain ? (isSelected ? 22 : 18) : isSelected ? 17 : 13;
      const borderRadius = item.isSquare ? '4px' : '9999px';
      const ringShadow = item.isPublicDomain
        ? '0 0 0 3px rgba(127, 209, 174, 0.55), 0 2px 6px rgba(0,0,0,0.28)'
        : '0 2px 5px rgba(0,0,0,0.25)';

      const icon = L.divIcon({
        className: 'mustakshif-leaflet-pin',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `<button type="button" data-marker-id="${item.id}" aria-label="${item.title.replace(/"/g, '&quot;')}" style="width:${size}px;height:${size}px;border-radius:${borderRadius};background-color:${item.color};border:2px solid #FFFFFF;box-shadow:${ringShadow};cursor:pointer;display:block;padding:0;"></button>`,
      });

      const marker = L.marker([item.lat, item.lng], { icon });
      marker.bindTooltip(item.title, {
        direction: 'top',
        offset: [0, -size / 2],
      });
      marker.on('click', () => {
        setSelectedItem(item);
        storage.incrementMapSheetsCount();
      });
      marker.addTo(group);
    }
  }, [filteredItems, selectedItem?.id]);

  const handleOpenSelected = (item: GeoMapItem) => {
    if (item.kind === 'civilization' && item.rawCiv) {
      onSelectCivilization?.(item.rawCiv.id);
      return;
    }
    const myth = getEntryById(item.id);
    if (myth) {
      onSelectEntry(myth);
    }
  };

  const getTagVariant = (tag: string): TagVariant => {
    if (tag === 'رعب') return 'horror';
    if (tag === 'تاريخ') return 'history';
    if (tag === 'خرافي') return 'supernatural';
    return 'neutral';
  };

  const filterChips: Array<{ id: MapFilterCategory; label: string }> = [
    { id: 'all', label: t('map.all') },
    { id: 'story', label: t('map.story') },
    { id: 'myth', label: t('map.myth') },
    { id: 'cosmology', label: t('map.cosmology') },
    { id: 'folklore', label: t('map.folklore') },
    { id: 'civilizations', label: t('map.civilizations') },
  ];

  const featuredOriginItems = useMemo(
    () => allGeoItems.filter((item) => item.isPublicDomain),
    [allGeoItems]
  );

  return (
    <div data-testid="map-screen" className="space-y-4 pb-8 animate-in fade-in duration-200" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-2xl font-bold leading-tight"
          >
            {t('map.title')}
          </h2>
          <p style={{ color: tokens.textSecondary }} className="text-xs font-['Cairo',sans-serif] mt-0.5">
            {t('map.subtitle')}
          </p>
        </div>

        <div
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
          }}
          className="flex items-center gap-1.5 border px-3 py-1.5 rounded-2xl shadow-xs shrink-0"
        >
          <span style={{ backgroundColor: '#7FD1AE' }} className="w-2 h-2 rounded-full" />
          <span style={{ color: tokens.deepAccent }} className="text-[11px] font-bold font-mono">
            {t('map.placesCount', { count: filteredItems.length })}
          </span>
        </div>
      </div>

      {/* Search & Filter Chips */}
      <div className="space-y-2.5">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('map.search')}
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
              color: tokens.textPrimary,
            }}
            className="w-full ps-10 pe-9 py-2.5 rounded-2xl border text-xs sm:text-sm font-['Cairo',sans-serif] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#7FD1AE] min-h-[44px]"
          />
          <Search
            size={16}
            style={{ color: tokens.textSecondary }}
            className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ color: tokens.textSecondary }}
              className="absolute end-2 top-1/2 -translate-y-1/2 p-2 cursor-pointer"
              aria-label={t('home.clearSearch')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
          {filterChips.map((chip) => {
            const isActive = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                data-testid={`map-filter-${chip.id}`}
                onClick={() => setActiveFilter(chip.id)}
                style={{
                  backgroundColor: isActive ? '#7FD1AE' : isDark ? '#12332D' : '#FFFFFF',
                  color: isActive ? '#0E5C4D' : isDark ? '#7FD1AE' : '#0E5C4D',
                  borderColor: '#7FD1AE',
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shrink-0 min-h-[38px] flex items-center justify-center shadow-2xs"
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Leaflet Map Viewport */}
      <div
        style={{
          backgroundColor: isDark ? '#0B2420' : '#E8F1FB',
          borderColor: isDark ? 'rgba(127, 209, 174, 0.4)' : '#7FD1AE',
        }}
        className="relative w-full h-[360px] sm:h-[420px] rounded-[24px] border-2 shadow-sm overflow-hidden"
      >
        <div
          ref={mapContainerRef}
          data-testid="leaflet-map-container"
          style={{ backgroundColor: isDark ? '#0B2420' : '#E8F1FB' }}
          className="w-full h-full"
        />

        {/* Zoom Controls Overlay */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-0.5 bg-white/95 dark:bg-[#12332D]/95 backdrop-blur-md p-1 rounded-2xl border border-[#7FD1AE] shadow-xs">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-2 text-[#0E5C4D] dark:text-[#7FD1AE] rounded-xl cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={t('map.zoomIn')}
            aria-label={t('map.zoomIn')}
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-2 text-[#0E5C4D] dark:text-[#7FD1AE] rounded-xl cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={t('map.zoomOut')}
            aria-label={t('map.zoomOut')}
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.setView([21, 56], 3)}
            className="p-2 text-[#0E5C4D] dark:text-[#7FD1AE] rounded-xl cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={t('map.zoomReset')}
            aria-label={t('map.zoomReset')}
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Cool-Palette Legend */}
        <div
          style={{
            backgroundColor: isDark ? 'rgba(18, 51, 45, 0.94)' : 'rgba(255, 255, 255, 0.94)',
            borderColor: '#7FD1AE',
          }}
          className="hidden sm:block absolute bottom-3 left-3 z-20 p-2.5 rounded-2xl border shadow-sm space-y-1 text-[10px] font-['Cairo',sans-serif]"
        >
          <h4 style={{ color: isDark ? '#7FD1AE' : '#0E5C4D' }} className="font-bold border-b border-[#7FD1AE]/30 pb-1">
            {t('map.legend')}
          </h4>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0E5C4D] border border-white shrink-0" />
            <span>{t('map.story')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4A90D9] border border-white shrink-0" />
            <span>{t('map.myth')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8E7BE8] border border-white shrink-0" />
            <span>{t('map.cosmology')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#17877B] border border-white shrink-0" />
            <span>{t('map.folklore')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#3DDC97] border border-white shrink-0" />
            <span>{t('map.civilizations')}</span>
          </div>
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-white/85 dark:bg-[#0B2420]/90 p-5 text-center">
            <MapPin size={24} style={{ color: tokens.deepAccent }} />
            <p style={{ color: tokens.deepAccent }} className="text-sm font-bold">
              {t('map.emptyTitle')}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              style={{ backgroundColor: tokens.deepAccent, color: isDark ? '#0B2420' : '#FFFFFF' }}
              className="px-4 py-2 rounded-full text-xs font-bold cursor-pointer min-h-[40px]"
            >
              {t('map.emptyReset')}
            </button>
          </div>
        )}
      </div>

      {/* Public-Domain Cultural Origins Quick Focus Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        {featuredOriginItems.map((origin) => (
          <button
            key={origin.id}
            type="button"
            data-testid={`map-origin-${origin.id}`}
            onClick={() => {
              if (activeFilter !== 'all' && activeFilter !== origin.kind) {
                setActiveFilter('all');
              }
              setSelectedItem(origin);
              mapInstanceRef.current?.flyTo([origin.lat, origin.lng], 5, { duration: 0.6 });
            }}
            style={{
              backgroundColor: selectedItem?.id === origin.id ? tokens.primaryMint : tokens.card,
              color: selectedItem?.id === origin.id ? '#0E5C4D' : tokens.textPrimary,
              borderColor: tokens.border,
            }}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer min-h-[38px]"
          >
            <MapPin size={13} style={{ color: origin.color }} />
            <span>{origin.regionLabel}</span>
          </button>
        ))}
      </div>

      {/* Selected Marker Preview Card -> Opens Story */}
      {selectedItem && (
        <div
          data-testid="map-selected-card"
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
          }}
          className="rounded-[24px] p-4 shadow-md border space-y-3 text-start animate-in fade-in duration-150"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {selectedItem.image ? (
                <img
                  src={selectedItem.image}
                  alt={selectedItem.title}
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border"
                  style={{ borderColor: tokens.borderSubtle }}
                />
              ) : (
                <div
                  style={{ backgroundColor: tokens.surface, color: tokens.deepAccent }}
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                >
                  <MapPin size={22} />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 style={{ color: tokens.deepAccent }} className="font-['Aref_Ruqaa',serif] text-lg font-bold truncate">
                    {selectedItem.title}
                  </h3>
                  <span
                    style={{
                      backgroundColor: tokens.coolBlueTint,
                      color: tokens.coolBlueAccent,
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  >
                    {selectedItem.kind === 'civilization' ? t('map.civilizations') : getTypeLabel(selectedItem.kind, lang)}
                  </span>
                </div>

                <p style={{ color: tokens.textSecondary }} className="text-[11px] flex items-center gap-1 mt-0.5">
                  <MapPin size={12} style={{ color: tokens.primaryMint }} />
                  <span>
                    {selectedItem.regionLabel} • {selectedItem.cultureLabel}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              aria-label={t('common.close')}
              style={{ backgroundColor: tokens.surface, color: tokens.textSecondary }}
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center cursor-pointer shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          <p style={{ color: tokens.textPrimary }} className="text-xs font-['Cairo',sans-serif] leading-relaxed line-clamp-2">
            {selectedItem.summary}
          </p>

          {selectedItem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedItem.tags.slice(0, 3).map((tag, idx) => (
                <Tag key={`${tag}-${idx}`} variant={getTagVariant(tag)} size="sm">
                  {getTagLabel(tag, lang)}
                </Tag>
              ))}
            </div>
          )}

          <button
            type="button"
            data-testid="map-open-story-btn"
            onClick={() => handleOpenSelected(selectedItem)}
            style={{
              backgroundColor: '#0E5C4D',
              color: '#FFFFFF',
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:opacity-90 cursor-pointer min-h-[44px]"
          >
            <span>
              {selectedItem.kind === 'civilization' ? t('map.readCiv') : t('map.openLeafletStory')}
            </span>
            <ChevronLeft size={16} className={dir === 'ltr' ? 'rotate-180' : ''} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MapScreen;
