/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Storage & Preferences Service (مستكشف)
 * Local persistence for bookmarks, reading history, dark-teal theme, and onboarding.
 * Equivalent to AsyncStorage/SQLite on mobile platforms with graceful fallback.
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

// In-memory fallback for environments without window.localStorage (e.g. Node tests, SSR)
const memoryStore = new Map<string, string>();

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return memoryStore.get(key) || null;
    } catch {
      return memoryStore.get(key) || null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      memoryStore.set(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },
};

export const storage = {
  getBookmarks: (): string[] => {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return data ? JSON.parse(data) : ['al-anqa', 'al-ghul', 'iram-dhat-al-imad'];
    } catch {
      return ['al-anqa', 'al-ghul', 'iram-dhat-al-imad'];
    }
  },

  setBookmarks: (ids: string[]) => {
    try {
      safeStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(ids));
    } catch {}
  },

  getHistory: (): string[] => {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : ['al-anqa', 'al-ghul', 'al-jinn', 'al-lat'];
    } catch {
      return ['al-anqa', 'al-ghul', 'al-jinn', 'al-lat'];
    }
  },

  setHistory: (ids: string[]) => {
    try {
      safeStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(ids));
    } catch {}
  },

  getThemeMode: (): ThemeMode => {
    try {
      const mode = safeStorage.getItem(STORAGE_KEYS.THEME_MODE);
      return mode === 'dark' || mode === 'darkTeal' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  },

  setThemeMode: (mode: ThemeMode) => {
    try {
      safeStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    } catch {}
  },

  getFontSize: (): FontSize => {
    try {
      const size = safeStorage.getItem(STORAGE_KEYS.FONT_SIZE);
      return size === 'sm' || size === 'lg' ? size : 'md';
    } catch {
      return 'md';
    }
  },

  setFontSize: (size: FontSize) => {
    try {
      safeStorage.setItem(STORAGE_KEYS.FONT_SIZE, size);
    } catch {}
  },

  getHasCompletedOnboarding: (): boolean => {
    try {
      return safeStorage.getItem(STORAGE_KEYS.ONBOARDING) === 'true';
    } catch {
      return false;
    }
  },

  setHasCompletedOnboarding: (completed: boolean) => {
    try {
      safeStorage.setItem(STORAGE_KEYS.ONBOARDING, completed ? 'true' : 'false');
    } catch {}
  },

  getLastReadChapter: (): LastReadChapter | null => {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.LAST_READ);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setLastReadChapter: (data: LastReadChapter) => {
    try {
      safeStorage.setItem(STORAGE_KEYS.LAST_READ, JSON.stringify(data));
    } catch {}
  },

  clearLastReadChapter: () => {
    try {
      safeStorage.setItem(STORAGE_KEYS.LAST_READ, '');
    } catch {}
  },

  getFavoriteHooks: (): string[] => {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.STUDIO_FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setFavoriteHooks: (ids: string[]) => {
    try {
      safeStorage.setItem(STORAGE_KEYS.STUDIO_FAVORITES, JSON.stringify(ids));
    } catch {}
  },

  getFavoriteQuotes: (): string[] => {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.FAVORITE_QUOTES);
      return data ? JSON.parse(data) : ['ghul_quote_0', 'anqa_quote_1'];
    } catch {
      return ['ghul_quote_0', 'anqa_quote_1'];
    }
  },

  setFavoriteQuotes: (ids: string[]) => {
    try {
      safeStorage.setItem(STORAGE_KEYS.FAVORITE_QUOTES, JSON.stringify(ids));
    } catch {}
  },

  getAllMythProgress: (): Record<string, number> => {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.MYTH_PROGRESS);
      return data
        ? JSON.parse(data)
        : {
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
    } catch {
      return {
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
    }
  },

  setMythProgress: (mythId: string, progress: number) => {
    try {
      const current = storage.getAllMythProgress();
      current[mythId] = Math.min(100, Math.max(0, Math.round(progress)));
      if (mythId.startsWith('al-')) {
        current[mythId.slice(3)] = current[mythId];
      } else {
        current[`al-${mythId}`] = current[mythId];
      }
      safeStorage.setItem(STORAGE_KEYS.MYTH_PROGRESS, JSON.stringify(current));
    } catch {}
  },

  getLibraryViewMode: (): 'grid' | 'list' => {
    try {
      const mode = safeStorage.getItem(STORAGE_KEYS.LIBRARY_VIEW_MODE);
      return mode === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  },

  setLibraryViewMode: (mode: 'grid' | 'list') => {
    try {
      safeStorage.setItem(STORAGE_KEYS.LIBRARY_VIEW_MODE, mode);
    } catch {}
  },

  getMapSheetsCount: (): number => {
    try {
      const val = safeStorage.getItem(STORAGE_KEYS.MAP_SHEETS_COUNT);
      return val ? parseInt(val, 10) : 10;
    } catch {
      return 10;
    }
  },

  incrementMapSheetsCount: () => {
    try {
      const current = storage.getMapSheetsCount();
      safeStorage.setItem(STORAGE_KEYS.MAP_SHEETS_COUNT, String(current + 1));
    } catch {}
  },

  getDarkReadingMinutes: (): number => {
    try {
      const val = safeStorage.getItem(STORAGE_KEYS.DARK_READING_MINUTES);
      return val ? parseInt(val, 10) : 32;
    } catch {
      return 32;
    }
  },

  addDarkReadingMinutes: (minutes: number = 1) => {
    try {
      const current = storage.getDarkReadingMinutes();
      safeStorage.setItem(STORAGE_KEYS.DARK_READING_MINUTES, String(current + minutes));
    } catch {}
  },

  getReadChapters: (): string[] => {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.READ_CHAPTERS);
      return data ? JSON.parse(data) : ['ghul_0', 'ghul_1', 'irm_0', 'anqa_0'];
    } catch {
      return ['ghul_0', 'ghul_1', 'irm_0', 'anqa_0'];
    }
  },

  markChapterRead: (chapterKey: string) => {
    try {
      const current = storage.getReadChapters();
      if (!current.includes(chapterKey)) {
        current.push(chapterKey);
        safeStorage.setItem(STORAGE_KEYS.READ_CHAPTERS, JSON.stringify(current));
      }
    } catch {}
  },

  getCivSegment: (): 'list' | 'timeline' => {
    try {
      const val = safeStorage.getItem(STORAGE_KEYS.CIV_SEGMENT);
      return val === 'timeline' ? 'timeline' : 'list';
    } catch {
      return 'list';
    }
  },

  setCivSegment: (segment: 'list' | 'timeline') => {
    try {
      safeStorage.setItem(STORAGE_KEYS.CIV_SEGMENT, segment);
    } catch {}
  },

  getDualNarrativeView: (): 'tradition' | 'archaeology' => {
    try {
      const val = safeStorage.getItem(STORAGE_KEYS.DUAL_NARRATIVE_VIEW);
      return val === 'archaeology' ? 'archaeology' : 'tradition';
    } catch {
      return 'tradition';
    }
  },

  setDualNarrativeView: (view: 'tradition' | 'archaeology') => {
    try {
      safeStorage.setItem(STORAGE_KEYS.DUAL_NARRATIVE_VIEW, view);
    } catch {}
  },

  getMythDualNarrativeView: (): 'tradition' | 'analysis' => {
    try {
      const val = safeStorage.getItem(STORAGE_KEYS.MYTH_DUAL_NARRATIVE_VIEW);
      return val === 'analysis' ? 'analysis' : 'tradition';
    } catch {
      return 'tradition';
    }
  },

  setMythDualNarrativeView: (view: 'tradition' | 'analysis') => {
    try {
      safeStorage.setItem(STORAGE_KEYS.MYTH_DUAL_NARRATIVE_VIEW, view);
    } catch {}
  },

  getSentMessagesCount: (): number => {
    try {
      const val = safeStorage.getItem(STORAGE_KEYS.SENT_MESSAGES_COUNT);
      return val ? parseInt(val, 10) || 0 : 0;
    } catch {
      return 0;
    }
  },

  incrementSentMessagesCount: (): number => {
    try {
      const current = storage.getSentMessagesCount();
      const next = current + 1;
      safeStorage.setItem(STORAGE_KEYS.SENT_MESSAGES_COUNT, String(next));
      return next;
    } catch {
      return 1;
    }
  },

  setSentMessagesCount: (count: number): void => {
    try {
      safeStorage.setItem(STORAGE_KEYS.SENT_MESSAGES_COUNT, String(Math.max(0, count)));
    } catch {}
  },
};


