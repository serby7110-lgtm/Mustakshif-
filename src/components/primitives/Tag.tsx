/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Tag / Pill Component (مستكشف)
 * Token-driven pastels supporting both Light and Dark mode variants:
 * horror (dark: #E89A9A), history (dark: #9CC4EE), supernatural (dark: #C9B2F0).
 */

import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

export type TagVariant = 'horror' | 'history' | 'supernatural' | 'green' | 'blue' | 'neutral';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Tag: React.FC<TagProps> = ({
  variant = 'neutral',
  size = 'md',
  icon,
  children,
  className = '',
  style,
  ...props
}) => {
  const { tokens, isDark } = useTheme();

  const variantStyles: Record<TagVariant, { bg: string; text: string; border: string }> = {
    horror: {
      bg: tokens.tags.horrorBg,
      text: tokens.tags.horrorText,
      border: isDark ? 'rgba(232, 154, 154, 0.4)' : 'rgba(240, 138, 138, 0.35)',
    },
    history: {
      bg: tokens.tags.historyBg,
      text: tokens.tags.historyText,
      border: isDark ? 'rgba(156, 196, 238, 0.4)' : 'rgba(127, 178, 232, 0.4)',
    },
    supernatural: {
      bg: tokens.tags.supernaturalBg,
      text: tokens.tags.supernaturalText,
      border: isDark ? 'rgba(201, 178, 240, 0.4)' : 'rgba(183, 156, 232, 0.4)',
    },
    green: {
      bg: isDark ? 'rgba(127, 209, 174, 0.15)' : 'rgba(127, 209, 174, 0.22)',
      text: tokens.deepAccent,
      border: tokens.border,
    },
    blue: {
      bg: tokens.coolBlueTint,
      text: tokens.coolBlueAccent,
      border: isDark ? 'rgba(127, 178, 232, 0.35)' : 'rgba(74, 144, 217, 0.3)',
    },
    neutral: {
      bg: tokens.surface,
      text: tokens.textSecondary,
      border: tokens.borderSubtle,
    },
  };

  const current = variantStyles[variant];

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-[11px] gap-1' 
    : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border transition-colors ${sizeClasses} ${className}`}
      style={{
        backgroundColor: current.bg,
        color: current.text,
        borderColor: current.border,
        ...style,
      }}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

// Aliased as Pill for design system naming flexibility
export const Pill = Tag;

export default Tag;
