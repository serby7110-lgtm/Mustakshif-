/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Mustakshif Firebase Client Integration (Analytics only — zero Authentication / zero OAuth)
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAnalytics,
  isSupported as isAnalyticsSupported,
  logEvent as firebaseLogEvent,
  Analytics,
} from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

let appInstance: FirebaseApp | null = null;
let analyticsInstance: Analytics | null = null;

export type MustakshifAnalyticsEvent =
  | 'premium_banner_view'
  | 'locked_entry_tap'
  | 'paywall_view'
  | 'subscribe_start'
  | 'subscribe_success'
  | 'restore_purchases'
  | 'manage_subscription'
  | 'tip_purchase';

export function getFirebaseApp(): FirebaseApp {
  if (!appInstance) {
    appInstance = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return appInstance;
}

export async function initFirebaseAnalytics(): Promise<Analytics | null> {
  if (analyticsInstance) return analyticsInstance;
  if (typeof window === 'undefined') return null;

  try {
    const supported = await isAnalyticsSupported();
    if (!supported) return null;
    analyticsInstance = getAnalytics(getFirebaseApp());
    return analyticsInstance;
  } catch {
    return null;
  }
}

export function logAnalyticsEvent(
  eventName: MustakshifAnalyticsEvent,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined') return;
  try {
    if (analyticsInstance) {
      firebaseLogEvent(analyticsInstance, eventName, params);
      return;
    }
    void initFirebaseAnalytics().then((instance) => {
      if (instance) {
        try {
          firebaseLogEvent(instance, eventName, params);
        } catch {
          // Ignore analytics errors offline
        }
      }
    });
  } catch {
    // Graceful no-op in tests or offline contexts
  }
}
