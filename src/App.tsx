/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import {
  Bookmark,
  X,
  ChevronLeft,
} from 'lucide-react';

import { AppShell } from './components/layout/AppShell';
import { TabId } from './components/layout/TabBar';
import { Tag, TagVariant } from './components/primitives/Tag';
import { IconButton } from './components/primitives/IconButton';
import { MYTH_ENTRIES, getAllEntries, getEntriesByCategory, getEntryById } from './data/seed';
import { MythEntry, MythCategory, CATEGORY_LABELS } from './data/types';
import { AzamaEntry } from './data/azamaTypes';
import { storage, FontSize } from './data/storage';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { I18nProvider, useI18n } from './i18n/i18n';
import { getLocalizedEntry, localizeTag } from './content';
import { applyTypographyToDocument, FONT_SETTINGS_EVENT } from './utils/typography';

import { HomeScreen } from './screens/HomeScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { SplashScreen } from './screens/SplashScreen';
import { LockedHeroImage, PremiumPill } from './components/primitives/LockedMediaBadges';
import { logAnalyticsEvent } from './lib/firebase';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const ArticleScreen = lazy(() => import('./screens/ArticleScreen'));
const AzamaDetailScreen = lazy(() =>
  import('./screens/AzamaDetailScreen').then((m) => ({ default: m.AzamaDetailScreen }))
);
const CivilizationsScreen = lazy(() =>
  import('./screens/CivilizationsScreen').then((m) => ({ default: m.CivilizationsScreen }))
);
const MapScreen = lazy(() => import('./screens/MapScreen'));
const LibraryScreen = lazy(() => import('./screens/LibraryScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const MethodologyScreen = lazy(() => import('./screens/MethodologyScreen'));
const SubscriptionScreen = lazy(() => import('./screens/SubscriptionScreen'));
const DebugScreen = lazy(() => import('./screens/DebugScreen'));
const TagScreen = lazy(() =>
  import('./screens/TagScreen').then((m) => ({ default: m.TagScreen }))
);
const CreaturesScreen = lazy(() =>
  import('./screens/CreaturesScreen').then((m) => ({ default: m.CreaturesScreen }))
);

function isDebugLocation(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/+$/, '');
  return path === '/debug' || window.location.hash === '#/debug';
}

function AppContent() {
  const { theme, isDark, toggleTheme, tokens } = useTheme();
  const { t, lang, dir } = useI18n();

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
  const [savedIds, setSavedIds] = useState<string[]>(() => storage.getBookmarks() ?? []);
  const [historyIds, setHistoryIds] = useState<string[]>(() => storage.getHistory() ?? []);
  const [fontSize, setFontSize] = useState<FontSize>(() => storage.getFontSize());
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() =>
    storage.getHasCompletedOnboarding()
  );

  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [selectedEntry, setSelectedEntry] = useState<MythEntry | null>(null);
  const [targetChapterIndex, setTargetChapterIndex] = useState<number | undefined>(undefined);
  const [entryStack, setEntryStack] = useState<MythEntry[]>([]);
  const [selectedAzamaEntry, setSelectedAzamaEntry] = useState<AzamaEntry | null>(null);
  const [azamaStack, setAzamaStack] = useState<AzamaEntry[]>([]);
  const [civSegmentOverride, setCivSegmentOverride] = useState<{
    segment: 'list' | 'timeline' | 'azama';
    nonce: number;
  } | null>(null);
  const [categoryFilterModal, setCategoryFilterModal] = useState<MythCategory | null>(null);
  const [selectedCivId, setSelectedCivId] = useState<string | null>(null);
  const [showMethodology, setShowMethodology] = useState<boolean>(false);
  const [showSubscription, setShowSubscription] = useState<boolean>(false);
  const [showDebug, setShowDebug] = useState<boolean>(() => isDebugLocation());
  const [activeTagKey, setActiveTagKey] = useState<string | null>(null);
  const [showCreatures, setShowCreatures] = useState<boolean>(false);
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(null);
  const [isPremiumActive, setIsPremiumActive] = useState<boolean>(() => storage.hasPremiumMonthly());
  const logoTapCountRef = useRef<number>(0);
  const logoTapTimerRef = useRef<number | null>(null);

  useEffect(() => {
    applyTypographyToDocument({
      fontSize: storage.getFontSize(),
      arabicFont: storage.getArabicFont(),
      englishFont: storage.getEnglishFont(),
    });
    const syncEntitlement = () => {
      setIsPremiumActive(storage.hasPremiumMonthly());
    };
    const syncDebugRoute = () => {
      setShowDebug(isDebugLocation());
    };
    const syncFontSettings = () => {
      setFontSize(storage.getFontSize());
    };
    window.addEventListener('mustakshif:entitlement-changed', syncEntitlement);
    window.addEventListener('popstate', syncDebugRoute);
    window.addEventListener('hashchange', syncDebugRoute);
    window.addEventListener(FONT_SETTINGS_EVENT, syncFontSettings);
    return () => {
      window.removeEventListener('mustakshif:entitlement-changed', syncEntitlement);
      window.removeEventListener('popstate', syncDebugRoute);
      window.removeEventListener('hashchange', syncDebugRoute);
      window.removeEventListener(FONT_SETTINGS_EVENT, syncFontSettings);
      if (logoTapTimerRef.current != null) {
        window.clearTimeout(logoTapTimerRef.current);
      }
    };
  }, []);

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
    setSavedIds((prev) => {
      const list = prev ?? [];
      return list.includes(id) ? list.filter((item) => item !== id) : [id, ...list];
    });
  };

  const handleOpenEntry = (entry: MythEntry, chapterIndex?: number) => {
    if (!entry) return;
    setActiveTagKey(null);
    setShowCreatures(false);
    setSelectedCreatureId(null);
    if (entry.isPremium && !isPremiumActive) {
      logAnalyticsEvent('locked_entry_tap', { entry_id: entry.id });
    }
    setHistoryIds((prev) => {
      const list = prev ?? [];
      return [entry.id, ...list.filter((id) => id !== entry.id)];
    });
    setEntryStack([entry]);
    setSelectedEntry(entry);
    setTargetChapterIndex(chapterIndex);
  };

  const handleOpenTag = (tagKey: string) => {
    if (!tagKey) return;
    setShowCreatures(false);
    setSelectedCreatureId(null);
    setActiveTagKey(tagKey);
  };

  const handleOpenCreatures = (creatureId?: string) => {
    setActiveTagKey(null);
    setSelectedCreatureId(creatureId ?? null);
    setShowCreatures(true);
  };

  const handleOpenStoryById = (storyId: string) => {
    const resolved = getEntryById(storyId);
    if (resolved) {
      handleOpenEntry(resolved);
    }
  };

  const handleSelectRelated = (rel: MythEntry) => {
    if (!rel) return;
    setHistoryIds((prev) => {
      const list = prev ?? [];
      return [rel.id, ...list.filter((id) => id !== rel.id)];
    });
    setEntryStack((prev) => {
      const list = prev ?? [];
      if (list.length > 0 && list[list.length - 1]?.id === rel.id) {
        return list;
      }
      const existingIdx = list.findIndex((item) => item.id === rel.id);
      if (existingIdx !== -1) {
        return list.slice(0, existingIdx + 1);
      }
      return [...list, rel];
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

  const handleOpenAzamaEntry = (entry: AzamaEntry) => {
    if (!entry) return;
    setAzamaStack([entry]);
    setSelectedAzamaEntry(entry);
  };

  const handleSelectRelatedAzama = (rel: AzamaEntry) => {
    if (!rel) return;
    setAzamaStack((prev) => {
      const list = prev ?? [];
      if (list.length > 0 && list[list.length - 1]?.id === rel.id) {
        return list;
      }
      const existingIdx = list.findIndex((item) => item.id === rel.id);
      if (existingIdx !== -1) {
        return list.slice(0, existingIdx + 1);
      }
      return [...list, rel];
    });
    setSelectedAzamaEntry(rel);
  };

  const handleBackFromAzama = () => {
    if (azamaStack.length > 1) {
      const nextStack = azamaStack.slice(0, -1);
      const prevEntry = nextStack[nextStack.length - 1];
      setAzamaStack(nextStack);
      setSelectedAzamaEntry(prevEntry);
    } else {
      setAzamaStack([]);
      setSelectedAzamaEntry(null);
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

  const handleLogoTap = () => {
    if (logoTapTimerRef.current != null) {
      window.clearTimeout(logoTapTimerRef.current);
    }
    logoTapCountRef.current += 1;
    if (logoTapCountRef.current >= 5) {
      logoTapCountRef.current = 0;
      logoTapTimerRef.current = null;
      setShowDebug(true);
      return;
    }
    logoTapTimerRef.current = window.setTimeout(() => {
      logoTapCountRef.current = 0;
      logoTapTimerRef.current = null;
    }, 2500);
  };

  const handleCloseDebug = () => {
    setShowDebug(false);
    if (typeof window !== 'undefined' && isDebugLocation()) {
      const nextUrl = `/${window.location.search || ''}`;
      window.history.replaceState(null, '', nextUrl);
    }
  };

  // 0. Hidden Diagnostics / Error Log page (/debug or 5 taps on the logo)
  if (showDebug) {
    return (
      <div className={isDark ? 'dark dark-teal' : ''}>
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center p-6 text-sm font-bold opacity-75">
                {t('common.loading')}
              </div>
            }
          >
            <DebugScreen onBack={handleCloseDebug} />
          </Suspense>
        </ErrorBoundary>
      </div>
    );
  }

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

  const localizedSelected = selectedEntry ? getLocalizedEntry(selectedEntry, lang) : null;

  return (
    <div className={isDark ? 'dark dark-teal' : ''}>
      <AppShell
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedEntry(null);
          setEntryStack([]);
          setTargetChapterIndex(undefined);
          setSelectedAzamaEntry(null);
          setAzamaStack([]);
          setSelectedCivId(null);
          setCivSegmentOverride(null);
          setCategoryFilterModal(null);
          setShowMethodology(false);
          setShowSubscription(false);
          setActiveTagKey(null);
          setShowCreatures(false);
          setSelectedCreatureId(null);
          setActiveTab(tab);
        }}
        hideTabBar={Boolean(
          selectedEntry ||
            selectedAzamaEntry ||
            showMethodology ||
            showSubscription ||
            activeTagKey ||
            showCreatures
        )}
        hideHeader={Boolean(
          selectedEntry ||
            selectedAzamaEntry ||
            showMethodology ||
            showSubscription ||
            activeTagKey ||
            showCreatures
        )}
        onLogoTap={handleLogoTap}
        headerTitle={selectedAzamaEntry?.title || localizedSelected?.name || t('app.title')}
        headerSubtitle={localizedSelected?.typeLabel || t('app.subtitle')}
        headerTrailing={
          <div className="flex items-center gap-1.5">
            <IconButton
              icon={<Bookmark size={18} className={(savedIds ?? []).length > 0 ? 'fill-current' : ''} />}
              label={t('nav.library')}
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
        {categoryFilterModal && (() => {
          const modalEntries = (getEntriesByCategory(categoryFilterModal) ?? []).filter(Boolean);
          const documentedCount = modalEntries.filter(
            (e) =>
              (Array.isArray(e?.sources) && e.sources.length > 0) ||
              (Array.isArray(e?.evidenceLabels) && e.evidenceLabels.length > 0)
          ).length;

          return (
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
                      {t(`cat.${categoryFilterModal}`, { defaultValue: CATEGORY_LABELS[categoryFilterModal] })}
                    </h3>
                    <p
                      style={{ color: tokens.textSecondary }}
                      className="text-xs"
                    >
                      {t('home.documentedCount', { count: documentedCount })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCategoryFilterModal(null)}
                    style={{ color: tokens.textSecondary }}
                    className="p-2 rounded-xl hover:opacity-80 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={t('common.close')}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {modalEntries.map((rawItem) => {
                    const item = getLocalizedEntry(rawItem, lang);
                    const isLocked = Boolean(item?.isPremium) && !isPremiumActive;
                    return (
                      <div
                        key={rawItem.id}
                        onClick={() => {
                          setCategoryFilterModal(null);
                          handleOpenEntry(rawItem);
                        }}
                        style={{
                          backgroundColor: tokens.surface,
                          borderColor: tokens.border,
                        }}
                        className="p-3.5 rounded-2xl hover:opacity-90 transition-all border flex items-center justify-between gap-3 cursor-pointer group min-h-[52px]"
                      >
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border" style={{ borderColor: tokens.borderSubtle }}>
                          <LockedHeroImage
                            src={item?.heroImage}
                            alt={item?.name ?? ''}
                            isLocked={isLocked}
                            compact
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span
                              style={{ color: tokens.textPrimary }}
                              className="font-['Aref_Ruqaa',serif] text-base font-bold group-hover:opacity-90"
                            >
                              {item?.name ?? ''}
                            </span>
                            {item?.isLongForm && (
                              <span
                                style={{
                                  backgroundColor: tokens.primaryMint,
                                  color: '#0E5C4D',
                                }}
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                              >
                                {t('longForm.longPill') || 'طويلة'}
                              </span>
                            )}
                            {item?.isPremium && <PremiumPill />}
                            {Array.isArray(item?.tags) && item.tags[0] && (
                              <Tag variant={getTagVariant(item.tags[0])} size="sm">
                                {localizeTag(item.tags[0], lang)}
                              </Tag>
                            )}
                          </div>
                          <p
                            style={{ color: tokens.textSecondary }}
                            className="text-xs line-clamp-1"
                          >
                            {item?.summary ?? ''}
                          </p>
                        </div>
                        <ChevronLeft
                          size={16}
                          style={{ color: tokens.deepAccent }}
                          className={`shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* When subscription screen is requested */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16 text-sm font-bold opacity-70">
              {t('common.loading')}
            </div>
          }
        >
        {showSubscription ? (
          <ErrorBoundary>
            <SubscriptionScreen
              onBack={() => setShowSubscription(false)}
              isPremiumActive={isPremiumActive}
              onEntitlementUpdated={(active) => setIsPremiumActive(active)}
            />
          </ErrorBoundary>
        ) : showMethodology ? (
          <ErrorBoundary>
            <MethodologyScreen onBack={() => setShowMethodology(false)} />
          </ErrorBoundary>
        ) : activeTagKey ? (
          <ErrorBoundary>
            <TagScreen
              tagKey={activeTagKey}
              onBack={() => setActiveTagKey(null)}
              onSelectStoryById={handleOpenStoryById}
            />
          </ErrorBoundary>
        ) : showCreatures ? (
          <ErrorBoundary>
            <CreaturesScreen
              initialCreatureId={selectedCreatureId}
              onBack={() => {
                setShowCreatures(false);
                setSelectedCreatureId(null);
              }}
              onSelectStoryById={handleOpenStoryById}
              onSelectEntry={(entry) => handleOpenEntry(entry)}
            />
          </ErrorBoundary>
        ) : selectedEntry ? (
          /* When an article is selected, display ArticleScreen with loop-safe stack */
          <ErrorBoundary>
            <ArticleScreen
              entryId={selectedEntry.id}
              onBack={handleBackFromArticle}
              onSelectRelated={handleSelectRelated}
              isSaved={(savedIds ?? []).includes(selectedEntry.id)}
              onToggleSave={(id) => toggleSave(id)}
              initialChapterIndex={targetChapterIndex}
              onSelectCivilization={(civId) => {
                setSelectedEntry(null);
                setSelectedCivId(civId);
                setCivSegmentOverride({ segment: 'list', nonce: Date.now() });
                setActiveTab('civilizations');
              }}
              onOpenMethodology={() => setShowMethodology(true)}
              isPremiumActive={isPremiumActive}
              onPremiumChange={(active) => setIsPremiumActive(active)}
              onOpenSubscription={() => {
                setSelectedEntry(null);
                setShowSubscription(true);
              }}
              onOpenTag={handleOpenTag}
              onOpenCreature={handleOpenCreatures}
            />
          </ErrorBoundary>
        ) : selectedAzamaEntry ? (
          <ErrorBoundary>
            <AzamaDetailScreen
              entry={selectedAzamaEntry}
              onBack={handleBackFromAzama}
              onSelectRelated={handleSelectRelatedAzama}
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
                    setCivSegmentOverride({ segment: 'list', nonce: Date.now() });
                    setActiveTab('civilizations');
                  }}
                  onExploreCivilizations={() => {
                    setSelectedCivId(null);
                    setCivSegmentOverride({ segment: 'list', nonce: Date.now() });
                    setActiveTab('civilizations');
                  }}
                  onOpenAzama={() => {
                    setSelectedCivId(null);
                    setCivSegmentOverride({ segment: 'azama', nonce: Date.now() });
                    setActiveTab('civilizations');
                  }}
                  isPremiumActive={isPremiumActive}
                  onOpenSubscription={() => setShowSubscription(true)}
                  onOpenTag={handleOpenTag}
                  onOpenCreatures={() => handleOpenCreatures()}
                />
              </ErrorBoundary>
            )}

            {/* TAB 2: الحضارات (Civilizations Tab) */}
            {activeTab === 'civilizations' && (
              <ErrorBoundary>
                <CivilizationsScreen
                  selectedCivId={selectedCivId}
                  onClearSelectedCiv={() => setSelectedCivId(null)}
                  onSelectMythId={(mythId: string) => {
                    const entry = getEntryById(mythId);
                    if (entry) {
                      handleOpenEntry(entry);
                    }
                  }}
                  onOpenMethodology={() => setShowMethodology(true)}
                  initialSegment={civSegmentOverride?.segment}
                  segmentTriggerNonce={civSegmentOverride?.nonce}
                  onSelectAzamaEntry={handleOpenAzamaEntry}
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
                    setCivSegmentOverride({ segment: 'list', nonce: Date.now() });
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
                  isPremiumActive={isPremiumActive}
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
                  savedCount={(savedIds ?? []).length}
                  historyCount={(historyIds ?? []).length}
                  totalMythCount={(getAllEntries() ?? []).length}
                  onReplayOnboarding={() => setHasCompletedOnboarding(false)}
                  onOpenMethodology={() => setShowMethodology(true)}
                  isPremiumActive={isPremiumActive}
                  onOpenSubscription={() => setShowSubscription(true)}
                />
              </ErrorBoundary>
            )}
          </>
        )}
        </Suspense>
      </AppShell>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <AppContent />
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
