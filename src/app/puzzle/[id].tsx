import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography, spacing } from '@/theme';
import { getPuzzleById } from '@/content/sampleRegions';
import { useSettingsStore } from '@/state';
import { PuzzlePlayScreen } from '@/components/screens';
import { safeBack } from '@/utils/safeBack';

export default function PuzzleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const mode = useSettingsStore((s) => s.mode);
  const puzzle = typeof id === 'string' ? getPuzzleById(id) : undefined;

  if (!puzzle) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper.cream, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
        <Text style={{ fontFamily: typography.fontFamily.body, color: colors.ink.soft, textAlign: 'center' }}>
          That sighting could not be found.
        </Text>
      </View>
    );
  }

  return (
    <PuzzlePlayScreen
      puzzle={puzzle}
      mode={mode}
      onExit={() => safeBack(router, `/region/${puzzle.metadata.regionId}`)}
      onSolved={() => router.push(`/reveal/${puzzle.id}`)}
    />
  );
}
