import React from 'react';
import { ScrollView, Text } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { Puzzle } from '@/engine';
import { Stamp, Button } from '@/components/atoms';
import { Polaroid, FieldEntryCard } from '@/components/molecules';
import { formatTime } from '@/utils/formatTime';

export interface RevealScreenProps {
  puzzle: Puzzle;
  bestTime?: number;
  isNewBest?: boolean;
  onNext?: () => void;
  onBackToSelection: () => void;
  testID?: string;
}

export function RevealScreen({ puzzle, bestTime, isNewBest = false, onNext, onBackToSelection, testID }: RevealScreenProps) {
  const stampText = puzzle.difficulty.tier === 'Expert' ? 'Classified File' : 'Sighting Confirmed';
  return (
    <ScrollView
      testID={testID}
      style={{ flex: 1, backgroundColor: colors.ink.primary }}
      contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md }}
    >
      <Stamp text={stampText} color="red" animateIn />
      <Polaroid grid={puzzle.grid} caption={`${puzzle.name} · ${puzzle.subtitle}`} />
      {isNewBest && bestTime !== undefined ? (
        <Text
          style={{ fontFamily: typography.fontFamily.display, letterSpacing: typography.letterSpacing.wide, fontSize: typography.size.sm, color: colors.accent.candleGlow, textTransform: 'uppercase' }}
        >
          {`New Best · ${formatTime(bestTime)}`}
        </Text>
      ) : null}
      <FieldEntryCard entry={puzzle.entry} variant="reveal" />
      {onNext ? (
        <Button label="Next Sighting" variant="primary" fullWidth onPress={onNext} testID="reveal-next" />
      ) : null}
      <Button
        label="Back to the List"
        variant={onNext ? 'secondary' : 'primary'}
        fullWidth
        onPress={onBackToSelection}
        testID="reveal-back"
      />
    </ScrollView>
  );
}

export default RevealScreen;
