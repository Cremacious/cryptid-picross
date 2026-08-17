import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, border } from '@/theme';
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
  const insets = useSafeAreaInsets();
  const stampText = puzzle.difficulty.tier === 'Expert' ? 'Classified File' : 'Sighting Confirmed';
  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: colors.ink.primary, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ScrollView
        style={{ flex: 1 }}
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
      </ScrollView>

      {/* Fixed light action footer — the atom Buttons are styled for paper surfaces, so a
          paper-cream bar keeps them readable on the dark reveal backdrop, and both stay on
          screen no matter how tall the polaroid/case file is. */}
      <View
        style={{ backgroundColor: colors.paper.cream, padding: spacing.md, gap: spacing.sm, borderTopWidth: border.thick, borderTopColor: colors.paper.shadow }}
      >
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
      </View>
    </View>
  );
}

export default RevealScreen;
