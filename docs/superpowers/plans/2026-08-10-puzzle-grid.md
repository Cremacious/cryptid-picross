# PuzzleGrid Organism Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `PuzzleGrid` organism — the interactive nonogram grid that renders row/column clues and a memoized `PuzzleCell` grid, drives the `uiStore`, derives clues from the engine, highlights wrong fills in Cozy mode, and fires `onWin(time, mistakes)` exactly once when solved.

**Architecture:** An organism that composes the `PuzzleCell` molecule and coordinates with the `uiStore` (COMPONENT_LIBRARY.md 3.1). It `init`s the store from the puzzle's grid on mount, subscribes to `cellState`/`status`, passes STABLE per-cell `onPress` handlers (so `PuzzleCell`'s `React.memo` actually helps across hundreds of cells), and detects the play→won transition to call `onWin` once. Clues come from the engine's `deriveClues`. Lives at `src/components/organisms/PuzzleGrid.tsx`, exported from an organisms barrel.

**Tech Stack:** React Native + Expo, TypeScript, Zustand (`@/state`), engine (`@/engine`), Jest + `@testing-library/react-native` v13.

## Global Constraints

- Never inline color/spacing/font values; import from `@/theme`. (COMPONENT_LIBRARY.md Design System Quick Reference)
- Organisms may import atoms, molecules, and stores — never other organisms. (COMPONENT_LIBRARY.md Part 6)
- Win detection is the engine's `isSolved` (already inside `uiStore`); the grid reads `uiStore.status`, it does NOT re-derive win. Clues use the engine's `deriveClues`. (DATA_AND_ENGINE.md §4)
- STABLE per-cell `onPress`: build handlers with `useMemo` keyed by `[rows, cols, tap]` (the zustand `tap` action is a stable reference) so `PuzzleCell`'s memo is not defeated. (COMPONENT_LIBRARY.md 3.1 performance; carried note from molecules review)
- Grid clue numbers use `allowFontScaling={false}` (fixed size relative to cells). (QA_AND_LAUNCH.md §2.5)
- Each cell gets an `accessibilityLabel` "row R, column C, <state>". (QA_AND_LAUNCH.md §2.4)
- `onWin` fires EXACTLY ONCE per solve, and must NOT fire spuriously on mount if the shared `uiStore` was left in a `won` state by a previous puzzle — detect the transition, don't read a level. 
- Cozy mode shows wrong fills (filled where target is empty) via `PuzzleCell isWrong`; Classic mode does not surface them (mistakes still counted by the store). (SCREEN_SPECS.md Screen 5)
- `@testing-library/react-native` is v13 — `render`/`fireEvent` synchronous; do NOT `await`. Reset the singleton `uiStore` in `beforeEach`.
- Every commit message ends with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Project root: `/home/chris/Code/cryptid-picross`.

---

### Task 1: PuzzleGrid organism + barrel

**Files:**
- Create: `src/components/organisms/PuzzleGrid.tsx`
- Create: `src/components/organisms/index.ts`
- Test: `src/components/organisms/__tests__/PuzzleGrid.test.tsx`

**Interfaces:**
- Consumes: `@/theme`; `Puzzle`, `deriveClues`, `PlayCell` from `@/engine`; `useUiStore`, `PuzzleStatus` from `@/state`; `PuzzleCell` from `@/components/molecules`.
- Produces: `PuzzleGrid` with props:
  ```typescript
  interface PuzzleGridProps {
    puzzle: Puzzle;
    mode: 'cozy' | 'classic';
    onWin: (time: number, mistakes: number) => void;   // time in seconds
    onProgressChange?: (progress: number) => void;      // 0..1 of target cells correctly filled
  }
  ```
  and `src/components/organisms/index.ts` re-exporting it.

- [ ] **Step 1: Write the failing test**

Create `src/components/organisms/__tests__/PuzzleGrid.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PuzzleGrid } from '@/components/organisms';
import { useUiStore } from '@/state';
import type { Puzzle } from '@/engine';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

// Minimal puzzle: only `grid` is used by the organism (clues are derived).
const makePuzzle = (grid: number[][]): Puzzle =>
  ({ id: 'test', name: 'Test', subtitle: '', grid } as unknown as Puzzle);

const TARGET = makePuzzle([
  [1, 0],
  [0, 1],
]);

const flat = (s: unknown) =>
  Array.isArray(s) ? Object.assign({}, ...(s as unknown[]).flat().filter(Boolean)) : (s as Record<string, unknown>);

beforeEach(() => {
  useUiStore.setState({
    target: null, cellState: [], history: [], tool: 'fill',
    errors: 0, status: 'idle', startedAt: null, elapsedMs: null,
  });
});

describe('PuzzleGrid', () => {
  it('renders a cell for every grid position', () => {
    render(<PuzzleGrid puzzle={TARGET} mode="cozy" onWin={() => {}} />);
    expect(screen.getByTestId('cell-0-0')).toBeTruthy();
    expect(screen.getByTestId('cell-0-1')).toBeTruthy();
    expect(screen.getByTestId('cell-1-0')).toBeTruthy();
    expect(screen.getByTestId('cell-1-1')).toBeTruthy();
  });

  it('renders clue numbers derived from the grid', () => {
    render(<PuzzleGrid puzzle={TARGET} mode="cozy" onWin={() => {}} />);
    // rows [1],[1] and cols [1],[1] -> at least four "1" clue labels
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(4);
  });

  it('a tap updates the uiStore cell state', () => {
    render(<PuzzleGrid puzzle={TARGET} mode="cozy" onWin={() => {}} />);
    fireEvent.press(screen.getByTestId('cell-0-0'));
    expect(useUiStore.getState().cellState[0][0]).toBe(1);
  });

  it('fires onWin once when the puzzle is solved', () => {
    const onWin = jest.fn();
    render(<PuzzleGrid puzzle={TARGET} mode="cozy" onWin={onWin} />);
    fireEvent.press(screen.getByTestId('cell-0-0')); // target 1
    fireEvent.press(screen.getByTestId('cell-1-1')); // target 1 -> solved
    expect(onWin).toHaveBeenCalledTimes(1);
    expect(onWin).toHaveBeenCalledWith(expect.any(Number), 0);
  });

  it('does NOT fire onWin on mount when the store was left won by a prior puzzle', () => {
    useUiStore.setState({ status: 'won', elapsedMs: 1234, errors: 3 });
    const onWin = jest.fn();
    render(<PuzzleGrid puzzle={TARGET} mode="cozy" onWin={onWin} />);
    expect(onWin).not.toHaveBeenCalled();
  });

  it('marks a wrong fill in Cozy mode with the warning-red cell', () => {
    render(<PuzzleGrid puzzle={TARGET} mode="cozy" onWin={() => {}} />);
    fireEvent.press(screen.getByTestId('cell-0-1')); // target 0 -> wrong fill
    expect(useUiStore.getState().errors).toBe(1);
    expect(flat(screen.getByTestId('cell-0-1').props.style).backgroundColor).toBe('#9B3B2E');
  });

  it('reports progress toward the solution when onProgressChange is given', () => {
    const onProgressChange = jest.fn();
    render(<PuzzleGrid puzzle={TARGET} mode="cozy" onWin={() => {}} onProgressChange={onProgressChange} />);
    onProgressChange.mockClear();
    fireEvent.press(screen.getByTestId('cell-0-0')); // 1 of 2 target cells correct
    expect(onProgressChange).toHaveBeenLastCalledWith(0.5);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- PuzzleGrid` → FAIL (no module `@/components/organisms`).

- [ ] **Step 3: Implement**

Create `src/components/organisms/PuzzleGrid.tsx`:
```tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { colors, typography, spacing, layout } from '@/theme';
import { Puzzle, deriveClues, PlayCell } from '@/engine';
import { useUiStore, PuzzleStatus } from '@/state';
import { PuzzleCell } from '@/components/molecules';

export interface PuzzleGridProps {
  puzzle: Puzzle;
  mode: 'cozy' | 'classic';
  onWin: (time: number, mistakes: number) => void;
  onProgressChange?: (progress: number) => void;
}

const ROW_CLUE_WIDTH = 48;

const clueTextStyle = {
  fontFamily: typography.fontFamily.display,
  fontSize: typography.size.xs,
  color: colors.ink.soft,
  lineHeight: typography.size.xs * 1.15,
};

export function PuzzleGrid({ puzzle, mode, onWin, onProgressChange }: PuzzleGridProps) {
  const target = puzzle.grid;
  const rows = target.length;
  const cols = rows > 0 ? target[0].length : 0;

  const { row: rowClues, col: colClues } = useMemo(() => deriveClues(target), [target]);

  const cellState = useUiStore((s) => s.cellState);
  const status = useUiStore((s) => s.status);
  const errors = useUiStore((s) => s.errors);
  const elapsedMs = useUiStore((s) => s.elapsedMs);
  const tap = useUiStore((s) => s.tap);
  const init = useUiStore((s) => s.init);

  // Initialize the store for this puzzle on mount / puzzle change.
  useEffect(() => {
    init(target);
  }, [init, target]);

  // Fire onWin once, on the genuine play -> won transition. Never on mount from
  // a stale `won` left by a previous puzzle (prev starts null -> first tick can't fire).
  const prevStatusRef = useRef<PuzzleStatus | null>(null);
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (prev !== null && prev !== 'won' && status === 'won') {
      onWin(elapsedMs != null ? Math.round(elapsedMs / 1000) : 0, errors);
    }
    prevStatusRef.current = status;
  }, [status, elapsedMs, errors, onWin]);

  // Optional progress reporting: fraction of target-filled cells correctly filled.
  useEffect(() => {
    if (!onProgressChange) return;
    let targetFilled = 0;
    let correct = 0;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (target[r][c] === 1) {
          targetFilled += 1;
          if (cellState[r]?.[c] === 1) correct += 1;
        }
      }
    }
    onProgressChange(targetFilled > 0 ? correct / targetFilled : 0);
  }, [cellState, onProgressChange, target, rows, cols]);

  // Stable per-cell handlers (tap is a stable zustand action) so PuzzleCell's memo holds.
  const handlers = useMemo(
    () =>
      Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => () => tap(r, c)),
      ),
    [rows, cols, tap],
  );

  const { width } = useWindowDimensions();
  const available = width > 0 ? width - spacing.md * 2 - ROW_CLUE_WIDTH : cols * layout.gridCellMin;
  const cellSize = Math.max(
    layout.gridCellMin,
    Math.min(layout.gridCellMax, Math.floor(available / Math.max(cols, 1))),
  );

  // Before the init effect runs, cellState may not match dims; treat as empty.
  const ready = cellState.length === rows && (rows === 0 || cellState[0]?.length === cols);
  const stateAt = (r: number, c: number): PlayCell => (ready ? cellState[r][c] : 0);

  const describe = (r: number, c: number): string => {
    const s = stateAt(r, c);
    const word = s === 1 ? 'filled' : s === 2 ? 'marked' : 'empty';
    return `row ${r + 1}, column ${c + 1}, ${word}`;
  };

  return (
    <View accessibilityLabel="Puzzle grid">
      {/* Column clues */}
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: ROW_CLUE_WIDTH }} />
        {Array.from({ length: cols }).map((_, c) => (
          <View
            key={`cc-${c}`}
            style={{ width: cellSize, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: spacing.xxs }}
          >
            {colClues[c].map((n, i) => (
              <Text key={i} allowFontScaling={false} style={clueTextStyle}>
                {n}
              </Text>
            ))}
          </View>
        ))}
      </View>

      {/* Rows: clue gutter + cells */}
      {Array.from({ length: rows }).map((_, r) => (
        <View key={`row-${r}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{ width: ROW_CLUE_WIDTH, flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.xs, paddingRight: spacing.xs }}
          >
            {rowClues[r].map((n, i) => (
              <Text key={i} allowFontScaling={false} style={clueTextStyle}>
                {n}
              </Text>
            ))}
          </View>
          {Array.from({ length: cols }).map((_, c) => {
            const s = stateAt(r, c);
            const isWrong = mode === 'cozy' && s === 1 && target[r][c] === 0;
            return (
              <PuzzleCell
                key={`cell-${r}-${c}`}
                testID={`cell-${r}-${c}`}
                state={s}
                isWrong={isWrong}
                size={cellSize}
                onPress={handlers[r][c]}
                boldRight={(c + 1) % 5 === 0 && c < cols - 1}
                boldBottom={(r + 1) % 5 === 0 && r < rows - 1}
                accessibilityLabel={describe(r, c)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default PuzzleGrid;
```

Create `src/components/organisms/index.ts`:
```typescript
export { PuzzleGrid, default as PuzzleGridDefault } from './PuzzleGrid';
export type { PuzzleGridProps } from './PuzzleGrid';
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- PuzzleGrid` → PASS (7 tests). If the "wrong fill" style assertion reads the animated style oddly, keep the intent (`backgroundColor === '#9B3B2E'`) and adjust only the reading mechanism.

- [ ] **Step 5: Full suite + typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: entire suite green, tsc exit 0.

- [ ] **Step 6: Coverage check**

Run:
```bash
npx jest --coverage --collectCoverageFrom='src/components/organisms/**/*.tsx' src/components/organisms 2>&1 | tail -12
```
Expected: `PuzzleGrid.tsx` ≥ 85% statements/lines. If the classic-mode branch or the `ready===false` guard is uncovered, add a focused test (e.g. render with `mode="classic"` and assert a wrong fill is NOT red).

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(organisms): add PuzzleGrid

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the executor

- Organisms import atoms/molecules/stores — never other organisms.
- Win is the store's concern; the grid only detects the play→won transition to call `onWin` once. The null-initialized `prevStatusRef` is what prevents a spurious `onWin` when the singleton store was left `won` by a previous puzzle — do not simplify it to a level check.
- Keep the per-cell `onPress` handlers stable (the `useMemo` keyed by `[rows, cols, tap]`); a fresh closure per render would defeat `PuzzleCell`'s memo across hundreds of cells.
- Cell-size fitting is approximate here; pinch-zoom / ScrollView for oversized 25×25 grids on small phones is a screen-level refinement (a later plan), not part of this organism.
- This organism is the logic+layout of the grid only; the surrounding Puzzle Play screen (top bar, timer, toolbar, reveal transition) is a separate screens plan.
