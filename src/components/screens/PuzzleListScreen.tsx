import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { Region } from '@/engine';
import { useProgressStore } from '@/state';
import { IconButton } from '@/components/atoms';
import { PuzzleCard } from '@/components/molecules';

export interface PuzzleListScreenProps {
  region: Region;
  onSelectPuzzle: (id: string) => void;
  onBack: () => void;
  testID?: string;
}

export function PuzzleListScreen({ region, onSelectPuzzle, onBack, testID }: PuzzleListScreenProps) {
  const solved = useProgressStore((s) => s.solved);

  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: colors.paper.cream, padding: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton icon="back" variant="ghost" accessibilityLabel="Back" onPress={onBack} testID="list-back" />
      </View>
      <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.xl, letterSpacing: typography.letterSpacing.wide, color: colors.ink.primary, marginTop: spacing.sm }}>
        {region.name}
      </Text>
      <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.sm, color: colors.ink.faded, marginBottom: spacing.md }}>
        {region.tagline}
      </Text>
      <ScrollView>
        {region.puzzles.map((p) => {
          const entry = solved[p.id];
          const isSolved = entry !== undefined;
          const cols = p.grid[0]?.length ?? 0;
          const rows = p.grid.length;
          return (
            <PuzzleCard
              key={p.id}
              puzzleNumber={p.metadata.order}
              puzzleName={isSolved ? p.name : '???'}
              size={`${cols}x${rows}`}
              tier={p.difficulty.tier}
              isSolved={isSolved}
              bestTime={entry?.time}
              bestMistakes={entry?.mistakes}
              onPress={() => onSelectPuzzle(p.id)}
              testID={`puzzle-${p.id}`}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

export default PuzzleListScreen;
