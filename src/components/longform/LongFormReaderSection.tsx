import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Lock,
  Play,
  Sparkles,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { Card } from '../primitives/Card';
import {
  LongFormEntryData,
  LongFormChapter,
  isChapterUnlocked,
} from '../../data/longForm';
import { storage } from '../../data/storage';
import { useTheme } from '../../theme/ThemeContext';

export interface LongFormReaderSectionProps {
  entry: LongFormEntryData;
  bodyTextSizeClass: string;
}

export const LongFormReaderSection: React.FC<LongFormReaderSectionProps> = ({
  entry,
  bodyTextSizeClass,
}) => {
  const { tokens, isDark } = useTheme();
  const [hasPremiumMonthly, setHasPremiumMonthly] = useState<boolean>(() =>
    storage.hasPremiumMonthly()
  );
  const [chapterProgressMap, setChapterProgressMap] = useState<Record<string, number>>(() =>
    storage.getLongFormChapterProgressMap()
  );
  const [resumeState, setResumeState] = useState(() =>
    storage.getLongFormResumeState(entry.id)
  );
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(
    () => storage.getLongFormResumeState(entry.id)?.lastChapterIndex ?? 0
  );

  const overallProgress = useMemo(() => {
    if (!entry.chapters.length) return 0;
    const sum = entry.chapters.reduce((acc, ch) => {
      return acc + (chapterProgressMap[`${entry.id}:${ch.id}`] || 0);
    }, 0);
    return Math.round(sum / entry.chapters.length);
  }, [entry, chapterProgressMap]);

  const handleMarkChapterProgress = (ch: LongFormChapter, percent: number) => {
    storage.setLongFormChapterProgress(entry.id, ch.id, ch.index, ch.title, percent);
    setChapterProgressMap(storage.getLongFormChapterProgressMap());
    setResumeState(storage.getLongFormResumeState(entry.id));
    setSelectedChapterIdx(ch.index);
  };

  const handleResume = () => {
    const idx = resumeState?.lastChapterIndex ?? 0;
    setSelectedChapterIdx(idx);
    const el = document.getElementById(`long-chapter-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleActivatePremium = () => {
    storage.setPremiumMonthly(true);
    setHasPremiumMonthly(true);
  };

  const getEvidenceColors = (label: string) => {
    const isDocumented = label === 'موثق تاريخياً' || label === 'نص قرآني' || label === 'نص ديني';
    if (isDocumented) {
      return {
        bg: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.28)',
        fg: isDark ? '#9FE8CC' : '#0E5C4D',
        border: isDark ? 'rgba(159, 232, 204, 0.35)' : 'rgba(14, 92, 77, 0.25)',
      };
    }
    return {
      bg: tokens.coolBlueTint,
      fg: tokens.coolBlueAccent,
      border: tokens.border,
    };
  };

  const mainChapters = entry.chapters.filter((c) => !c.isAppendix).length;
  const appendicesCount = entry.chapters.filter((c) => c.isAppendix).length;

  return (
    <section
      aria-label="الموسوعة الطويلة والفصول"
      className="space-y-4 pt-1 text-right"
      dir="rtl"
    >
      {/* Top Meta + Badges + Resume Card */}
      <Card
        variant="white"
        elevation="card"
        padded="lg"
        className="rounded-[20px] space-y-3"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{
                backgroundColor: tokens.primaryMint,
                color: '#0E5C4D',
              }}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1"
            >
              <BookOpen size={11} />
              <span>طويلة</span>
            </span>
            <span
              style={{
                backgroundColor: tokens.coolBlueTint,
                color: tokens.coolBlueAccent,
                borderColor: tokens.border,
              }}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-flex items-center gap-1"
            >
              <Award size={11} />
              <span>Premium</span>
            </span>
            <span
              style={{ color: tokens.textSecondary }}
              className="text-[11px] font-['Cairo',sans-serif]"
            >
              الهدف: {entry.targetWords.toLocaleString('ar-EG')} كلمة • {mainChapters} فصول
              {appendicesCount > 0 ? ` + ${appendicesCount} ملاحق` : ''}
            </span>
          </div>

          <span
            style={{ color: tokens.deepAccent }}
            className="text-xs font-bold font-mono"
          >
            {overallProgress}%
          </span>
        </div>

        {/* Overall Progress Bar */}
        <div
          style={{ backgroundColor: tokens.borderSubtle }}
          className="w-full h-2 rounded-full overflow-hidden"
        >
          <div
            style={{
              width: `${overallProgress}%`,
              backgroundColor: tokens.deepAccent,
            }}
            className="h-full transition-all duration-300 rounded-full"
          />
        </div>

        {/* Resume / Start CTA */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <div className="text-xs" style={{ color: tokens.textSecondary }}>
            {resumeState ? (
              <span>
                آخر موضع: <strong style={{ color: tokens.textPrimary }}>{resumeState.lastChapterTitle}</strong> ({resumeState.chapterProgressPercent}%)
              </span>
            ) : (
              <span>الفصل الأول متاح مجاناً للجميع؛ بقية الفصول عبر اشتراك premium_monthly.</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleResume}
            style={{
              backgroundColor: tokens.deepAccent,
              color: isDark ? '#0B2420' : '#FFFFFF',
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:opacity-90 min-h-[38px]"
          >
            <Play size={13} />
            <span>{resumeState ? 'استئناف القراءة' : 'ابدأ الفصل الأول مجاناً'}</span>
          </button>
        </div>
      </Card>

      {/* Chapter Cards */}
      <div className="space-y-3.5">
        {entry.chapters.map((chapter) => {
          const unlocked = isChapterUnlocked(entry, chapter.index, hasPremiumMonthly);
          const chProgress = chapterProgressMap[`${entry.id}:${chapter.id}`] || 0;
          const evColors = getEvidenceColors(chapter.evidenceLabel);
          const isSelected = selectedChapterIdx === chapter.index;

          return (
            <Card
              key={chapter.id}
              id={`long-chapter-${chapter.index}`}
              variant="white"
              elevation="card"
              padded="lg"
              style={{
                borderColor: isSelected ? tokens.deepAccent : tokens.border,
              }}
              className="rounded-[20px] space-y-3 border transition-all"
            >
              {/* Chapter Top Pills: Evidence + Free/Lock Status */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span
                  style={{
                    backgroundColor: evColors.bg,
                    color: evColors.fg,
                    borderColor: evColors.border,
                  }}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                >
                  {chapter.evidenceLabel}
                </span>

                <div className="flex items-center gap-2">
                  {chapter.isAppendix && (
                    <span
                      style={{ color: tokens.textSecondary }}
                      className="text-[11px] font-bold"
                    >
                      ملحق
                    </span>
                  )}
                  <span
                    style={{
                      backgroundColor:
                        chapter.index === 0 || chapter.isFree
                          ? 'rgba(127, 209, 174, 0.25)'
                          : tokens.coolBlueTint,
                      color:
                        chapter.index === 0 || chapter.isFree
                          ? tokens.deepAccent
                          : tokens.coolBlueAccent,
                    }}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1"
                  >
                    {chapter.index === 0 || chapter.isFree ? (
                      <>
                        <Sparkles size={11} />
                        <span>فصل أول مجاني</span>
                      </>
                    ) : unlocked ? (
                      <>
                        <CheckCircle2 size={11} />
                        <span>مفتوح (Premium)</span>
                      </>
                    ) : (
                      <>
                        <Lock size={11} />
                        <span>مقفل — premium_monthly</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Chapter Title */}
              <h4
                style={{ color: tokens.deepAccent }}
                className="font-['Aref_Ruqaa',serif] text-lg font-bold leading-snug"
              >
                {chapter.title}
              </h4>

              {/* Per-Chapter Progress Bar */}
              {chProgress > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]" style={{ color: tokens.textSecondary }}>
                    <span>تقدم الفصل</span>
                    <span className="font-mono font-bold">{chProgress}%</span>
                  </div>
                  <div
                    style={{ backgroundColor: tokens.borderSubtle }}
                    className="w-full h-1.5 rounded-full overflow-hidden"
                  >
                    <div
                      style={{
                        width: `${chProgress}%`,
                        backgroundColor: tokens.primaryMint,
                      }}
                      className="h-full rounded-full transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Chapter Body or Premium Lock Box */}
              {unlocked ? (
                <div className="space-y-3">
                  {chapter.paragraphs.length > 0 ? (
                    <div
                      style={{ color: tokens.textPrimary }}
                      className={`space-y-3 font-['Cairo',sans-serif] text-justify ${bodyTextSizeClass}`}
                    >
                      {chapter.paragraphs.map((p, pIdx) => (
                        <p key={pIdx}>{p}</p>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: tokens.coolBlueTint,
                        color: tokens.textSecondary,
                      }}
                      className="p-3 rounded-xl text-xs"
                    >
                      هيكل الفصل جاهز — سيتم إضافة النص الكامل في الدفعات القادمة.
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleMarkChapterProgress(chapter, 100)}
                      style={{
                        backgroundColor: chProgress >= 100 ? tokens.primaryMint : tokens.surface,
                        color: tokens.deepAccent,
                        borderColor: tokens.border,
                      }}
                      className="px-3.5 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={13} />
                      <span>{chProgress >= 100 ? 'مكتمل 100%' : 'تسجيل إكمال الفصل'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: tokens.coolBlueTint,
                    borderColor: tokens.border,
                  }}
                  className="p-4 rounded-2xl border space-y-2.5"
                >
                  <div className="flex items-center gap-2 text-xs font-bold" style={{ color: tokens.textPrimary }}>
                    <Lock size={14} style={{ color: tokens.coolBlueAccent }} />
                    <span>هذا الفصل متاح لمشتركي باقة premium_monthly (الفصل الأول مجاني للمعاينة).</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleActivatePremium}
                    style={{
                      backgroundColor: tokens.coolBlueAccent,
                      color: '#FFFFFF',
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:opacity-90 min-h-[38px]"
                  >
                    تفعيل premium_monthly وفتح الفصول
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
};
