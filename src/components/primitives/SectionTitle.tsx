/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Section Title Component (مستكشف)
 * Token-driven typography and icon accent.
 */

import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

export interface SectionTitleProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  badge,
  action,
  icon,
  className = '',
}) => {
  const { tokens } = useTheme();

  return (
    <div className={`flex items-end justify-between gap-3 text-right ${className}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {icon && <span style={{ color: tokens.deepAccent }}>{icon}</span>}
          <h2
            style={{ color: tokens.textPrimary }}
            className="font-['Aref_Ruqaa',serif] text-xl sm:text-2xl font-bold tracking-wide leading-tight"
          >
            {title}
          </h2>
          {badge && <div className="inline-flex items-center">{badge}</div>}
        </div>
        {subtitle && (
          <p
            style={{ color: tokens.textSecondary }}
            className="mt-1 text-xs sm:text-sm font-['Cairo',sans-serif] leading-relaxed"
          >
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="shrink-0 text-left">
          {action}
        </div>
      )}
    </div>
  );
};

export default SectionTitle;
