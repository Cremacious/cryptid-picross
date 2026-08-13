import {
  MOCK_PRICING,
  getStorePricing,
  purchaseRegion,
  purchaseBundle,
  restorePurchases,
} from '@/iap/mockPurchases';
import type { RegionCatalog } from '@/iap/types';

const catalog: RegionCatalog = {
  allRegionIds: ['pnw', 'appalachia', 'superior'],
  regionProductIds: { appalachia: 'region.appalachia' },
  bundleProductId: 'bundle.all',
};

describe('mock IAP', () => {
  it('returns the fixed placeholder pricing', async () => {
    expect(await getStorePricing({ bundleProductId: 'bundle.all' })).toEqual(MOCK_PRICING);
  });

  it('grants exactly the purchased region', async () => {
    const r = await purchaseRegion({ regionId: 'appalachia', productId: 'region.appalachia', catalog });
    expect(r.outcome).toBe('success');
    expect(r.owned).toEqual({ regions: ['appalachia'], packs: [] });
  });

  it('grants every region plus the bundle pack on a bundle purchase', async () => {
    const r = await purchaseBundle({ catalog });
    expect(r.outcome).toBe('success');
    expect(r.owned?.regions).toEqual(catalog.allRegionIds);
    expect(r.owned?.packs).toContain('bundle');
  });

  it('restores successfully with nothing to grant', async () => {
    const r = await restorePurchases({ catalog });
    expect(r.outcome).toBe('success');
    expect(r.owned).toEqual({ regions: [], packs: [] });
  });
});
