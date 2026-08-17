import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface AdmobExtra {
  iosInterstitialAdUnitId?: string;
  androidInterstitialAdUnitId?: string;
}

/** Read the ad config from app.json → expo.extra.admob (empty until real ad units exist). */
export function getAdmobConfig(): AdmobExtra {
  const extra = (Constants.expoConfig?.extra ?? {}) as { admob?: AdmobExtra };
  return extra.admob ?? {};
}

/**
 * Ads run only on native (iOS/Android). On web, in Jest (node), and during SSR the whole
 * ad layer is a no-op, so the app stays fully runnable without the native SDK.
 */
export function isAdsPlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * The interstitial ad unit id for this platform, or undefined — in which case the native
 * backend falls back to Google's TEST unit id, so dev builds show test ads before real
 * units are provisioned (see issue #9).
 */
export function getInterstitialAdUnitId(): string | undefined {
  const cfg = getAdmobConfig();
  if (Platform.OS === 'ios') return cfg.iosInterstitialAdUnitId || undefined;
  if (Platform.OS === 'android') return cfg.androidInterstitialAdUnitId || undefined;
  return undefined;
}
