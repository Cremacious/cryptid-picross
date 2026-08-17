import { usePurchaseStore } from '@/state';
import { adsBackend } from './backend';
import { useAdsStore, loadAdsCadence } from './adsStore';
import { isAdsPlatform, getInterstitialAdUnitId } from './config';
import {
  shouldShowInterstitial,
  DEFAULT_EVERY_N,
  DEFAULT_MIN_INTERVAL_MS,
} from './interstitialPolicy';

export { isAdsPlatform } from './config';

let initialized = false;

/**
 * Boot the ad layer: load the saved cadence, and — for non-paying players on native —
 * run consent + init the SDK and preload the first interstitial. No-op on web/Jest and
 * for anyone who owns the ad-free unlock.
 */
export async function initAds(): Promise<void> {
  if (initialized) return;
  initialized = true;
  await loadAdsCadence();
  if (!isAdsPlatform()) return;
  if (usePurchaseStore.getState().adsRemoved()) return;
  await adsBackend.initialize();
  await adsBackend.loadInterstitial(getInterstitialAdUnitId());
}

/**
 * Call when a player leaves the reveal after solving a puzzle. Counts the completion and,
 * if the cadence + timing allow and an ad is loaded, shows an interstitial (then preloads
 * the next). Never shows for ad-free (paid) players or off native. Resolves after the ad
 * closes so the caller can navigate right after.
 */
export async function maybeShowInterstitialAfterSolve(now: number = Date.now()): Promise<void> {
  if (!isAdsPlatform()) return;
  if (usePurchaseStore.getState().adsRemoved()) return;

  useAdsStore.getState().recordCompletion();
  const { completionsSinceShown, lastShownAt } = useAdsStore.getState();
  const eligible = shouldShowInterstitial(
    { completionsSinceShown, lastShownAt },
    { now, everyNCompletions: DEFAULT_EVERY_N, minIntervalMs: DEFAULT_MIN_INTERVAL_MS },
  );
  if (!eligible) return;

  const shown = await adsBackend.showInterstitial();
  if (shown) {
    useAdsStore.getState().recordShown(now);
    await adsBackend.loadInterstitial(getInterstitialAdUnitId());
  }
}
