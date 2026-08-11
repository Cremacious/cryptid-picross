import React from 'react';
import { useRouter } from 'expo-router';
import { sampleRegions } from '@/content/sampleRegions';
import { RegionsScreen } from '@/components/screens';

export default function RegionsRoute() {
  const router = useRouter();
  return (
    <RegionsScreen
      regions={sampleRegions}
      onSelectRegion={(id) => router.push(`/region/${id}`)}
      onBack={() => router.back()}
    />
  );
}
