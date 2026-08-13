import { applyOwned } from '@/iap/syncPurchases';
import { usePurchaseStore } from '@/state';

beforeEach(() => usePurchaseStore.getState().clearAll());

describe('applyOwned', () => {
  it('grants regions and packs into the purchase store', () => {
    applyOwned({ regions: ['appalachia', 'greatlakes'], packs: ['bundle'] });
    const s = usePurchaseStore.getState();
    expect(s.ownsRegion('appalachia')).toBe(true);
    expect(s.ownsRegion('greatlakes')).toBe(true);
    expect(s.ownedPacks).toContain('bundle');
  });

  it('is a no-op for undefined (never wipes existing ownership)', () => {
    usePurchaseStore.getState().grantRegion('appalachia');
    applyOwned(undefined);
    expect(usePurchaseStore.getState().ownsRegion('appalachia')).toBe(true);
  });

  it('is additive — keeps previously owned regions', () => {
    usePurchaseStore.getState().grantRegion('appalachia');
    applyOwned({ regions: ['greatlakes'], packs: [] });
    const s = usePurchaseStore.getState();
    expect(s.ownsRegion('appalachia')).toBe(true);
    expect(s.ownsRegion('greatlakes')).toBe(true);
  });
});
