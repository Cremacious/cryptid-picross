import { OwnedSet, PurchaseResult, RegionCatalog, StorePricing } from './types';
import { getApiKeyForPlatform, isIapConfigured } from './config';
import * as mock from './mockPurchases';

/**
 * Native (iOS/Android) IAP via RevenueCat. `react-native-purchases` is required LAZILY
 * inside each function so the native module is never loaded on web or under Jest, and so
 * a dev build without a configured key never touches it — those cases fall back to the
 * mock, keeping the app fully functional.
 *
 * Dashboard convention this expects (documented in docs/EAS_BUILD.md):
 *   - one RevenueCat entitlement per region, its identifier == the region id
 *     (or == the region's product id), unlocked by that region's product;
 *   - a "bundle" entitlement (or an entitlement named after `bundleProductId`) that the
 *     all-regions product unlocks, which grants every region.
 */

let configured = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rc(): any {
  return require('react-native-purchases').default;
}

export const MOCK_PRICING = mock.MOCK_PRICING;

function ownedFromCustomerInfo(customerInfo: unknown, catalog: RegionCatalog): OwnedSet {
  const info = customerInfo as { entitlements?: { active?: Record<string, unknown> } };
  const activeIds = new Set(Object.keys(info?.entitlements?.active ?? {}));
  const regions = new Set<string>();
  const packs = new Set<string>();

  if (activeIds.has('bundle') || activeIds.has(catalog.bundleProductId)) {
    catalog.allRegionIds.forEach((r) => regions.add(r));
    packs.add('bundle');
  }
  for (const regionId of catalog.allRegionIds) {
    const productId = catalog.regionProductIds[regionId];
    if (activeIds.has(regionId) || (productId && activeIds.has(productId))) regions.add(regionId);
  }
  return { regions: [...regions], packs: [...packs] };
}

export async function configureIap(): Promise<void> {
  if (!isIapConfigured() || configured) return;
  const apiKey = getApiKeyForPlatform() as string;
  rc().configure({ apiKey });
  configured = true;
}

export async function getStorePricing(args: {
  regionProductId?: string;
  bundleProductId: string;
}): Promise<StorePricing> {
  if (!isIapConfigured()) return mock.getStorePricing(args);
  try {
    await configureIap();
    const offerings = await rc().getOfferings();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const packages: any[] = offerings?.current?.availablePackages ?? [];
    const find = (productId?: string) =>
      productId ? packages.find((p) => p.product?.identifier === productId) : undefined;
    return {
      regionPrice: find(args.regionProductId)?.product?.priceString ?? mock.MOCK_PRICING.regionPrice,
      bundlePrice: find(args.bundleProductId)?.product?.priceString ?? mock.MOCK_PRICING.bundlePrice,
    };
  } catch {
    return mock.getStorePricing(args);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function purchaseByProductId(productId: string, catalog: RegionCatalog): Promise<PurchaseResult> {
  await configureIap();
  const offerings = await rc().getOfferings();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const packages: any[] = offerings?.current?.availablePackages ?? [];
  const pkg = packages.find((p) => p.product?.identifier === productId);
  if (!pkg) return { outcome: 'error', message: 'That item is not available right now.' };

  try {
    const { customerInfo } = await rc().purchasePackage(pkg);
    return { outcome: 'success', owned: ownedFromCustomerInfo(customerInfo, catalog) };
  } catch (e) {
    // RevenueCat throws with userCancelled === true when the shopper backs out.
    if ((e as { userCancelled?: boolean })?.userCancelled) return { outcome: 'cancelled' };
    return { outcome: 'error', message: (e as { message?: string })?.message ?? 'Purchase failed.' };
  }
}

export async function purchaseRegion(args: {
  regionId: string;
  productId: string;
  catalog: RegionCatalog;
}): Promise<PurchaseResult> {
  if (!isIapConfigured()) return mock.purchaseRegion(args);
  return purchaseByProductId(args.productId, args.catalog);
}

export async function purchaseBundle(args: { catalog: RegionCatalog }): Promise<PurchaseResult> {
  if (!isIapConfigured()) return mock.purchaseBundle(args);
  return purchaseByProductId(args.catalog.bundleProductId, args.catalog);
}

export async function restorePurchases(args: { catalog: RegionCatalog }): Promise<PurchaseResult> {
  if (!isIapConfigured()) return mock.restorePurchases(args);
  try {
    await configureIap();
    const customerInfo = await rc().restorePurchases();
    return { outcome: 'success', owned: ownedFromCustomerInfo(customerInfo, args.catalog) };
  } catch (e) {
    return { outcome: 'error', message: (e as { message?: string })?.message ?? 'Restore failed.' };
  }
}
