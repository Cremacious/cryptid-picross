import { BUNDLE_PRODUCT_ID, buildRegionCatalog } from '@/iap';

describe('IAP catalog', () => {
  it('pins the all-access product id to the App Store Connect product', () => {
    expect(BUNDLE_PRODUCT_ID).toBe('bundle.all');
  });

  it('builds a catalog whose bundle product is the all-access product', () => {
    const catalog = buildRegionCatalog(['pnw', 'appalachia']);
    expect(catalog).toEqual({
      allRegionIds: ['pnw', 'appalachia'],
      bundleProductId: 'bundle.all',
    });
  });
});
