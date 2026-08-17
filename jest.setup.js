// Reanimated 4 delegates its native layer to react-native-worklets. Jest has no
// native runtime, so worklets must load its official mock before reanimated is
// required — otherwise reanimated's module-scope native init crashes on import.
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/lib/module/mock')
);

// Reanimated's official jest mock — makes animated components render in tests.
require('react-native-reanimated').setUpTests?.();

// Safe-area context needs a provider (or mock) or useSafeAreaInsets throws under Jest.
// The package's official mock returns zero insets, which is what screen tests expect.
jest.mock('react-native-safe-area-context', () => {
  const m = require('react-native-safe-area-context/jest/mock');
  return { __esModule: true, ...(m.default ?? m) };
});

// AsyncStorage has no native module under Jest; use the package's official mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// react-native-purchases is a native module with no Jest runtime. Tests use the mock IAP
// adapter (src/iap/purchases.ts), so this is only a safety net in case the native adapter
// is ever resolved under Jest — its lazy require() would otherwise fail to load.
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    getOfferings: jest.fn(async () => ({ current: { availablePackages: [] } })),
    purchasePackage: jest.fn(async () => ({ customerInfo: { entitlements: { active: {} } } })),
    restorePurchases: jest.fn(async () => ({ entitlements: { active: {} } })),
  },
}));
