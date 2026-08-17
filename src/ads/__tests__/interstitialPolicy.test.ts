import {
  shouldShowInterstitial,
  withCompletion,
  withShown,
  DEFAULT_EVERY_N,
  DEFAULT_MIN_INTERVAL_MS,
} from '@/ads/interstitialPolicy';

const opts = (now: number) => ({
  now,
  everyNCompletions: DEFAULT_EVERY_N,
  minIntervalMs: DEFAULT_MIN_INTERVAL_MS,
});

describe('interstitial policy', () => {
  it('does not show before N completions', () => {
    expect(shouldShowInterstitial({ completionsSinceShown: 0, lastShownAt: null }, opts(0))).toBe(false);
    expect(shouldShowInterstitial({ completionsSinceShown: 2, lastShownAt: null }, opts(0))).toBe(false);
  });

  it('shows on the Nth completion when no ad has shown yet', () => {
    expect(shouldShowInterstitial({ completionsSinceShown: 3, lastShownAt: null }, opts(0))).toBe(true);
  });

  it('suppresses a second ad inside the minimum interval', () => {
    const c = { completionsSinceShown: 3, lastShownAt: 1_000 };
    expect(shouldShowInterstitial(c, opts(1_000 + DEFAULT_MIN_INTERVAL_MS - 1))).toBe(false);
    expect(shouldShowInterstitial(c, opts(1_000 + DEFAULT_MIN_INTERVAL_MS))).toBe(true);
  });

  it('never shows when everyN is non-positive', () => {
    expect(
      shouldShowInterstitial({ completionsSinceShown: 99, lastShownAt: null }, { now: 0, everyNCompletions: 0, minIntervalMs: 0 }),
    ).toBe(false);
  });

  it('withCompletion increments the counter; withShown resets and stamps time', () => {
    let c = { completionsSinceShown: 0, lastShownAt: null as number | null };
    c = withCompletion(c);
    c = withCompletion(c);
    expect(c.completionsSinceShown).toBe(2);
    c = withShown(c, 5_000);
    expect(c).toEqual({ completionsSinceShown: 0, lastShownAt: 5_000 });
  });

  it('models the full every-3rd cadence over a run of solves', () => {
    let c = { completionsSinceShown: 0, lastShownAt: null as number | null };
    const shows: number[] = [];
    // 7 solves at 3-minute spacing (well past the interval), expect ads on #3 and #6.
    for (let i = 1; i <= 7; i += 1) {
      const now = i * 180_000;
      c = withCompletion(c);
      if (shouldShowInterstitial(c, opts(now))) {
        shows.push(i);
        c = withShown(c, now);
      }
    }
    expect(shows).toEqual([3, 6]);
  });
});
