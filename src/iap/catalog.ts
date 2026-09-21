import { RegionCatalog } from './types';

/**
 * The single all-access non-consumable. This string must match the Product ID in App Store
 * Connect character-for-character — a mismatch means purchases succeed and nothing unlocks.
 * Apple product ids are permanent and cannot be renamed after creation.
 */
export const BUNDLE_PRODUCT_ID = 'bundle.all';

/**
 * Build the catalog the IAP layer uses to map an entitlement back to region ids. Region ids
 * are passed in rather than imported so this module stays free of any `@/content` dependency.
 */
export function buildRegionCatalog(allRegionIds: string[]): RegionCatalog {
  return { allRegionIds, bundleProductId: BUNDLE_PRODUCT_ID };
}
