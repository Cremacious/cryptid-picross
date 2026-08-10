# Puzzle Play Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Assemble the first runnable, playable screen: the `PuzzleToolbar` organism, a `buildPuzzle` helper + sample puzzles, the `PuzzlePlayScreen` component (chrome + grid + toolbar, wiring undo/hint/tool and win → `progressStore.markSolved`), and a `/puzzle/[id]` route reachable from Home.

**Architecture:** `PuzzleToolbar` is a presentational organism (IconButtons + a Button) driven entirely by props. `buildPuzzle` runs the engine (`deriveClues`, `analyzePuzzle`, `scoreDifficulty`) to fill a `Puzzle`'s derived fields from a hand-authored grid — a runtime stand-in for the future content pipeline — and `samplePuzzles` provides a couple of small dev puzzles. `PuzzlePlayScreen` composes the `PuzzleGrid` organism + `PuzzleToolbar`, reads/writes the `uiStore` for tool/undo/hint, shows a live timer + mistake count, and on win calls `progressStore.markSolved`. Hint is implemented with the existing `uiStore.tap(r, c, 'fill')` on a correct-but-unfilled cell — no store change needed. The Expo Router route is thin: it resolves the sample puzzle by id and renders the screen.

**Tech Stack:** React Native + Expo Router, TypeScript, Zustand (`@/state`), engine (`@/engine`), Jest + `@testing-library/react-native` v13.

## Global Constraints

- Never inline color/spacing/font values; import from `@/theme`. (COMPONENT_LIBRARY.md Design System Quick Reference)
- Organisms/screens import atoms, molecules, organisms, and stores; screens may also use router + content. Atoms/molecules never import upward. (COMPONENT_LIBRARY.md Part 6)
- Do NOT hand-author `rowClues`/`colClues`/`difficulty`/`fillRatio`/`isUnique`/`requiresGuessing` — derive them via the engine (`buildPuzzle`). (DATA_AND_ENGINE.md §2.1 note)
- Hint reveals a correct-but-unfilled cell via `uiStore.tap(r, c, 'fill')` (fill override); it must not count as a mistake (filling a target cell never does) and is limited to 3 per puzzle. (SCREEN_SPECS.md Screen 5)
- On win, the screen calls `progressStore.markSolved(puzzle.id, { time, mistakes })`. (SCREEN_SPECS.md Screen 5 analytics/behavior)
- Toolbar: Fill/Mark are toggles (active state visible); Undo disabled when `!canUndo`; Hint shows remaining count and disables at 0; `Check My Work` Button shows only in Classic mode. (COMPONENT_LIBRARY.md 3.3)
- `@testing-library/react-native` is v13 — synchronous `render`/`fireEvent`; reset the singleton `uiStore` (and `progressStore` where asserted) in `beforeEach`.
- Every commit message ends with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Project root: `/home/chris/Code/cryptid-picross`.

---

### Task 1: PuzzleToolbar organism

The bottom toolbar: Fill / Mark / Undo / Hint (+ Check My Work in Classic). Presentational — driven by props. (COMPONENT_LIBRARY.md 3.3)

**Files:**
- Create: `src/components/organisms/PuzzleToolbar.tsx`
- Modify: `src/components/organisms/index.ts`
- Test: `src/components/organisms/__tests__/PuzzleToolbar.test.tsx`

**Interfaces:**
- Consumes: `@/theme`; `IconButton` + `Button` from `@/components/atoms`.
- Produces: `PuzzleToolbar` with props:
  ```typescript
  interface PuzzleToolbarProps {
    activeTool: 'fill' | 'mark';
    mode: 'cozy' | 'classic';
    onToolChange: (tool: 'fill' | 'mark') => void;
    onUndo: () => void;
    onHint: () => void;
    onCheckWork?: () => void;
    canUndo: boolean;
    hintCount: number;
    testID?: string;
  }
  ```

- [ ] **Step 1: Write the failing test**

Create `src/components/organisms/__tests__/PuzzleToolbar.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PuzzleToolbar } from '@/components/organisms';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const baseProps = {
  activeTool: 'fill' as const,
  mode: 'cozy' as const,
  onToolChange: jest.fn(),
  onUndo: jest.fn(),
  onHint: jest.fn(),
  canUndo: true,
  hintCount: 3,
};

describe('PuzzleToolbar', () => {
  it('renders the four core tools', () => {
    render(<PuzzleToolbar {...baseProps} />);
    expect(screen.getByTestId('tool-fill')).toBeTruthy();
    expect(screen.getByTestId('tool-mark')).toBeTruthy();
    expect(screen.getByTestId('tool-undo')).toBeTruthy();
    expect(screen.getByTestId('tool-hint')).toBeTruthy();
  });

  it('switches tool when Mark is tapped', () => {
    const onToolChange = jest.fn();
    render(<PuzzleToolbar {...baseProps} onToolChange={onToolChange} />);
    fireEvent.press(screen.getByTestId('tool-mark'));
    expect(onToolChange).toHaveBeenCalledWith('mark');
  });

  it('does not undo when canUndo is false', () => {
    const onUndo = jest.fn();
    render(<PuzzleToolbar {...baseProps} canUndo={false} onUndo={onUndo} />);
    fireEvent.press(screen.getByTestId('tool-undo'));
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('shows the hint count and disables hint at zero', () => {
    const onHint = jest.fn();
    render(<PuzzleToolbar {...baseProps} hintCount={0} onHint={onHint} />);
    fireEvent.press(screen.getByTestId('tool-hint'));
    expect(onHint).not.toHaveBeenCalled();
  });

  it('shows Check My Work only in Classic mode and calls it', () => {
    const onCheckWork = jest.fn();
    const { rerender } = render(<PuzzleToolbar {...baseProps} mode="cozy" onCheckWork={onCheckWork} />);
    expect(screen.queryByTestId('tool-check')).toBeNull();
    rerender(<PuzzleToolbar {...baseProps} mode="classic" onCheckWork={onCheckWork} />);
    fireEvent.press(screen.getByTestId('tool-check'));
    expect(onCheckWork).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- PuzzleToolbar` → FAIL.

- [ ] **Step 3: Implement**

Create `src/components/organisms/PuzzleToolbar.tsx`:
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { IconButton, Button } from '@/components/atoms';
import { colors, typography, spacing, radius, layout, border } from '@/theme';

export interface PuzzleToolbarProps {
  activeTool: 'fill' | 'mark';
  mode: 'cozy' | 'classic';
  onToolChange: (tool: 'fill' | 'mark') => void;
  onUndo: () => void;
  onHint: () => void;
  onCheckWork?: () => void;
  canUndo: boolean;
  hintCount: number;
  testID?: string;
}

export function PuzzleToolbar({
  activeTool,
  mode,
  onToolChange,
  onUndo,
  onHint,
  onCheckWork,
  canUndo,
  hintCount,
  testID,
}: PuzzleToolbarProps) {
  const noHints = hintCount <= 0;
  return (
    <View
      testID={testID}
      style={{
        borderTopWidth: border.thin,
        borderTopColor: colors.paper.shadow,
        borderStyle: 'dashed',
        paddingTop: spacing.sm,
        gap: spacing.sm,
      }}
    >
      {mode === 'classic' && onCheckWork ? (
        <Button label="Check My Work" variant="secondary" fullWidth onPress={onCheckWork} testID="tool-check" />
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', minHeight: layout.toolbarHeight }}>
        <IconButton
          icon="fill"
          variant={activeTool === 'fill' ? 'active' : 'default'}
          accessibilityLabel="Fill tool"
          onPress={() => onToolChange('fill')}
          testID="tool-fill"
        />
        <IconButton
          icon="mark"
          variant={activeTool === 'mark' ? 'active' : 'default'}
          accessibilityLabel="Mark tool"
          onPress={() => onToolChange('mark')}
          testID="tool-mark"
        />
        <IconButton
          icon="undo"
          variant="default"
          disabled={!canUndo}
          accessibilityLabel="Undo"
          onPress={onUndo}
          testID="tool-undo"
        />
        <View>
          <IconButton
            icon="hint"
            variant="default"
            disabled={noHints}
            accessibilityLabel={`Hint, ${hintCount} remaining`}
            onPress={onHint}
            testID="tool-hint"
          />
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              minWidth: 18,
              height: 18,
              borderRadius: radius.full,
              backgroundColor: colors.accent.candleGlow,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 2,
            }}
          >
            <Text allowFontScaling={false} style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.xs, color: colors.ink.primary }}>
              {hintCount}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default PuzzleToolbar;
```
Add to `src/components/organisms/index.ts`:
```typescript
export { PuzzleToolbar, default as PuzzleToolbarDefault } from './PuzzleToolbar';
export type { PuzzleToolbarProps } from './PuzzleToolbar';
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- PuzzleToolbar && npx tsc --noEmit` → PASS (5), exit 0.

Note: `IconButton` disabled means its `onPress` no-ops internally, so the "no undo / no hint when disabled" tests pass through the atom's own guard.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(organisms): add PuzzleToolbar

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: buildPuzzle helper + sample puzzles

Derive a full `Puzzle` from an authored grid using the engine, and provide a couple of small dev puzzles so screens have real content before the pipeline exists. (DATA_AND_ENGINE.md §2.1, §5)

**Files:**
- Create: `src/content/buildPuzzle.ts`
- Create: `src/content/samplePuzzles.ts`
- Test: `src/content/__tests__/buildPuzzle.test.ts`

**Interfaces:**
- Consumes: `@/engine` (`Grid`, `Puzzle`, `FieldEntry`, `PuzzleMetadata`, `deriveClues`, `analyzePuzzle`, `scoreDifficulty`).
- Produces:
  - `buildPuzzle(input: { id; name; subtitle; grid; entry; metadata }): Puzzle`
  - `samplePuzzles: Puzzle[]` and `getSamplePuzzle(id: string): Puzzle | undefined`

- [ ] **Step 1: Write the failing test**

Create `src/content/__tests__/buildPuzzle.test.ts`:
```typescript
import { buildPuzzle } from '@/content/buildPuzzle';
import { getSamplePuzzle, samplePuzzles } from '@/content/samplePuzzles';
import type { FieldEntry, PuzzleMetadata } from '@/engine';

const entry: FieldEntry = { title: 'X', body: 'Y', voiceStyle: 'notebook' };
const metadata: PuzzleMetadata = { regionId: 'pnw', order: 1, isCapstone: false };

describe('buildPuzzle', () => {
  it('derives clues, fill ratio, uniqueness, and difficulty from the grid', () => {
    const p = buildPuzzle({
      id: 'plus',
      name: 'Plus',
      subtitle: 'test',
      grid: [
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [1, 1, 1, 1, 1],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
      ],
      entry,
      metadata,
    });
    expect(p.rowClues).toEqual([[1], [1], [5], [1], [1]]);
    expect(p.colClues).toEqual([[1], [1], [5], [1], [1]]);
    expect(p.fillRatio).toBeCloseTo(9 / 25, 5);
    expect(p.isUnique).toBe(true);
    expect(p.requiresGuessing).toBe(false);
    expect(p.difficulty.tier).toBe('Easy');
  });
});

describe('samplePuzzles', () => {
  it('provides at least one uniquely-solvable puzzle with a field entry', () => {
    expect(samplePuzzles.length).toBeGreaterThanOrEqual(1);
    samplePuzzles.forEach((p) => {
      expect(p.isUnique).toBe(true);
      expect(p.entry.body.length).toBeGreaterThan(0);
      expect(p.rowClues.length).toBe(p.grid.length);
    });
  });

  it('looks up a sample by id', () => {
    const first = samplePuzzles[0];
    expect(getSamplePuzzle(first.id)?.id).toBe(first.id);
    expect(getSamplePuzzle('nope')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- buildPuzzle` → FAIL.

- [ ] **Step 3: Implement**

Create `src/content/buildPuzzle.ts`:
```typescript
import {
  Grid,
  Puzzle,
  FieldEntry,
  PuzzleMetadata,
  deriveClues,
  analyzePuzzle,
  scoreDifficulty,
} from '@/engine';

export interface PuzzleInput {
  id: string;
  name: string;
  subtitle: string;
  grid: Grid;
  entry: FieldEntry;
  metadata: PuzzleMetadata;
}

/** Derive all engine-computed fields from an authored grid (runtime content-import). */
export function buildPuzzle(input: PuzzleInput): Puzzle {
  const { grid } = input;
  const { row, col } = deriveClues(grid);
  const { unique, depth } = analyzePuzzle(row, col);
  const difficulty = scoreDifficulty(grid, row, col, unique, depth);
  const area = grid.length * (grid[0]?.length ?? 0);
  const filled = grid.reduce((sum, line) => sum + line.reduce((a, b) => a + b, 0), 0);
  return {
    ...input,
    rowClues: row,
    colClues: col,
    fillRatio: area > 0 ? filled / area : 0,
    isUnique: unique,
    requiresGuessing: !unique,
    difficulty,
  };
}
```

Create `src/content/samplePuzzles.ts`:
```typescript
import { Puzzle } from '@/engine';
import { buildPuzzle } from './buildPuzzle';

// Small hand-authored dev puzzles (stand-in until the content pipeline lands).
export const samplePuzzles: Puzzle[] = [
  buildPuzzle({
    id: 'sample-plus',
    name: 'The Crossing',
    subtitle: 'Unidentified · Field Test',
    grid: [
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
    ],
    entry: {
      title: 'THE CROSSING · Case 001',
      body: 'A shape stood at the intersection of two logging roads at dusk. By the time the truck slowed, only the crossing remained. Recommend the file stay open.',
      voiceStyle: 'notebook',
      yearReported: 1974,
      witnessCredibility: 'medium',
    },
    metadata: { regionId: 'pnw', order: 1, isCapstone: false },
  }),
  buildPuzzle({
    id: 'sample-eye',
    name: 'The Watcher',
    subtitle: 'Unidentified · Field Test',
    grid: [
      [0, 1, 1, 1, 0],
      [1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1],
      [0, 1, 1, 1, 0],
    ],
    entry: {
      title: 'THE WATCHER · Case 002',
      body: 'Reported as a single reflective eye in the treeline that did not blink for eleven minutes. The witness blinked first.',
      voiceStyle: 'firstPerson',
      yearReported: 1988,
      witnessCredibility: 'low',
    },
    metadata: { regionId: 'pnw', order: 2, isCapstone: false },
  }),
];

export function getSamplePuzzle(id: string): Puzzle | undefined {
  return samplePuzzles.find((p) => p.id === id);
}
```
Note: both sample grids must be uniquely solvable (the test asserts `isUnique`). If `analyzePuzzle` reports a sample as non-unique, replace that grid with one that is (keep it a recognizable 5×5 shape) — do not weaken the test.

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- buildPuzzle && npx tsc --noEmit` → PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(content): add buildPuzzle helper + sample puzzles

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: PuzzlePlayScreen component

Composes the chrome (back, tier badge, title, timer + mistakes), the `PuzzleGrid`, and the `PuzzleToolbar`; wires tool/undo/hint and win → `progressStore.markSolved`. (SCREEN_SPECS.md Screen 5)

**Files:**
- Create: `src/components/screens/PuzzlePlayScreen.tsx`
- Create: `src/components/screens/index.ts`
- Test: `src/components/screens/__tests__/PuzzlePlayScreen.test.tsx`

**Interfaces:**
- Consumes: `@/theme`; `@/engine` (`Puzzle`); `useUiStore`, `useProgressStore` from `@/state`; `PuzzleGrid`, `PuzzleToolbar` from `@/components/organisms`; `IconButton` from `@/components/atoms`; `TierBadge` from `@/components/molecules`; `formatTime` from `@/utils/formatTime`.
- Produces: `PuzzlePlayScreen` with props:
  ```typescript
  interface PuzzlePlayScreenProps {
    puzzle: Puzzle;
    mode: 'cozy' | 'classic';
    onExit: () => void;
    onSolved?: (time: number, mistakes: number) => void;
  }
  ```

- [ ] **Step 1: Write the failing test**

Create `src/components/screens/__tests__/PuzzlePlayScreen.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PuzzlePlayScreen } from '@/components/screens';
import { buildPuzzle } from '@/content/buildPuzzle';
import { useUiStore, useProgressStore } from '@/state';
import type { FieldEntry, PuzzleMetadata } from '@/engine';

jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light' } }));

const entry: FieldEntry = { title: 'X', body: 'Y', voiceStyle: 'notebook' };
const metadata: PuzzleMetadata = { regionId: 'pnw', order: 7, isCapstone: false };
const PUZZLE = buildPuzzle({ id: 'p-test', name: 'Test', subtitle: 'sub', grid: [[1, 0], [0, 1]], entry, metadata });

beforeEach(() => {
  useUiStore.setState({ target: null, cellState: [], history: [], tool: 'fill', errors: 0, status: 'idle', startedAt: null, elapsedMs: null });
  useProgressStore.getState().hydrate({ solved: {}, onboardingCompleted: false, firstLaunchAt: 0 });
});

describe('PuzzlePlayScreen', () => {
  it('renders the grid, toolbar, tier badge, and timer', () => {
    render(<PuzzlePlayScreen puzzle={PUZZLE} mode="cozy" onExit={() => {}} />);
    expect(screen.getByTestId('cell-0-0')).toBeTruthy();
    expect(screen.getByTestId('tool-fill')).toBeTruthy();
    expect(screen.getByText(PUZZLE.difficulty.tier)).toBeTruthy();
    expect(screen.getByText(/00:00/)).toBeTruthy();
  });

  it('switches the active tool via the toolbar', () => {
    render(<PuzzlePlayScreen puzzle={PUZZLE} mode="cozy" onExit={() => {}} />);
    fireEvent.press(screen.getByTestId('tool-mark'));
    expect(useUiStore.getState().tool).toBe('mark');
  });

  it('reveals a correct cell when Hint is tapped', () => {
    render(<PuzzlePlayScreen puzzle={PUZZLE} mode="cozy" onExit={() => {}} />);
    fireEvent.press(screen.getByTestId('tool-hint'));
    // first target-filled unfilled cell is (0,0)
    expect(useUiStore.getState().cellState[0][0]).toBe(1);
    expect(useUiStore.getState().errors).toBe(0); // hint is never a mistake
  });

  it('marks the puzzle solved in progressStore on win', () => {
    const onSolved = jest.fn();
    render(<PuzzlePlayScreen puzzle={PUZZLE} mode="cozy" onExit={() => {}} onSolved={onSolved} />);
    fireEvent.press(screen.getByTestId('cell-0-0'));
    fireEvent.press(screen.getByTestId('cell-1-1'));
    expect(useProgressStore.getState().isSolved('p-test')).toBe(true);
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  it('calls onExit from the back control', () => {
    const onExit = jest.fn();
    render(<PuzzlePlayScreen puzzle={PUZZLE} mode="cozy" onExit={onExit} />);
    fireEvent.press(screen.getByTestId('play-back'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- PuzzlePlayScreen` → FAIL.

- [ ] **Step 3: Implement**

Create `src/components/screens/PuzzlePlayScreen.tsx`:
```tsx
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { colors, typography, spacing, layout } from '@/theme';
import { Puzzle } from '@/engine';
import { useUiStore, useProgressStore } from '@/state';
import { IconButton } from '@/components/atoms';
import { TierBadge } from '@/components/molecules';
import { PuzzleGrid, PuzzleToolbar } from '@/components/organisms';
import { formatTime } from '@/utils/formatTime';

export interface PuzzlePlayScreenProps {
  puzzle: Puzzle;
  mode: 'cozy' | 'classic';
  onExit: () => void;
  onSolved?: (time: number, mistakes: number) => void;
}

const HINT_LIMIT = 3;

const pad3 = (n: number) => String(n).padStart(3, '0');

export function PuzzlePlayScreen({ puzzle, mode, onExit, onSolved }: PuzzlePlayScreenProps) {
  const tool = useUiStore((s) => s.tool);
  const setTool = useUiStore((s) => s.setTool);
  const undo = useUiStore((s) => s.undo);
  const tap = useUiStore((s) => s.tap);
  const historyLength = useUiStore((s) => s.history.length);
  const errors = useUiStore((s) => s.errors);
  const status = useUiStore((s) => s.status);
  const startedAt = useUiStore((s) => s.startedAt);
  const cellState = useUiStore((s) => s.cellState);

  const [hintsRemaining, setHintsRemaining] = useState(HINT_LIMIT);

  // Live timer (stops at win).
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    if (status === 'won' || startedAt == null) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status, startedAt]);
  const elapsed = startedAt != null ? Math.max(0, Math.floor((nowMs - startedAt) / 1000)) : 0;

  const handleWin = useCallback(
    (time: number, mistakes: number) => {
      useProgressStore.getState().markSolved(puzzle.id, { time, mistakes });
      onSolved?.(time, mistakes);
    },
    [puzzle.id, onSolved],
  );

  const handleHint = useCallback(() => {
    if (hintsRemaining <= 0) return;
    const grid = puzzle.grid;
    for (let r = 0; r < grid.length; r += 1) {
      for (let c = 0; c < grid[r].length; c += 1) {
        if (grid[r][c] === 1 && cellState[r]?.[c] !== 1) {
          tap(r, c, 'fill');
          setHintsRemaining((h) => h - 1);
          return;
        }
      }
    }
  }, [hintsRemaining, puzzle.grid, cellState, tap]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper.cream, padding: spacing.md }}>
      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton icon="back" variant="ghost" accessibilityLabel="Back" onPress={onExit} testID="play-back" />
        <TierBadge tier={puzzle.difficulty.tier} />
      </View>

      {/* Header */}
      <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.xl, letterSpacing: typography.letterSpacing.wider, color: colors.ink.primary, textTransform: 'uppercase', marginTop: spacing.sm }}>
        {`Sighting ${pad3(puzzle.metadata.order)}`}
      </Text>
      <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.sm, color: colors.ink.faded }}>
        {puzzle.subtitle}
      </Text>

      {/* Timer + mistakes */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginVertical: spacing.sm }}>
        <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.sm, color: colors.ink.soft }}>{formatTime(elapsed)}</Text>
        <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.sm, color: colors.ink.faded }}>·</Text>
        <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.sm, color: errors > 0 ? colors.accent.stampRed : colors.ink.soft }}>
          {`${errors} mistakes`}
        </Text>
      </View>

      {/* Grid */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <PuzzleGrid puzzle={puzzle} mode={mode} onWin={handleWin} />
      </View>

      {/* Toolbar */}
      <PuzzleToolbar
        activeTool={tool}
        mode={mode}
        onToolChange={setTool}
        onUndo={undo}
        onHint={handleHint}
        canUndo={historyLength > 0}
        hintCount={hintsRemaining}
        testID="play-toolbar"
      />
    </View>
  );
}

export default PuzzlePlayScreen;
```

Create `src/components/screens/index.ts`:
```typescript
export { PuzzlePlayScreen, default as PuzzlePlayScreenDefault } from './PuzzlePlayScreen';
export type { PuzzlePlayScreenProps } from './PuzzlePlayScreen';
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- PuzzlePlayScreen && npx tsc --noEmit` → PASS (5), exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(screens): add PuzzlePlayScreen

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: `/puzzle/[id]` route + Home entry (runnable)

Wire the screen into Expo Router and make it reachable from Home, so the app runs to a playable puzzle. (SCREEN_SPECS.md Screen 5 routing)

**Files:**
- Create: `src/app/puzzle/[id].tsx`
- Modify: `src/app/index.tsx` (add a "Play a sample" entry)

**Interfaces:**
- Consumes: `expo-router` (`useLocalSearchParams`, `useRouter`, `Link`/`router.push`); `getSamplePuzzle` from `@/content/samplePuzzles`; `useSettingsStore` from `@/state`; `PuzzlePlayScreen` from `@/components/screens`.
- Produces: a route at `/puzzle/[id]` and a Home affordance that navigates to `/puzzle/sample-plus`.

- [ ] **Step 1: Implement the route**

Create `src/app/puzzle/[id].tsx`:
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography, spacing } from '@/theme';
import { getSamplePuzzle } from '@/content/samplePuzzles';
import { useSettingsStore } from '@/state';
import { PuzzlePlayScreen } from '@/components/screens';

export default function PuzzleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const mode = useSettingsStore((s) => s.mode);
  const puzzle = typeof id === 'string' ? getSamplePuzzle(id) : undefined;

  if (!puzzle) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper.cream, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
        <Text style={{ fontFamily: typography.fontFamily.body, color: colors.ink.soft, textAlign: 'center' }}>
          That sighting could not be found.
        </Text>
      </View>
    );
  }

  return <PuzzlePlayScreen puzzle={puzzle} mode={mode} onExit={() => router.back()} />;
}
```

- [ ] **Step 2: Add a Home entry to reach it**

Modify `src/app/index.tsx` — add a tappable "Play a sample" affordance that navigates to the first sample. Import `useRouter` from `expo-router` and, inside the component, add near the prompt text a `Pressable` (or reuse the existing prompt) wired to `router.push('/puzzle/sample-plus')`. Example addition (adapt to the existing file's structure; keep the themed styling):
```tsx
import { useRouter } from 'expo-router';
// ...inside the component:
const router = useRouter();
// ...in the returned JSX, add below the existing prompt:
<Pressable testID="home-play-sample" onPress={() => router.push('/puzzle/sample-plus')}>
  <Text style={styles.prompt}>tap to play a sample sighting</Text>
</Pressable>
```
(Import `Pressable` from `react-native` if not already imported. Keep the existing Home content; this is an added affordance, not a rewrite.)

- [ ] **Step 3: Typecheck + full suite**

Run: `npm test && npx tsc --noEmit`
Expected: entire suite green, tsc exit 0.

- [ ] **Step 4: Runnable check (headless bundle)**

Run:
```bash
rm -rf /tmp/cp-play-export && npx expo export --platform ios --output-dir /tmp/cp-play-export >/tmp/cp-play.log 2>&1; echo "export exit: $?"
```
Expected: `export exit: 0` (the route resolves, content + screen bundle, `@/` alias + router entry all wire up). If it fails, read `/tmp/cp-play.log` (common cause: a bad import path in the new route).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(app): add /puzzle/[id] route + Home entry to a playable sample

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the executor

- `buildPuzzle` is the runtime stand-in for the content pipeline; the sample grids MUST be uniquely solvable (the test enforces it) — swap a grid if `analyzePuzzle` disagrees.
- Hint uses `uiStore.tap(r, c, 'fill')` on a correct-but-unfilled cell — no new store action; filling a target cell never counts as a mistake.
- The screen reads tool/undo/hint/errors/timer from the SAME `uiStore` that `PuzzleGrid` inits — one source of truth. Don't add a second store.
- `PuzzlePlayScreen` is a testable component; the route file stays thin (params + content lookup + render).
- Reveal choreography, the confirm-on-exit dialog, and real content loading are separate later plans — not built here.
- Screens live in `src/components/screens/`; the Expo Router files in `src/app/` render them.
