/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TabBar, TabId } from './TabBar';
import { Logo } from '../primitives/Logo';
import { useTheme } from '../../theme/ThemeContext';
import { useI18n } from '../../i18n/i18n';

export interface AppShellProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  headerTitle?: string;
  headerSubtitle?: string;
  headerLeading?: React.ReactNode;
  headerTrailing?: React.ReactNode;
  hideTabBar?: boolean;
  hideHeader?: boolean;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onTabChange,
  headerTitle = 'مُسْتَكْشِف',
  headerSubtitle = 'موسوعة الأساطير العربية',
  headerLeading,
  headerTrailing,
  hideTabBar = false,
  hideHeader = false,
  children,
}) => {
  const { tokens, isDark } = useTheme();
  const { lang, dir, flag } = useI18n();

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
            <div className="flex items-center justify-between gap-3">
              {/* Right side in RTL: Title & Brand */}
              <div className="flex items-center gap-2.5">
                {headerLeading ? (
                  headerLeading
                ) : (
                  <div
                    style={{
                      backgroundColor: tokens.card,
                      borderColor: tokens.border,
                    }}
                    className="w-9 h-9 rounded-2xl border flex items-center justify-center shadow-xs"
                  >
                    <Logo size={24} />
                  </div>
                )}
                <div className="text-start">
                  <h1
                    style={{ color: tokens.deepAccent }}
                    className="font-['Aref_Ruqaa',serif] text-2xl font-bold leading-none tracking-wide"
                  >
                    {headerTitle}
                  </h1>
                  {headerSubtitle && (
                    <p
                      style={{ color: tokens.textSecondary }}
                      className="text-[11px] font-['Cairo',sans-serif] mt-0.5 font-medium"
                    >
                      {headerSubtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Left side in RTL: Trailing actions */}
              <div className="flex items-center gap-1.5">
                <span
                  role="img"
                  aria-label={lang}
                  title={lang}
                  style={{ backgroundColor: tokens.card, borderColor: tokens.border }}
                  className="w-8 h-8 rounded-full border flex items-center justify-center text-base leading-none shadow-xs"
                >
                  {flag}
                </span>
                {headerTrailing}
              </div>
            </div>
          </header>
        )}

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-5 pb-24">
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
