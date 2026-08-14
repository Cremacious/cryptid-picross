import {
  MOCK_PRICING,
  getStorePricing,
  purchaseBundle,
  restorePurchases,
} from '@/iap/mockPurchases';
import type { RegionCatalog } from '@/iap/types';

const catalog: RegionCatalog = {
  allRegionIds: ['pnw', 'appalachia', 'greatlakes'],
  bundleProductId: 'bundle.all',
};

describe('mock IAP', () => {
  it('returns the fixed placeholder pricing ($4.99 unlock)', async () => {
    expect(await getStorePricing({ bundleProductId: 'bundle.all' })).toEqual(MOCK_PRICING);
    expect(MOCK_PRICING.unlockPrice).toBe('$4.99');
  });

  it('grants every region plus the bundle pack on the unlock purchase', async () => {
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
