/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Card Component (مستكشف)
 * Fully token-driven card container supporting light and dark mode.
 */

import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'surface' | 'tint';
  elevation?: 'none' | 'subtle' | 'card' | 'elevated';
  interactive?: boolean;
  padded?: boolean | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'white',
  elevation = 'card',
  interactive = false,
  padded = 'md',
  className = '',
  style,
  children,
  ...props
}) => {
  const { tokens, isDark } = useTheme();

  // Resolve background based on variant and active theme tokens
  const resolvedBg = {
    white: isDark ? tokens.card : tokens.card,
    surface: tokens.surface,
    tint: isDark ? tokens.surface : tokens.coolBlueTint,
  }[variant];

  const elevationStyles = {
    none: 'shadow-none',
    subtle: isDark ? 'shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3)]' : 'shadow-[0_2px_8px_-2px_rgba(14,92,77,0.05)]',
    card: isDark ? 'shadow-[0_8px_24px_-6px_rgba(0,0,0,0.4)]' : 'shadow-[0_8px_24px_-6px_rgba(14,92,77,0.06),0_2px_6px_-2px_rgba(14,92,77,0.03)]',
    elevated: isDark ? 'shadow-[0_16px_36px_-8px_rgba(0,0,0,0.5)]' : 'shadow-[0_16px_36px_-8px_rgba(14,92,77,0.1)]',
  }[elevation];

  const paddingStyles: Record<string, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6',
  };
  const resolvedPadding = paddingStyles[typeof padded === 'string' ? padded : padded ? 'md' : 'none'] || '';

  const interactiveStyles = interactive
    ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] active:translate-y-0'
    : '';

  const dynamicStyle: React.CSSProperties = {
    backgroundColor: resolvedBg,
    color: tokens.textPrimary,
    borderColor: tokens.border,
    ...style,
  };

  return (
    <div
      style={dynamicStyle}
      className={`rounded-[18px] border transition-colors ${elevationStyles} ${resolvedPadding} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
