/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Contact Screen (تواصل معنا)
 * Sends user feedback, bug reports, and suggestions to Formspree
 * with instant client-side validation, error handling, and mailto fallback.
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Send,
  Mail,
  User,
  Tag,
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card } from '../components/primitives/Card';
import { useTheme } from '../theme/ThemeContext';
import { storage } from '../data/storage';

export const FORMSPREE_ID = "meaawdjn";

export type MessageType = 'شكوى' | 'اقتراح' | 'خطأ في المحتوى' | 'سؤال عام';

export interface ContactScreenProps {
  onBack?: () => void;
  onMessageSent?: () => void;
}

export const ContactScreen: React.FC<ContactScreenProps> = ({ onBack, onMessageSent }) => {
  const { tokens, isDark } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<MessageType>('شكوى');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  // Email regex allowing international and all standard domain extensions
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validation checks
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'يرجى إدخال الاسم';
    }

    if (!email.trim()) {
      errs.email = 'يرجى إدخال البريد الإلكتروني';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'يرجى إدخال بريد إلكتروني صحيح';
    }

    if (!subject.trim()) {
      errs.subject = 'يرجى إدخال عنوان الرسالة';
    }

    if (!message.trim()) {
      errs.message = 'يرجى كتابة نص الرسالة';
    }

    return errs;
  }, [name, email, subject, message]);

  const isValid = Object.keys(errors).length === 0;

  const showToast = (msg: string, isError = false) => {
    setToast({ message: msg, isError });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched
    setTouched({
      name: true,
      email: true,
      subject: true,
      message: true,
    });

    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        type,
        subject: subject.trim(),
        message: message.trim(),
        _subject: `مستكشف: ${type} - ${subject.trim()}`,
      };

      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        storage.incrementSentMessagesCount();
        setName('');
        setEmail('');
        setType('شكوى');
        setSubject('');
        setMessage('');
        setTouched({});
        showToast('✓ وصلت رسالتك، شكراً لك', false);
        onMessageSent?.();
      } else {
        showToast('فشل الإرسال، حاول لاحقاً', true);
      }
    } catch {
      showToast('فشل الإرسال، حاول لاحقاً', true);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border shadow-xs hover:opacity-90 cursor-pointer transition-all active:scale-95 min-h-[44px] min-w-[44px]"
            aria-label="العودة إلى الإعدادات"
          >
            <ArrowRight size={16} />
            <span>العودة</span>
          </button>
        ) : (
          <div />
        )}

        <div
          style={{
            backgroundColor: isDark ? 'rgba(74, 144, 217, 0.15)' : 'rgba(74, 144, 217, 0.12)',
            borderColor: isDark ? 'rgba(74, 144, 217, 0.35)' : 'rgba(74, 144, 217, 0.4)',
            color: isDark ? '#7EB5F0' : '#2A70B8',
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border min-h-[44px]"
        >
          <Mail size={14} />
          <span>قناة التواصل المباشر</span>
        </div>
      </div>

      {/* Header Banner */}
      <Card
        elevation="elevated"
        className="p-6 relative overflow-hidden"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #102621 0%, #153A32 100%)'
            : 'linear-gradient(135deg, #F0FAF6 0%, #E2F5ED 100%)',
          borderColor: tokens.border,
        }}
      >
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span
              style={{
                backgroundColor: '#4A90D9',
                color: '#FFFFFF',
              }}
              className="p-1.5 rounded-xl inline-flex items-center justify-center shadow-xs"
            >
              <MessageSquare size={18} />
            </span>
            <h1
              style={{ color: tokens.deepAccent }}
              className="font-['Aref_Ruqaa',serif] text-2xl sm:text-3xl font-bold"
            >
              تواصل معنا
            </h1>
          </div>
          <p
            style={{ color: tokens.textSecondary }}
            className="text-sm font-['Cairo',sans-serif] leading-relaxed"
          >
            شكواك، اقتراحك، أو اكتشافك لخطأ — صوتك يصلنا
          </p>
        </div>
      </Card>

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            backgroundColor: toast.isError
              ? isDark ? '#5C1D1D' : '#FEE2E2'
              : isDark ? '#103D32' : '#D6F4E7',
            borderColor: toast.isError
              ? isDark ? '#B91C1C' : '#FCA5A5'
              : isDark ? '#2D8A70' : '#8EDBC0',
            color: toast.isError
              ? isDark ? '#FECACA' : '#991B1B'
              : isDark ? '#A7F3D0' : '#065F46',
          }}
          className="p-4 rounded-2xl border shadow-md flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
          role="alert"
        >
          {toast.isError ? (
            <AlertCircle size={20} className="shrink-0" />
          ) : (
            <CheckCircle2 size={20} className="shrink-0" />
          )}
          <span className="text-sm font-bold font-['Cairo',sans-serif]">
            {toast.message}
          </span>
        </div>
      )}

      {/* Main Contact Form */}
      <Card variant="white" elevation="card" className="p-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Field 1: Name */}
          <div>
            <label
              htmlFor="contact-name"
              style={{ color: tokens.textPrimary }}
              className="block text-xs font-bold mb-1.5 flex items-center gap-1.5"
            >
              <User size={14} style={{ color: tokens.deepAccent }} />
              <span>الاسم <span className="text-red-500">*</span></span>
            </label>
            <input
              id="contact-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="الاسم"
              style={{
                backgroundColor: tokens.surface,
                borderColor: touched.name && errors.name ? '#EF4444' : tokens.border,
                color: tokens.textPrimary,
              }}
              className="w-full px-4 py-3 rounded-2xl border text-sm font-['Cairo',sans-serif] outline-none transition-colors focus:ring-2 focus:ring-[#4A90D9]/40 min-h-[48px]"
            />
            {touched.name && errors.name && (
              <p className="text-red-500 text-xs mt-1.5 font-bold flex items-center gap-1">
                <AlertCircle size={12} />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Field 2: Email */}
          <div>
            <label
              htmlFor="contact-email"
              style={{ color: tokens.textPrimary }}
              className="block text-xs font-bold mb-1.5 flex items-center gap-1.5"
            >
              <Mail size={14} style={{ color: tokens.deepAccent }} />
              <span>بريدك الإلكتروني <span className="text-red-500">*</span></span>
            </label>
            <input
              id="contact-email"
              type="email"
              dir="ltr"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="بريدك الإلكتروني"
              style={{
                backgroundColor: tokens.surface,
                borderColor: touched.email && errors.email ? '#EF4444' : tokens.border,
                color: tokens.textPrimary,
              }}
              className="w-full px-4 py-3 rounded-2xl border text-sm font-['Cairo',sans-serif] text-right outline-none transition-colors focus:ring-2 focus:ring-[#4A90D9]/40 min-h-[48px]"
            />
            {touched.email && errors.email && (
              <p className="text-red-500 text-xs mt-1.5 font-bold flex items-center gap-1">
                <AlertCircle size={12} />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          {/* Field 3: Type Dropdown */}
          <div>
            <label
              htmlFor="contact-type"
              style={{ color: tokens.textPrimary }}
              className="block text-xs font-bold mb-1.5 flex items-center gap-1.5"
            >
              <Tag size={14} style={{ color: tokens.deepAccent }} />
              <span>نوع الرسالة <span className="text-red-500">*</span></span>
            </label>
            <select
              id="contact-type"
              value={type}
              onChange={(e) => setType(e.target.value as MessageType)}
              style={{
                backgroundColor: tokens.surface,
                borderColor: tokens.border,
                color: tokens.textPrimary,
              }}
              className="w-full px-4 py-3 rounded-2xl border text-sm font-['Cairo',sans-serif] outline-none transition-colors focus:ring-2 focus:ring-[#4A90D9]/40 min-h-[48px] cursor-pointer"
            >
              <option value="شكوى">شكوى</option>
              <option value="اقتراح">اقتراح</option>
              <option value="خطأ في المحتوى">خطأ في المحتوى</option>
              <option value="سؤال عام">سؤال عام</option>
            </select>
          </div>

          {/* Field 4: Subject */}
          <div>
            <label
              htmlFor="contact-subject"
              style={{ color: tokens.textPrimary }}
              className="block text-xs font-bold mb-1.5 flex items-center gap-1.5"
            >
              <FileText size={14} style={{ color: tokens.deepAccent }} />
              <span>عنوان الرسالة <span className="text-red-500">*</span></span>
            </label>
            <input
              id="contact-subject"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onBlur={() => handleBlur('subject')}
              placeholder="عنوان الرسالة"
              style={{
                backgroundColor: tokens.surface,
                borderColor: touched.subject && errors.subject ? '#EF4444' : tokens.border,
                color: tokens.textPrimary,
              }}
              className="w-full px-4 py-3 rounded-2xl border text-sm font-['Cairo',sans-serif] outline-none transition-colors focus:ring-2 focus:ring-[#4A90D9]/40 min-h-[48px]"
            />
            {touched.subject && errors.subject && (
              <p className="text-red-500 text-xs mt-1.5 font-bold flex items-center gap-1">
                <AlertCircle size={12} />
                <span>{errors.subject}</span>
              </p>
            )}
          </div>

          {/* Field 5: Message Textarea */}
          <div>
            <label
              htmlFor="contact-message"
              style={{ color: tokens.textPrimary }}
              className="block text-xs font-bold mb-1.5 flex items-center gap-1.5"
            >
              <MessageSquare size={14} style={{ color: tokens.deepAccent }} />
              <span>نص الرسالة <span className="text-red-500">*</span></span>
            </label>
            <textarea
              id="contact-message"
              rows={6}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onBlur={() => handleBlur('message')}
              placeholder="اكتب رسالتك هنا..."
              style={{
                backgroundColor: tokens.surface,
                borderColor: touched.message && errors.message ? '#EF4444' : tokens.border,
                color: tokens.textPrimary,
              }}
              className="w-full px-4 py-3 rounded-2xl border text-sm font-['Cairo',sans-serif] outline-none transition-colors focus:ring-2 focus:ring-[#4A90D9]/40 resize-y leading-relaxed min-h-[140px]"
            />
            {touched.message && errors.message && (
              <p className="text-red-500 text-xs mt-1.5 font-bold flex items-center gap-1">
                <AlertCircle size={12} />
                <span>{errors.message}</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              style={{
                backgroundColor: '#4A90D9',
                color: '#FFFFFF',
                opacity: (!isValid || isSubmitting) ? 0.6 : 1,
              }}
              className="w-full h-12 min-h-[48px] rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>إرسال</span>
                </>
              )}
            </button>

            {/* Privacy note */}
            <p
              style={{ color: tokens.textSecondary }}
              className="text-[11px] text-center mt-2.5 font-['Cairo',sans-serif]"
            >
              رسالتك تصل مباشرة لمطور التطبيق عبر Formspree
            </p>
          </div>
        </form>
      </Card>

      {/* Alternative Email Section (البريد البديل) */}
      <Card
        variant="surface"
        elevation="subtle"
        className="p-5"
        style={{
          borderColor: tokens.borderSubtle,
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              style={{
                backgroundColor: isDark ? 'rgba(74, 144, 217, 0.2)' : 'rgba(74, 144, 217, 0.12)',
                color: '#4A90D9',
              }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            >
              <Mail size={18} />
            </div>
            <div>
              <h3
                style={{ color: tokens.textPrimary }}
                className="font-bold text-sm font-['Cairo',sans-serif]"
              >
                البريد البديل
              </h3>
              <p
                style={{ color: tokens.textSecondary }}
                className="text-xs mt-0.5"
              >
                في حال واجهت أي صعوبة في الإرسال عبر النموذج
              </p>
            </div>
          </div>

          <a
            href="mailto:serby7110@gmail.com?subject=%D9%85%D9%86%20%D8%AA%D8%B7%D8%A8%D9%8A%D9%82%20%D9%85%D8%B3%D8%AA%D9%83%D8%B4%D9%81"
            style={{
              backgroundColor: isDark ? '#152E2B' : '#EDF7F3',
              color: tokens.deepAccent,
              borderColor: tokens.border,
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 hover:opacity-90 transition-opacity min-h-[44px]"
          >
            <span>أو راسلنا مباشرة:</span>
            <span dir="ltr" className="underline font-mono text-[11px]">serby7110@gmail.com</span>
          </a>
        </div>
      </Card>
    </div>
  );
};
