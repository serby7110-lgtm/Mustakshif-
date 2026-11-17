/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Storage & Preferences Service (مستكشف)
 * Local persistence for bookmarks, reading history, dark-teal theme, and onboarding.
 * Equivalent to AsyncStorage/SQLite on mobile platforms with graceful fallback
 * and runtime type guards against corrupted or malformed stored values.
 */

const STORAGE_KEYS = {
  BOOKMARKS: 'mustakshif_saved_ids_v1',
  HISTORY: 'mustakshif_history_ids_v1',
  THEME_MODE: 'mustakshif_theme_mode_v1',
  FONT_SIZE: 'mustakshif_font_size_v1',
  ONBOARDING: 'mustakshif_onboarding_v1',
  LAST_READ: 'mustakshif_last_read_v1',
  STUDIO_FAVORITES: 'mustakshif_studio_favorites_v1',
  MYTH_PROGRESS: 'mustakshif_myth_progress_v2',
  LIBRARY_VIEW_MODE: 'mustakshif_library_view_v2',
  MAP_SHEETS_COUNT: 'mustakshif_map_sheets_v2',
  DARK_READING_MINUTES: 'mustakshif_dark_minutes_v2',
  READ_CHAPTERS: 'mustakshif_read_chapters_v2',
  FAVORITE_QUOTES: 'mustakshif_favorite_quotes_v1',
  CIV_SEGMENT: 'mustakshif_civ_segment_v1',
  DUAL_NARRATIVE_VIEW: 'mustakshif_dual_narrative_view_v1',
  MYTH_DUAL_NARRATIVE_VIEW: 'mustakshif_myth_dual_narrative_view_v1',
  SENT_MESSAGES_COUNT: 'mustakshif_sent_messages_count',
  AUTO_DARK_MODE: 'mustakshif_auto_dark_mode_v1',
} as const;

export type ThemeMode = 'light' | 'dark' | 'darkTeal';
export type FontSize = 'sm' | 'md' | 'lg';

export interface LastReadChapter {
  mythId: string;
  mythName: string;
  chapterIndex: number;
  chapterTitle: string;
  progressPercent: number;
  timestamp?: number;
}

export interface LongFormResumeState {
  entryId: string;
  lastChapterIndex: number;
  lastChapterId: string;
  lastChapterTitle: string;
  chapterProgressPercent: number;
  updatedAt: number;
}

const DEFAULT_BOOKMARKS = ['al-anqa', 'al-ghul', 'iram-dhat-al-imad'];
const DEFAULT_HISTORY = ['al-anqa', 'al-ghul', 'al-jinn', 'al-lat'];
const DEFAULT_FAVORITE_QUOTES = ['ghul_quote_0', 'anqa_quote_1'];
const DEFAULT_READ_CHAPTERS = ['ghul_0', 'ghul_1', 'irm_0', 'anqa_0'];
const DEFAULT_MYTH_PROGRESS: Record<string, number> = {
  ghul: 65,
  'al-ghul': 65,
  anqa: 100,
  'al-anqa': 100,
  irm: 40,
  'iram-dhat-al-imad': 40,
  jinn: 100,
  'al-jinn': 100,
  allat: 100,
  'al-lat': 100,
  hubal: 100,
};

function warnStorage(context: string, err: unknown): void {
  console.warn(`[Storage] ${context}:`, err);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStringArray(raw: string | null, fallback: string[], label: string): string[] {
  if (!raw) return [...fallback];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      warnStorage(`Expected array for ${label}, falling back to default`, parsed);
      return [...fallback];
    }
    return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0);
  } catch (err) {
    warnStorage(`Failed to parse ${label}`, err);
    return [...fallback];
  }
}

function parsePlainObject<T extends Record<string, unknown>>(
  raw: string | null,
  fallback: T,
  label: string
): T {
  if (!raw) return { ...fallback };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed)) {
      warnStorage(`Expected object for ${label}, falling back to default`, parsed);
      return { ...fallback };
    }
    return parsed as T;
  } catch (err) {
    warnStorage(`Failed to parse ${label}`, err);
    return { ...fallback };
  }
}

function parseNumberMap(
  raw: string | null,
  fallback: Record<string, number>,
  label: string
): Record<string, number> {
  const obj = parsePlainObject<Record<string, unknown>>(raw, fallback, label);
  const sanitized: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'number' && Number.isFinite(v)) {
      sanitized[k] = v;
    }
  }
  return Object.keys(sanitized).length > 0 || raw ? sanitized : { ...fallback };
}

function parseNonNegInt(raw: string | null, fallback: number, label: string): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    warnStorage(`Invalid non-negative integer for ${label}: "${raw}"`, parsed);
    return fallback;
  }
  return parsed;
}

// In-memory fallback for environments without window.localStorage (e.g. Node tests, SSR)
const memoryStore = new Map<string, string>();

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return memoryStore.get(key) ?? null;
    } catch (err) {
      warnStorage(`getItem(${key}) failed, using memoryStore`, err);
      return memoryStore.get(key) ?? null;
    }
  },
  setItem: (key: string, value: string): void => {
    memoryStore.set(key, value);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (err) {
      warnStorage(`setItem(${key}) failed, stored in memoryStore only`, err);
    }
  },
};

export const storage = {
  getBookmarks: (): string[] => {
    const data = safeStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return parseStringArray(data, DEFAULT_BOOKMARKS, STORAGE_KEYS.BOOKMARKS);
  },

  setBookmarks: (ids: string[]) => {
    try {
      const safeIds = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
      safeStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(safeIds));
    } catch (err) {
      warnStorage('setBookmarks failed', err);
    }
  },

  getHistory: (): string[] => {
    const data = safeStorage.getItem(STORAGE_KEYS.HISTORY);
    return parseStringArray(data, DEFAULT_HISTORY, STORAGE_KEYS.HISTORY);
  },

  setHistory: (ids: string[]) => {
    try {
      const safeIds = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
      safeStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(safeIds));
    } catch (err) {
      warnStorage('setHistory failed', err);
    }
  },

  getThemeMode: (): ThemeMode => {
    try {
      const mode = safeStorage.getItem(STORAGE_KEYS.THEME_MODE);
      return mode === 'dark' || mode === 'darkTeal' ? 'dark' : 'light';
    } catch (err) {
      warnStorage('getThemeMode failed', err);
      return 'light';
    }
  },

  setThemeMode: (mode: ThemeMode) => {
    try {
      safeStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    } catch (err) {
      warnStorage('setThemeMode failed', err);
    }
  },

  getAutoDarkMode: (): boolean => {
    try {
      return safeStorage.getItem(STORAGE_KEYS.AUTO_DARK_MODE) === 'true';
    } catch (err) {
      warnStorage('getAutoDarkMode failed', err);
      return false;
    }
  },

  setAutoDarkMode: (enabled: boolean) => {
    try {
      safeStorage.setItem(STORAGE_KEYS.AUTO_DARK_MODE, enabled ? 'true' : 'false');
    } catch (err) {
      warnStorage('setAutoDarkMode failed', err);
    }
  },

  getFontSize: (): FontSize => {
    try {
      const size = safeStorage.getItem(STORAGE_KEYS.FONT_SIZE);
      return size === 'sm' || size === 'lg' ? size : 'md';
    } catch (err) {
      warnStorage('getFontSize failed', err);
      return 'md';
    }
  },

  setFontSize: (size: FontSize) => {
    try {
      safeStorage.setItem(STORAGE_KEYS.FONT_SIZE, size);
    } catch (err) {
      warnStorage('setFontSize failed', err);
    }
  },

  getHasCompletedOnboarding: (): boolean => {
    try {
      return safeStorage.getItem(STORAGE_KEYS.ONBOARDING) === 'true';
    } catch (err) {
      warnStorage('getHasCompletedOnboarding failed', err);
      return false;
    }
  },

  setHasCompletedOnboarding: (completed: boolean) => {
    try {
      safeStorage.setItem(STORAGE_KEYS.ONBOARDING, completed ? 'true' : 'false');
    } catch (err) {
      warnStorage('setHasCompletedOnboarding failed', err);
    }
  },

  getLastReadChapter: (): LastReadChapter | null => {
    const data = safeStorage.getItem(STORAGE_KEYS.LAST_READ);
    if (!data) return null;
    try {
      const parsed: unknown = JSON.parse(data);
      if (
        isPlainObject(parsed) &&
        typeof parsed.mythId === 'string' &&
        typeof parsed.chapterIndex === 'number' &&
        Number.isFinite(parsed.chapterIndex)
      ) {
        return {
          mythId: parsed.mythId,
          mythName: typeof parsed.mythName === 'string' ? parsed.mythName : '',
          chapterIndex: parsed.chapterIndex,
          chapterTitle: typeof parsed.chapterTitle === 'string' ? parsed.chapterTitle : '',
          progressPercent:
            typeof parsed.progressPercent === 'number' && Number.isFinite(parsed.progressPercent)
              ? parsed.progressPercent
              : 0,
          timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : undefined,
        };
      }
      warnStorage('Invalid lastReadChapter shape, ignoring stored value', parsed);
      return null;
    } catch (err) {
      warnStorage('getLastReadChapter parse failed', err);
      return null;
    }
  },

  setLastReadChapter: (data: LastReadChapter) => {
    try {
      safeStorage.setItem(STORAGE_KEYS.LAST_READ, JSON.stringify(data));
    } catch (err) {
      warnStorage('setLastReadChapter failed', err);
    }
  },

  clearLastReadChapter: () => {
    try {
      safeStorage.setItem(STORAGE_KEYS.LAST_READ, '');
    } catch (err) {
      warnStorage('clearLastReadChapter failed', err);
    }
  },

  getFavoriteHooks: (): string[] => {
    const data = safeStorage.getItem(STORAGE_KEYS.STUDIO_FAVORITES);
    return parseStringArray(data, [], STORAGE_KEYS.STUDIO_FAVORITES);
  },

  setFavoriteHooks: (ids: string[]) => {
    try {
      const safeIds = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
      safeStorage.setItem(STORAGE_KEYS.STUDIO_FAVORITES, JSON.stringify(safeIds));
    } catch (err) {
      warnStorage('setFavoriteHooks failed', err);
    }
  },

  getFavoriteQuotes: (): string[] => {
    const data = safeStorage.getItem(STORAGE_KEYS.FAVORITE_QUOTES);
    return parseStringArray(data, DEFAULT_FAVORITE_QUOTES, STORAGE_KEYS.FAVORITE_QUOTES);
  },

  setFavoriteQuotes: (ids: string[]) => {
    try {
      const safeIds = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
      safeStorage.setItem(STORAGE_KEYS.FAVORITE_QUOTES, JSON.stringify(safeIds));
    } catch (err) {
      warnStorage('setFavoriteQuotes failed', err);
    }
  },

  getAllMythProgress: (): Record<string, number> => {
    const data = safeStorage.getItem(STORAGE_KEYS.MYTH_PROGRESS);
    return parseNumberMap(data, DEFAULT_MYTH_PROGRESS, STORAGE_KEYS.MYTH_PROGRESS);
  },

  setMythProgress: (mythId: string, progress: number) => {
    if (!mythId) return;
    try {
      const safeProgress = Number.isFinite(progress) ? progress : 0;
      const current = storage.getAllMythProgress();
      const clamped = Math.min(100, Math.max(0, Math.round(safeProgress)));
      current[mythId] = clamped;
      if (mythId.startsWith('al-')) {
        current[mythId.slice(3)] = clamped;
      } else {
        current[`al-${mythId}`] = clamped;
      }
      safeStorage.setItem(STORAGE_KEYS.MYTH_PROGRESS, JSON.stringify(current));
    } catch (err) {
      warnStorage('setMythProgress failed', err);
    }
  },

  getLibraryViewMode: (): 'grid' | 'list' => {
    try {
      const mode = safeStorage.getItem(STORAGE_KEYS.LIBRARY_VIEW_MODE);
      return mode === 'list' ? 'list' : 'grid';
    } catch (err) {
      warnStorage('getLibraryViewMode failed', err);
      return 'grid';
    }
  },

  setLibraryViewMode: (mode: 'grid' | 'list') => {
    try {
      safeStorage.setItem(STORAGE_KEYS.LIBRARY_VIEW_MODE, mode);
    } catch (err) {
      warnStorage('setLibraryViewMode failed', err);
    }
  },

  getMapSheetsCount: (): number => {
    const val = safeStorage.getItem(STORAGE_KEYS.MAP_SHEETS_COUNT);
    return parseNonNegInt(val, 10, STORAGE_KEYS.MAP_SHEETS_COUNT);
  },

  incrementMapSheetsCount: () => {
    try {
      const current = storage.getMapSheetsCount();
      safeStorage.setItem(STORAGE_KEYS.MAP_SHEETS_COUNT, String(current + 1));
    } catch (err) {
      warnStorage('incrementMapSheetsCount failed', err);
    }
  },

  getDarkReadingMinutes: (): number => {
    const val = safeStorage.getItem(STORAGE_KEYS.DARK_READING_MINUTES);
    return parseNonNegInt(val, 32, STORAGE_KEYS.DARK_READING_MINUTES);
  },

  addDarkReadingMinutes: (minutes: number = 1) => {
    try {
      const delta = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0;
      const current = storage.getDarkReadingMinutes();
      safeStorage.setItem(STORAGE_KEYS.DARK_READING_MINUTES, String(current + delta));
    } catch (err) {
      warnStorage('addDarkReadingMinutes failed', err);
    }
  },

  getReadChapters: (): string[] => {
    const data = safeStorage.getItem(STORAGE_KEYS.READ_CHAPTERS);
    return parseStringArray(data, DEFAULT_READ_CHAPTERS, STORAGE_KEYS.READ_CHAPTERS);
  },

  markChapterRead: (chapterKey: string) => {
    if (!chapterKey) return;
    try {
      const current = storage.getReadChapters();
      if (!current.includes(chapterKey)) {
        current.push(chapterKey);
        safeStorage.setItem(STORAGE_KEYS.READ_CHAPTERS, JSON.stringify(current));
      }
    } catch (err) {
      warnStorage('markChapterRead failed', err);
    }
  },

  getCivSegment: (): 'list' | 'timeline' => {
    try {
      const val = safeStorage.getItem(STORAGE_KEYS.CIV_SEGMENT);
      return val === 'timeline' ? 'timeline' : 'list';
    } catch (err) {
      warnStorage('getCivSegment failed', err);
      return 'list';
    }
  },

  setCivSegment: (segment: 'list' | 'timeline') => {
    try {
      safeStorage.setItem(STORAGE_KEYS.CIV_SEGMENT, segment);
    } catch (err) {
      warnStorage('setCivSegment failed', err);
    }
  },

  getDualNarrativeView: (): 'tradition' | 'archaeology' => {
    try {
      const val = safeStorage.getItem(STORAGE_KEYS.DUAL_NARRATIVE_VIEW);
      return val === 'archaeology' ? 'archaeology' : 'tradition';
    } catch (err) {
      warnStorage('getDualNarrativeView failed', err);
      return 'tradition';
    }
  },

  setDualNarrativeView: (view: 'tradition' | 'archaeology') => {
    try {
      safeStorage.setItem(STORAGE_KEYS.DUAL_NARRATIVE_VIEW, view);
    } catch (err) {
      warnStorage('setDualNarrativeView failed', err);
    }
  },

  getMythDualNarrativeView: (): 'tradition' | 'analysis' => {
    try {
      const val = safeStorage.getItem(STORAGE_KEYS.MYTH_DUAL_NARRATIVE_VIEW);
      return val === 'analysis' ? 'analysis' : 'tradition';
    } catch (err) {
      warnStorage('getMythDualNarrativeView failed', err);
      return 'tradition';
    }
  },

  setMythDualNarrativeView: (view: 'tradition' | 'analysis') => {
    try {
      safeStorage.setItem(STORAGE_KEYS.MYTH_DUAL_NARRATIVE_VIEW, view);
    } catch (err) {
      warnStorage('setMythDualNarrativeView failed', err);
    }
  },

  getSentMessagesCount: (): number => {
    const val = safeStorage.getItem(STORAGE_KEYS.SENT_MESSAGES_COUNT);
    return parseNonNegInt(val, 0, STORAGE_KEYS.SENT_MESSAGES_COUNT);
  },

  incrementSentMessagesCount: (): number => {
    try {
      const current = storage.getSentMessagesCount();
      const next = current + 1;
      safeStorage.setItem(STORAGE_KEYS.SENT_MESSAGES_COUNT, String(next));
      return next;
    } catch (err) {
      warnStorage('incrementSentMessagesCount failed', err);
      return 1;
    }
  },

  setSentMessagesCount: (count: number): void => {
    try {
      const safeCount = Number.isFinite(count) ? Math.max(0, Math.round(count)) : 0;
      safeStorage.setItem(STORAGE_KEYS.SENT_MESSAGES_COUNT, String(safeCount));
    } catch (err) {
      warnStorage('setSentMessagesCount failed', err);
    }
  },

  hasPremiumMonthly: (): boolean => {
    try {
      const active = safeStorage.getItem('mustakshif_premium_monthly_v1') === 'true';
      if (!active) return false;
      const verifiedAtRaw = safeStorage.getItem('mustakshif_premium_verified_at_v1');
      if (!verifiedAtRaw) return true;
      const verifiedAt = Number.parseInt(verifiedAtRaw, 10);
      const OFFLINE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;
      return Number.isFinite(verifiedAt) && Date.now() - verifiedAt <= OFFLINE_GRACE_MS;
    } catch (err) {
      warnStorage('hasPremiumMonthly failed', err);
      return false;
    }
  },

  setPremiumMonthly: (active: boolean, meta?: { renewalDate?: string | null; price?: string; period?: string }): void => {
    try {
      safeStorage.setItem('mustakshif_premium_monthly_v1', active ? 'true' : 'false');
      if (active) {
        safeStorage.setItem('mustakshif_premium_verified_at_v1', String(Date.now()));
        const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const defaultRenewal = nextMonth.toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        safeStorage.setItem('mustakshif_premium_renewal_v1', meta?.renewalDate || defaultRenewal);
      } else {
        safeStorage.setItem('mustakshif_premium_verified_at_v1', '');
        safeStorage.setItem('mustakshif_premium_renewal_v1', '');
      }
      if (meta?.price) safeStorage.setItem('mustakshif_premium_price_v1', meta.price);
      if (meta?.period) safeStorage.setItem('mustakshif_premium_period_v1', meta.period);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mustakshif:entitlement-changed', { detail: { active } }));
      }
    } catch (err) {
      warnStorage('setPremiumMonthly failed', err);
    }
  },

  getSubscriptionDetails: (): {
    active: boolean;
    renewalDate: string | null;
    price: string;
    period: string;
    productId: 'premium_monthly';
    isBillingAvailable: boolean;
  } => {
    const active = storage.hasPremiumMonthly();
    const renewalRaw = safeStorage.getItem('mustakshif_premium_renewal_v1');
    const price = safeStorage.getItem('mustakshif_premium_price_v1') || '١٤٫٩٩ ر.س';
    const period = safeStorage.getItem('mustakshif_premium_period_v1') || 'شهرياً';

    let isBillingAvailable = true;
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('billing') === 'unavailable' || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
          isBillingAvailable = false;
        }
        const bridge = (window as unknown as { MustakshifBilling?: { isAvailable?: () => boolean } }).MustakshifBilling;
        if (bridge && typeof bridge.isAvailable === 'function') {
          isBillingAvailable = Boolean(bridge.isAvailable());
        }
      }
    } catch (err) {
      warnStorage('getSubscriptionDetails billing check failed', err);
      isBillingAvailable = true;
    }

    return {
      active,
      renewalDate: active && renewalRaw ? renewalRaw : null,
      price,
      period,
      productId: 'premium_monthly',
      isBillingAvailable,
    };
  },

  getLongFormChapterProgressMap: (): Record<string, number> => {
    const raw = safeStorage.getItem('mustakshif_long_form_chapter_progress_v1');
    return parseNumberMap(raw, {}, 'mustakshif_long_form_chapter_progress_v1');
  },

  setLongFormChapterProgress: (
    entryId: string,
    chapterId: string,
    chapterIndex: number,
    chapterTitle: string,
    progressPercent: number
  ): void => {
    if (!entryId || !chapterId) return;
    try {
      const safePercent = Number.isFinite(progressPercent) ? progressPercent : 0;
      const safeIndex = Number.isFinite(chapterIndex) && chapterIndex >= 0 ? Math.round(chapterIndex) : 0;
      const clamped = Math.min(100, Math.max(0, Math.round(safePercent)));
      const map = storage.getLongFormChapterProgressMap();
      const key = `${entryId}:${chapterId}`;
      map[key] = Math.max(map[key] || 0, clamped);
      safeStorage.setItem('mustakshif_long_form_chapter_progress_v1', JSON.stringify(map));

      const resumeRaw = safeStorage.getItem('mustakshif_long_form_resume_v1');
      const resumeMap = parsePlainObject<Record<string, unknown>>(
        resumeRaw,
        {},
        'mustakshif_long_form_resume_v1'
      );
      resumeMap[entryId] = {
        entryId,
        lastChapterIndex: safeIndex,
        lastChapterId: chapterId,
        lastChapterTitle: chapterTitle || '',
        chapterProgressPercent: clamped,
        updatedAt: Date.now(),
      };
      safeStorage.setItem('mustakshif_long_form_resume_v1', JSON.stringify(resumeMap));
    } catch (err) {
      warnStorage('setLongFormChapterProgress failed', err);
    }
  },

  getLongFormResumeState: (entryId: string): LongFormResumeState | null => {
    if (!entryId) return null;
    const raw = safeStorage.getItem('mustakshif_long_form_resume_v1');
    if (!raw) return null;
    const map = parsePlainObject<Record<string, unknown>>(raw, {}, 'mustakshif_long_form_resume_v1');
    const candidate = map[entryId];
    if (
      isPlainObject(candidate) &&
      typeof candidate.lastChapterIndex === 'number' &&
      Number.isFinite(candidate.lastChapterIndex) &&
      typeof candidate.lastChapterId === 'string'
    ) {
      return {
        entryId: typeof candidate.entryId === 'string' ? candidate.entryId : entryId,
        lastChapterIndex: candidate.lastChapterIndex,
        lastChapterId: candidate.lastChapterId,
        lastChapterTitle: typeof candidate.lastChapterTitle === 'string' ? candidate.lastChapterTitle : '',
        chapterProgressPercent:
          typeof candidate.chapterProgressPercent === 'number' && Number.isFinite(candidate.chapterProgressPercent)
            ? candidate.chapterProgressPercent
            : 0,
        updatedAt:
          typeof candidate.updatedAt === 'number' && Number.isFinite(candidate.updatedAt)
            ? candidate.updatedAt
            : 0,
      };
    }
    return null;
  },
};
