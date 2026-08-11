import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { Region } from '@/engine';
import { useProgressStore, usePurchaseStore } from '@/state';
import { IconButton } from '@/components/atoms';
import { RegionCard } from '@/components/molecules';

export interface RegionsScreenProps {
  regions: Region[];
  onSelectRegion: (id: string) => void;
  onBack: () => void;
  testID?: string;
}

export function RegionsScreen({ regions, onSelectRegion, onBack, testID }: RegionsScreenProps) {
  const solved = useProgressStore((s) => s.solved);
  const ownsRegion = usePurchaseStore((s) => s.ownsRegion);

  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: colors.paper.cream, padding: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton icon="back" variant="ghost" accessibilityLabel="Back" onPress={onBack} testID="regions-back" />
      </View>
      <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.xl, letterSpacing: typography.letterSpacing.wider, color: colors.ink.primary, textTransform: 'uppercase', marginTop: spacing.sm }}>
        Expeditions
      </Text>
      <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.sm, color: colors.ink.faded, marginBottom: spacing.md }}>
        Choose a region to investigate.
      </Text>
      <ScrollView>
        {regions.map((region) => {
          const solvedCount = region.puzzles.filter((p) => solved[p.id] !== undefined).length;
          const isLocked = !region.isFree && !ownsRegion(region.id);
          return (
            <RegionCard
              key={region.id}
              region={region}
              progress={{ solved: solvedCount, total: region.totalPuzzles }}
              isLocked={isLocked}
              isComingSoon={false}
              onPress={() => onSelectRegion(region.id)}
              testID={`region-${region.id}`}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

export default RegionsScreen;
