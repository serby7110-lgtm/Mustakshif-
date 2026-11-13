/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  auth,
  db,
  googleAuthProvider,
  signInWithPopup,
  signOut,
  User,
  validateFirestoreConnection,
  handleFirestoreError,
  OperationType,
  setDriveAccessToken,
  getDriveAccessToken,
  setGoogleAccessToken,
  getGoogleAccessToken,
} from '../lib/firebase';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
} from 'firebase/firestore';
import { sendGmailMessage, SendEmailParams, GmailSendResult } from '../services/gmail';
import {
  createCalendarEvent,
  listUpcomingReadingEvents,
  deleteCalendarEvent,
  CalendarEventInput,
  CalendarEventItem,
  CalendarOperationResult,
} from '../services/calendar';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  syncBookmarksToCloud: (localBookmarkIds: string[]) => Promise<string[]>;
  uploadBookmarksToDrive: (data: unknown) => Promise<{ success: boolean; fileId?: string; error?: string }>;
  sendEmailWithGmail: (params: SendEmailParams) => Promise<GmailSendResult>;
  scheduleReadingSession: (event: CalendarEventInput) => Promise<CalendarOperationResult>;
  getUpcomingReadingEvents: () => Promise<CalendarEventItem[]>;
  cancelReadingSession: (eventId: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  logOut: async () => {},
  getAccessToken: async () => null,
  syncBookmarksToCloud: async () => [],
  uploadBookmarksToDrive: async () => ({ success: false }),
  sendEmailWithGmail: async () => ({ success: false }),
  scheduleReadingSession: async () => ({ success: false }),
  getUpcomingReadingEvents: async () => [],
  cancelReadingSession: async () => ({ success: false }),
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Validate connection on boot
    validateFirestoreConnection().catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Sync or register profile
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          await setDoc(
            userRef,
            {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'مستكشف',
              email: currentUser.email || '',
              photoURL: currentUser.photoURL || '',
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('Could not sync user profile to Firestore:', err);
        }
      } else {
        setGoogleAccessToken(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      setGoogleAccessToken(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    let token = getGoogleAccessToken();
    if (!token) {
      try {
        const result = await signInWithPopup(auth, googleAuthProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          token = credential.accessToken;
          setGoogleAccessToken(token);
        }
      } catch (e) {
        console.warn('Could not obtain Google access token:', e);
      }
    }
    return token;
  };

  const sendEmailWithGmail = async (params: SendEmailParams): Promise<GmailSendResult> => {
    try {
      let token = getGoogleAccessToken();
      if (!token) {
        const result = await signInWithPopup(auth, googleAuthProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (!credential?.accessToken) {
          return { success: false, error: 'تعذر الحصول على تصريح Gmail من حساب Google' };
        }
        token = credential.accessToken;
        setGoogleAccessToken(token);
      }
      return await sendGmailMessage(token, params);
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'تعذر إرسال البريد عبر Gmail',
      };
    }
  };

  const scheduleReadingSession = async (
    event: CalendarEventInput
  ): Promise<CalendarOperationResult> => {
    try {
      let token = getGoogleAccessToken();
      if (!token) {
        const result = await signInWithPopup(auth, googleAuthProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (!credential?.accessToken) {
          return { success: false, error: 'تعذر الحصول على تصريح تقويم Google' };
        }
        token = credential.accessToken;
        setGoogleAccessToken(token);
      }
      return await createCalendarEvent(token, event);
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'تعذر إضافة الموعد إلى تقويم Google',
      };
    }
  };

  const getUpcomingReadingEvents = async (): Promise<CalendarEventItem[]> => {
    try {
      const token = getGoogleAccessToken();
      if (!token) return [];
      return await listUpcomingReadingEvents(token);
    } catch {
      return [];
    }
  };

  const cancelReadingSession = async (
    eventId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      let token = getGoogleAccessToken();
      if (!token) {
        const result = await signInWithPopup(auth, googleAuthProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (!credential?.accessToken) {
          return { success: false, error: 'تعذر الحصول على تصريح تقويم Google' };
        }
        token = credential.accessToken;
        setGoogleAccessToken(token);
      }
      return await deleteCalendarEvent(token, eventId);
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'تعذر حذف الموعد من التقويم',
      };
    }
  };

  const uploadBookmarksToDrive = async (
    data: unknown
  ): Promise<{ success: boolean; fileId?: string; error?: string }> => {
    try {
      let token = getDriveAccessToken();
      if (!token) {
        // Try sign in to obtain access token with Google Drive scopes
        const result = await signInWithPopup(auth, googleAuthProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (!credential?.accessToken) {
          return { success: false, error: 'تعذر الحصول على إذن Google Drive' };
        }
        token = credential.accessToken;
        setDriveAccessToken(token);
      }

      const fileContent = JSON.stringify(data, null, 2);
      const metadata = {
        name: `mustakshif-bookmarks-${new Date().toISOString().slice(0, 10)}.json`,
        mimeType: 'application/json',
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([fileContent], { type: 'application/json' }));

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'فشل الرفع إلى Google Drive');
      }

      const resJson = await res.json();
      return { success: true, fileId: resJson.id };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'خطأ غير متوقع' };
    }
  };

  const syncBookmarksToCloud = async (localBookmarkIds: string[]): Promise<string[]> => {
    if (!user) return localBookmarkIds;
    const bookmarksPath = `users/${user.uid}/bookmarks`;

    try {
      // 1. Fetch remote bookmarks
      const snapshot = await getDocs(collection(db, 'users', user.uid, 'bookmarks'));
      const remoteIds = new Set<string>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.mythId) remoteIds.add(data.mythId);
      });

      // 2. Merge local and remote
      const merged = Array.from(new Set([...localBookmarkIds, ...Array.from(remoteIds)]));

      // 3. Upload missing local to cloud
      for (const id of localBookmarkIds) {
        if (!remoteIds.has(id)) {
          const docRef = doc(db, 'users', user.uid, 'bookmarks', id);
          await setDoc(docRef, {
            mythId: id,
            savedAt: new Date().toISOString(),
            category: 'general',
          });
        }
      }

      return merged;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, bookmarksPath);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        logOut,
        getAccessToken,
        syncBookmarksToCloud,
        uploadBookmarksToDrive,
        sendEmailWithGmail,
        scheduleReadingSession,
        getUpcomingReadingEvents,
        cancelReadingSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

