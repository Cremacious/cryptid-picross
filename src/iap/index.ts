export * from './types';
export { isIapConfigured } from './config';
export { applyOwned } from './syncPurchases';
// Platform-resolved: purchases.ts (web/test/mock) or purchases.native.ts (iOS/Android).
export {
  MOCK_PRICING,
  configureIap,
  getStorePricing,
  purchaseBundle,
  restorePurchases,
} from './purchases';
