import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography, spacing } from '@/theme';
import { getSampleRegion } from '@/content/sampleRegions';
import { PuzzleListScreen } from '@/components/screens';

export default function RegionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const region = typeof id === 'string' ? getSampleRegion(id) : undefined;

  if (!region) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper.cream, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
        <Text style={{ fontFamily: typography.fontFamily.body, color: colors.ink.soft, textAlign: 'center' }}>
          That region could not be found.
        </Text>
      </View>
    );
  }

  return (
    <PuzzleListScreen
      region={region}
      onSelectPuzzle={(pid) => router.push(`/puzzle/${pid}`)}
      onBack={() => router.back()}
    />
  );
}
