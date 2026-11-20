/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Dedicated Tag Explorer Screen (صفحة الوسم)
 * Displays stories linked to a tag plus an "عبر الثقافات" (Across Cultures)
 * comparison matrix grouping parallel tales by cultural tradition.
 */

import React, { useMemo } from 'react';
import { ChevronRight, ChevronLeft, Globe2, Tag as TagIcon, BookOpen } from 'lucide-react';
import { Card } from '../components/primitives/Card';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/i18n';
import {
  CONTENT_CATALOG,
  getCultureLabel,
  getTagLabel,
  getTagMeta,
  getTypeLabel,
} from '../content/catalog';
import { getCrossCulturalTagComparison } from '../utils/catalogFilters';
import { resolveHeroImageUrl } from '../utils/assets';

export interface TagScreenProps {
  tagKey: string;
  onBack: () => void;
  onSelectStoryById: (storyId: string) => void;
}

export const TagScreen: React.FC<TagScreenProps> = ({
  tagKey,
  onBack,
  onSelectStoryById,
}) => {
  const { t, lang, dir } = useI18n();
  const { tokens, isDark } = useTheme();

  const tagMeta = useMemo(() => getTagMeta(tagKey), [tagKey]);
  const comparison = useMemo(
    () => getCrossCulturalTagComparison(CONTENT_CATALOG, tagKey),
    [tagKey]
  );

  return (
    <div data-testid="tag-screen" className="space-y-4 pb-10 animate-in fade-in duration-200" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('tagPage.back')}
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
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{
                backgroundColor: tokens.coolBlueTint,
                color: tokens.coolBlueAccent,
              }}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
            >
              <TagIcon size={11} />
              <span>{t('tagPage.title')}</span>
            </span>
          </div>
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-2xl font-bold leading-tight mt-0.5 truncate"
          >
            {getTagLabel(tagKey, lang)}
          </h2>
        </div>
      </div>

      {/* Summary & Motif Banner */}
      <Card
        variant="white"
        elevation="card"
        className="p-4 sm:p-5 rounded-[22px] border space-y-3 text-start"
      >
        <p style={{ color: tokens.textPrimary }} className="text-xs sm:text-sm font-['Cairo',sans-serif] leading-relaxed">
          {tagMeta.description[lang] || tagMeta.description.ar}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            style={{
              backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : '#F2FBF7',
              color: tokens.deepAccent,
              borderColor: tokens.border,
            }}
            className="px-3 py-1 rounded-full text-xs font-bold border"
          >
            {t('tagPage.storiesCount', { count: comparison.totalStories })}
          </span>
          <span
            style={{
              backgroundColor: tokens.coolBlueTint,
              color: tokens.coolBlueAccent,
              borderColor: tokens.border,
            }}
            className="px-3 py-1 rounded-full text-xs font-bold border"
          >
            {t('tagPage.culturesCount', { count: comparison.cultureCount })}
          </span>
        </div>
      </Card>

      {/* Across Cultures Section ("عبر الثقافات") */}
      <section data-testid="across-cultures-section" className="space-y-3.5 pt-1">
        <div className="text-start">
          <h3
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-xl font-bold flex items-center gap-2"
          >
            <Globe2 size={20} style={{ color: tokens.coolBlueAccent }} />
            <span>{t('tagPage.acrossCultures')}</span>
          </h3>
          <p style={{ color: tokens.textSecondary }} className="text-xs font-['Cairo',sans-serif] mt-0.5">
            {t('tagPage.acrossCulturesSub')}
          </p>
        </div>

        {comparison.groups.length === 0 ? (
          <Card variant="white" className="p-6 text-center rounded-2xl">
            <p style={{ color: tokens.textSecondary }} className="text-xs font-bold">
              {t('tagPage.noStories')}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {comparison.groups.map((group) => (
              <div
                key={group.culture}
                data-testid={`culture-group-${group.culture}`}
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.border,
                }}
                className="p-3.5 sm:p-4 rounded-[22px] border space-y-3 text-start"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b" style={{ borderColor: tokens.borderSubtle }}>
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: tokens.primaryMint, color: '#0E5C4D' }}
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                    />
                    <h4 style={{ color: tokens.deepAccent }} className="font-['Aref_Ruqaa',serif] text-lg font-bold">
                      {getCultureLabel(group.culture, lang)}
                    </h4>
                  </div>
                  <span style={{ color: tokens.textSecondary }} className="text-[11px] font-mono font-bold">
                    {group.items.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`tag-story-${item.id}`}
                      onClick={() => onSelectStoryById(item.id)}
                      style={{
                        backgroundColor: tokens.card,
                        borderColor: tokens.borderSubtle,
                      }}
                      className="w-full p-3 rounded-2xl border shadow-xs flex items-center gap-3 text-start cursor-pointer hover:border-[#7FD1AE] transition-all min-h-[72px]"
                    >
                      <img
                        src={resolveHeroImageUrl(item.image)}
                        alt={item.title[lang] || item.title.ar}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border"
                        style={{ borderColor: tokens.borderSubtle }}
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span style={{ color: tokens.textPrimary }} className="font-['Aref_Ruqaa',serif] text-base font-bold truncate">
                            {item.title[lang] || item.title.ar}
                          </span>
                          <span
                            style={{
                              backgroundColor: tokens.coolBlueTint,
                              color: tokens.coolBlueAccent,
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          >
                            {getTypeLabel(item.type, lang)}
                          </span>
                        </div>
                        <p style={{ color: tokens.textSecondary }} className="text-xs line-clamp-2 leading-relaxed">
                          {item.summary[lang] || item.summary.ar}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: tokens.deepAccent }}>
                          <BookOpen size={11} />
                          <span className="truncate">{item.source.title[lang] || item.source.title.ar}</span>
                        </div>
                      </div>
                      <ChevronLeft size={16} style={{ color: tokens.deepAccent }} className={dir === 'ltr' ? 'rotate-180 shrink-0' : 'shrink-0'} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TagScreen;
