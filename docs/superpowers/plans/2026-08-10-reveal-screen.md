# Reveal Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the win payoff — the `Polaroid` and `FieldEntryCard` molecules, a `RevealScreen` component (stamp + developed polaroid + optional new-best + case file + "Add to Guide"), and a `/reveal/[id]` route wired from `PuzzlePlayScreen`'s `onSolved` so solving a puzzle lands on the reveal.

**Architecture:** `Polaroid` renders the completed grid as pixel-art with a Reanimated spring "drop"; `FieldEntryCard` renders the case file with voice-style decoration; both are molecules (props-in, atoms + tokens). `RevealScreen` composes the `Stamp`/`Button` atoms + the two new molecules over a dark backdrop. The `/reveal/[id]` route resolves the sample puzzle + best time and renders it; `PuzzlePlayScreen`'s `onSolved` (already a prop) is wired by the puzzle route to navigate there. Closes the loop: Home → puzzle → solve → reveal.

**Tech Stack:** React Native + Expo Router, TypeScript, Reanimated, Jest + `@testing-library/react-native` v13.

## Global Constraints

- Never inline color/spacing/font/radius values; import from `@/theme`. Pixel-art cell sizes are per-size component constants (acceptable). (COMPONENT_LIBRARY.md Design System Quick Reference)
- Molecules import atoms + molecules only; screens import atoms/molecules/organisms/stores/utils; routes import screens/content/stores. No upward imports. (COMPONENT_LIBRARY.md Part 6)
- Animation respects `useReducedMotion()` — the polaroid appears in place (no drop) when reduced. (QA_AND_LAUNCH.md §2.6)
- Polaroid rests at a slight rotation (~-2°), never 0°; drop uses the polaroid spring config. (COMPONENT_LIBRARY.md 2.6; motion.spring.polaroid)
- Voice-style decoration affects only opening/closing decoration, never body formatting: `notebook`/`deadpan` none, `firstPerson` dashed left border, `victorian` a "℘" glyph top-right. (COMPONENT_LIBRARY.md 2.5)
- Reveal stamp text: "SIGHTING CONFIRMED" normally, "CLASSIFIED FILE" for Expert tier. (SCREEN_SPECS.md Screen 6)
- `@testing-library/react-native` is v13 — synchronous `render`/`fireEvent`; reset singleton stores in `beforeEach` where asserted.
- Every commit message ends with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Project root: `/home/chris/Code/cryptid-picross`.

---

### Task 1: Polaroid molecule

The developed polaroid: pixel-art of the completed grid, caption, spring drop-in. (COMPONENT_LIBRARY.md 2.6)

**Files:**
- Create: `src/components/molecules/Polaroid.tsx`
- Modify: `src/components/molecules/index.ts`
- Test: `src/components/molecules/__tests__/Polaroid.test.tsx`

**Interfaces:**
- Consumes: `@/theme`; `Grid` from `@/engine`; `react-native-reanimated`.
- Produces: `Polaroid` with props `{ grid: Grid; caption: string; animateIn?: boolean; onAnimationComplete?: () => void; size?: 'sm'|'md'|'lg'; testID?: string }`.

- [ ] **Step 1: Write the failing test**

Create `src/components/molecules/__tests__/Polaroid.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import { Polaroid } from '@/components/molecules';

const GRID = [
  [1, 0],
  [0, 1],
];

describe('Polaroid', () => {
  it('renders the caption and the pixel-art container', () => {
    render(<Polaroid grid={GRID} caption="Mothman · Silver Bridge" testID="polaroid" />);
    expect(screen.getByText('Mothman · Silver Bridge')).toBeTruthy();
    expect(screen.getByTestId('polaroid-art')).toBeTruthy();
  });

  it('renders with animateIn without crashing', () => {
    render(<Polaroid grid={GRID} caption="X" animateIn testID="polaroid" />);
    expect(screen.getByTestId('polaroid')).toBeTruthy();
  });

  it('renders in place with animateIn disabled', () => {
    render(<Polaroid grid={GRID} caption="Y" animateIn={false} testID="polaroid" />);
    expect(screen.getByTestId('polaroid')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- Polaroid` → FAIL.

- [ ] **Step 3: Implement**

Create `src/components/molecules/Polaroid.tsx`:
```tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useReducedMotion,
  runOnJS,
} from 'react-native-reanimated';
import { colors, typography, spacing, radius, layout, motion } from '@/theme';
import { Grid } from '@/engine';

export interface PolaroidProps {
  grid: Grid;
  caption: string;
  animateIn?: boolean;
  onAnimationComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  testID?: string;
}

const PIXEL: Record<NonNullable<PolaroidProps['size']>, number> = { sm: 6, md: 10, lg: 14 };

export function Polaroid({
  grid,
  caption,
  animateIn = true,
  onAnimationComplete,
  size = 'md',
  testID,
}: PolaroidProps) {
  const pixel = PIXEL[size];
  const reduced = useReducedMotion();
  const active = animateIn && !reduced;

  const translateY = useSharedValue(active ? -300 : 0);
  const rotate = useSharedValue(active ? -15 : -2);
  const scale = useSharedValue(active ? 1.4 : 1);
  const opacity = useSharedValue(active ? 0 : 1);

  useEffect(() => {
    if (active) {
      opacity.value = withTiming(1, { duration: motion.duration.fast });
      translateY.value = withSpring(0, motion.spring.polaroid);
      rotate.value = withSpring(-2, motion.spring.polaroid);
      scale.value = withSpring(1, motion.spring.polaroid, (finished) => {
        if (finished && onAnimationComplete) runOnJS(onAnimationComplete)();
      });
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      testID={testID}
      style={[
        {
          backgroundColor: colors.paper.highlight,
          padding: spacing.sm,
          paddingBottom: layout.polaroidBorderBottom,
          borderRadius: radius.xs,
          alignSelf: 'center',
        },
        animStyle,
      ]}
    >
      <View testID={`${testID}-art`} style={{ backgroundColor: colors.paper.cream, padding: spacing.xs }}>
        {grid.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row' }}>
            {row.map((cell, c) => (
              <View
                key={c}
                style={{ width: pixel, height: pixel, backgroundColor: cell === 1 ? colors.ink.primary : 'transparent' }}
              />
            ))}
          </View>
        ))}
      </View>
      <Text
        style={{
          fontFamily: typography.fontFamily.bodyItalic,
          fontStyle: 'italic',
          fontSize: typography.size.sm,
          color: colors.ink.soft,
          textAlign: 'center',
          marginTop: spacing.sm,
        }}
      >
        {caption}
      </Text>
    </Animated.View>
  );
}

export default Polaroid;
```
Add to `src/components/molecules/index.ts`:
```typescript
export { Polaroid, default as PolaroidDefault } from './Polaroid';
export type { PolaroidProps } from './Polaroid';
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- Polaroid && npx tsc --noEmit` → PASS (3), exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(molecules): add Polaroid

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: FieldEntryCard molecule

The case-file card with voice-style decoration. (COMPONENT_LIBRARY.md 2.5)

**Files:**
- Create: `src/components/molecules/FieldEntryCard.tsx`
- Modify: `src/components/molecules/index.ts`
- Test: `src/components/molecules/__tests__/FieldEntryCard.test.tsx`

**Interfaces:**
- Consumes: `@/theme`; `PaperSurface` from `@/components/atoms`; `FieldEntry`, `Grid` from `@/engine`.
- Produces: `FieldEntryCard` with props `{ entry: FieldEntry; thumbnail?: Grid; variant?: 'reveal'|'index'; testID?: string }`.

- [ ] **Step 1: Write the failing test**

Create `src/components/molecules/__tests__/FieldEntryCard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import { FieldEntryCard } from '@/components/molecules';
import type { FieldEntry } from '@/engine';

const base: FieldEntry = { title: 'MOTHMAN · CASE 014', body: 'Winged figure at dusk.', voiceStyle: 'notebook' };

describe('FieldEntryCard', () => {
  it('renders the title and body', () => {
    render(<FieldEntryCard entry={base} testID="entry" />);
    expect(screen.getByText('MOTHMAN · CASE 014')).toBeTruthy();
    expect(screen.getByText('Winged figure at dusk.')).toBeTruthy();
  });

  it('shows the victorian glyph for the victorian voice', () => {
    render(<FieldEntryCard entry={{ ...base, voiceStyle: 'victorian' }} testID="entry" />);
    expect(screen.getByTestId('entry-victorian')).toBeTruthy();
  });

  it('does not show the victorian glyph for the notebook voice', () => {
    render(<FieldEntryCard entry={base} testID="entry" />);
    expect(screen.queryByTestId('entry-victorian')).toBeNull();
  });

  it('renders a thumbnail when provided', () => {
    render(<FieldEntryCard entry={base} thumbnail={[[1, 0], [0, 1]]} testID="entry" />);
    expect(screen.getByTestId('entry-thumb')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- FieldEntryCard` → FAIL.

- [ ] **Step 3: Implement**

Create `src/components/molecules/FieldEntryCard.tsx`:
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { PaperSurface } from '@/components/atoms';
import { colors, typography, spacing, border } from '@/theme';
import { FieldEntry, Grid } from '@/engine';

export interface FieldEntryCardProps {
  entry: FieldEntry;
  thumbnail?: Grid;
  variant?: 'reveal' | 'index';
  testID?: string;
}

const THUMB_PIXEL = 4;

export function FieldEntryCard({ entry, thumbnail, variant = 'reveal', testID }: FieldEntryCardProps) {
  const isFirstPerson = entry.voiceStyle === 'firstPerson';
  const isVictorian = entry.voiceStyle === 'victorian';
  const bodySize = variant === 'index' ? typography.size.sm : typography.size.md;

  return (
    <PaperSurface variant="aged" padding="md" testID={testID} style={{ position: 'relative' }}>
      {isVictorian ? (
        <Text
          testID={`${testID}-victorian`}
          style={{ position: 'absolute', top: spacing.sm, right: spacing.sm, fontFamily: typography.fontFamily.body, fontSize: typography.size.lg, color: colors.ink.faded }}
        >
          ℘
        </Text>
      ) : null}

      {thumbnail ? (
        <View testID={`${testID}-thumb`} style={{ alignSelf: 'flex-start', marginBottom: spacing.sm }}>
          {thumbnail.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row' }}>
              {row.map((cell, c) => (
                <View key={c} style={{ width: THUMB_PIXEL, height: THUMB_PIXEL, backgroundColor: cell === 1 ? colors.ink.primary : 'transparent' }} />
              ))}
            </View>
          ))}
        </View>
      ) : null}

      <View
        style={
          isFirstPerson
            ? { borderLeftWidth: border.thick, borderLeftColor: colors.paper.shadow, borderStyle: 'dashed', paddingLeft: spacing.sm }
            : undefined
        }
      >
        <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.md, letterSpacing: typography.letterSpacing.wide, color: colors.ink.primary, textTransform: 'uppercase' }}>
          {entry.title}
        </Text>
        <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: bodySize, lineHeight: bodySize * 1.5, color: colors.ink.soft, marginTop: spacing.xs }}>
          {entry.body}
        </Text>
      </View>
    </PaperSurface>
  );
}

export default FieldEntryCard;
```
Add to `src/components/molecules/index.ts`:
```typescript
export { FieldEntryCard, default as FieldEntryCardDefault } from './FieldEntryCard';
export type { FieldEntryCardProps } from './FieldEntryCard';
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- FieldEntryCard && npx tsc --noEmit` → PASS (4), exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(molecules): add FieldEntryCard

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: RevealScreen component

Composes the stamp, polaroid, optional new-best, case file, and the "Add to Guide" button over a dark backdrop. (SCREEN_SPECS.md Screen 6)

**Files:**
- Create: `src/components/screens/RevealScreen.tsx`
- Modify: `src/components/screens/index.ts`
- Test: `src/components/screens/__tests__/RevealScreen.test.tsx`

**Interfaces:**
- Consumes: `@/theme`; `Puzzle` from `@/engine`; `Stamp`, `Button` from `@/components/atoms`; `Polaroid`, `FieldEntryCard` from `@/components/molecules`; `formatTime` from `@/utils/formatTime`.
- Produces: `RevealScreen` with props `{ puzzle: Puzzle; bestTime?: number; isNewBest?: boolean; onAddToGuide: () => void; testID?: string }`.

- [ ] **Step 1: Write the failing test**

Create `src/components/screens/__tests__/RevealScreen.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RevealScreen } from '@/components/screens';
import { buildPuzzle } from '@/content/buildPuzzle';
import type { FieldEntry, PuzzleMetadata } from '@/engine';

const entry: FieldEntry = { title: 'THE CROSSING · CASE 001', body: 'A shape at the crossing.', voiceStyle: 'notebook' };
const metadata: PuzzleMetadata = { regionId: 'pnw', order: 1, isCapstone: false };
const easyPuzzle = buildPuzzle({ id: 'r1', name: 'The Crossing', subtitle: 'Field Test', grid: [[1, 0], [0, 1]], entry, metadata });

describe('RevealScreen', () => {
  it('renders the confirmed stamp, polaroid caption, and case file', () => {
    render(<RevealScreen puzzle={easyPuzzle} onAddToGuide={() => {}} testID="reveal" />);
    expect(screen.getByText('Sighting Confirmed')).toBeTruthy();
    expect(screen.getByText(/The Crossing/)).toBeTruthy();
    expect(screen.getByText('THE CROSSING · CASE 001')).toBeTruthy();
    expect(screen.getByText('A shape at the crossing.')).toBeTruthy();
  });

  it('shows a new-best callout when isNewBest and bestTime are given', () => {
    render(<RevealScreen puzzle={easyPuzzle} bestTime={75} isNewBest onAddToGuide={() => {}} testID="reveal" />);
    expect(screen.getByText(/New Best · 01:15/)).toBeTruthy();
  });

  it('does not show the new-best callout without isNewBest', () => {
    render(<RevealScreen puzzle={easyPuzzle} bestTime={75} onAddToGuide={() => {}} testID="reveal" />);
    expect(screen.queryByText(/New Best/)).toBeNull();
  });

  it('calls onAddToGuide from the button', () => {
    const onAddToGuide = jest.fn();
    render(<RevealScreen puzzle={easyPuzzle} onAddToGuide={onAddToGuide} testID="reveal" />);
    fireEvent.press(screen.getByTestId('reveal-add'));
    expect(onAddToGuide).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- RevealScreen` → FAIL.

- [ ] **Step 3: Implement**

Create `src/components/screens/RevealScreen.tsx`:
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { Puzzle } from '@/engine';
import { Stamp, Button } from '@/components/atoms';
import { Polaroid, FieldEntryCard } from '@/components/molecules';
import { formatTime } from '@/utils/formatTime';

export interface RevealScreenProps {
  puzzle: Puzzle;
  bestTime?: number;
  isNewBest?: boolean;
  onAddToGuide: () => void;
  testID?: string;
}

export function RevealScreen({ puzzle, bestTime, isNewBest = false, onAddToGuide, testID }: RevealScreenProps) {
  const stampText = puzzle.difficulty.tier === 'Expert' ? 'Classified File' : 'Sighting Confirmed';
  return (
    <View
      testID={testID}
      style={{ flex: 1, backgroundColor: colors.ink.primary, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md }}
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
      <Button label="Add to Guide" fullWidth onPress={onAddToGuide} testID="reveal-add" />
    </View>
  );
}

export default RevealScreen;
```
Add to `src/components/screens/index.ts`:
```typescript
export { RevealScreen, default as RevealScreenDefault } from './RevealScreen';
export type { RevealScreenProps } from './RevealScreen';
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- RevealScreen && npx tsc --noEmit` → PASS (4), exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(screens): add RevealScreen

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: `/reveal/[id]` route + wire the win

Add the reveal route and make `PuzzlePlayScreen`'s `onSolved` navigate to it, closing the loop. (SCREEN_SPECS.md Screen 6 routing)

**Files:**
- Create: `src/app/reveal/[id].tsx`
- Modify: `src/app/puzzle/[id].tsx` (pass `onSolved`)

**Interfaces:**
- Consumes: `expo-router` (`useLocalSearchParams`, `useRouter`); `getSamplePuzzle` from `@/content/samplePuzzles`; `useProgressStore` from `@/state`; `RevealScreen` from `@/components/screens`.
- Produces: a `/reveal/[id]` route; the puzzle route now navigates to it on solve.

- [ ] **Step 1: Create the reveal route**

Create `src/app/reveal/[id].tsx`:
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography, spacing } from '@/theme';
import { getSamplePuzzle } from '@/content/samplePuzzles';
import { useProgressStore } from '@/state';
import { RevealScreen } from '@/components/screens';

export default function RevealRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const puzzle = typeof id === 'string' ? getSamplePuzzle(id) : undefined;
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
```
Note: "Add to Guide" returns to Home via `router.replace('/')` (replacing the reveal so back doesn't re-enter it). Returning to a Puzzle List instead is a later enhancement once that screen exists.

- [ ] **Step 2: Wire the puzzle route to navigate on solve**

Modify `src/app/puzzle/[id].tsx`: add `onSolved` to the `PuzzlePlayScreen` so it pushes the reveal. Change the render line to:
```tsx
return (
  <PuzzlePlayScreen
    puzzle={puzzle}
    mode={mode}
    onExit={() => router.back()}
    onSolved={() => router.push(`/reveal/${puzzle.id}`)}
  />
);
```
(The `puzzle`, `mode`, `router` are already in scope from the existing route.)

- [ ] **Step 3: Full suite + typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: entire suite green, tsc exit 0.

- [ ] **Step 4: Runnable check (headless bundle)**

Run:
```bash
rm -rf /tmp/cp-reveal-export && npx expo export --platform ios --output-dir /tmp/cp-reveal-export >/tmp/cp-reveal.log 2>&1; echo "export exit: $?"
```
Expected: `export exit: 0` (both routes bundle). If it fails, read `/tmp/cp-reveal.log`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(app): add /reveal/[id] route and navigate to it on solve

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the executor

- Molecules stay presentational (props-in); the route supplies the puzzle + best time.
- `Polaroid` uses the shared polaroid spring (`motion.spring.polaroid`) and respects reduced motion (appears in place). Don't add sound/haptics here.
- New-best detection is not plumbed through yet (the reveal shows best time from the progress store; `isNewBest` defaults false). Capturing the pre-solve best to light up "NEW BEST" is a small later enhancement.
- The full Reveal choreography timeline (staggered stamp → polaroid → entry → button) and modal presentation are polish for a later pass; this delivers the working payoff and navigation.
- After this, the loop is Home → puzzle → solve → reveal → back to Home.
