import { Platform } from 'react-native';
import { AdsBackend } from './types';

/**
 * Native (iOS/Android) ads via `react-native-google-mobile-ads`. The SDK is required
 * LAZILY inside each function so the native module is never loaded on web or under Jest,
 * mirroring the IAP adapter (`purchases.native.ts`). Any SDK/consent error degrades to
 * "no ad shown" rather than throwing into the app.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
function gma(): any {
  return require('react-native-google-mobile-ads');
}

let interstitial: any = null;
let loaded = false;
let nonPersonalizedOnly = false;

/** iOS ATT + Google UMP consent. On any failure we fall back to non-personalized ads. */
async function requestConsentAndTracking(): Promise<void> {
  if (Platform.OS === 'ios') {
    try {
      const { requestTrackingPermissionsAsync } = require('expo-tracking-transparency');
      const { status } = await requestTrackingPermissionsAsync();
      if (status !== 'granted') nonPersonalizedOnly = true;
    } catch {
      nonPersonalizedOnly = true;
    }
  }
  try {
    const { AdsConsent } = gma();
    await AdsConsent.requestInfoUpdate();
    await AdsConsent.loadAndShowConsentFormIfRequired();
    const info = await AdsConsent.getConsentInfo?.();
    if (info && info.canRequestAds === false) nonPersonalizedOnly = true;
  } catch {
    // proceed with non-personalized ads on any consent error
  }
}

function makeInterstitial(adUnitId?: string): any {
  const { InterstitialAd, AdEventType, TestIds } = gma();
  const unit = adUnitId ?? TestIds.INTERSTITIAL;
  const ad = InterstitialAd.createForAdRequest(unit, { requestNonPersonalizedAdsOnly: nonPersonalizedOnly });
  ad.addAdEventListener(AdEventType.LOADED, () => {
    loaded = true;
  });
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    loaded = false;
  });
  ad.addAdEventListener(AdEventType.ERROR, () => {
    loaded = false;
  });
  return ad;
}

export const adsBackend: AdsBackend = {
  async initialize() {
    await requestConsentAndTracking();
    await gma().default().initialize();
  },
  async loadInterstitial(adUnitId?: string) {
    interstitial = makeInterstitial(adUnitId);
    loaded = false;
    try {
      interstitial.load();
    } catch {
      // ignore; showInterstitial() will just return false
    }
  },
  async showInterstitial() {
    if (!interstitial || !loaded) return false;
    try {
      await interstitial.show();
      return true;
    } catch {
      return false;
    }
  },
};
