import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography, spacing } from '@/theme';
import { getPuzzleById } from '@/content/sampleRegions';
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

  return (
    <RevealScreen
      puzzle={puzzle}
      bestTime={entry?.time}
      onAddToGuide={() => router.replace('/')}
    />
  );
}
