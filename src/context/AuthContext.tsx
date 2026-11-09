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
} from '../lib/firebase';
import {
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
} from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  syncBookmarksToCloud: (localBookmarkIds: string[]) => Promise<string[]>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  logOut: async () => {},
  syncBookmarksToCloud: async () => [],
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
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
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
    <AuthContext.Provider value={{ user, loading, signIn, logOut, syncBookmarksToCloud }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
