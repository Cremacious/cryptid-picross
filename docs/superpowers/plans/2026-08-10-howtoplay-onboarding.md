# How-to-play Onboarding Intro (Workstream B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepend a skippable illustrated rules explainer (what a nonogram is, how to read clues like "3 1" with an annotated example, marking empties) to onboarding, restructured to a kind-based step model, with a Skip control visible throughout.

**Architecture:** Rewrite `OnboardingScreen` around a `Step[]` config where each step has a `kind` (`explainer` | `fill` | `mark` | `done`) instead of hard-coded step indices. Explainer steps advance freely; `fill`/`mark` steps gate on the practice grid; `done` completes. A "Reading the clues" step renders a static annotated example row (clue `3 1` → filled, filled, filled, empty, filled = `[1,1,1,0,1]`) using non-interactive `PuzzleCell`s. A Skip control (top-right) calls `onComplete` from any step. Local practice state only — no `uiStore`.

**Tech Stack:** React Native + Expo, TypeScript, Jest + `@testing-library/react-native` v13. Reuses `PuzzleCell` + `Button`. No new deps, no new Expo APIs.

## Global Constraints

- Never inline color/spacing/font values; import from `@/theme`. (project convention)
- Onboarding holds LOCAL practice state (`useState`) — no `uiStore`. (DATA_AND_ENGINE.md §3.2)
- Gating: `explainer`/`done` advance freely; `fill` needs ≥ 3 filled cells; `mark` needs ≥ 1 marked cell; Next is a disabled `Button` (its atom guard no-ops onPress) until the requirement is met. (SCREEN_SPECS.md Screen 1)
- Skip is available from every step and calls `onComplete` (the route sets `onboardingCompleted`). "Optionally skip if you know how to play." (design doc)
- Rules must be correct: clue numbers are the lengths of consecutive filled runs, in order, with at least one empty cell between runs. The "3 1" example row is `[1,1,1,0,1]`. (nonogram rules)
- `@testing-library/react-native` is v13 — synchronous `render`/`fireEvent`; the test mocks `expo-haptics` (PuzzleCell uses it on press). (project convention)
- Every commit message ends with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Project root: `/home/chris/Code/cryptid-picross`.

---

### Task 1: rewrite OnboardingScreen with explainer steps + Skip

**Files:**
- Modify (rewrite): `src/components/screens/OnboardingScreen.tsx`
- Modify (rewrite): `src/components/screens/__tests__/OnboardingScreen.test.tsx`

**Interfaces:**
- Unchanged public API: `OnboardingScreen` with props `{ onComplete: () => void; testID?: string }`.

- [ ] **Step 1: Rewrite the test for the new flow**

Replace `src/components/screens/__tests__/OnboardingScreen.test.tsx` with:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { OnboardingScreen } from '@/components/screens';

jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light' } }));

describe('OnboardingScreen', () => {
  it('starts on the rules explainer with all step dots and a Skip control', () => {
    render(<OnboardingScreen onComplete={() => {}} testID="ob" />);
    expect(screen.getByText(/What is a nonogram/i)).toBeTruthy();
    expect(screen.getByTestId('ob-dot-0')).toBeTruthy();
    expect(screen.getByTestId('ob-dot-5')).toBeTruthy();
    expect(screen.getByTestId('ob-skip')).toBeTruthy();
  });

  it('Skip completes onboarding immediately from the first step', () => {
    const onComplete = jest.fn();
    render(<OnboardingScreen onComplete={onComplete} testID="ob" />);
    fireEvent.press(screen.getByTestId('ob-skip'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('shows the annotated clue example on the reading-the-clues step', () => {
    render(<OnboardingScreen onComplete={() => {}} testID="ob" />);
    fireEvent.press(screen.getByTestId('ob-next')); // -> reading the clues
    expect(screen.getByText(/Reading the clues/i)).toBeTruthy();
    expect(screen.getByTestId('ob-example')).toBeTruthy();
    // the "3 1" example row renders 5 example cells
    expect(screen.getByTestId('ob-example-0')).toBeTruthy();
    expect(screen.getByTestId('ob-example-4')).toBeTruthy();
  });

  it('advances explainers freely, then gates fill, then mark, then completes', () => {
    const onComplete = jest.fn();
    render(<OnboardingScreen onComplete={onComplete} testID="ob" />);
    fireEvent.press(screen.getByTestId('ob-next')); // -> reading the clues
    fireEvent.press(screen.getByTestId('ob-next')); // -> marking empties
    fireEvent.press(screen.getByTestId('ob-next')); // -> Try it (fill)
    expect(screen.getByText(/Try it/i)).toBeTruthy();

    // gated until 3 fills
    fireEvent.press(screen.getByTestId('ob-next'));
    expect(screen.getByText(/Try it/i)).toBeTruthy();
    fireEvent.press(screen.getByTestId('ob-cell-0-0'));
    fireEvent.press(screen.getByTestId('ob-cell-0-1'));
    fireEvent.press(screen.getByTestId('ob-cell-0-2'));
    fireEvent.press(screen.getByTestId('ob-next')); // -> Mark
    expect(screen.getByText(/Mark what is empty/i)).toBeTruthy();

    // gated until 1 mark
    fireEvent.press(screen.getByTestId('ob-next'));
    expect(screen.getByText(/Mark what is empty/i)).toBeTruthy();
    fireEvent.press(screen.getByTestId('ob-cell-4-4'));
    fireEvent.press(screen.getByTestId('ob-next')); // -> The trail begins
    expect(screen.getByText(/The trail begins/i)).toBeTruthy();

    fireEvent.press(screen.getByTestId('ob-next')); // Start investigating
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- OnboardingScreen` → FAIL (old screen has no Skip / different steps).

- [ ] **Step 3: Rewrite the component**

Replace `src/components/screens/OnboardingScreen.tsx` with:
```tsx
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
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
      style={{ flex: 1, backgroundColor: colors.paper.cream, padding: spacing.lg, justifyContent: 'space-between' }}
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
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- OnboardingScreen && npx tsc --noEmit` → PASS (4), exit 0.

- [ ] **Step 5: Full suite**

Run: `npm test`
Expected: entire suite green (the onboarding route still calls `onComplete` → the same public API is unchanged).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(screens): onboarding rules explainer + Skip

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the executor

- The public API (`OnboardingScreen` props) is unchanged, so `src/app/onboarding.tsx` needs no edits — it already wires `onComplete`.
- Rules correctness matters (the user does not play picross): keep the "3 1 = three filled, a gap, then one" wording and the `[1,1,1,0,1]` example exactly.
- Gating relies on the `Button` atom no-op-ing `onPress` when `disabled` — the same mechanism the old onboarding used.
- Local practice state only; do not import `uiStore`.
- After this, the controller will visually confirm the explainer + Skip in the running web preview.
