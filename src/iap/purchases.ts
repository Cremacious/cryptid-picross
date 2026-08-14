// Default / web / test implementation: the mock. Metro resolves this file on web and
// Jest picks it up too, so neither ever loads the native `react-native-purchases`
// module. Native platforms resolve `purchases.native.ts` instead.
export { MOCK_PRICING, configureIap, getStorePricing, purchaseBundle, restorePurchases } from './mockPurchases';
