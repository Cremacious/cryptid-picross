export type PurchaseOutcome = 'success' | 'cancelled' | 'error';

/** Regions and packs a customer owns, as reported by the store (or the mock). */
export interface OwnedSet {
  regions: string[];
  packs: string[];
}

export interface StorePricing {
  /** Localized price of the single all-access unlock (product `bundle.all`). */
  unlockPrice: string;
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
 * app's region ids. There is a single non-consumable product (`bundleProductId`, i.e.
 * `bundle.all`) that unlocks every region; `allRegionIds` is what it grants.
 */
export interface RegionCatalog {
  allRegionIds: string[];
  bundleProductId: string;
}
