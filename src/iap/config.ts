import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface RevenueCatConfig {
  iosApiKey?: string;
  androidApiKey?: string;
}

/** Read RevenueCat keys from app.json → expo.extra.revenueCat (empty until set up). */
export function getRevenueCatConfig(): RevenueCatConfig {
  const extra = (Constants.expoConfig?.extra ?? {}) as { revenueCat?: RevenueCatConfig };
  return extra.revenueCat ?? {};
}

/** The API key for the current native platform, or undefined on web / when unset. */
export function getApiKeyForPlatform(): string | undefined {
  const cfg = getRevenueCatConfig();
  if (Platform.OS === 'ios') return cfg.iosApiKey || undefined;
  if (Platform.OS === 'android') return cfg.androidApiKey || undefined;
  return undefined;
}

/**
 * True only when a real RevenueCat key exists for this platform. When false the whole
 * IAP layer runs in mock mode, so the web preview and un-provisioned dev builds keep
 * working (instant local unlock) instead of crashing on the missing native module.
 */
export function isIapConfigured(): boolean {
  const key = getApiKeyForPlatform();
  return typeof key === 'string' && key.length > 0;
}
