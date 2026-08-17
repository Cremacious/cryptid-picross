import React, { useMemo } from 'react';
import { useRouter, Redirect } from 'expo-router';
import { useProgressStore } from '@/state';
import { getPuzzleById } from '@/content/sampleRegions';
import { MainMenuScreen } from '@/components/screens';

export default function Home() {
  const router = useRouter();
  const onboardingCompleted = useProgressStore((s) => s.onboardingCompleted);
  const solved = useProgressStore((s) => s.solved);

  const continueId = useMemo(() => {
    let best: string | undefined;
    let bestAt = -Infinity;
    for (const [id, entry] of Object.entries(solved)) {
      if (entry.lastPlayedAt > bestAt) {
        bestAt = entry.lastPlayedAt;
        best = id;
      }
    }
    return best;
  }, [solved]);

  if (!onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <MainMenuScreen
      testID="home-screen"
      showContinue={continueId !== undefined}
      onContinue={() => {
        if (!continueId) return;
        // Route through the region's puzzle list so it sits under the puzzle — then the
        // back button returns to the puzzle listing, not the main menu.
        const regionId = getPuzzleById(continueId)?.metadata.regionId;
        if (regionId) router.push(`/region/${regionId}`);
        router.push(`/puzzle/${continueId}`);
      }}
      onBegin={() => router.push('/regions')}
      onSettings={() => router.push('/settings')}
    />
  );
}
