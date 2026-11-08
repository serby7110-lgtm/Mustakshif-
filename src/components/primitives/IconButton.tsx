/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Icon Button Component (مستكشف)
 * Token-driven interactive icon button.
 */

import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'surface' | 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  mirrorRTL?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  variant = 'surface',
  size = 'md',
  mirrorRTL = false,
  className = '',
  style,
  ...props
}) => {
  const { tokens, isDark } = useTheme();

  const variantStyles = {
    default: {
      backgroundColor: tokens.card,
      color: tokens.textPrimary,
      borderColor: tokens.border,
    },
    surface: {
      backgroundColor: tokens.surface,
      color: tokens.deepAccent,
      borderColor: tokens.border,
    },
    primary: {
      backgroundColor: tokens.deepAccent,
      color: isDark ? tokens.background : '#FFFFFF',
      borderColor: 'transparent',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: tokens.textSecondary,
      borderColor: 'transparent',
    },
  }[variant];

  const sizeStyles = {
    sm: 'w-8 h-8 rounded-xl text-sm p-1.5',
    md: 'w-10 h-10 rounded-2xl text-base p-2',
    lg: 'w-12 h-12 rounded-2xl text-lg p-2.5',
  }[size];

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      style={{
        ...variantStyles,
        ...style,
      }}
      className={`inline-flex items-center justify-center border transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7FD1AE] cursor-pointer shrink-0 shadow-xs ${sizeStyles} ${className}`}
      {...props}
    >
      <span className={mirrorRTL ? 'transform scale-x-[-1] inline-flex' : 'inline-flex'}>
        {icon}
      </span>
    </button>
  );
};

export default IconButton;
