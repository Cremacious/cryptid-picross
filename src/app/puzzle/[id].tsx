import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography, spacing } from '@/theme';
import { getSamplePuzzle } from '@/content/samplePuzzles';
import { useSettingsStore } from '@/state';
import { PuzzlePlayScreen } from '@/components/screens';

export default function PuzzleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const mode = useSettingsStore((s) => s.mode);
  const puzzle = typeof id === 'string' ? getSamplePuzzle(id) : undefined;

  if (!puzzle) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper.cream, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
        <Text style={{ fontFamily: typography.fontFamily.body, color: colors.ink.soft, textAlign: 'center' }}>
          That sighting could not be found.
        </Text>
      </View>
    );
  }

  return <PuzzlePlayScreen puzzle={puzzle} mode={mode} onExit={() => router.back()} />;
}
