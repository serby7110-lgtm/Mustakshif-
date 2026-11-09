/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  X,
  ChevronLeft,
} from 'lucide-react';

import { AppShell } from './components/layout/AppShell';
import { TabId } from './components/layout/TabBar';
import { Tag, TagVariant } from './components/primitives/Tag';
import { IconButton } from './components/primitives/IconButton';
import { MYTH_ENTRIES, getEntriesByCategory, getEntryById } from './data/seed';
import { MythEntry, MythCategory, CATEGORY_LABELS } from './data/types';
import { storage, FontSize } from './data/storage';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { ar } from './i18n/ar';

import { HomeScreen } from './screens/HomeScreen';
import { ArticleScreen } from './screens/ArticleScreen';
import { CivilizationsScreen } from './screens/CivilizationsScreen';
import { MapScreen } from './screens/MapScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { SplashScreen } from './screens/SplashScreen';
import { MethodologyScreen } from './screens/MethodologyScreen';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './i18n/i18n';

function AppContent() {
  const { theme, isDark, toggleTheme, tokens } = useTheme();

  // Splash Screen shown for ~1.5s on app start
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1' || params.get('nosplash') === '1') {
        return false;
      }
    }
    return true;
  });

  // Persistent States from storage (Bookmarks, History, FontSize, Onboarding)
  const [savedIds, setSavedIds] = useState<string[]>(() => storage.getBookmarks());
  const [historyIds, setHistoryIds] = useState<string[]>(() => storage.getHistory());
  const [fontSize, setFontSize] = useState<FontSize>(() => storage.getFontSize());
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() =>
    storage.getHasCompletedOnboarding()
  );

  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [selectedEntry, setSelectedEntry] = useState<MythEntry | null>(null);
  const [targetChapterIndex, setTargetChapterIndex] = useState<number | undefined>(undefined);
  const [entryStack, setEntryStack] = useState<MythEntry[]>([]);
  const [categoryFilterModal, setCategoryFilterModal] = useState<MythCategory | null>(null);
  const [selectedCivId, setSelectedCivId] = useState<string | null>(null);
  const [showMethodology, setShowMethodology] = useState<boolean>(false);

  // Persist bookmarks
  useEffect(() => {
    storage.setBookmarks(savedIds);
  }, [savedIds]);

  // Persist reading history
  useEffect(() => {
    storage.setHistory(historyIds);
  }, [historyIds]);

  // Persist font size
  useEffect(() => {
    storage.setFontSize(fontSize);
  }, [fontSize]);

  const toggleSave = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [id, ...prev]
    );
  };

  const handleOpenEntry = (entry: MythEntry, chapterIndex?: number) => {
    setHistoryIds((prev) => [entry.id, ...prev.filter((id) => id !== entry.id)]);
    setEntryStack([entry]);
    setSelectedEntry(entry);
    setTargetChapterIndex(chapterIndex);
  };

  const handleSelectRelated = (rel: MythEntry) => {
    setHistoryIds((prev) => [rel.id, ...prev.filter((id) => id !== rel.id)]);
    setEntryStack((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].id === rel.id) {
        return prev;
      }
      const existingIdx = prev.findIndex((item) => item.id === rel.id);
      if (existingIdx !== -1) {
        return prev.slice(0, existingIdx + 1);
      }
      return [...prev, rel];
    });
    setSelectedEntry(rel);
    setTargetChapterIndex(undefined);
  };

  const handleBackFromArticle = () => {
    setTargetChapterIndex(undefined);
    if (entryStack.length > 1) {
      const nextStack = entryStack.slice(0, -1);
      const prevEntry = nextStack[nextStack.length - 1];
      setEntryStack(nextStack);
      setSelectedEntry(prevEntry);
    } else {
      setEntryStack([]);
      setSelectedEntry(null);
    }
  };

  const handleClearHistory = () => {
    setHistoryIds([]);
    storage.setHistory([]);
  };

  const handleFinishOnboarding = () => {
    setHasCompletedOnboarding(true);
    storage.setHasCompletedOnboarding(true);
  };

  const getTagVariant = (tag: string): TagVariant => {
    if (tag === 'رعب') return 'horror';
    if (tag === 'تاريخ') return 'history';
    if (tag === 'خرافي') return 'supernatural';
    return 'neutral';
  };

  // 1. Splash screen shown for ~1.5s on app start
  if (showSplash) {
    return (
      <ErrorBoundary>
        <SplashScreen onFinish={() => setShowSplash(false)} durationMs={1500} />
      </ErrorBoundary>
    );
  }

  // 2. If onboarding hasn't been completed yet, display the 3-slide RTL intro
  if (!hasCompletedOnboarding) {
    return (
      <ErrorBoundary>
        <OnboardingScreen onComplete={handleFinishOnboarding} />
      </ErrorBoundary>
    );
  }

  return (
    <div className={isDark ? 'dark dark-teal' : ''}>
      <AppShell
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedEntry(null);
          setSelectedCivId(null);
          setCategoryFilterModal(null);
          setShowMethodology(false);
          setActiveTab(tab);
        }}
        hideTabBar={Boolean(selectedEntry || showMethodology)}
        hideHeader={Boolean(selectedEntry || showMethodology)}
        headerTitle={selectedEntry ? selectedEntry.name : ar.app.title}
        headerSubtitle={selectedEntry ? selectedEntry.typeLabel : ar.app.subtitle}
        headerTrailing={
          <div className="flex items-center gap-1.5">
            <IconButton
              icon={<Bookmark size={18} className={savedIds.length > 0 ? 'fill-current' : ''} />}
              label={ar.tabs.library}
              variant="surface"
              size="md"
              onClick={() => {
                setSelectedEntry(null);
                setActiveTab('library');
              }}
            />
          </div>
        }
      >
        {/* Category Filter Modal / Bottom Sheet */}
        {categoryFilterModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200">
            <div
              style={{
                backgroundColor: tokens.card,
                borderColor: tokens.border,
              }}
              className="w-full max-w-md rounded-[24px] p-5 shadow-2xl border animate-in slide-in-from-bottom-4 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div
                style={{ borderColor: tokens.borderSubtle }}
                className="flex items-center justify-between pb-3 border-b"
              >
                <div>
                  <h3
                    style={{ color: tokens.deepAccent }}
                    className="font-['Aref_Ruqaa',serif] text-xl font-bold"
                  >
                    {CATEGORY_LABELS[categoryFilterModal]}
                  </h3>
                  <p
                    style={{ color: tokens.textSecondary }}
                    className="text-xs"
                  >
                    {MYTH_ENTRIES.filter((e) => e.category === categoryFilterModal).length} مدخلة موثقة
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCategoryFilterModal(null)}
                  style={{ color: tokens.textSecondary }}
                  className="p-2 rounded-xl hover:opacity-80 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="إغلاق"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2.5">
                {getEntriesByCategory(categoryFilterModal).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setCategoryFilterModal(null);
                      handleOpenEntry(item);
                    }}
                    style={{
                      backgroundColor: tokens.surface,
                      borderColor: tokens.border,
                    }}
                    className="p-3.5 rounded-2xl hover:opacity-90 transition-all border flex items-center justify-between gap-3 cursor-pointer group min-h-[52px]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          style={{ color: tokens.textPrimary }}
                          className="font-['Aref_Ruqaa',serif] text-base font-bold group-hover:opacity-90"
                        >
                          {item.name}
                        </span>
                        <Tag variant={getTagVariant(item.tags[0])} size="sm">
                          {item.tags[0]}
                        </Tag>
                      </div>
                      <p
                        style={{ color: tokens.textSecondary }}
                        className="text-xs line-clamp-1"
                      >
                        {item.summary}
                      </p>
                    </div>
                    <ChevronLeft
                      size={16}
                      style={{ color: tokens.deepAccent }}
                      className="shrink-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* When methodology screen is requested */}
        {showMethodology ? (
          <ErrorBoundary>
            <MethodologyScreen onBack={() => setShowMethodology(false)} />
          </ErrorBoundary>
        ) : selectedEntry ? (
          /* When an article is selected, display ArticleScreen with loop-safe stack */
          <ErrorBoundary>
            <ArticleScreen
              entryId={selectedEntry.id}
              onBack={handleBackFromArticle}
              onSelectRelated={handleSelectRelated}
              isSaved={savedIds.includes(selectedEntry.id)}
              onToggleSave={(id) => toggleSave(id)}
              initialChapterIndex={targetChapterIndex}
              onSelectCivilization={(civId) => {
                setSelectedEntry(null);
                setSelectedCivId(civId);
                setActiveTab('civilizations');
              }}
              onOpenMethodology={() => setShowMethodology(true)}
            />
          </ErrorBoundary>
        ) : (
          <>
            {/* TAB 1: الرئيسية (Home Screen) */}
            {activeTab === 'home' && (
              <ErrorBoundary>
                <HomeScreen
                  onSelectEntry={(entry, chIdx) => handleOpenEntry(entry, chIdx)}
                  onOpenProfile={() => setActiveTab('profile')}
                  onSelectCategoryFilter={(cat) => setCategoryFilterModal(cat)}
                  savedIds={savedIds}
                  onToggleSave={toggleSave}
                  onSelectCivilization={(civId) => {
                    setSelectedCivId(civId);
                    setActiveTab('civilizations');
                  }}
                  onExploreCivilizations={() => {
                    setSelectedCivId(null);
                    setActiveTab('civilizations');
                  }}
                />
              </ErrorBoundary>
            )}

            {/* TAB 2: الحضارات (Civilizations Tab) */}
            {activeTab === 'civilizations' && (
              <ErrorBoundary>
                <CivilizationsScreen
                  selectedCivId={selectedCivId}
                  onClearSelectedCiv={() => setSelectedCivId(null)}
                  onSelectMythId={(mythId) => {
                    const entry = getEntryById(mythId);
                    if (entry) {
                      handleOpenEntry(entry);
                    }
                  }}
                  onOpenMethodology={() => setShowMethodology(true)}
                />
              </ErrorBoundary>
            )}

            {/* TAB 3: الخريطة (Stylized Map Tab) */}
            {activeTab === 'map' && (
              <ErrorBoundary>
                <MapScreen
                  onSelectEntry={(entry) => handleOpenEntry(entry)}
                  onSelectCivilization={(civId) => {
                    setSelectedEntry(null);
                    setSelectedCivId(civId);
                    setActiveTab('civilizations');
                  }}
                />
              </ErrorBoundary>
            )}

            {/* TAB 4: المكتبة (Library Tab) */}
            {activeTab === 'library' && (
              <ErrorBoundary>
                <LibraryScreen
                  savedIds={savedIds}
                  historyIds={historyIds}
                  onSelectEntry={(entry) => handleOpenEntry(entry)}
                  onToggleSave={toggleSave}
                  onClearHistory={handleClearHistory}
                  onExploreClick={() => setActiveTab('home')}
                />
              </ErrorBoundary>
            )}

            {/* TAB 5: حسابي (Profile & Settings Tab) */}
            {activeTab === 'profile' && (
              <ErrorBoundary>
                <ProfileScreen
                  themeMode={theme}
                  onToggleTheme={toggleTheme}
                  fontSize={fontSize}
                  onChangeFontSize={setFontSize}
                  savedCount={savedIds.length}
                  historyCount={historyIds.length}
                  totalMythCount={MYTH_ENTRIES.length}
                  onReplayOnboarding={() => setHasCompletedOnboarding(false)}
                  onOpenMethodology={() => setShowMethodology(true)}
                />
              </ErrorBoundary>
            )}
          </>
        )}
      </AppShell>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <I18nProvider>
          <AppContent />
        </I18nProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
