import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography, spacing } from '@/theme';
import { getSampleRegion, sampleRegions } from '@/content/sampleRegions';
import { usePurchaseStore } from '@/state';
import { PaywallScreen } from '@/components/screens';
import { safeBack } from '@/utils/safeBack';
import {
  configureIap,
  getStorePricing,
  purchaseBundle,
  restorePurchases,
  applyOwned,
  MOCK_PRICING,
  RegionCatalog,
  PurchaseResult,
} from '@/iap';

// The single all-access product. Create one non-consumable product with this identifier
// in App Store Connect / Google Play + RevenueCat (priced $4.99). There are no per-region
// products.
const BUNDLE_PRODUCT_ID = 'bundle.all';

export default function PaywallRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const region = typeof id === 'string' ? getSampleRegion(id) : undefined;

  const [pricing, setPricing] = useState(MOCK_PRICING);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const catalog: RegionCatalog = useMemo(
    () => ({
      allRegionIds: sampleRegions.map((r) => r.id),
      bundleProductId: BUNDLE_PRODUCT_ID,
    }),
    [],
  );

  // Configure the store SDK and fetch localized prices (mock is instant + fixed on web).
  useEffect(() => {
    let alive = true;
    void (async () => {
      await configureIap();
      if (!region) return;
      const p = await getStorePricing({ bundleProductId: BUNDLE_PRODUCT_ID });
      if (alive) setPricing(p);
    })();
    return () => {
      alive = false;
    };
  }, [region]);

  if (!region) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper.cream, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
        <Text style={{ fontFamily: typography.fontFamily.body, color: colors.ink.soft, textAlign: 'center' }}>
          That region could not be found.
        </Text>
      </View>
    );
  }

  const settle = (result: PurchaseResult) => {
    if (result.outcome === 'success') {
      applyOwned(result.owned);
      router.replace(`/region/${region.id}`);
    } else if (result.outcome === 'error') {
      setErrorText(result.message ?? 'Something went wrong. Please try again.');
    }
    // 'cancelled' -> silently stay on the paywall.
  };

  const run = async (action: () => Promise<PurchaseResult>) => {
    if (busy) return;
    setBusy(true);
    setErrorText(null);
    try {
      settle(await action());
    } finally {
      setBusy(false);
    }
  };

  const buyUnlock = () => run(() => purchaseBundle({ catalog }));

  const onRestore = () =>
    run(async () => {
      const result = await restorePurchases({ catalog });
      if (result.outcome === 'success') {
        applyOwned(result.owned);
        // If the restore didn't unlock this region, tell the player instead of navigating.
        if (!usePurchaseStore.getState().ownsRegion(region.id)) {
          return { outcome: 'error', message: 'No previous purchases found for this region.' };
        }
      }
      return result;
    });

  return (
    <PaywallScreen
      region={region}
      unlockPrice={pricing.unlockPrice}
      onPurchaseUnlock={buyUnlock}
      onRestore={onRestore}
      onClose={() => safeBack(router, '/regions')}
      busy={busy}
      errorText={errorText}
    />
  );
}
