import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { colors, typography, spacing, radius } from '@/theme';
import { PlayGrid, PlayCell } from '@/engine';
import { Button } from '@/components/atoms';
import { PuzzleCell } from '@/components/molecules';

export interface OnboardingScreenProps {
  onComplete: () => void;
  testID?: string;
}

const STEPS = [
  { title: 'Every clue counts.', tagline: 'The numbers tell you how many cells to fill in each row and column.' },
  { title: 'Try it.', tagline: 'Tap cells to fill them in. Fill at least three to continue.' },
  { title: 'Mark what is empty.', tagline: 'Tap to note a cell as empty. Place at least one.' },
  { title: 'The trail begins.', tagline: 'Solve puzzles, unlock case files, fill your field guide. Watch the treeline.' },
];

const SIZE = 5;
const CELL = 40;
const emptyGrid = (): PlayGrid => Array.from({ length: SIZE }, () => new Array<PlayCell>(SIZE).fill(0));

export function OnboardingScreen({ onComplete, testID }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [grid, setGrid] = useState<PlayGrid>(emptyGrid);

  const flat = grid.flat();
  const filledCount = flat.filter((c) => c === 1).length;
  const markCount = flat.filter((c) => c === 2).length;

  const interactive = step === 1 || step === 2;
  const tool: 'fill' | 'mark' = step === 2 ? 'mark' : 'fill';

  const tapCell = (r: number, c: number) => {
    if (!interactive) return;
    setGrid((prev) =>
      prev.map((row, ri) =>
        ri === r
          ? row.map((cell, ci) => {
              if (ci !== c) return cell;
              if (tool === 'fill') return cell === 1 ? 0 : 1;
              return cell === 2 ? 0 : 2;
            })
          : row,
      ),
    );
  };

  const canAdvance =
    step === 0 || step === 3 || (step === 1 && filledCount >= 3) || (step === 2 && markCount >= 1);
  const isLast = step === STEPS.length - 1;

  const advance = () => {
    if (isLast) {
      onComplete();
      return;
    }
    if (canAdvance) setStep((s) => s + 1);
  };

  const current = STEPS[step];

  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: colors.paper.cream, padding: spacing.lg, justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md }}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            testID={`${testID}-dot-${i}`}
            style={{ width: 8, height: 8, borderRadius: radius.full, backgroundColor: i === step ? colors.ink.primary : colors.paper.shadow }}
          />
        ))}
      </View>

      <View style={{ alignItems: 'center', gap: spacing.md }}>
        <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.xl, letterSpacing: typography.letterSpacing.wide, color: colors.ink.primary, textAlign: 'center', textTransform: 'uppercase' }}>
          {current.title}
        </Text>
        <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.md, color: colors.ink.soft, textAlign: 'center' }}>
          {current.tagline}
        </Text>

        <View testID={`${testID}-grid`}>
          {grid.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row' }}>
              {row.map((cell, c) => (
                <PuzzleCell
                  key={c}
                  testID={`${testID}-cell-${r}-${c}`}
                  state={cell}
                  size={CELL}
                  onPress={() => tapCell(r, c)}
                  accessibilityLabel={`practice cell row ${r + 1}, column ${c + 1}`}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      <Button
        label={isLast ? 'Start investigating' : 'Next'}
        fullWidth
        disabled={!canAdvance}
        onPress={advance}
        testID={`${testID}-next`}
      />
    </View>
  );
}

export default OnboardingScreen;
