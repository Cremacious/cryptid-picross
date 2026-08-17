/**
 * Pure decision logic for when to show an interstitial ad. Kept free of any SDK,
 * storage, or React so it is trivially testable and platform-agnostic.
 *
 * Cadence model: we count completions since the last ad was shown. An ad is eligible
 * once that count reaches `everyNCompletions`, but only if at least `minIntervalMs` has
 * elapsed since the previous ad (so a burst of quick solves can't chain ads back-to-back).
 */
export interface InterstitialCadence {
  /** Puzzle completions since the last interstitial was shown. */
  completionsSinceShown: number;
  /** Unix ms the last interstitial was shown, or null if never. */
  lastShownAt: number | null;
}

export interface InterstitialPolicyOpts {
  now: number;
  everyNCompletions: number;
  minIntervalMs: number;
}

export const DEFAULT_EVERY_N = 3;
export const DEFAULT_MIN_INTERVAL_MS = 120_000; // 2 minutes

/** True when an interstitial is eligible to show for this cadence + timing. */
export function shouldShowInterstitial(c: InterstitialCadence, o: InterstitialPolicyOpts): boolean {
  if (o.everyNCompletions <= 0) return false;
  if (c.completionsSinceShown < o.everyNCompletions) return false;
  if (c.lastShownAt !== null && o.now - c.lastShownAt < o.minIntervalMs) return false;
  return true;
}

/** Cadence after recording one more puzzle completion. */
export function withCompletion(c: InterstitialCadence): InterstitialCadence {
  return { ...c, completionsSinceShown: c.completionsSinceShown + 1 };
}

/** Cadence after an interstitial was actually shown: reset the counter, stamp the time. */
export function withShown(c: InterstitialCadence, now: number): InterstitialCadence {
  return { completionsSinceShown: 0, lastShownAt: now };
}
