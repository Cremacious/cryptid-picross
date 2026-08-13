# Mobile UI Sizing (Workstream C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the puzzle fill the screen on a phone (cells sized from both width and height, larger cap, scaled clue numbers) and give the list screens comfortable, thumb-friendly rows.

**Architecture:** Extract the grid sizing math into pure, unit-tested helpers (`computeCellSize`, `computeClueFontSize`); `PuzzleGrid` uses them with the window's width AND height (reserving space for the header/toolbar and clue gutters) so a 5×5 grows to fill the space while a 25×25 still fits. A light, token-driven legibility pass bumps the list cards' row height and subtitle text.

**Tech Stack:** React Native + Expo, TypeScript, Jest + `@testing-library/react-native` v13. No new deps.

## Global Constraints

- Never inline color/spacing/font values; import from `@/theme`. Grid sizing constants live in the sizing module / `layout` tokens. (project convention)
- `@testing-library/react-native` is v13 — synchronous `render`/`fireEvent`; `useWindowDimensions()` returns `{width:0,height:0}` in jest, so sizing must degrade to a sane fallback (`gridCellMin`) and still render all cells. Reset singleton `uiStore` in `beforeEach` where asserted. (project convention)
- Touch targets ≥ 44pt where feasible; large grids bottom out at `gridCellMin` (14) and rely on `hitSlop`. (QA_AND_LAUNCH.md §2.3)
- `PuzzleGrid` must keep rendering every `cell-r-c` testID and its clues; the existing `samples-solvable` + `PuzzleGrid` tests must stay green. (regression guard)
- Every commit message ends with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Project root: `/home/chris/Code/cryptid-picross`.

---

### Task 1: grid sizing helpers + raise the cell cap

Pure sizing math + a bigger max cell.

**Files:**
- Create: `src/components/organisms/gridSizing.ts`
- Create: `src/components/organisms/__tests__/gridSizing.test.ts`
- Modify: `src/theme/layout.ts` (`gridCellMax` 40 → 56)

**Interfaces:**
- Consumes: `layout` from `@/theme`.
- Produces:
  - `ROW_CLUE_GUTTER: number` (48)
  - `computeCellSize(p: { windowWidth: number; windowHeight: number; cols: number; rows: number }): number`
  - `computeClueFontSize(cellSize: number): number`

- [ ] **Step 1: Write the failing test**

Create `src/components/organisms/__tests__/gridSizing.test.ts`:
```typescript
import { computeCellSize, computeClueFontSize } from '@/components/organisms/gridSizing';

describe('computeCellSize', () => {
  it('grows a small grid toward the max on a roomy phone', () => {
    // 390x844 phone, 5x5 -> width allows ~62/cell, clamped to the 56 cap
    expect(computeCellSize({ windowWidth: 390, windowHeight: 844, cols: 5, rows: 5 })).toBe(56);
  });
  it('shrinks a big grid to the min so it still fits', () => {
    // 25x25 -> far below min -> clamps to 14
    expect(computeCellSize({ windowWidth: 390, windowHeight: 844, cols: 25, rows: 25 })).toBe(14);
  });
  it('is limited by height when the window is short', () => {
    // very short window forces small cells even for few rows
    const size = computeCellSize({ windowWidth: 390, windowHeight: 360, cols: 5, rows: 5 });
    expect(size).toBeLessThan(56);
    expect(size).toBeGreaterThanOrEqual(14);
  });
  it('falls back to the min when dimensions are unknown (jest / first render)', () => {
    expect(computeCellSize({ windowWidth: 0, windowHeight: 0, cols: 5, rows: 5 })).toBe(14);
  });
});

describe('computeClueFontSize', () => {
  it('scales with cell size, clamped to a legible range', () => {
    expect(computeClueFontSize(56)).toBe(18); // 56*0.36=20.16 -> clamp 18
    expect(computeClueFontSize(14)).toBe(11); // 14*0.36=5.04 -> clamp 11
    expect(computeClueFontSize(40)).toBe(14); // 40*0.36=14.4 -> 14
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- gridSizing` → FAIL.

- [ ] **Step 3: Raise the cap**

In `src/theme/layout.ts`, change `gridCellMax: 40,` to `gridCellMax: 56, // 5×5 fills a phone; large grids clamp down to gridCellMin`.

- [ ] **Step 4: Implement the helpers**

Create `src/components/organisms/gridSizing.ts`:
```typescript
import { layout } from '@/theme';

/** Horizontal space reserved for the row-clue gutter. */
export const ROW_CLUE_GUTTER = 48;

/** Vertical space reserved for the column-clue gutter above the grid. */
const COL_CLUE_GUTTER = 56;

/** Header + timer + toolbar + padding reserved from the window height. */
const CHROME_HEIGHT = 300;

/**
 * Cell edge (px) that fits the grid in the space left by width AND height,
 * clamped to [gridCellMin, gridCellMax]. Unknown dims (jest / first render)
 * degrade to gridCellMin so the grid still renders.
 */
export function computeCellSize(p: {
  windowWidth: number;
  windowHeight: number;
  cols: number;
  rows: number;
}): number {
  const availW = p.windowWidth - layout.screenPadding * 2 - ROW_CLUE_GUTTER;
  const availH = p.windowHeight - CHROME_HEIGHT - COL_CLUE_GUTTER;
  const byWidth = p.cols > 0 ? Math.floor(availW / p.cols) : layout.gridCellMax;
  const byHeight = p.rows > 0 ? Math.floor(availH / p.rows) : layout.gridCellMax;
  const raw = Math.min(byWidth, byHeight);
  return Math.max(layout.gridCellMin, Math.min(layout.gridCellMax, raw));
}

/** Clue number font that scales with the cell, clamped to a legible range. */
export function computeClueFontSize(cellSize: number): number {
  return Math.max(11, Math.min(18, Math.round(cellSize * 0.36)));
}
```

- [ ] **Step 5: Run to verify it passes + typecheck**

Run: `npm test -- gridSizing && npx tsc --noEmit` → PASS (5), exit 0.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(organisms): add grid sizing helpers + raise cell cap to 56

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: use fit-to-screen sizing + scaled clues in PuzzleGrid

Wire the helpers in so the grid grows on a phone.

**Files:**
- Modify: `src/components/organisms/PuzzleGrid.tsx`

**Interfaces:**
- Consumes: `computeCellSize`, `computeClueFontSize`, `ROW_CLUE_GUTTER` from `./gridSizing`.

- [ ] **Step 1: Rewire the sizing in PuzzleGrid**

In `src/components/organisms/PuzzleGrid.tsx`:

1. Add the import (after the existing imports): `import { computeCellSize, computeClueFontSize, ROW_CLUE_GUTTER } from './gridSizing';`
2. Delete the local `const ROW_CLUE_WIDTH = 48;` and replace every use of `ROW_CLUE_WIDTH` with `ROW_CLUE_GUTTER`.
3. Delete the module-level `const clueTextStyle = { ... };` object. Instead, compute it inside the component after `cellSize` is known (see below), so the font scales.
4. Replace the width-only sizing:
```tsx
  const { width } = useWindowDimensions();
  const available = width > 0 ? width - spacing.md * 2 - ROW_CLUE_WIDTH : cols * layout.gridCellMin;
  const cellSize = Math.max(
    layout.gridCellMin,
    Math.min(layout.gridCellMax, Math.floor(available / Math.max(cols, 1))),
  );
```
with:
```tsx
  const { width, height } = useWindowDimensions();
  const cellSize = computeCellSize({ windowWidth: width, windowHeight: height, cols, rows });
  const clueTextStyle = {
    fontFamily: typography.fontFamily.display,
    fontSize: computeClueFontSize(cellSize),
    color: colors.ink.soft,
    lineHeight: computeClueFontSize(cellSize) * 1.15,
  } as const;
```
5. Ensure the two clue `<Text ... style={clueTextStyle}>` usages now reference this in-component `clueTextStyle` (they already reference `clueTextStyle` by name — just make sure the module-level one is gone so this local one is used). `layout` may now be unused in this file — remove it from the `@/theme` import if so, to keep `tsc` clean.

- [ ] **Step 2: Full suite + typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: entire suite green (PuzzleGrid, PuzzlePlayScreen, samples-solvable all still pass — they render at the jest fallback cell size of 14, cells + clues intact), tsc exit 0.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(organisms): PuzzleGrid fills the screen (width+height sizing, scaled clues)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: legibility pass on the list cards

Comfortable, thumb-friendly rows for the region + puzzle selectors.

**Files:**
- Modify: `src/components/molecules/RegionCard.tsx`
- Modify: `src/components/molecules/PuzzleCard.tsx`

**Interfaces:** none new (visual/token tweaks only).

- [ ] **Step 1: Bump RegionCard comfort**

In `src/components/molecules/RegionCard.tsx`: the inner content row currently has `minHeight: layout.touchTarget`. Change that row's `minHeight` to `layout.touchTarget + spacing.lg` (≈68) for a comfortable tap row, and bump the subtitle `Text` font from `typography.size.xs` to `typography.size.sm`. Leave the swatch, name, icon, and lock/opacity behavior unchanged.

- [ ] **Step 2: Bump PuzzleCard comfort**

In `src/components/molecules/PuzzleCard.tsx`: add `minHeight: layout.touchTarget + spacing.lg` to the main content row `View` style (the `flexDirection: 'row'` container), and bump the grid-`size` text and the best-time italic text from `typography.size.xs` to `typography.size.sm`. Import `layout` from `@/theme` if not already imported. Leave the `SIGHTING ###` label, name/`???`, TierBadge, check icon, and testIDs unchanged.

- [ ] **Step 3: Run the affected tests + full suite + typecheck**

Run: `npm test -- RegionCard PuzzleCard && npm test && npx tsc --noEmit`
Expected: RegionCard/PuzzleCard tests still pass (they assert names/progress/lock/check/testIDs, not font sizes), entire suite green, tsc exit 0.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(molecules): larger, thumb-friendly Region/Puzzle list cards

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the executor

- The grid sizing degrades to `gridCellMin` (14) when `useWindowDimensions()` is 0 (jest / first paint), so no test needs a real device to pass; the visible improvement shows on an actual phone / the web preview at mobile width.
- Keep every `cell-r-c` testID and the clue rendering — the `samples-solvable` and `PuzzleGrid` tests are the regression guard.
- The legibility pass is deliberately light (token-driven row height + one font bump per card); it is NOT a redesign. If a card test asserts an exact size and breaks, that's a signal to keep the change even lighter — do not remove the test's intent.
- After Task 2, the controller will visually confirm the bigger grid in the running web preview at mobile width.
