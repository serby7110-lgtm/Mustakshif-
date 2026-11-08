/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Methodology Transparency Screen (عن المنهج)
 * Explains the four documentation badges, dual-narrative philosophy, and citation guidelines.
 */

import React from 'react';
import {
  ArrowRight,
  Info,
  CheckCircle2,
  Scroll,
  Sparkles,
  Landmark,
  Scale,
  Quote,
} from 'lucide-react';
import { Card } from '../components/primitives/Card';
import { useTheme } from '../theme/ThemeContext';

import { useI18n } from '../i18n/i18n';
export interface MethodologyScreenProps {
  onBack?: () => void;
}

export const MethodologyScreen: React.FC<MethodologyScreenProps> = ({ onBack }) => {
  const { t } = useI18n();
  const { tokens, isDark } = useTheme();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200" dir="rtl">
      {/* Top Navigation Bar with Back Button */}
      <div className="flex items-center justify-between pt-1">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            style={{
              backgroundColor: tokens.card,
              color: tokens.deepAccent,
              borderColor: tokens.border,
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-xs hover:opacity-90 cursor-pointer transition-all active:scale-95"
            aria-label="العودة"
          >
            <ArrowRight size={16} />
            <span>العودة</span>
          </button>
        ) : (
          <div />
        )}

        <div
          style={{
            backgroundColor: isDark ? 'rgba(127, 209, 174, 0.15)' : '#D6F4E7',
            borderColor: isDark ? 'rgba(127, 209, 174, 0.35)' : '#8EDBC0',
            color: isDark ? '#7FD1AE' : '#0E5C4D',
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
        >
          <Info size={14} />
          <span>شفافية التوثيق</span>
        </div>
      </div>

      {/* Screen Header & Verbatim Intro */}
      <header className="space-y-3">
        <h1
          style={{ color: tokens.deepAccent }}
          className="font-['Aref_Ruqaa',serif] text-2xl sm:text-3xl font-bold leading-tight"
        >
          {t('method.title')}
        </h1>
        <p
          style={{
            color: tokens.textSecondary,
            backgroundColor: tokens.surface,
            borderColor: tokens.border,
          }}
          className="text-xs sm:text-sm font-['Cairo',sans-serif] leading-relaxed p-4 rounded-2xl border shadow-xs"
        >
          «مستكشف» لا يخلط المرويَّ بالموثَّق. كل نص في التطبيق يحمل واحدة من أربع شارات، ليعرف القارئ والكاتب والباحث ماذا يمسك تماماً.
        </p>
      </header>

      {/* The 4 Documentation Badges Grid */}
      <div className="space-y-4">
        <h2
          style={{ color: tokens.deepAccent }}
          className="font-['Aref_Ruqaa',serif] text-lg font-bold"
        >
          شارات التوثيق الأربع
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: نص حرفي (Mint accent) */}
          <Card
            variant="white"
            elevation="card"
            style={{
              borderColor: isDark ? 'rgba(127, 209, 174, 0.45)' : '#8EDBC0',
            }}
            className="p-5 rounded-2xl border-2 space-y-3 relative overflow-hidden"
          >
            {/* Top Label Pill: Mint Accent */}
            <div className="flex items-center justify-between gap-2">
              <span
                style={{
                  backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : '#D6F4E7',
                  color: isDark ? '#7FD1AE' : '#0E5C4D',
                  borderColor: isDark ? 'rgba(127, 209, 174, 0.45)' : '#8EDBC0',
                }}
                className="px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 font-['Cairo',sans-serif]"
              >
                <CheckCircle2 size={13} />
                <span>نص حرفي</span>
              </span>
              <span
                style={{ color: tokens.textSecondary }}
                className="text-[11px] font-mono opacity-70"
              >
                #01
              </span>
            </div>

            <h3
              style={{ color: tokens.textPrimary }}
              className="font-['Aref_Ruqaa',serif] text-lg font-bold"
            >
              نص حرفي
            </h3>

            <p
              style={{ color: tokens.textSecondary }}
              className="text-xs sm:text-sm font-['Cairo',sans-serif] leading-relaxed"
            >
              منقول من القرآن أو الحديث أو كتاب موثوق مطبوع. قابل للنسخ مع مصدره، ولا زيادة فيه ولا نقص.
            </p>
          </Card>

          {/* Card 2: بأسلوب المصدر (Cool-blue accent) */}
          <Card
            variant="white"
            elevation="card"
            style={{
              borderColor: isDark ? 'rgba(74, 144, 217, 0.45)' : '#ADCFF6',
            }}
            className="p-5 rounded-2xl border-2 space-y-3 relative overflow-hidden"
          >
            {/* Top Label Pill: Cool-blue Accent */}
            <div className="flex items-center justify-between gap-2">
              <span
                style={{
                  backgroundColor: isDark ? 'rgba(74, 144, 217, 0.2)' : '#E3EEFC',
                  color: isDark ? '#8ABDF8' : '#1A4D7C',
                  borderColor: isDark ? 'rgba(74, 144, 217, 0.45)' : '#ADCFF6',
                }}
                className="px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 font-['Cairo',sans-serif]"
              >
                <Scroll size={13} />
                <span>بأسلوب المصدر</span>
              </span>
              <span
                style={{ color: tokens.textSecondary }}
                className="text-[11px] font-mono opacity-70"
              >
                #02
              </span>
            </div>

            <h3
              style={{ color: tokens.textPrimary }}
              className="font-['Aref_Ruqaa',serif] text-lg font-bold"
            >
              بأسلوب المصدر
            </h3>

            <p
              style={{ color: tokens.textSecondary }}
              className="text-xs sm:text-sm font-['Cairo',sans-serif] leading-relaxed"
            >
              تلخيص بروح الكتاب القديم (الجاحظ، الكلبي، المسعودي…) لا بألفاظه. أمانةً في العزو: لا ننسب للكتاب لفظاً لم يكتبه.
            </p>
          </Card>

          {/* Card 3: الرواية الشعبية (Cool-blue accent) */}
          <Card
            variant="white"
            elevation="card"
            style={{
              borderColor: isDark ? 'rgba(74, 144, 217, 0.45)' : '#ADCFF6',
            }}
            className="p-5 rounded-2xl border-2 space-y-3 relative overflow-hidden"
          >
            {/* Top Label Pill: Cool-blue Accent */}
            <div className="flex items-center justify-between gap-2">
              <span
                style={{
                  backgroundColor: isDark ? 'rgba(74, 144, 217, 0.2)' : '#E3EEFC',
                  color: isDark ? '#8ABDF8' : '#1A4D7C',
                  borderColor: isDark ? 'rgba(74, 144, 217, 0.45)' : '#ADCFF6',
                }}
                className="px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 font-['Cairo',sans-serif]"
              >
                <Sparkles size={13} />
                <span>{t('method.folk')}</span>
              </span>
              <span
                style={{ color: tokens.textSecondary }}
                className="text-[11px] font-mono opacity-70"
              >
                #03
              </span>
            </div>

            <h3
              style={{ color: tokens.textPrimary }}
              className="font-['Aref_Ruqaa',serif] text-lg font-bold"
            >
              {t('method.folk')}
            </h3>

            <p
              style={{ color: tokens.textSecondary }}
              className="text-xs sm:text-sm font-['Cairo',sans-serif] leading-relaxed"
            >
              ما يرويه الحكواتيون والجدّات والأسواق — ذاكرة الناس. تُحفظ كتراث ثقافي جدير بالتدوين، لا كتاريخ موثَّق.
            </p>
          </Card>

          {/* Card 4: التحليل التاريخي (Mint accent) */}
          <Card
            variant="white"
            elevation="card"
            style={{
              borderColor: isDark ? 'rgba(127, 209, 174, 0.45)' : '#8EDBC0',
            }}
            className="p-5 rounded-2xl border-2 space-y-3 relative overflow-hidden"
          >
            {/* Top Label Pill: Mint Accent */}
            <div className="flex items-center justify-between gap-2">
              <span
                style={{
                  backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : '#D6F4E7',
                  color: isDark ? '#7FD1AE' : '#0E5C4D',
                  borderColor: isDark ? 'rgba(127, 209, 174, 0.45)' : '#8EDBC0',
                }}
                className="px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 font-['Cairo',sans-serif]"
              >
                <Landmark size={13} />
                <span>{t('method.analysis')}</span>
              </span>
              <span
                style={{ color: tokens.textSecondary }}
                className="text-[11px] font-mono opacity-70"
              >
                #04
              </span>
            </div>

            <h3
              style={{ color: tokens.textPrimary }}
              className="font-['Aref_Ruqaa',serif] text-lg font-bold"
            >
              {t('method.analysis')}
            </h3>

            <p
              style={{ color: tokens.textSecondary }}
              className="text-xs sm:text-sm font-['Cairo',sans-serif] leading-relaxed"
            >
              ما تقوله الآثار والنقوش والتاريخ المقارن — بما فيه مواضع الاتفاق والخلاف مع الرواية. وحين تختلف الروايتان نعرضهما جنباً إلى جنب.
            </p>
          </Card>
        </div>
      </div>

      {/* Section: لماذا روايتان؟ */}
      <section className="space-y-2.5">
        <Card
          variant="white"
          elevation="subtle"
          style={{
            borderColor: tokens.border,
          }}
          className="p-5 rounded-2xl border space-y-2.5"
        >
          <div className="flex items-center gap-2">
            <div
              style={{
                backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : '#D6F4E7',
                color: isDark ? '#7FD1AE' : '#0E5C4D',
              }}
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            >
              <Scale size={18} />
            </div>
            <h2
              style={{ color: tokens.deepAccent }}
              className="font-['Aref_Ruqaa',serif] text-lg font-bold"
            >
              لماذا روايتان؟
            </h2>
          </div>

          <p
            style={{ color: tokens.textPrimary }}
            className="text-xs sm:text-sm font-['Cairo',sans-serif] leading-relaxed"
          >
            لأن التراث ليس عدو العلم، ولا العلم عدو التراث: الأول يحفظ المعنى، والثاني يحقق الزمن. والقارئ الناضج يحتاجهما معاً.
          </p>
        </Card>
      </section>

      {/* Section: كيف أستشهد؟ */}
      <section className="space-y-2.5">
        <Card
          variant="white"
          elevation="subtle"
          style={{
            borderColor: tokens.border,
          }}
          className="p-5 rounded-2xl border space-y-2.5"
        >
          <div className="flex items-center gap-2">
            <div
              style={{
                backgroundColor: isDark ? 'rgba(74, 144, 217, 0.2)' : '#E3EEFC',
                color: isDark ? '#8ABDF8' : '#1A4D7C',
              }}
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            >
              <Quote size={18} />
            </div>
            <h2
              style={{ color: tokens.deepAccent }}
              className="font-['Aref_Ruqaa',serif] text-lg font-bold"
            >
              كيف أستشهد؟
            </h2>
          </div>

          <p
            style={{ color: tokens.textPrimary }}
            className="text-xs sm:text-sm font-['Cairo',sans-serif] leading-relaxed"
          >
            الصيغة المقترحة: «تطبيق مستكشف — أساطير وحضارات العرب، بطاقة X، قسم Y، شارة Z». وفي البحوث العلمية تُفضَّل شارة «نص حرفي» مع مصدرها.
          </p>
        </Card>
      </section>
    </div>
  );
};

export default MethodologyScreen;
