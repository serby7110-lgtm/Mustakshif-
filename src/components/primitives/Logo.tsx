/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Brand Logo (شعار مستكشف)
 * An eight-pointed geometric star (Rub el Hizb style) drawn with thin
 * strokes in deep teal #0E5C4D and mint #7FD1AE, with a small four-point
 * sparkle in the center in cool blue #4A90D9.
 * Clean, minimal, works on both white and dark backgrounds.
 */

import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

export interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  sparkleColor?: string;
  showBackdrop?: boolean;
  title?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 40,
  className = '',
  primaryColor,
  secondaryColor,
  sparkleColor,
  showBackdrop = false,
  title = 'شعار مستكشف',
  ...props
}) => {
  const { tokens, isDark } = useTheme();

  // Resolves to theme tokens while keeping default string contracts (#0E5C4D, #7FD1AE, #4A90D9)
  const resolvedPrimary = primaryColor || (isDark ? tokens.deepAccent : '#0E5C4D');
  const resolvedSecondary = secondaryColor || (isDark ? tokens.primaryMint : '#7FD1AE');
  const resolvedSparkle = sparkleColor || (isDark ? tokens.coolBlueAccent : '#4A90D9');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 select-none ${className}`}
      role="img"
      aria-label={title}
      {...props}
    >
      <title>{title}</title>

      {/* Optional subtle circular backdrop for extreme contrast versatility */}
      {showBackdrop && (
        <circle
          cx="50"
          cy="50"
          r="46"
          fill={tokens.card}
          fillOpacity="0.85"
          stroke={resolvedSecondary}
          strokeWidth="1"
          strokeOpacity="0.4"
        />
      )}

      {/* Primary Square: Deep Teal with soft rounded corners */}
      <rect
        x="22"
        y="22"
        width="56"
        height="56"
        rx="3.5"
        fill="none"
        stroke={resolvedPrimary}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Secondary Square: Mint Green, rotated 45 degrees */}
      <rect
        x="22"
        y="22"
        width="56"
        height="56"
        rx="3.5"
        transform="rotate(45 50 50)"
        fill="none"
        stroke={resolvedSecondary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Delicate inner geometric guide circle */}
      <circle
        cx="50"
        cy="50"
        r="17"
        fill="none"
        stroke={resolvedSecondary}
        strokeWidth="1.2"
        strokeDasharray="2.5 2.5"
        strokeOpacity="0.8"
      />

      {/* Center 4-Point Sparkle: Cool Blue */}
      <path
        d="M 50,38 C 50,44.5 55.5,50 62,50 C 55.5,50 50,55.5 50,62 C 50,55.5 44.5,50 38,50 C 44.5,50 50,44.5 50,38 Z"
        fill={resolvedSparkle}
      />

      {/* Micro luminous core dot */}
      <circle cx="50" cy="50" r="1.8" fill={isDark ? tokens.background : '#FFFFFF'} />

      {/* Subtle vertex pearls at 8 cardinal & intercardinal tips */}
      <circle cx="50" cy="10.5" r="1.5" fill={resolvedPrimary} fillOpacity="0.75" />
      <circle cx="50" cy="89.5" r="1.5" fill={resolvedPrimary} fillOpacity="0.75" />
      <circle cx="10.5" cy="50" r="1.5" fill={resolvedPrimary} fillOpacity="0.75" />
      <circle cx="89.5" cy="50" r="1.5" fill={resolvedPrimary} fillOpacity="0.75" />
    </svg>
  );
};

export default Logo;
