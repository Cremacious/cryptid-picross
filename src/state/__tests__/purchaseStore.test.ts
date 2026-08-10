import { usePurchaseStore } from '@/state/purchaseStore';
import { notifyChange } from '@/state/saveBus';

jest.mock('@/state/saveBus', () => ({
  notifyChange: jest.fn(),
  setChangeHandler: jest.fn(),
}));

beforeEach(() => {
  (notifyChange as jest.Mock).mockClear();
  usePurchaseStore.getState().hydrate({
    ownedRegions: [], ownedPacks: [], lastRestoredAt: null, purchaseHistory: [],
  });
});

describe('purchaseStore', () => {
  it('grants a region, records history, and reports ownership', () => {
    usePurchaseStore.getState().grantRegion('pnw', '$2.99');
    expect(usePurchaseStore.getState().ownsRegion('pnw')).toBe(true);
    expect(usePurchaseStore.getState().purchaseHistory).toHaveLength(1);
    expect(notifyChange).toHaveBeenCalled();
  });

  it('is idempotent — granting the same region twice does not duplicate', () => {
    usePurchaseStore.getState().grantRegion('pnw');
    usePurchaseStore.getState().grantRegion('pnw');
    expect(usePurchaseStore.getState().ownedRegions).toEqual(['pnw']);
  });

  it('restore sets owned regions/packs and lastRestoredAt', () => {
    usePurchaseStore.getState().restore(['pnw', 'appalachia', 'pnw'], ['halloween']);
    const s = usePurchaseStore.getState();
    expect(s.ownedRegions.sort()).toEqual(['appalachia', 'pnw']);
    expect(s.ownedPacks).toEqual(['halloween']);
    expect(typeof s.lastRestoredAt).toBe('number');
  });
});
