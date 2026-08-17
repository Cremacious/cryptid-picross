/**
 * The surface the app uses to drive ads, so the calling code never touches the SDK
 * directly. `backend.ts` (web/test) resolves to a no-op; `backend.native.ts` resolves to
 * the real AdMob implementation on iOS/Android.
 */
export interface AdsBackend {
  /** One-time init: ATT + UMP consent (native), then the ads SDK. Safe to call once. */
  initialize(): Promise<void>;
  /** Preload an interstitial. `adUnitId` undefined -> the backend uses a test unit. */
  loadInterstitial(adUnitId?: string): Promise<void>;
  /** Show the loaded interstitial. Resolves true only if an ad was actually presented. */
  showInterstitial(): Promise<boolean>;
}
