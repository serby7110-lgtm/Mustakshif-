import React from 'react';
import { Lock, BookOpen } from 'lucide-react';
import { resolveHeroImageUrl } from '../../utils/assets';

export const PremiumPill: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    style={{
      backgroundColor: '#4A90D9',
      color: '#FFFFFF',
    }}
    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs inline-flex items-center ${className}`}
  >
    Premium
  </span>
);

export const LockedLockBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <span
    aria-label="محتوى مقفل"
    style={{
      backgroundColor: 'rgba(11, 36, 32, 0.72)',
      color: '#FFFFFF',
    }}
    className={`absolute ${compact ? 'top-1 start-1 p-1' : 'top-2 start-2 p-1.5'} z-10 rounded-full flex items-center justify-center shadow-sm backdrop-blur-xs`}
  >
    <Lock size={18} strokeWidth={1.9} />
  </span>
);

export interface LockedHeroImageProps {
  src?: string | null;
  alt?: string | null;
  isLocked: boolean;
  className?: string;
  compact?: boolean;
  loading?: 'lazy' | 'eager';
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export const LockedHeroImage: React.FC<LockedHeroImageProps> = ({
  src,
  alt,
  isLocked,
  className = 'w-full h-full object-cover',
  compact = false,
  loading = 'lazy',
  onError,
}) => {
  const resolvedSrc = resolveHeroImageUrl(src);
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (onError) {
      onError(e);
      return;
    }
    const img = e.currentTarget;
    if (img.dataset.fallbackApplied === '1') return;
    img.dataset.fallbackApplied = '1';
    img.src = '/icons/icon.svg';
  };
  return (
    <>
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={alt ?? ''}
          style={{ opacity: isLocked ? 0.55 : 1 }}
          className={className}
          loading={loading}
          decoding="async"
          onError={handleImgError}
        />
      ) : (
        <div
          aria-label={alt ?? ''}
          style={{ opacity: isLocked ? 0.55 : 1 }}
          className="w-full h-full flex items-center justify-center bg-black/5 dark:bg-white/5 text-current opacity-50"
        >
          <BookOpen size={compact ? 18 : 26} strokeWidth={1.6} />
        </div>
      )}
      {isLocked && <LockedLockBadge compact={compact} />}
    </>
  );
};

