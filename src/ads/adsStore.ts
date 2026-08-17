import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InterstitialCadence, withCompletion, withShown } from './interstitialPolicy';

/**
 * Persists the interstitial cadence (completions since last ad + last-shown time) under
 * its own storage key, separate from the main save blob, so the "every 3rd puzzle"
 * pacing survives app restarts without touching the save schema.
 */
export const ADS_CADENCE_KEY = '@picross-cryptozoology/ads/v1';

interface AdsStore extends InterstitialCadence {
  recordCompletion: () => void;
  recordShown: (now: number) => void;
  hydrate: (c: InterstitialCadence) => void;
}

function persist(c: InterstitialCadence): void {
  void AsyncStorage.setItem(ADS_CADENCE_KEY, JSON.stringify(c)).catch(() => {
    // best-effort; cadence is non-critical
  });
}

export const useAdsStore = create<AdsStore>((set, get) => ({
  completionsSinceShown: 0,
  lastShownAt: null,
  recordCompletion: () => {
    const next = withCompletion(get());
    set(next);
    persist({ completionsSinceShown: next.completionsSinceShown, lastShownAt: next.lastShownAt });
  },
  recordShown: (now) => {
    const next = withShown(get(), now);
    set(next);
    persist(next);
  },
  hydrate: (c) => set({ completionsSinceShown: c.completionsSinceShown, lastShownAt: c.lastShownAt }),
}));

/** Load the persisted cadence into the store (called once at boot). Tolerates bad data. */
export async function loadAdsCadence(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(ADS_CADENCE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.completionsSinceShown === 'number') {
      useAdsStore.getState().hydrate({
        completionsSinceShown: parsed.completionsSinceShown,
        lastShownAt: typeof parsed.lastShownAt === 'number' ? parsed.lastShownAt : null,
      });
    }
  } catch {
    // ignore; start from a fresh cadence
  }
}
