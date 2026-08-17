import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography, spacing } from '@/theme';
import { getPuzzleById, getSampleRegion } from '@/content/sampleRegions';
import { useProgressStore } from '@/state';
import { RevealScreen } from '@/components/screens';
import { maybeShowInterstitialAfterSolve } from '@/ads';
import { safeBack } from '@/utils/safeBack';

export default function RevealRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const puzzle = typeof id === 'string' ? getPuzzleById(id) : undefined;
  const entry = useProgressStore((s) => (typeof id === 'string' ? s.solved[id] : undefined));

  if (!puzzle) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ink.primary, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
        <Text style={{ fontFamily: typography.fontFamily.body, color: colors.paper.cream, textAlign: 'center' }}>
          No case file found for this sighting.
        </Text>
      </View>
    );
  }

  const regionId = puzzle.metadata.regionId;
  const region = getSampleRegion(regionId);
  const index = region ? region.puzzles.findIndex((p) => p.id === puzzle.id) : -1;
  const next = region && index >= 0 ? region.puzzles[index + 1] : undefined;

  // Leaving the reveal (after the player has seen their picture) is the interstitial break.
  // The ad is gated on cadence + paid status inside maybeShowInterstitialAfterSolve; on web
  // it resolves instantly, so navigation is never delayed for non-native players.
  const leave = async (go: () => void) => {
    await maybeShowInterstitialAfterSolve();
    go();
  };

  return (
    <RevealScreen
      puzzle={puzzle}
      bestTime={entry?.time}
      onNext={next ? () => void leave(() => router.replace(`/puzzle/${next.id}`)) : undefined}
      onBackToSelection={() => void leave(() => safeBack(router, `/region/${regionId}`))}
    />
  );
}
