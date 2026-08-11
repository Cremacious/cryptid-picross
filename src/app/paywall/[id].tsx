import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography, spacing } from '@/theme';
import { getSampleRegion, sampleRegions } from '@/content/sampleRegions';
import { usePurchaseStore } from '@/state';
import { PaywallScreen } from '@/components/screens';

// DEV MOCK: prices and the "purchase" are local stand-ins. Real RevenueCat IAP
// (product fetch, purchase, receipt validation) is a separate later task that
// needs Apple Developer + Play Console + RevenueCat setup and a native build.
const REGION_PRICE = '$2.99';
const BUNDLE_PRICE = '$6.99';

export default function PaywallRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const region = typeof id === 'string' ? getSampleRegion(id) : undefined;
  const grantRegion = usePurchaseStore((s) => s.grantRegion);

  if (!region) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper.cream, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
        <Text style={{ fontFamily: typography.fontFamily.body, color: colors.ink.soft, textAlign: 'center' }}>
          That region could not be found.
        </Text>
      </View>
    );
  }

  const buyRegion = () => {
    grantRegion(region.id, REGION_PRICE); // MOCK grant
    router.replace(`/region/${region.id}`);
  };
  const buyBundle = () => {
    sampleRegions.forEach((r) => grantRegion(r.id, BUNDLE_PRICE)); // MOCK grant all
    router.replace(`/region/${region.id}`);
  };
  const onRestore = () => {
    // MOCK: no real receipts to restore yet. Must NOT call restore([]) — that would
    // clear ownedRegions. Real restore-purchases wiring lands with RevenueCat.
  };

  return (
    <PaywallScreen
      region={region}
      regionPrice={REGION_PRICE}
      bundlePrice={BUNDLE_PRICE}
      onPurchaseRegion={buyRegion}
      onPurchaseBundle={buyBundle}
      onRestore={onRestore}
      onClose={() => router.back()}
    />
  );
}
