import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography, spacing } from '@/theme';
import { getPuzzleById, getSampleRegion } from '@/content/sampleRegions';
import { useProgressStore } from '@/state';
import { RevealScreen } from '@/components/screens';

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

  return (
    <RevealScreen
      puzzle={puzzle}
      bestTime={entry?.time}
      onNext={next ? () => router.replace(`/puzzle/${next.id}`) : undefined}
      onBackToSelection={() => router.replace(`/region/${regionId}`)}
    />
  );
}
