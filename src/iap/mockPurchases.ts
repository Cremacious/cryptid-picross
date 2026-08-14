import { PurchaseResult, RegionCatalog, StorePricing } from './types';

/**
 * Mock IAP implementation — used on web, in tests, and on native dev builds that have
 * no RevenueCat key yet. It mirrors the app's original dev behaviour: fixed prices and
 * an instant local unlock, so the whole app is playable without a store account.
 *
 * The native adapter (purchases.native.ts) delegates here whenever IAP is unconfigured.
 */

export const MOCK_PRICING: StorePricing = { unlockPrice: '$4.99' };

export async function configureIap(): Promise<void> {
  // Nothing to configure without a real store.
}

export async function getStorePricing(_args: { bundleProductId: string }): Promise<StorePricing> {
  return MOCK_PRICING;
}

export async function purchaseBundle(args: { catalog: RegionCatalog }): Promise<PurchaseResult> {
  return { outcome: 'success', owned: { regions: [...args.catalog.allRegionIds], packs: ['bundle'] } };
}

export async function restorePurchases(_args: { catalog: RegionCatalog }): Promise<PurchaseResult> {
  // The mock keeps no server-side receipts, so there is nothing to restore.
  return { outcome: 'success', owned: { regions: [], packs: [] } };
}
