import React from 'react';
import { useRouter } from 'expo-router';
import { sampleRegions, getSampleRegion } from '@/content/sampleRegions';
import { usePurchaseStore } from '@/state';
import { RegionsScreen } from '@/components/screens';
import { safeBack } from '@/utils/safeBack';

export default function RegionsRoute() {
  const router = useRouter();
  const ownsRegion = usePurchaseStore((s) => s.ownsRegion);
  return (
    <RegionsScreen
      regions={sampleRegions}
      onSelectRegion={(id) => {
        const region = getSampleRegion(id);
        const locked = !!region && !region.isFree && !ownsRegion(id);
        router.push(locked ? `/paywall/${id}` : `/region/${id}`);
      }}
      onBack={() => safeBack(router, '/')}
    />
  );
}
