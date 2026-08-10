# Molecules Set 1 (Grid & List) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first molecule set from COMPONENT_LIBRARY.md Part 2 — `TierBadge`, `PuzzleCell`, `RegionCard`, `PuzzleCard` — styled from `@/theme`, composing the atoms + domain types, each with a test, exported from a molecules barrel.

**Architecture:** Molecules combine atoms and hold at most small local (animation) state; they receive data via props (COMPONENT_LIBRARY.md Part 2). They may import atoms and other molecules but never organisms. `PuzzleCell` is performance-critical (a grid renders hundreds), so it is `React.memo`-wrapped and animates on the native thread via Reanimated. Each lives under `src/components/molecules/` and is re-exported from `src/components/molecules/index.ts`.

**Tech Stack:** React Native + Expo, TypeScript, Reanimated 3/4, `expo-haptics`, `@expo/vector-icons` (Feather placeholder), Jest + `@testing-library/react-native` v13.

## Global Constraints

- Never inline color/spacing/font/radius/duration values; import from `@/theme`. (COMPONENT_LIBRARY.md Design System Quick Reference)
- Props are semantic; event handlers are `on<Verb>`. Molecules import atoms/molecules only — never organisms. (COMPONENT_LIBRARY.md Part 6)
- Text contrast ≥ 4.5:1 (non-large text). Where a spec-named text color would fail on a light background, choose a readable token and note it — the accessibility constraint governs. (QA_AND_LAUNCH.md §2.2)
- Every color signal has a non-color partner (tier = color + name text; solved = tint + check; locked = dim + lock icon). (QA_AND_LAUNCH.md §2.7)
- Touch targets ≥ 44pt for interactive rows; `PuzzleCell` may render smaller but its grid provides `hitSlop` later — the cell itself renders at its given `size`. (COMPONENT_LIBRARY.md Part 4)
- Animation respects `useReducedMotion()`. (QA_AND_LAUNCH.md §2.6)
- `@testing-library/react-native` is v13 — `render`/`fireEvent` are synchronous; do NOT `await` them.
- Every commit message ends with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Project root: `/home/chris/Code/cryptid-picross`.

---

### Task 1: TierBadge molecule

Small colored pill showing a puzzle's difficulty tier. (COMPONENT_LIBRARY.md 2.2)

**Files:**
- Create: `src/components/molecules/TierBadge.tsx`
- Create: `src/components/molecules/index.ts`
- Test: `src/components/molecules/__tests__/TierBadge.test.tsx`

**Interfaces:**
- Consumes: `@/theme`; `Tier` from `@/engine`.
- Produces: `TierBadge` with props `{ tier: Tier; size?: 'sm' | 'md'; testID?: string }`, and `src/components/molecules/index.ts` re-exporting it.

- [ ] **Step 1: Write the failing test**

Create `src/components/molecules/__tests__/TierBadge.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import { TierBadge } from '@/components/molecules';

const flat = (s: unknown) =>
  Array.isArray(s) ? Object.assign({}, ...(s as unknown[]).flat().filter(Boolean)) : (s as Record<string, unknown>);

describe('TierBadge', () => {
  it('renders the tier name in uppercase-capable text', () => {
    render(<TierBadge tier="Expert" testID="badge" />);
    expect(screen.getByText('Expert')).toBeTruthy();
  });

  it('colors Expert with the oxblood stamp red', () => {
    render(<TierBadge tier="Expert" testID="badge" />);
    expect(flat(screen.getByTestId('badge').props.style).backgroundColor).toBe('#9B3B2E');
  });

  it('colors Easy with the moss region tint', () => {
    render(<TierBadge tier="Easy" testID="badge" />);
    expect(flat(screen.getByTestId('badge').props.style).backgroundColor).toBe('#5D6B4E');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- TierBadge` → FAIL (no module `@/components/molecules`).

- [ ] **Step 3: Implement**

Create `src/components/molecules/TierBadge.tsx`:
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { colors, typography, spacing, radius } from '@/theme';
import { Tier } from '@/engine';

export interface TierBadgeProps {
  tier: Tier;
  size?: 'sm' | 'md';
  testID?: string;
}

const TIER_BG: Record<Tier, string> = {
  Easy: colors.region.pnw,
  Medium: colors.paper.shadow,
  Hard: colors.region.appalachia,
  Expert: colors.accent.stampRed,
};

// Medium's tint (paper.shadow) is light — cream text fails contrast there, so it
// gets ink text. The others are dark enough for cream. (WCAG AA governs over the
// spec's blanket "paper-cream".)
const TIER_TEXT: Record<Tier, string> = {
  Easy: colors.paper.cream,
  Medium: colors.ink.primary,
  Hard: colors.paper.cream,
  Expert: colors.paper.cream,
};

export function TierBadge({ tier, size = 'md', testID }: TierBadgeProps) {
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: TIER_BG[tier],
        borderRadius: radius.xs,
        paddingVertical: spacing.xxs,
        paddingHorizontal: spacing.sm,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: typography.fontFamily.display,
          fontSize: size === 'sm' ? typography.size.xs : typography.size.sm,
          letterSpacing: typography.letterSpacing.wider,
          color: TIER_TEXT[tier],
          textTransform: 'uppercase',
        }}
      >
        {tier}
      </Text>
    </View>
  );
}

export default TierBadge;
```

Create `src/components/molecules/index.ts`:
```typescript
export { TierBadge, default as TierBadgeDefault } from './TierBadge';
export type { TierBadgeProps } from './TierBadge';
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- TierBadge && npx tsc --noEmit` → PASS (3), exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(molecules): add TierBadge

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: PuzzleCell molecule

The individual, performance-critical grid cell: empty/filled/marked/wrong, tap scale, wrong-shake, haptics. Memoized. (COMPONENT_LIBRARY.md 2.1)

**Files:**
- Create: `src/components/molecules/PuzzleCell.tsx`
- Modify: `src/components/molecules/index.ts`
- Test: `src/components/molecules/__tests__/PuzzleCell.test.tsx`

**Interfaces:**
- Consumes: `@/theme`; `PlayCell` from `@/engine`; `react-native-reanimated`; `expo-haptics`.
- Produces: `PuzzleCell` (a `React.memo` component) with props:
  ```typescript
  interface PuzzleCellProps {
    state: PlayCell;               // 0 | 1 | 2
    isWrong?: boolean;             // Cozy mode wrong highlight
    size: number;                  // px edge
    onPress: () => void;
    boldRight?: boolean;           // 5x5 divider
    boldBottom?: boolean;
    accessibilityLabel?: string;   // grid supplies "row 3, column 5, filled"
    testID?: string;
  }
  ```

- [ ] **Step 1: Write the failing test**

Create `src/components/molecules/__tests__/PuzzleCell.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PuzzleCell } from '@/components/molecules';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const flat = (s: unknown) =>
  Array.isArray(s) ? Object.assign({}, ...(s as unknown[]).flat().filter(Boolean)) : (s as Record<string, unknown>);

describe('PuzzleCell', () => {
  it('renders an empty cell with the paper-cream fill', () => {
    render(<PuzzleCell state={0} size={24} onPress={() => {}} testID="cell" />);
    expect(flat(screen.getByTestId('cell').props.style).backgroundColor).toBe('#F1E8D3');
  });

  it('renders a filled cell with ink', () => {
    render(<PuzzleCell state={1} size={24} onPress={() => {}} testID="cell" />);
    expect(flat(screen.getByTestId('cell').props.style).backgroundColor).toBe('#2B241B');
  });

  it('renders a marked cell with an × glyph', () => {
    render(<PuzzleCell state={2} size={24} onPress={() => {}} testID="cell" />);
    expect(screen.getByText('×')).toBeTruthy();
  });

  it('renders a wrong cell with the warning red fill (Cozy mode)', () => {
    render(<PuzzleCell state={1} isWrong size={24} onPress={() => {}} testID="cell" />);
    expect(flat(screen.getByTestId('cell').props.style).backgroundColor).toBe('#9B3B2E');
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<PuzzleCell state={0} size={24} onPress={onPress} testID="cell" />);
    fireEvent.press(screen.getByTestId('cell'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes its accessibility label', () => {
    render(<PuzzleCell state={1} size={24} onPress={() => {}} accessibilityLabel="row 1, column 1, filled" testID="cell" />);
    expect(screen.getByTestId('cell').props.accessibilityLabel).toBe('row 1, column 1, filled');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- PuzzleCell` → FAIL.

- [ ] **Step 3: Implement**

Create `src/components/molecules/PuzzleCell.tsx`:
```tsx
import React, { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography } from '@/theme';
import { PlayCell } from '@/engine';

export interface PuzzleCellProps {
  state: PlayCell;
  isWrong?: boolean;
  size: number;
  onPress: () => void;
  boldRight?: boolean;
  boldBottom?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function fillFor(state: PlayCell, isWrong: boolean): string {
  if (isWrong) return colors.cell.wrong;
  if (state === 1) return colors.cell.filled;
  if (state === 2) return colors.cell.marked;
  return colors.cell.empty;
}

function PuzzleCellBase({
  state,
  isWrong = false,
  size,
  onPress,
  boldRight = false,
  boldBottom = false,
  accessibilityLabel,
  testID,
}: PuzzleCellProps) {
  const scale = useSharedValue(1);
  const shake = useSharedValue(0);
  const reduced = useReducedMotion();

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: shake.value }],
  }));

  useEffect(() => {
    if (isWrong && !reduced) {
      shake.value = withSequence(
        withTiming(-3, { duration: 40 }),
        withTiming(3, { duration: 40 }),
        withTiming(0, { duration: 40 }),
      );
    }
  }, [isWrong, reduced, shake]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!reduced) {
      scale.value = withSequence(withTiming(0.9, { duration: 50 }), withTiming(1, { duration: 50 }));
    }
    onPress();
  };

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={handlePress}
      style={[
        {
          width: size,
          height: size,
          backgroundColor: fillFor(state, isWrong),
          borderWidth: 1,
          borderColor: colors.cell.emptyBorder,
          borderRightWidth: boldRight ? 2 : 1,
          borderBottomWidth: boldBottom ? 2 : 1,
          borderRightColor: boldRight ? colors.ink.faded : colors.cell.emptyBorder,
          borderBottomColor: boldBottom ? colors.ink.faded : colors.cell.emptyBorder,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animStyle,
      ]}
    >
      {state === 2 && !isWrong ? (
        <Text
          allowFontScaling={false}
          style={{ color: colors.cell.markGlyph, fontFamily: typography.fontFamily.display, fontSize: size * 0.6 }}
        >
          ×
        </Text>
      ) : null}
    </AnimatedPressable>
  );
}

// Memoized — a 25x25 grid renders 625 of these and re-renders on every tap.
export const PuzzleCell = React.memo(PuzzleCellBase);

export default PuzzleCell;
```
Add to `src/components/molecules/index.ts`:
```typescript
export { PuzzleCell, default as PuzzleCellDefault } from './PuzzleCell';
export type { PuzzleCellProps } from './PuzzleCell';
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- PuzzleCell && npx tsc --noEmit` → PASS (6), exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(molecules): add PuzzleCell

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: RegionCard molecule

A row in the region-select list: swatch, name, progress, lock/coming-soon state. (COMPONENT_LIBRARY.md 2.3)

**Files:**
- Create: `src/components/molecules/RegionCard.tsx`
- Modify: `src/components/molecules/index.ts`
- Test: `src/components/molecules/__tests__/RegionCard.test.tsx`

**Interfaces:**
- Consumes: `@/theme`; `PaperSurface` from `@/components/atoms`; `Region` from `@/engine`; `Feather` from `@expo/vector-icons`.
- Produces: `RegionCard` with props:
  ```typescript
  interface RegionCardProps {
    region: Region;
    progress: { solved: number; total: number };
    isLocked: boolean;
    isComingSoon: boolean;
    onPress: () => void;
    testID?: string;
  }
  ```

- [ ] **Step 1: Write the failing test**

Create `src/components/molecules/__tests__/RegionCard.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RegionCard } from '@/components/molecules';
import type { Region } from '@/engine';

const REGION = {
  id: 'pnw',
  name: 'The Pacific Northwest',
  tagline: 'Where the trees watch',
  tint: '#5D6B4E',
  puzzles: [],
  totalPuzzles: 100,
  isFree: true,
} as unknown as Region;

const flat = (s: unknown) =>
  Array.isArray(s) ? Object.assign({}, ...(s as unknown[]).flat().filter(Boolean)) : (s as Record<string, unknown>);

describe('RegionCard', () => {
  it('renders the region name and progress', () => {
    render(<RegionCard region={REGION} progress={{ solved: 12, total: 100 }} isLocked={false} isComingSoon={false} onPress={() => {}} testID="card" />);
    expect(screen.getByText('The Pacific Northwest')).toBeTruthy();
    expect(screen.getByText(/12\s*\/\s*100/)).toBeTruthy();
  });

  it('dims and shows a lock affordance when locked', () => {
    render(<RegionCard region={REGION} progress={{ solved: 0, total: 100 }} isLocked isComingSoon={false} onPress={() => {}} testID="card" />);
    expect(flat(screen.getByTestId('card').props.style).opacity).toBeCloseTo(0.45, 2);
    expect(screen.getByTestId('card-lock')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<RegionCard region={REGION} progress={{ solved: 0, total: 100 }} isLocked={false} isComingSoon={false} onPress={onPress} testID="card" />);
    fireEvent.press(screen.getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- RegionCard` → FAIL.

- [ ] **Step 3: Implement**

Create `src/components/molecules/RegionCard.tsx`:
```tsx
import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PaperSurface } from '@/components/atoms';
import { colors, typography, spacing, radius, border, layout } from '@/theme';
import { Region } from '@/engine';

export interface RegionCardProps {
  region: Region;
  progress: { solved: number; total: number };
  isLocked: boolean;
  isComingSoon: boolean;
  onPress: () => void;
  testID?: string;
}

export function RegionCard({ region, progress, isLocked, isComingSoon, onPress, testID }: RegionCardProps) {
  const showLock = isLocked || isComingSoon;
  const subtitle = isComingSoon
    ? 'Coming soon'
    : isLocked
      ? 'Locked · tap to unlock'
      : `${progress.solved} / ${progress.total} sightings`;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${region.name}${isLocked ? ', locked' : ''}`}
      onPress={onPress}
      style={{ opacity: isLocked ? 0.45 : 1, marginVertical: spacing.xs }}
    >
      <PaperSurface
        variant="aged"
        padding="md"
        style={
          isComingSoon
            ? { borderWidth: border.thin, borderColor: colors.paper.shadow, borderStyle: 'dashed' }
            : undefined
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: layout.touchTarget }}>
          <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: region.tint }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.md, color: colors.ink.primary, letterSpacing: typography.letterSpacing.wide }}>
              {region.name}
            </Text>
            <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.xs, color: colors.ink.faded, marginTop: spacing.xxs }}>
              {subtitle}
            </Text>
          </View>
          <Feather
            testID={showLock ? `${testID}-lock` : `${testID}-chevron`}
            name={showLock ? 'lock' : 'chevron-right'}
            size={20}
            color={colors.ink.soft}
          />
        </View>
      </PaperSurface>
    </Pressable>
  );
}

export default RegionCard;
```
Add to `src/components/molecules/index.ts`:
```typescript
export { RegionCard, default as RegionCardDefault } from './RegionCard';
export type { RegionCardProps } from './RegionCard';
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- RegionCard && npx tsc --noEmit` → PASS (3), exit 0.

Note: the `Feather` component in tests uses the existing global mock at `__mocks__/@expo/vector-icons.js`; it must forward `testID` so `card-lock` is queryable. If that mock does not forward `testID`, update the mock to render a host element carrying the passed `testID` (do not remove the mock). Document any mock change.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(molecules): add RegionCard

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: PuzzleCard molecule + time helper

A row in the puzzle list: sighting label, name-or-???, size + TierBadge, best time + check when solved. (COMPONENT_LIBRARY.md 2.4)

**Files:**
- Create: `src/utils/formatTime.ts`
- Create: `src/components/molecules/PuzzleCard.tsx`
- Modify: `src/components/molecules/index.ts`
- Test: `src/utils/__tests__/formatTime.test.ts`
- Test: `src/components/molecules/__tests__/PuzzleCard.test.tsx`

**Interfaces:**
- Consumes: `@/theme`; `PaperSurface` from `@/components/atoms`; `TierBadge` from `@/components/molecules`; `Tier` from `@/engine`.
- Produces:
  - `formatTime(seconds: number): string` — `MM:SS`
  - `PuzzleCard` with props:
    ```typescript
    interface PuzzleCardProps {
      puzzleNumber: number;
      puzzleName: string;   // "???" when unsolved
      size: string;         // "10x8"
      tier: Tier;
      isSolved: boolean;
      bestTime?: number;    // seconds
      bestMistakes?: number;
      onPress: () => void;
      testID?: string;
    }
    ```

- [ ] **Step 1: Write the failing tests**

Create `src/utils/__tests__/formatTime.test.ts`:
```typescript
import { formatTime } from '@/utils/formatTime';

describe('formatTime', () => {
  it('formats sub-minute times', () => {
    expect(formatTime(9)).toBe('00:09');
    expect(formatTime(59)).toBe('00:59');
  });
  it('formats minutes and seconds', () => {
    expect(formatTime(75)).toBe('01:15');
    expect(formatTime(600)).toBe('10:00');
  });
  it('floors fractional seconds and clamps negatives to zero', () => {
    expect(formatTime(42.9)).toBe('00:42');
    expect(formatTime(-5)).toBe('00:00');
  });
});
```

Create `src/components/molecules/__tests__/PuzzleCard.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PuzzleCard } from '@/components/molecules';

describe('PuzzleCard', () => {
  it('hides the name as ??? when unsolved and shows the sighting number', () => {
    render(<PuzzleCard puzzleNumber={1} puzzleName="The Roadside Encounter" size="8x8" tier="Easy" isSolved={false} onPress={() => {}} testID="card" />);
    expect(screen.getByText('???')).toBeTruthy();
    expect(screen.getByText(/SIGHTING\s*001/)).toBeTruthy();
    expect(screen.queryByText('The Roadside Encounter')).toBeNull();
  });

  it('reveals the name, a check, and the best time when solved', () => {
    render(<PuzzleCard puzzleNumber={14} puzzleName="The Colony" size="10x8" tier="Medium" isSolved bestTime={75} bestMistakes={1} onPress={() => {}} testID="card" />);
    expect(screen.getByText('The Colony')).toBeTruthy();
    expect(screen.getByText(/01:15/)).toBeTruthy();
    expect(screen.getByTestId('card-check')).toBeTruthy();
  });

  it('renders a tier badge and calls onPress', () => {
    const onPress = jest.fn();
    render(<PuzzleCard puzzleNumber={2} puzzleName="???" size="5x5" tier="Expert" isSolved={false} onPress={onPress} testID="card" />);
    expect(screen.getByText('Expert')).toBeTruthy();
    fireEvent.press(screen.getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test -- formatTime PuzzleCard` → FAIL.

- [ ] **Step 3: Implement**

Create `src/utils/formatTime.ts`:
```typescript
/** Seconds -> "MM:SS". Floors fractional seconds; clamps negatives to zero. */
export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(mm)}:${pad(ss)}`;
}
```

Create `src/components/molecules/PuzzleCard.tsx`:
```tsx
import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PaperSurface } from '@/components/atoms';
import { colors, typography, spacing } from '@/theme';
import { Tier } from '@/engine';
import { formatTime } from '@/utils/formatTime';
import { TierBadge } from './TierBadge';

export interface PuzzleCardProps {
  puzzleNumber: number;
  puzzleName: string;
  size: string;
  tier: Tier;
  isSolved: boolean;
  bestTime?: number;
  bestMistakes?: number;
  onPress: () => void;
  testID?: string;
}

const pad3 = (n: number) => String(n).padStart(3, '0');

export function PuzzleCard({
  puzzleNumber,
  puzzleName,
  size,
  tier,
  isSolved,
  bestTime,
  bestMistakes,
  onPress,
  testID,
}: PuzzleCardProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`Sighting ${pad3(puzzleNumber)}${isSolved ? `, ${puzzleName}, solved` : ', unsolved'}`}
      onPress={onPress}
      style={{ marginVertical: spacing.xs }}
    >
      <PaperSurface variant={isSolved ? 'cream' : 'aged'} padding="md" regionTint={isSolved ? colors.region.pnw : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.xs, letterSpacing: typography.letterSpacing.wider, color: colors.ink.faded }}>
              {`SIGHTING ${pad3(puzzleNumber)}`}
            </Text>
            <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.md, color: colors.ink.primary, marginTop: spacing.xxs }}>
              {isSolved ? puzzleName : '???'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
              <Text style={{ fontFamily: typography.fontFamily.body, fontSize: typography.size.xs, color: colors.ink.soft }}>{size}</Text>
              <TierBadge tier={tier} size="sm" />
            </View>
            {isSolved && bestTime !== undefined ? (
              <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.xs, color: colors.ink.faded, marginTop: spacing.xs }}>
                {`best ${formatTime(bestTime)}${bestMistakes !== undefined ? ` · ${bestMistakes} mistakes` : ''}`}
              </Text>
            ) : null}
          </View>
          {isSolved ? <Feather testID={`${testID}-check`} name="check" size={22} color={colors.region.pnw} /> : null}
        </View>
      </PaperSurface>
    </Pressable>
  );
}

export default PuzzleCard;
```
Add to `src/components/molecules/index.ts`:
```typescript
export { PuzzleCard, default as PuzzleCardDefault } from './PuzzleCard';
export type { PuzzleCardProps } from './PuzzleCard';
```

- [ ] **Step 4: Run the FULL suite + typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: entire suite green (molecules + state + engine + atoms + scaffold), tsc exit 0.

- [ ] **Step 5: Coverage check**

Run:
```bash
npx jest --coverage --collectCoverageFrom='src/components/molecules/**/*.tsx' --collectCoverageFrom='src/utils/formatTime.ts' src/components/molecules src/utils/__tests__/formatTime.test.ts 2>&1 | tail -20
```
Expected: molecules + formatTime ≥ 85% statements/lines. If a branch is uncovered (e.g. `bestMistakes` undefined path, coming-soon border), add a focused test.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(molecules): add PuzzleCard + formatTime helper

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the executor

- Molecules import atoms (`PaperSurface`) and other molecules (`TierBadge`) — never organisms.
- `PuzzleCell` MUST stay `React.memo`-wrapped; the grid renders hundreds and re-renders on every tap.
- Reanimated animations respect `useReducedMotion()`; the jest reanimated mock (already configured) makes them render in tests.
- The `@expo/vector-icons` global jest mock must forward `testID` for the RegionCard lock and PuzzleCard check queries — extend the mock if needed, don't remove it.
- Tier text colors intentionally deviate from the spec's blanket "paper-cream" for the light Medium tier (ink text) to meet WCAG contrast — the accessibility constraint governs.
- Reveal molecules (`Polaroid`, `FieldEntryCard`), `ModeToggle`, and `WorldMapPin` are a SEPARATE later set — not built here.
