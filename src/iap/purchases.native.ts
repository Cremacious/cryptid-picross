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
 *   - a single non-consumable product `bundle.all` ($4.99) attached to a "bundle"
 *     entitlement (or an entitlement named after `bundleProductId`) that unlocks every
 *     region. There are no per-region products.
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
  return { regions: [...regions], packs: [...packs] };
}

export async function configureIap(): Promise<void> {
  if (!isIapConfigured() || configured) return;
  const apiKey = getApiKeyForPlatform() as string;
  rc().configure({ apiKey });
  configured = true;
}

export async function getStorePricing(args: { bundleProductId: string }): Promise<StorePricing> {
  if (!isIapConfigured()) return mock.getStorePricing(args);
  try {
    await configureIap();
    const offerings = await rc().getOfferings();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const packages: any[] = offerings?.current?.availablePackages ?? [];
    const pkg = packages.find((p) => p.product?.identifier === args.bundleProductId);
    return { unlockPrice: pkg?.product?.priceString ?? mock.MOCK_PRICING.unlockPrice };
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
