/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Creatures & Beings Directory Screen (صفحة الكائنات)
 * Categorizes Deities (آلهة), Spirits (أرواح), and Creatures (مخلوقات),
 * links bidirectionally with stories across the catalog, and supports
 * 4-language display, search, and full detail drawer/card.
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  Crown,
  Wind,
  Sparkles,
  BookOpen,
  MapPin,
} from 'lucide-react';
import { Card } from '../components/primitives/Card';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/i18n';
import { CREATURES_CATALOG } from '../content/creaturesCatalog';
import { CONTENT_CATALOG, getCultureLabel, getTypeLabel } from '../content/catalog';
import type { CreatureEntry, CreatureKind } from '../content/catalogTypes';
import { filterCreatures, getStoriesForCreature } from '../utils/catalogFilters';
import { getEntryById } from '../data/seed';
import type { MythEntry } from '../data/types';
import { resolveHeroImageUrl } from '../utils/assets';

export interface CreaturesScreenProps {
  onBack: () => void;
  initialCreatureId?: string | null;
  onSelectStoryById: (storyId: string) => void;
  onSelectEntry?: (entry: MythEntry) => void;
}

const KIND_STYLE: Record<CreatureKind, { accent: string; bgLight: string; bgDark: string }> = {
  deity: {
    accent: '#4A90D9',
    bgLight: '#E8F1FB',
    bgDark: 'rgba(74, 144, 217, 0.2)',
  },
  spirit: {
    accent: '#8E7BE8',
    bgLight: '#ECE7F8',
    bgDark: 'rgba(142, 123, 232, 0.2)',
  },
  creature: {
    accent: '#0E5C4D',
    bgLight: '#F2FBF7',
    bgDark: 'rgba(127, 209, 174, 0.18)',
  },
};

export const CreaturesScreen: React.FC<CreaturesScreenProps> = ({
  onBack,
  initialCreatureId,
  onSelectStoryById,
  onSelectEntry,
}) => {
  const { t, lang, dir } = useI18n();
  const { tokens, isDark } = useTheme();

  const [kindFilter, setKindFilter] = useState<CreatureKind | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreature, setSelectedCreature] = useState<CreatureEntry | null>(() => {
    if (!initialCreatureId) return null;
    return CREATURES_CATALOG.find((c) => c.id === initialCreatureId) ?? null;
  });

  useEffect(() => {
    if (initialCreatureId) {
      const found = CREATURES_CATALOG.find((c) => c.id === initialCreatureId);
      if (found) {
        setSelectedCreature(found);
      }
    }
  }, [initialCreatureId]);

  const kindCounts = useMemo(() => {
    const counts = { all: CREATURES_CATALOG.length, deity: 0, spirit: 0, creature: 0 };
    for (const c of CREATURES_CATALOG) {
      counts[c.kind] += 1;
    }
    return counts;
  }, []);

  const filteredList = useMemo(
    () => filterCreatures(CREATURES_CATALOG, kindFilter, searchQuery),
    [kindFilter, searchQuery]
  );

  const selectedLinkedStories = useMemo(() => {
    if (!selectedCreature) return [];
    return getStoriesForCreature(selectedCreature, CONTENT_CATALOG);
  }, [selectedCreature]);

  const handleOpenStory = (storyId: string) => {
    const myth = getEntryById(storyId);
    if (myth && onSelectEntry) {
      onSelectEntry(myth);
      return;
    }
    onSelectStoryById(storyId);
  };

  const renderKindIcon = (kind: CreatureKind, size = 16) => {
    if (kind === 'deity') return <Crown size={size} />;
    if (kind === 'spirit') return <Wind size={size} />;
    return <Sparkles size={size} />;
  };

  return (
    <div data-testid="creatures-screen" className="space-y-4 pb-10 animate-in fade-in duration-200" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => {
            if (selectedCreature) {
              setSelectedCreature(null);
            } else {
              onBack();
            }
          }}
          aria-label={t('creatures.back')}
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
            color: tokens.deepAccent,
          }}
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl border shadow-xs flex items-center justify-center cursor-pointer hover:opacity-90 shrink-0"
        >
          <ChevronRight size={22} className={`stroke-[2.5] ${dir === 'ltr' ? 'rotate-180' : ''}`} />
        </button>

        <div className="flex-1 min-w-0 text-start">
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-xl sm:text-2xl font-bold leading-tight truncate"
          >
            {selectedCreature ? selectedCreature.name[lang] || selectedCreature.name.ar : t('creatures.title')}
          </h2>
          <p style={{ color: tokens.textSecondary }} className="text-xs font-['Cairo',sans-serif] truncate">
            {selectedCreature ? selectedCreature.epithet[lang] || selectedCreature.epithet.ar : t('creatures.subtitle')}
          </p>
        </div>
      </div>

      {/* Detail View if a creature is selected */}
      {selectedCreature ? (
        <div data-testid="creature-detail-card" className="space-y-4 animate-in fade-in duration-150">
          <Card variant="white" elevation="card" padded={false} className="rounded-[24px] overflow-hidden border">
            <div className="relative h-52 w-full overflow-hidden" style={{ backgroundColor: tokens.surface }}>
              <img
                src={resolveHeroImageUrl(selectedCreature.image)}
                alt={selectedCreature.name[lang] || selectedCreature.name.ar}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-3 inset-x-4 flex items-center justify-between gap-2 text-white">
                <span
                  style={{
                    backgroundColor: isDark
                      ? KIND_STYLE[selectedCreature.kind].bgDark
                      : KIND_STYLE[selectedCreature.kind].bgLight,
                    color: isDark ? '#9FE8CC' : KIND_STYLE[selectedCreature.kind].accent,
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs"
                >
                  {renderKindIcon(selectedCreature.kind, 14)}
                  <span>{t(`creatures.${selectedCreature.kind}`)}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs bg-black/55 px-2.5 py-1 rounded-full">
                  <MapPin size={12} style={{ color: '#7FD1AE' }} />
                  <span>{getCultureLabel(selectedCreature.culture, lang)}</span>
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-4 text-start">
              <div className="space-y-1.5">
                <h3 style={{ color: tokens.deepAccent }} className="font-['Aref_Ruqaa',serif] text-2xl font-bold">
                  {selectedCreature.name[lang] || selectedCreature.name.ar}
                </h3>
                <p style={{ color: tokens.textPrimary }} className="text-sm font-['Cairo',sans-serif] leading-relaxed">
                  {selectedCreature.description[lang] || selectedCreature.description.ar}
                </p>
              </div>

              {/* Attributes */}
              <div className="space-y-2 pt-2 border-t" style={{ borderColor: tokens.borderSubtle }}>
                <h4 style={{ color: tokens.deepAccent }} className="text-xs font-bold">
                  {t('creatures.attributes')}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedCreature.attributes[lang] ?? selectedCreature.attributes.ar).map((attr, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: tokens.surface,
                        borderColor: tokens.border,
                        color: tokens.textPrimary,
                      }}
                      className="px-3 py-1 rounded-full text-xs font-medium border"
                    >
                      ✦ {attr}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Linked Stories */}
          <div className="space-y-2.5">
            <h3
              style={{ color: tokens.textPrimary }}
              className="font-['Aref_Ruqaa',serif] text-lg font-bold flex items-center gap-2"
            >
              <BookOpen size={18} style={{ color: tokens.coolBlueAccent }} />
              <span>
                {t('creatures.linkedStories')} ({selectedLinkedStories.length})
              </span>
            </h3>

            <div className="space-y-2.5">
              {selectedLinkedStories.map((story) => (
                <button
                  key={story.id}
                  type="button"
                  data-testid={`creature-linked-story-${story.id}`}
                  onClick={() => handleOpenStory(story.id)}
                  style={{
                    backgroundColor: tokens.card,
                    borderColor: tokens.border,
                  }}
                  className="w-full p-3 rounded-2xl border shadow-xs flex items-center gap-3 text-start cursor-pointer hover:border-[#7FD1AE] transition-all min-h-[64px]"
                >
                  <img
                    src={resolveHeroImageUrl(story.image)}
                    alt={story.title[lang] || story.title.ar}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border"
                    style={{ borderColor: tokens.borderSubtle }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span style={{ color: tokens.textPrimary }} className="font-['Aref_Ruqaa',serif] text-base font-bold truncate">
                        {story.title[lang] || story.title.ar}
                      </span>
                      <span
                        style={{
                          backgroundColor: tokens.coolBlueTint,
                          color: tokens.coolBlueAccent,
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      >
                        {getTypeLabel(story.type, lang)}
                      </span>
                    </div>
                    <p style={{ color: tokens.textSecondary }} className="text-xs line-clamp-1">
                      {story.summary[lang] || story.summary.ar}
                    </p>
                  </div>
                  <ChevronLeft size={16} style={{ color: tokens.deepAccent }} className={dir === 'ltr' ? 'rotate-180 shrink-0' : 'shrink-0'} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('creatures.searchPlaceholder')}
              style={{
                backgroundColor: tokens.card,
                borderColor: tokens.border,
                color: tokens.textPrimary,
              }}
              className="w-full ps-10 pe-10 py-2.5 rounded-2xl border text-xs sm:text-sm font-['Cairo',sans-serif] focus:outline-none focus:ring-2 focus:ring-[#7FD1AE] min-h-[44px]"
            />
            <Search size={16} style={{ color: tokens.textSecondary }} className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ color: tokens.textSecondary }}
                className="absolute end-2 top-1/2 -translate-y-1/2 p-2 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label={t('home.clearSearch')}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Kind Tabs: الكل | آلهة | أرواح | مخلوقات */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
            {(['all', 'deity', 'spirit', 'creature'] as const).map((kind) => {
              const active = kindFilter === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  data-testid={`creatures-filter-${kind}`}
                  onClick={() => setKindFilter(kind)}
                  style={{
                    backgroundColor: active ? tokens.deepAccent : tokens.card,
                    color: active ? (isDark ? '#0B2420' : '#FFFFFF') : tokens.textPrimary,
                    borderColor: active ? tokens.deepAccent : tokens.border,
                  }}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold cursor-pointer transition-all min-h-[40px]"
                >
                  {kind !== 'all' && renderKindIcon(kind, 14)}
                  <span>{t(`creatures.${kind}`)}</span>
                  <span className="text-[10px] opacity-80">({kindCounts[kind]})</span>
                </button>
              );
            })}
          </div>

          {/* Beings Grid */}
          {filteredList.length === 0 ? (
            <Card variant="white" className="p-8 text-center space-y-2 rounded-2xl">
              <p style={{ color: tokens.textSecondary }} className="text-xs font-bold">
                {t('creatures.empty')}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredList.map((creature) => {
                const styleMeta = KIND_STYLE[creature.kind];
                const linkedCount = getStoriesForCreature(creature, CONTENT_CATALOG).length;

                return (
                  <button
                    key={creature.id}
                    type="button"
                    data-testid={`creature-card-${creature.id}`}
                    onClick={() => setSelectedCreature(creature)}
                    style={{
                      backgroundColor: tokens.card,
                      borderColor: tokens.border,
                    }}
                    className="p-3 rounded-[20px] border shadow-xs text-start flex items-center gap-3 cursor-pointer hover:border-[#7FD1AE] transition-all group min-h-[92px]"
                  >
                    <img
                      src={resolveHeroImageUrl(creature.image)}
                      alt={creature.name[lang] || creature.name.ar}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 border group-hover:scale-105 transition-transform"
                      style={{ borderColor: tokens.borderSubtle }}
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          style={{ color: tokens.textPrimary }}
                          className="font-['Aref_Ruqaa',serif] text-base font-bold truncate"
                        >
                          {creature.name[lang] || creature.name.ar}
                        </span>
                        <span
                          style={{
                            backgroundColor: isDark ? styleMeta.bgDark : styleMeta.bgLight,
                            color: isDark ? '#9FE8CC' : styleMeta.accent,
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                        >
                          {renderKindIcon(creature.kind, 11)}
                          <span>{t(`creatures.${creature.kind}`)}</span>
                        </span>
                      </div>

                      <p style={{ color: tokens.textSecondary }} className="text-xs line-clamp-1">
                        {creature.epithet[lang] || creature.epithet.ar}
                      </p>

                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                        <span style={{ color: tokens.deepAccent }} className="font-semibold truncate">
                          {getCultureLabel(creature.culture, lang)}
                        </span>
                        <span style={{ color: tokens.coolBlueAccent }} className="font-mono font-bold shrink-0">
                          {linkedCount} {t('creatures.linkedStories')}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CreaturesScreen;
