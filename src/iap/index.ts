export * from './types';
export { BUNDLE_PRODUCT_ID, buildRegionCatalog } from './catalog';
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
