import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@/theme';
import { PlayGrid, PlayCell } from '@/engine';
import { Button } from '@/components/atoms';
import { PuzzleCell } from '@/components/molecules';

export interface OnboardingScreenProps {
  onComplete: () => void;
  testID?: string;
}

type StepKind = 'explainer' | 'fill' | 'mark' | 'done';

interface Step {
  kind: StepKind;
  title: string;
  tagline: string;
  example?: 'clue-row';
}

const STEPS: Step[] = [
  {
    kind: 'explainer',
    title: 'What is a nonogram?',
    tagline:
      'Fill the right cells to reveal a hidden creature. The numbers around the grid are your only clues.',
  },
  {
    kind: 'explainer',
    title: 'Reading the clues',
    tagline:
      'Each number is a run of filled-in cells, in order, with at least one gap between runs. So "3 1" means three filled, a gap, then one more.',
    example: 'clue-row',
  },
  {
    kind: 'explainer',
    title: 'Marking empties',
    tagline:
      'Tap in mark mode to note a cell you are sure is empty. Marks (✕) are just reminders — they never count as answers.',
  },
  {
    kind: 'fill',
    title: 'Try it',
    tagline: 'Tap cells to fill them in. Fill at least three to continue.',
  },
  {
    kind: 'mark',
    title: 'Mark what is empty',
    tagline: 'Tap to mark a cell as empty. Place at least one.',
  },
  {
    kind: 'done',
    title: 'The trail begins',
    tagline: 'Solve puzzles, unlock case files, fill your field guide. Watch the treeline.',
  },
];

const SIZE = 5;
const CELL = 40;
const EXAMPLE_ROW: PlayCell[] = [1, 1, 1, 0, 1]; // clue "3 1"
const emptyGrid = (): PlayGrid => Array.from({ length: SIZE }, () => new Array<PlayCell>(SIZE).fill(0));

export function OnboardingScreen({ onComplete, testID }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [grid, setGrid] = useState<PlayGrid>(emptyGrid);

  const current = STEPS[step];
  const interactive = current.kind === 'fill' || current.kind === 'mark';
  const tool: 'fill' | 'mark' = current.kind === 'mark' ? 'mark' : 'fill';

  const flat = grid.flat();
  const filledCount = flat.filter((c) => c === 1).length;
  const markCount = flat.filter((c) => c === 2).length;

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
    current.kind === 'explainer' ||
    current.kind === 'done' ||
    (current.kind === 'fill' && filledCount >= 3) ||
    (current.kind === 'mark' && markCount >= 1);
  const isLast = step === STEPS.length - 1;

  const advance = () => {
    if (isLast) {
      onComplete();
      return;
    }
    if (canAdvance) setStep((s) => s + 1);
  };

  return (
    <View
      testID={testID}
      style={{ flex: 1, backgroundColor: colors.paper.cream, paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md, justifyContent: 'space-between' }}
    >
      {/* dots + skip */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md }}>
        <View style={{ width: 56 }} />
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              testID={`${testID}-dot-${i}`}
              style={{ width: 8, height: 8, borderRadius: radius.full, backgroundColor: i === step ? colors.ink.primary : colors.paper.shadow }}
            />
          ))}
        </View>
        <Pressable
          testID={`${testID}-skip`}
          onPress={onComplete}
          accessibilityRole="button"
          accessibilityLabel="Skip the tutorial"
          style={{ width: 56, alignItems: 'flex-end' }}
        >
          <Text style={{ fontFamily: typography.fontFamily.body, fontSize: typography.size.sm, color: colors.ink.faded }}>Skip</Text>
        </Pressable>
      </View>

      {/* title + tagline + visual */}
      <View style={{ alignItems: 'center', gap: spacing.md }}>
        <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.xl, letterSpacing: typography.letterSpacing.wide, color: colors.ink.primary, textAlign: 'center', textTransform: 'uppercase' }}>
          {current.title}
        </Text>
        <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.md, color: colors.ink.soft, textAlign: 'center' }}>
          {current.tagline}
        </Text>

        {current.example === 'clue-row' ? (
          <View testID={`${testID}-example`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
            <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.lg, color: colors.ink.soft, letterSpacing: typography.letterSpacing.wide }}>
              3 1
            </Text>
            <View style={{ flexDirection: 'row' }}>
              {EXAMPLE_ROW.map((cell, c) => (
                <PuzzleCell
                  key={c}
                  testID={`${testID}-example-${c}`}
                  state={cell}
                  size={CELL}
                  onPress={() => {}}
                  accessibilityLabel={`example cell ${c + 1}`}
                />
              ))}
            </View>
          </View>
        ) : null}

        {interactive ? (
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
        ) : null}
      </View>

      {/* next / start */}
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
