/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { TabBar, TabId } from './TabBar';
import { Logo } from '../primitives/Logo';
import { useTheme } from '../../theme/ThemeContext';
import { LANGUAGES, useI18n } from '../../i18n/i18n';

export interface AppShellProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  headerTitle?: string;
  headerSubtitle?: string;
  headerLeading?: React.ReactNode;
  headerTrailing?: React.ReactNode;
  hideTabBar?: boolean;
  hideHeader?: boolean;
  onLogoTap?: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onTabChange,
  headerTitle,
  headerSubtitle,
  headerLeading,
  headerTrailing,
  hideTabBar = false,
  hideHeader = false,
  onLogoTap,
  children,
}) => {
  const { tokens, isDark } = useTheme();
  const { lang, dir, flag, setLang, t } = useI18n();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const resolvedTitle = headerTitle ?? t('app.title');
  const resolvedSubtitle = headerSubtitle ?? t('app.subtitle');
  const currentMeta = LANGUAGES.find((l) => l.lang === lang) ?? LANGUAGES[0];

  useEffect(() => {
    if (!langMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLangMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [langMenuOpen]);

  return (
    <div
      dir={dir}
      lang={lang}
      style={{
        backgroundColor: tokens.background,
        color: tokens.textPrimary,
      }}
      className="min-h-screen flex justify-center font-['Cairo',sans-serif] selection:bg-[#7FD1AE]/30 transition-colors"
    >
      {/* Mobile-first centered application container */}
      <div
        style={{
          backgroundColor: tokens.surface,
          borderColor: tokens.border,
        }}
        className="w-full max-w-md min-h-screen flex flex-col shadow-[0_0_40px_-10px_rgba(14,92,77,0.08)] relative border-x transition-colors"
      >
        {/* Sticky App Header */}
        {!hideHeader && (
          <header
            style={{
              backgroundColor: isDark ? 'rgba(18, 51, 45, 0.95)' : 'rgba(255, 255, 255, 0.92)',
              borderColor: tokens.border,
            }}
            className="sticky top-0 z-30 backdrop-blur-md border-b px-4 py-3 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              {/* Start side: Title & Brand */}
              <div className="flex items-center gap-2.5 min-w-0">
                {headerLeading ? (
                  headerLeading
                ) : (
                  <button
                    type="button"
                    onClick={onLogoTap}
                    data-testid="app-logo-trigger"
                    aria-label={t('app.title')}
                    style={{
                      backgroundColor: tokens.card,
                      borderColor: tokens.border,
                    }}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl border flex items-center justify-center shadow-xs shrink-0 cursor-pointer focus:outline-none"
                  >
                    <Logo size={24} />
                  </button>
                )}
                <div className="text-start min-w-0">
                  <h1
                    style={{ color: tokens.deepAccent }}
                    className="font-['Aref_Ruqaa',serif] text-xl sm:text-2xl font-bold leading-none tracking-wide truncate"
                  >
                    {resolvedTitle}
                  </h1>
                  {resolvedSubtitle && (
                    <p
                      style={{ color: tokens.textSecondary }}
                      className="text-[11px] font-['Cairo',sans-serif] mt-0.5 font-medium truncate"
                    >
                      {resolvedSubtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* End side: Language Selector + Trailing actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div ref={menuRef} className="relative">
                  <button
                    type="button"
                    data-testid="header-lang-selector"
                    onClick={() => setLangMenuOpen((prev) => !prev)}
                    aria-label={t('common.selectLanguage')}
                    aria-haspopup="menu"
                    aria-expanded={langMenuOpen}
                    style={{
                      backgroundColor: tokens.card,
                      borderColor: langMenuOpen ? tokens.primaryMint : tokens.border,
                      color: tokens.deepAccent,
                    }}
                    className="min-h-[44px] px-2.5 py-1.5 rounded-full border flex items-center gap-1 text-[11px] font-bold shadow-xs hover:opacity-90 transition-all cursor-pointer"
                  >
                    <Globe size={13} className="shrink-0 opacity-80" />
                    <span
                      style={{ borderColor: tokens.borderSubtle }}
                      className="px-1.5 py-0.5 rounded-md border text-[10px] font-mono font-bold leading-none"
                      aria-hidden="true"
                    >
                      {flag}
                    </span>
                    <span className="max-w-[120px] truncate">{currentMeta.nativeName}</span>
                    <ChevronDown
                      size={12}
                      className={`shrink-0 transition-transform duration-200 ${langMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {langMenuOpen && (
                    <div
                      role="menu"
                      aria-label={t('common.selectLanguage')}
                      data-testid="header-lang-menu"
                      style={{
                        backgroundColor: tokens.card,
                        borderColor: tokens.border,
                        color: tokens.textPrimary,
                      }}
                      className="absolute end-0 mt-2 w-52 rounded-2xl border shadow-xl p-1.5 z-50 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                      {LANGUAGES.map((item) => {
                        const isSelected = item.lang === lang;
                        return (
                          <button
                            key={item.lang}
                            type="button"
                            role="menuitemradio"
                            aria-checked={isSelected}
                            data-testid={`header-lang-option-${item.lang}`}
                            onClick={() => {
                              setLang(item.lang);
                              setLangMenuOpen(false);
                            }}
                            style={{
                              backgroundColor: isSelected
                                ? (isDark ? 'rgba(127, 209, 174, 0.18)' : '#F2FBF7')
                                : 'transparent',
                              color: isSelected ? tokens.deepAccent : tokens.textPrimary,
                            }}
                            className="w-full px-3 py-2 rounded-xl flex items-center justify-between gap-2 text-xs font-bold hover:opacity-90 transition-colors cursor-pointer text-start"
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <span
                                style={{ borderColor: tokens.borderSubtle }}
                                className="px-1.5 py-0.5 rounded-md border text-[10px] font-mono font-bold leading-none shrink-0"
                                aria-hidden="true"
                              >
                                {item.flag}
                              </span>
                              <span className="truncate">{item.nativeName}</span>
                            </span>
                            {isSelected && <Check size={14} style={{ color: tokens.deepAccent }} className="shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {headerTrailing}
              </div>
            </div>
          </header>
        )}

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 scroll-smooth">
          {children}
        </main>

        {/* Fixed Bottom Tab Bar */}
        {!hideTabBar && (
          <div className="sticky bottom-0 z-30">
            <TabBar activeTab={activeTab} onTabChange={onTabChange} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AppShell;
