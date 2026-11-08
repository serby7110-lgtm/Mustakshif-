/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Landmark, Map, BookOpen, User } from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';

export type TabId = 'home' | 'civilizations' | 'map' | 'library' | 'profile';

export interface TabItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

export const TABS: readonly TabItem[] = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { id: 'civilizations', label: 'الحضارات', icon: Landmark },
  { id: 'map', label: 'الخريطة', icon: Map },
  { id: 'library', label: 'المكتبة', icon: BookOpen },
  { id: 'profile', label: 'حسابي', icon: User },
] as const;

export interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  className?: string;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onTabChange,
  className = '',
}) => {
  const { tokens, isDark } = useTheme();

  return (
    <nav
      role="navigation"
      aria-label="شريط التنقل السفلي"
      style={{
        backgroundColor: isDark ? 'rgba(18, 51, 45, 0.96)' : 'rgba(255, 255, 255, 0.96)',
        borderColor: tokens.border,
      }}
      className={`w-full backdrop-blur-md border-t px-3 py-2 shadow-[0_-4px_20px_-2px_rgba(14,92,77,0.06)] transition-colors ${className}`}
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
              aria-selected={isActive}
              role="tab"
              className="flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-200 cursor-pointer group"
            >
              <div
                style={{
                  backgroundColor: isActive
                    ? (isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)')
                    : 'transparent',
                  color: isActive ? tokens.deepAccent : tokens.textSecondary,
                }}
                className="relative flex items-center justify-center w-10 h-8 rounded-full transition-all duration-200"
              >
                <IconComponent
                  size={20}
                  className={`transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {isActive && (
                  <span
                    style={{ backgroundColor: tokens.deepAccent }}
                    className="absolute -top-0.5 w-1.5 h-1.5 rounded-full"
                  />
                )}
              </div>
              <span
                style={{
                  color: isActive ? tokens.deepAccent : tokens.textSecondary,
                  fontWeight: isActive ? 700 : 500,
                }}
                className="text-[11px] font-['Cairo',sans-serif] mt-1 transition-all leading-none"
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabBar;
