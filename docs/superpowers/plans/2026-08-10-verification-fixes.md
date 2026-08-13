# Verification + Fixes (Workstream D) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the "1 mistakes" grammar bug and formalize puzzle correctness with an end-to-end "solve → win" test that drives every sample puzzle through the real component tap path.

**Architecture:** A tiny `pluralize` util replaces the hardcoded `"${errors} mistakes"` string in `PuzzlePlayScreen`. A new integration test renders the real `PuzzleGrid` for each sample puzzle, presses exactly the solution cells via their `cell-r-c` testIDs, and asserts the puzzle reaches `won` with `onWin` firing once at 0 mistakes.

**Tech Stack:** TypeScript, Jest + `@testing-library/react-native` v13. No new deps.

## Global Constraints

- Never inline color/spacing/font values; import from `@/theme`. (design doc; project convention)
- `@testing-library/react-native` is v13 — synchronous `render`/`fireEvent`; reset singleton `uiStore` in `beforeEach`. (project convention)
- Puzzle win is the engine's concern (`isSolved` inside `uiStore`); the verification test asserts observable outcomes (`status === 'won'`, `onWin` args), it does not re-derive. (DATA_AND_ENGINE.md §4.6)
- Every commit message ends with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Project root: `/home/chris/Code/cryptid-picross`.

---

### Task 1: pluralize util + fix the mistake counter

Replace `"1 mistakes"` with a correctly pluralized count.

**Files:**
- Create: `src/utils/pluralize.ts`
- Create: `src/utils/__tests__/pluralize.test.ts`
- Modify: `src/components/screens/PuzzlePlayScreen.tsx` (the mistakes `Text`)

**Interfaces:**
- Produces: `pluralize(count: number, singular: string, plural?: string): string` — `"1 mistake"`, `"0 mistakes"`, `"2 mistakes"`.

- [ ] **Step 1: Write the failing test**

Create `src/utils/__tests__/pluralize.test.ts`:
```typescript
import { pluralize } from '@/utils/pluralize';

describe('pluralize', () => {
  it('uses the singular for exactly one', () => {
    expect(pluralize(1, 'mistake')).toBe('1 mistake');
  });
  it('uses the plural for zero and many', () => {
    expect(pluralize(0, 'mistake')).toBe('0 mistakes');
    expect(pluralize(2, 'mistake')).toBe('2 mistakes');
  });
  it('accepts an explicit irregular plural', () => {
    expect(pluralize(3, 'sighting', 'sightings')).toBe('3 sightings');
    expect(pluralize(1, 'sighting', 'sightings')).toBe('1 sighting');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- pluralize` → FAIL (no module).

- [ ] **Step 3: Implement the util**

Create `src/utils/pluralize.ts`:
```typescript
/** "1 mistake" / "0 mistakes" / "2 mistakes". Pass `plural` for irregular words. */
export function pluralize(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : plural ?? `${singular}s`;
  return `${count} ${word}`;
}
```

- [ ] **Step 4: Fix the PuzzlePlayScreen mistake text**

In `src/components/screens/PuzzlePlayScreen.tsx`:
- Add the import near the other `@/utils` import: `import { pluralize } from '@/utils/pluralize';` (the file already imports `formatTime` from `@/utils/formatTime`).
- Find the mistakes `Text` that renders `` {`${errors} mistakes`} `` and replace its child with `{pluralize(errors, 'mistake')}`. Leave the surrounding styling (the `errors > 0 ? colors.accent.stampRed : colors.ink.soft` color) unchanged.

- [ ] **Step 5: Run pluralize + PuzzlePlayScreen tests + typecheck**

Run: `npm test -- pluralize PuzzlePlayScreen && npx tsc --noEmit`
Expected: PASS, exit 0. (If an existing PuzzlePlayScreen test asserted the literal `"0 mistakes"`/`"1 mistakes"` text, it still matches — `pluralize(0,'mistake')` is `"0 mistakes"`. Only a test that asserted `"1 mistakes"` would need updating to `"1 mistake"`; fix it if present.)

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "fix(screens): pluralize the mistake counter (1 mistake, not 1 mistakes)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: solve-to-win verification for every sample puzzle

Prove each sample puzzle is actually solvable through the real tap path.

**Files:**
- Test: `src/content/__tests__/samples-solvable.test.tsx`

**Interfaces:**
- Consumes: `PuzzleGrid` from `@/components/organisms`; `sampleRegions` from `@/content/sampleRegions`; `useUiStore` from `@/state`.

- [ ] **Step 1: Write the test**

Create `src/content/__tests__/samples-solvable.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PuzzleGrid } from '@/components/organisms';
import { sampleRegions } from '@/content/sampleRegions';
import { useUiStore } from '@/state';
import type { Puzzle } from '@/engine';

jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light' } }));

const allPuzzles: Puzzle[] = sampleRegions.flatMap((r) => r.puzzles);

beforeEach(() => {
  useUiStore.setState({
    target: null, cellState: [], history: [], tool: 'fill',
    errors: 0, status: 'idle', startedAt: null, elapsedMs: null,
  });
});

describe('every sample puzzle solves to a win via real taps', () => {
  it('has at least one sample puzzle to check', () => {
    expect(allPuzzles.length).toBeGreaterThanOrEqual(1);
  });

  it.each(allPuzzles.map((p) => [p.id, p] as const))(
    'puzzle %s reaches won with zero mistakes when its solution cells are tapped',
    (_id, puzzle) => {
      const onWin = jest.fn();
      render(<PuzzleGrid puzzle={puzzle} mode="cozy" onWin={onWin} />);
      // tap exactly the filled (target === 1) cells
      puzzle.grid.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell === 1) fireEvent.press(screen.getByTestId(`cell-${r}-${c}`));
        });
      });
      expect(useUiStore.getState().status).toBe('won');
      expect(onWin).toHaveBeenCalledTimes(1);
      expect(onWin).toHaveBeenCalledWith(expect.any(Number), 0);
    },
  );
});
```

- [ ] **Step 2: Run the verification test**

Run: `npm test -- samples-solvable`
Expected: PASS — one case per sample puzzle (`sample-plus`, `sample-eye`, `appalachia-001`), each reaching `won` with 0 mistakes. If any FAILS to reach `won`, that puzzle's grid/clues are inconsistent — surface it (do NOT weaken the test); it means real content is broken.

- [ ] **Step 3: Full suite + typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: entire suite green, tsc exit 0.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "test(content): verify every sample puzzle solves to a win via real taps

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the executor

- This workstream is small and self-contained; it's the "verify + fix" step before the larger UI work (mobile sizing, how-to-play, main menu).
- The verification test is deliberately at the `PuzzleGrid` level (no timer) so it's deterministic; it presses real cell buttons, exercising the same `PuzzleCell → uiStore.tap → isSolved` path a player uses.
- Do not change the per-second timer behavior; it's out of scope (works correctly, just re-renders each second).
