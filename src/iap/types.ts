export type PurchaseOutcome = 'success' | 'cancelled' | 'error';

/** Regions and packs a customer owns, as reported by the store (or the mock). */
export interface OwnedSet {
  regions: string[];
  packs: string[];
}

export interface StorePricing {
  regionPrice: string;
  bundlePrice: string;
}

export interface PurchaseResult {
  outcome: PurchaseOutcome;
  /** Regions/packs now owned — present on `success`, applied into the purchase store. */
  owned?: OwnedSet;
  /** Human-readable reason — present on `error`. */
  message?: string;
}

/**
 * Enough context for the IAP layer to map a store purchase / entitlements back to the
 * app's region ids. `allRegionIds` lets a bundle grant everything and lets us translate
 * RevenueCat's active entitlements into owned regions; `bundleProductId` identifies the
 * all-regions product in the store.
 */
export interface RegionCatalog {
  allRegionIds: string[];
  /** region id -> its store product identifier (region.iapProductId). */
  regionProductIds: Record<string, string>;
  bundleProductId: string;
}
