# Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first-launch onboarding — an `OnboardingScreen` (4-step carousel: intro → fill practice gated on 3 fills → mark practice gated on 1 mark → start) with step dots and an interactive 5×5 practice grid, plus an `/onboarding` route gated by `progressStore.onboardingCompleted` (Home redirects on first launch; completing sets the flag and returns Home).

**Architecture:** `OnboardingScreen` is a self-contained component holding local step + practice-grid state (it uses its OWN local grid, not `uiStore` — this is a throwaway tutorial, not a real puzzle). It reuses the `PuzzleCell` molecule for the interactive grid and the `Button` atom for advancing. Steps gate the Next button until the practice requirement is met. The `/onboarding` route wires completion to `progressStore.setOnboardingCompleted(true)` + navigation Home; Home redirects to `/onboarding` while the flag is unset.

**Tech Stack:** React Native + Expo Router, TypeScript, Zustand (`@/state`), Jest + `@testing-library/react-native` v13.

## Global Constraints

- Never inline color/spacing/font values; import from `@/theme`. (COMPONENT_LIBRARY.md Design System Quick Reference)
- Onboarding uses LOCAL practice state — it must NOT touch `uiStore` (that store is for real puzzles). (DATA_AND_ENGINE.md §3.2)
- Shown when `progressStore.onboardingCompleted === false`; completing sets it true. First-time only. (SCREEN_SPECS.md Screen 1)
- Step gating: step 2 (fill) needs ≥ 3 filled cells before Next; step 3 (mark) needs ≥ 1 marked cell; steps 1 and 4 advance freely. Next is disabled until the requirement is met. (SCREEN_SPECS.md Screen 1)
- `@testing-library/react-native` is v13 — synchronous `render`/`fireEvent`; a `disabled` `Button` no-ops its `onPress` (atom guard). Reset `progressStore` in `beforeEach` where asserted.
- Every commit message ends with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Project root: `/home/chris/Code/cryptid-picross`.

---

### Task 1: OnboardingScreen component

The 4-step tutorial carousel with an interactive practice grid. (SCREEN_SPECS.md Screen 1)

**Files:**
- Create: `src/components/screens/OnboardingScreen.tsx`
- Modify: `src/components/screens/index.ts`
- Test: `src/components/screens/__tests__/OnboardingScreen.test.tsx`

**Interfaces:**
- Consumes: `@/theme`; `PlayGrid`, `PlayCell` from `@/engine`; `Button` from `@/components/atoms`; `PuzzleCell` from `@/components/molecules`.
- Produces: `OnboardingScreen` with props `{ onComplete: () => void; testID?: string }`.

- [ ] **Step 1: Write the failing test**

Create `src/components/screens/__tests__/OnboardingScreen.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { OnboardingScreen } from '@/components/screens';

jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light' } }));

describe('OnboardingScreen', () => {
  it('starts on step 1 with all four step dots', () => {
    render(<OnboardingScreen onComplete={() => {}} testID="ob" />);
    expect(screen.getByText(/Every clue counts/i)).toBeTruthy();
    expect(screen.getByTestId('ob-dot-0')).toBeTruthy();
    expect(screen.getByTestId('ob-dot-3')).toBeTruthy();
  });

  it('gates the fill step until three cells are filled', () => {
    render(<OnboardingScreen onComplete={() => {}} testID="ob" />);
    fireEvent.press(screen.getByTestId('ob-next')); // step 1 -> 2 (fill)
    expect(screen.getByText(/Try it/i)).toBeTruthy();
    // Next is disabled: pressing does nothing
    fireEvent.press(screen.getByTestId('ob-next'));
    expect(screen.getByText(/Try it/i)).toBeTruthy();
    // fill three cells
    fireEvent.press(screen.getByTestId('ob-cell-0-0'));
    fireEvent.press(screen.getByTestId('ob-cell-0-1'));
    fireEvent.press(screen.getByTestId('ob-cell-0-2'));
    fireEvent.press(screen.getByTestId('ob-next')); // now advances -> step 3 (mark)
    expect(screen.getByText(/Mark what is empty/i)).toBeTruthy();
  });

  it('gates the mark step until one cell is marked, then reaches the final step', () => {
    render(<OnboardingScreen onComplete={() => {}} testID="ob" />);
    fireEvent.press(screen.getByTestId('ob-next')); // -> fill
    fireEvent.press(screen.getByTestId('ob-cell-0-0'));
    fireEvent.press(screen.getByTestId('ob-cell-0-1'));
    fireEvent.press(screen.getByTestId('ob-cell-0-2'));
    fireEvent.press(screen.getByTestId('ob-next')); // -> mark
    // disabled until a mark exists
    fireEvent.press(screen.getByTestId('ob-next'));
    expect(screen.getByText(/Mark what is empty/i)).toBeTruthy();
    fireEvent.press(screen.getByTestId('ob-cell-4-4')); // mark a cell
    fireEvent.press(screen.getByTestId('ob-next')); // -> final
    expect(screen.getByText(/The trail begins/i)).toBeTruthy();
  });

  it('calls onComplete from the final step', () => {
    const onComplete = jest.fn();
    render(<OnboardingScreen onComplete={onComplete} testID="ob" />);
    fireEvent.press(screen.getByTestId('ob-next')); // -> fill
    fireEvent.press(screen.getByTestId('ob-cell-0-0'));
    fireEvent.press(screen.getByTestId('ob-cell-0-1'));
    fireEvent.press(screen.getByTestId('ob-cell-0-2'));
    fireEvent.press(screen.getByTestId('ob-next')); // -> mark
    fireEvent.press(screen.getByTestId('ob-cell-4-4'));
    fireEvent.press(screen.getByTestId('ob-next')); // -> final
    fireEvent.press(screen.getByTestId('ob-next')); // Start investigating
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- OnboardingScreen` → FAIL.

- [ ] **Step 3: Implement**

Create `src/components/screens/OnboardingScreen.tsx`:
```tsx
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
```
Add to `src/components/screens/index.ts`:
```typescript
export { OnboardingScreen, default as OnboardingScreenDefault } from './OnboardingScreen';
export type { OnboardingScreenProps } from './OnboardingScreen';
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- OnboardingScreen && npx tsc --noEmit` → PASS (4), exit 0.

Note: the test passes `testID="ob"`, so the dots/grid/cells/next resolve to `ob-dot-0`, `ob-cell-0-0`, `ob-next`, etc.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(screens): add OnboardingScreen

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `/onboarding` route + first-launch gate

Add the route and redirect Home to it while onboarding is incomplete. (SCREEN_SPECS.md Screen 1 route guard)

**Files:**
- Create: `src/app/onboarding.tsx`
- Modify: `src/app/index.tsx` (redirect to onboarding while incomplete)
- Modify: `src/app/__tests__/index.test.tsx` (hydrate onboarding complete so Home renders)

**Interfaces:**
- Consumes: `expo-router` (`useRouter`, `Redirect`); `useProgressStore` from `@/state`; `OnboardingScreen` from `@/components/screens`.
- Produces: a `/onboarding` route; Home redirects to it until `onboardingCompleted` is true.

- [ ] **Step 1: Create the onboarding route**

Create `src/app/onboarding.tsx`:
```tsx
import React from 'react';
import { useRouter } from 'expo-router';
import { useProgressStore } from '@/state';
import { OnboardingScreen } from '@/components/screens';

export default function OnboardingRoute() {
  const router = useRouter();
  const setOnboardingCompleted = useProgressStore((s) => s.setOnboardingCompleted);
  return (
    <OnboardingScreen
      onComplete={() => {
        setOnboardingCompleted(true);
        router.replace('/');
      }}
    />
  );
}
```

- [ ] **Step 2: Gate Home behind onboarding**

Modify `src/app/index.tsx`: import `Redirect` from `expo-router` and `useProgressStore` from `@/state`; read the flag with a hook (before any conditional return), and redirect while incomplete. Add near the top of `Home`, after the existing `const router = useRouter();`:
```tsx
const onboardingCompleted = useProgressStore((s) => s.onboardingCompleted);
if (!onboardingCompleted) {
  return <Redirect href="/onboarding" />;
}
```
Keep the rest of Home (gear, title, prompt, sample entry, styles) unchanged.

- [ ] **Step 3: Keep the existing Home test valid**

Modify `src/app/__tests__/index.test.tsx` so Home renders (not redirects): add an import for `useProgressStore` from `@/state` and a `beforeEach` that hydrates onboarding as complete:
```tsx
import { useProgressStore } from '@/state';

beforeEach(() => {
  useProgressStore.getState().hydrate({ solved: {}, onboardingCompleted: true, firstLaunchAt: 0 });
});
```
(If the file already has a `beforeEach`, merge this hydrate into it. Do not remove existing assertions.)

- [ ] **Step 4: Full suite + typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: entire suite green (the Home test now renders Home with onboarding complete), tsc exit 0.

- [ ] **Step 5: Runnable check (headless bundle)**

Run:
```bash
rm -rf /tmp/cp-onboard-export && npx expo export --platform ios --output-dir /tmp/cp-onboard-export >/tmp/cp-onboard.log 2>&1; echo "export exit: $?"
```
Expected: `export exit: 0`. If it fails, read `/tmp/cp-onboard.log`.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(app): add /onboarding route + first-launch gate

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the executor

- Onboarding holds LOCAL practice state (`useState`) — it must not import or mutate `uiStore`.
- Home must call its hooks unconditionally before the redirect early-return (React rules of hooks).
- The existing Home test will break unless it hydrates `onboardingCompleted: true` (Task 2 Step 3) — the redirect path (incomplete) is a route behavior verified by `expo export`, not the unit test.
- Simplifications noted as later polish: clue numbers on the practice grid, a demo pre-fill on step 1, long-press for marking (this v1 marks by tap in the mark step), horizontal slide transitions, and the skip-after-30s affordance.
- After this, first launch shows onboarding; completing it sets the flag (persisted) and never shows again unless progress is cleared.
