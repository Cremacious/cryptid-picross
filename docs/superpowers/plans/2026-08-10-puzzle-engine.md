# Puzzle Engine + Core Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the domain type system and the pure-logic puzzle engine from DATA_AND_ENGINE.md — clue derivation, line-candidate enumeration, line intersection, uniqueness + solve-depth analysis, difficulty scoring, and win detection — all in `src/engine/`, with near-total test coverage.

**Architecture:** Pure, dependency-free TypeScript. Every function is deterministic and side-effect-free: data in, data out. Types live in `src/engine/puzzleTypes.ts` (with `src/content/content.d.ts` re-exporting the content-facing subset). Each algorithm gets its own focused file and test. No React, no theme, no I/O — this layer is what the UI and content pipeline will build on. The Python reference (`nonogram_engine.py`) and `sample_pack.json` mentioned in the spec do not exist in this repo; tests assert against hand-computed expected values instead.

**Tech Stack:** TypeScript, Jest (`jest-expo`). No new dependencies.

## Global Constraints

- All types live in `src/engine/puzzleTypes.ts`; `src/content/content.d.ts` re-exports the content-facing types (`Region`, `FieldEntry`, `VoiceStyle`, `PurchaseInfo`, `PuzzleMetadata`). Never inline these types elsewhere. (DATA_AND_ENGINE.md §1.1)
- Engine functions are PURE — no mutation of inputs, no globals, no I/O. (DATA_AND_ENGINE.md §4)
- `Cell` is `0 | 1`; `PlayCell` is `0 | 1 | 2` (2 = mark). Marks NEVER count as fills for win detection. (DATA_AND_ENGINE.md §1.1, §4.6)
- `lineClues` of an empty line returns `[0]`, not `[]`. (DATA_AND_ENGINE.md §4.1)
- Tier bucketing from total difficulty: `<8` Easy, `<14` Medium, `<19` Hard, `>=19` Expert. (DATA_AND_ENGINE.md §4.5)
- `analyzePuzzle` caps propagation at depth 50; `unique:true` only when every cell is determined by pure line logic. (DATA_AND_ENGINE.md §4.4)
- Engine coverage target ≥ 95% (statements/functions/lines), ≥ 90% branches — write thorough tests. (QA_AND_LAUNCH.md §1.2)
- `@testing-library/react-native` is v13, but these are pure-function tests — no rendering. Use plain Jest.
- Every commit message ends with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Project root: `/home/chris/Code/cryptid-picross`.

---

### Task 1: Core domain types

Define every typed shape the engine, content, and stores share. Types only — verified by a compile-time usage test.

**Files:**
- Create: `src/engine/puzzleTypes.ts`
- Create: `src/content/content.d.ts`
- Test: `src/engine/__tests__/types.test.ts`

**Interfaces:**
- Produces (consumed by all later tasks and future plans):
  `Cell`, `Line`, `Grid`, `Clue`, `Clues`, `PlayCell`, `PlayGrid`, `Tier`, `DifficultyScore`, `Puzzle`, `PuzzleMetadata`, `FieldEntry`, `VoiceStyle`, `Region`, `PurchaseInfo`.

- [ ] **Step 1: Write the failing compile-time usage test**

Create `src/engine/__tests__/types.test.ts`:
```typescript
import type {
  Cell, Grid, Clue, Clues, PlayGrid, Tier, DifficultyScore,
  Puzzle, FieldEntry, VoiceStyle, Region, PurchaseInfo,
} from '@/engine/puzzleTypes';

describe('domain types', () => {
  it('compose into valid values', () => {
    const grid: Grid = [[0, 1], [1, 0]];
    const clues: Clues = [[1], [1]];
    const play: PlayGrid = [[0, 2], [1, 0]];
    const tier: Tier = 'Expert';
    const voice: VoiceStyle = 'notebook';
    const cell: Cell = 1;
    const clue: Clue = [2, 3];
    const score: DifficultyScore = {
      size: 1, density: 1, segmentLength: 1, asymmetry: 0, solveDepth: 0, total: 4, tier: 'Easy',
    };
    const entry: FieldEntry = { title: 'X', body: 'Y', voiceStyle: voice };
    const purchases: PurchaseInfo = {
      ownedRegions: ['pnw'], ownedPacks: [], purchasedFullBundle: false, lastRestoredAt: null,
    };
    expect(grid[0][1]).toBe(1);
    expect(clues.length).toBe(2);
    expect(play[0][1]).toBe(2);
    expect(tier).toBe('Expert');
    expect(cell).toBe(1);
    expect(clue).toEqual([2, 3]);
    expect(score.tier).toBe('Easy');
    expect(entry.voiceStyle).toBe('notebook');
    expect(purchases.ownedRegions[0]).toBe('pnw');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- types` → FAIL (cannot find module `@/engine/puzzleTypes`).

- [ ] **Step 3: Create the types**

Create `src/engine/puzzleTypes.ts`:
```typescript
// ---- Primitives ----
export type Cell = 0 | 1; // 0 = empty, 1 = filled (source of truth)
export type Line = Cell[];
export type Grid = Line[]; // grid[row][col]
export type Clue = number[]; // run lengths; [0] = empty line
export type Clues = Clue[];
export type PlayCell = 0 | 1 | 2; // 0 empty, 1 filled by user, 2 marked with X
export type PlayGrid = PlayCell[][];

// ---- Difficulty ----
export type Tier = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface DifficultyScore {
  size: number; // 0-5, from grid area
  density: number; // 0-5, distance from 50% fill
  segmentLength: number; // 0-5, inverse of average run length
  asymmetry: number; // 0-5, mirror symmetry distance
  solveDepth: number; // 0-5, propagation rounds needed
  total: number; // sum, 0-25
  tier: Tier;
}

// ---- Field entry (content) ----
export type VoiceStyle = 'notebook' | 'firstPerson' | 'victorian' | 'deadpan';

export interface FieldEntry {
  title: string;
  body: string;
  voiceStyle: VoiceStyle;
  yearReported?: number;
  witnessCredibility?: 'low' | 'medium' | 'high';
}

// ---- Puzzle ----
export interface PuzzleMetadata {
  regionId: string;
  order: number;
  isCapstone: boolean;
  cryptidName?: string;
  culturalSource?: {
    tradition: string;
    creditText: string;
    furtherReading?: string;
  };
}

export interface Puzzle {
  id: string;
  name: string;
  subtitle: string;
  grid: Grid;
  rowClues: Clues;
  colClues: Clues;
  fillRatio: number;
  isUnique: boolean;
  requiresGuessing: boolean;
  difficulty: DifficultyScore;
  entry: FieldEntry;
  metadata: PuzzleMetadata;
}

// ---- Region ----
export interface Region {
  id: string;
  name: string;
  tagline: string;
  tint: string;
  puzzles: Puzzle[];
  totalPuzzles: number;
  isFree: boolean;
  iapProductId?: string;
}

// ---- Purchases ----
export interface PurchaseInfo {
  ownedRegions: string[];
  ownedPacks: string[];
  purchasedFullBundle: boolean;
  lastRestoredAt: number | null;
}
```

Create `src/content/content.d.ts`:
```typescript
// Content-facing types re-exported for content files and the content pipeline.
export type {
  Region,
  Puzzle,
  PuzzleMetadata,
  FieldEntry,
  VoiceStyle,
  PurchaseInfo,
} from '@/engine/puzzleTypes';
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- types && npx tsc --noEmit` → PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): add core domain types

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Clue derivation

`lineClues` (one line → run lengths) and `deriveClues` (grid → row & column clues). (DATA_AND_ENGINE.md §4.1)

**Files:**
- Create: `src/engine/clues.ts`
- Test: `src/engine/__tests__/clues.test.ts`

**Interfaces:**
- Consumes: `Cell`, `Line`, `Grid`, `Clue`, `Clues` from `@/engine/puzzleTypes`.
- Produces:
  - `lineClues(line: Line): Clue`
  - `deriveClues(grid: Grid): { row: Clues; col: Clues }`

- [ ] **Step 1: Write the failing test**

Create `src/engine/__tests__/clues.test.ts`:
```typescript
import { lineClues, deriveClues } from '@/engine/clues';

describe('lineClues', () => {
  it('collapses runs of filled cells to lengths', () => {
    expect(lineClues([1, 1, 0, 1, 1, 1])).toEqual([2, 3]);
  });
  it('returns [0] for an empty line', () => {
    expect(lineClues([0, 0, 0, 0])).toEqual([0]);
  });
  it('handles a fully-filled line', () => {
    expect(lineClues([1, 1, 1])).toEqual([3]);
  });
  it('handles leading and trailing fills', () => {
    expect(lineClues([1, 0, 0, 1])).toEqual([1, 1]);
  });
});

describe('deriveClues', () => {
  it('derives row and column clues for a plus sign', () => {
    const grid = [
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
    ];
    const { row, col } = deriveClues(grid);
    expect(row).toEqual([[1], [1], [5], [1], [1]]);
    expect(col).toEqual([[1], [1], [5], [1], [1]]);
  });
  it('does not mutate the input grid', () => {
    const grid = [[1, 0], [0, 1]];
    const snapshot = JSON.stringify(grid);
    deriveClues(grid);
    expect(JSON.stringify(grid)).toBe(snapshot);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- clues` → FAIL.

- [ ] **Step 3: Implement**

Create `src/engine/clues.ts`:
```typescript
import { Cell, Line, Grid, Clue, Clues } from './puzzleTypes';

export function lineClues(line: Line): Clue {
  const runs: number[] = [];
  let current = 0;
  for (const cell of line) {
    if (cell === 1) {
      current += 1;
    } else if (current > 0) {
      runs.push(current);
      current = 0;
    }
  }
  if (current > 0) runs.push(current);
  return runs.length > 0 ? runs : [0];
}

export function deriveClues(grid: Grid): { row: Clues; col: Clues } {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  const row: Clues = grid.map((line) => lineClues(line));
  const col: Clues = [];
  for (let c = 0; c < cols; c += 1) {
    const column: Cell[] = [];
    for (let r = 0; r < rows; r += 1) column.push(grid[r][c]);
    col.push(lineClues(column));
  }
  return { row, col };
}
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- clues && npx tsc --noEmit` → PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): add clue derivation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Line candidates + intersection

`possibleLines` enumerates every valid arrangement of a clue in a line; `intersectLines` finds cells guaranteed across a candidate set. (DATA_AND_ENGINE.md §4.2, §4.3)

**Files:**
- Create: `src/engine/lines.ts`
- Test: `src/engine/__tests__/lines.test.ts`

**Interfaces:**
- Consumes: `Cell`, `Line`, `Clue` from `@/engine/puzzleTypes`.
- Produces:
  - `possibleLines(clue: Clue, length: number): Line[]`
  - `intersectLines(candidates: Line[]): (Cell | null)[]`

- [ ] **Step 1: Write the failing test**

Create `src/engine/__tests__/lines.test.ts`:
```typescript
import { possibleLines, intersectLines } from '@/engine/lines';

describe('possibleLines', () => {
  it('places a single run in every position', () => {
    expect(possibleLines([1], 3)).toEqual([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
  });
  it('returns the all-empty line for clue [0]', () => {
    expect(possibleLines([0], 5)).toEqual([[0, 0, 0, 0, 0]]);
  });
  it('fills the line exactly when the run equals the length', () => {
    expect(possibleLines([5], 5)).toEqual([[1, 1, 1, 1, 1]]);
  });
  it('respects the mandatory gap between runs', () => {
    expect(possibleLines([1, 1], 3)).toEqual([[1, 0, 1]]);
  });
  it('enumerates all arrangements of [2,3] in length 10', () => {
    const lines = possibleLines([2, 3], 10);
    // choose gaps g0>=0,g1>=1,g2>=0 with g0+g1+g2 = 10-5 = 5, g1>=1 -> 4 free split 3 ways = C(4+2,2)=15
    expect(lines.length).toBe(15);
    lines.forEach((l) => {
      expect(l.length).toBe(10);
      expect(l.reduce((a, b) => a + b, 0)).toBe(5); // 2 + 3 filled cells
    });
  });
});

describe('intersectLines', () => {
  it('returns 1 where all candidates agree filled, 0 where all agree empty, null otherwise', () => {
    expect(intersectLines([
      [1, 0, 1],
      [1, 1, 0],
    ])).toEqual([1, null, null]);
  });
  it('returns an empty array for no candidates', () => {
    expect(intersectLines([])).toEqual([]);
  });
  it('returns the line itself for a single candidate', () => {
    expect(intersectLines([[1, 0, 1]])).toEqual([1, 0, 1]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- lines` → FAIL.

- [ ] **Step 3: Implement**

Create `src/engine/lines.ts`:
```typescript
import { Cell, Line, Clue } from './puzzleTypes';

/**
 * Every valid placement of `clue`'s runs in a line of `length`, left to right,
 * with at least one empty cell between consecutive runs. Clue [0] => one all-empty line.
 */
export function possibleLines(clue: Clue, length: number): Line[] {
  const runs = clue.length === 1 && clue[0] === 0 ? [] : clue;
  const results: Line[] = [];

  const place = (index: number, from: number, acc: Cell[]): void => {
    if (index === runs.length) {
      const line = acc.slice();
      while (line.length < length) line.push(0);
      results.push(line);
      return;
    }
    const runLen = runs[index];
    const rest = runs.slice(index);
    const minTail = rest.reduce((a, b) => a + b, 0) + (rest.length - 1); // this run + gaps + rest
    const maxStart = length - minTail;
    for (let start = from; start <= maxStart; start += 1) {
      const next = acc.slice();
      while (next.length < start) next.push(0); // gap/leading zeros
      for (let k = 0; k < runLen; k += 1) next.push(1);
      const isLast = index === runs.length - 1;
      if (!isLast) next.push(0); // mandatory single gap
      place(index + 1, start + runLen + (isLast ? 0 : 1), next);
    }
  };

  place(0, 0, []);
  return results;
}

/** Per-cell: 1 if all candidates fill it, 0 if all leave it empty, null if they disagree. */
export function intersectLines(candidates: Line[]): (Cell | null)[] {
  if (candidates.length === 0) return [];
  const len = candidates[0].length;
  const out: (Cell | null)[] = [];
  for (let i = 0; i < len; i += 1) {
    const first = candidates[0][i];
    const allSame = candidates.every((c) => c[i] === first);
    out.push(allSame ? first : null);
  }
  return out;
}
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- lines && npx tsc --noEmit` → PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): add line candidates + intersection

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Uniqueness + solve-depth analysis

`analyzePuzzle` runs line-by-line constraint propagation to decide whether a puzzle is solvable by pure logic and how many rounds it takes. (DATA_AND_ENGINE.md §4.4)

**Files:**
- Create: `src/engine/analyze.ts`
- Test: `src/engine/__tests__/analyze.test.ts`

**Interfaces:**
- Consumes: `Cell`, `Clues` from `@/engine/puzzleTypes`; `possibleLines`, `intersectLines` from `./lines`.
- Produces: `analyzePuzzle(rowClues: Clues, colClues: Clues): { unique: boolean; depth: number }`

- [ ] **Step 1: Write the failing test**

Create `src/engine/__tests__/analyze.test.ts`:
```typescript
import { analyzePuzzle } from '@/engine/analyze';
import { deriveClues } from '@/engine/clues';

describe('analyzePuzzle', () => {
  it('marks a logically-solvable puzzle unique with a bounded depth', () => {
    const plus = [
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
    ];
    const { row, col } = deriveClues(plus);
    const result = analyzePuzzle(row, col);
    expect(result.unique).toBe(true);
    expect(result.depth).toBeGreaterThanOrEqual(1);
    expect(result.depth).toBeLessThanOrEqual(50);
  });

  it('marks an ambiguous puzzle non-unique (2x2 checkerboard has two solutions)', () => {
    // rowClues [1],[1]; colClues [1],[1] — solvable as this grid OR its inverse
    const result = analyzePuzzle([[1], [1]], [[1], [1]]);
    expect(result.unique).toBe(false);
  });

  it('solves a fully-filled grid at depth 1', () => {
    const result = analyzePuzzle([[3], [3], [3]], [[3], [3], [3]]);
    expect(result.unique).toBe(true);
    expect(result.depth).toBe(1);
  });

  it('reports non-unique when a clue cannot fit (contradiction: run of 6 in a 5-wide row)', () => {
    // row 0 wants a run of 6 in 5 columns -> zero candidates -> contradiction
    const result = analyzePuzzle([[6], [1], [1], [1], [1]], [[1], [1], [1], [1], [1]]);
    expect(result.unique).toBe(false);
    expect(result.depth).toBe(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- analyze` → FAIL.

- [ ] **Step 3: Implement**

Create `src/engine/analyze.ts`:
```typescript
import { Cell, Clues } from './puzzleTypes';
import { possibleLines, intersectLines } from './lines';

type Known = (Cell | null)[];

const matches = (candidate: Cell[], known: Known): boolean => {
  for (let i = 0; i < known.length; i += 1) {
    if (known[i] !== null && known[i] !== candidate[i]) return false;
  }
  return true;
};

/**
 * Line-by-line constraint propagation.
 * unique:true  => fully determined by pure logic (good puzzle).
 * unique:false => multiple solutions or needs guessing (bad puzzle).
 * depth        => propagation rounds used (logical difficulty, size-independent).
 */
export function analyzePuzzle(rowClues: Clues, colClues: Clues): { unique: boolean; depth: number } {
  const rows = rowClues.length;
  const cols = colClues.length;
  const grid: Known[] = Array.from({ length: rows }, () => new Array<Cell | null>(cols).fill(null));
  const rowCands = rowClues.map((c) => possibleLines(c, cols));
  const colCands = colClues.map((c) => possibleLines(c, rows));

  for (let depth = 1; depth <= 50; depth += 1) {
    let changed = false;

    for (let r = 0; r < rows; r += 1) {
      rowCands[r] = rowCands[r].filter((cand) => matches(cand, grid[r]));
      if (rowCands[r].length === 0) return { unique: false, depth };
      const inter = intersectLines(rowCands[r]);
      for (let c = 0; c < cols; c += 1) {
        if (inter[c] !== null && grid[r][c] === null) {
          grid[r][c] = inter[c];
          changed = true;
        }
      }
    }

    for (let c = 0; c < cols; c += 1) {
      const known: Known = grid.map((row) => row[c]);
      colCands[c] = colCands[c].filter((cand) => matches(cand, known));
      if (colCands[c].length === 0) return { unique: false, depth };
      const inter = intersectLines(colCands[c]);
      for (let r = 0; r < rows; r += 1) {
        if (inter[r] !== null && grid[r][c] === null) {
          grid[r][c] = inter[r];
          changed = true;
        }
      }
    }

    const solved = grid.every((row) => row.every((cell) => cell !== null));
    if (solved) return { unique: true, depth };
    if (!changed) return { unique: false, depth };
  }

  return { unique: false, depth: 50 };
}
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- analyze && npx tsc --noEmit` → PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): add uniqueness + solve-depth analysis

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Difficulty scoring

`scoreDifficulty` computes five 0–5 axes, sums to a 0–25 total, and buckets to a tier. (DATA_AND_ENGINE.md §4.5)

**Files:**
- Create: `src/engine/difficulty.ts`
- Test: `src/engine/__tests__/difficulty.test.ts`

**Interfaces:**
- Consumes: `Grid`, `Clues`, `Tier`, `DifficultyScore` from `@/engine/puzzleTypes`.
- Produces: `scoreDifficulty(grid: Grid, rowClues: Clues, colClues: Clues, unique: boolean, depth: number): DifficultyScore`

- [ ] **Step 1: Write the failing test**

Create `src/engine/__tests__/difficulty.test.ts`:
```typescript
import { scoreDifficulty } from '@/engine/difficulty';
import { deriveClues } from '@/engine/clues';

const plus = [
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [1, 1, 1, 1, 1],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
];

describe('scoreDifficulty', () => {
  it('scores the symmetric plus (area 25, 9 filled) as Easy with the expected axes', () => {
    const { row, col } = deriveClues(plus);
    const s = scoreDifficulty(plus, row, col, true, 2);
    expect(s.size).toBeCloseTo(1.0, 5); // area 25 -> 1.0
    expect(s.density).toBeCloseTo(1.4, 5); // |0.36-0.5|*2*5
    expect(s.segmentLength).toBeCloseTo(4.2, 5); // avgRun 1.8 -> 6-1.8
    expect(s.asymmetry).toBeCloseTo(0, 5); // fully mirror-symmetric
    expect(s.solveDepth).toBeCloseTo(0.8, 5); // (2-1)*0.8
    expect(s.total).toBeCloseTo(7.4, 5);
    expect(s.tier).toBe('Easy');
  });

  it('scores solveDepth 5.0 and never below Hard-ish when the puzzle is not unique', () => {
    const { row, col } = deriveClues(plus);
    const s = scoreDifficulty(plus, row, col, false, 3);
    expect(s.solveDepth).toBe(5.0);
  });

  it('buckets tiers by total thresholds', () => {
    // A large near-empty grid pushes size, density, segment up.
    const big: number[][] = Array.from({ length: 25 }, () => new Array(25).fill(0));
    big[0][0] = 1;
    const { row, col } = deriveClues(big);
    const s = scoreDifficulty(big, row, col, true, 2);
    expect(s.size).toBeCloseTo(5.0, 5); // area 625 -> 5.0
    expect(['Hard', 'Expert']).toContain(s.tier);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- difficulty` → FAIL.

- [ ] **Step 3: Implement**

Create `src/engine/difficulty.ts`:
```typescript
import { Grid, Clues, Tier, DifficultyScore } from './puzzleTypes';

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

function bucket(total: number): Tier {
  if (total < 8) return 'Easy';
  if (total < 14) return 'Medium';
  if (total < 19) return 'Hard';
  return 'Expert';
}

export function scoreDifficulty(
  grid: Grid,
  rowClues: Clues,
  colClues: Clues,
  unique: boolean,
  depth: number,
): DifficultyScore {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  const area = rows * cols;

  // Axis 1 — Size
  const size = area <= 25 ? 1.0 : area >= 625 ? 5.0 : 1.0 + (4.0 * (area - 25)) / 600;

  // Axis 2 — Density
  const filled = grid.reduce((sum, line) => sum + line.reduce((a, b) => a + b, 0), 0);
  const fillRatio = area > 0 ? filled / area : 0;
  const deviation = Math.abs(fillRatio - 0.5) * 2;
  const density = Math.min(5, deviation * 5);

  // Axis 3 — Segment length
  const allRuns = [...rowClues, ...colClues].flat().filter((r) => r > 0);
  const avgRun = allRuns.length > 0 ? allRuns.reduce((a, b) => a + b, 0) / allRuns.length : 0;
  const segmentLength = avgRun >= 6 ? 0 : clamp(6 - avgRun, 0, 5);

  // Axis 4 — Asymmetry
  let horizontalDiffs = 0;
  let verticalDiffs = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (grid[r][c] !== grid[r][cols - 1 - c]) horizontalDiffs += 1;
      if (grid[r][c] !== grid[rows - 1 - r][c]) verticalDiffs += 1;
    }
  }
  const bestSymmetry = area > 0 ? Math.min(horizontalDiffs, verticalDiffs) / area : 0;
  const asymmetry = Math.min(5, bestSymmetry * 10);

  // Axis 5 — Solve depth
  const solveDepth = !unique ? 5.0 : clamp((depth - 1) * 0.8, 0, 5);

  const total = size + density + segmentLength + asymmetry + solveDepth;
  return { size, density, segmentLength, asymmetry, solveDepth, total, tier: bucket(total) };
}
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- difficulty && npx tsc --noEmit` → PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): add difficulty scoring

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Win detection + engine barrel

`isSolved` (exact match; marks never count as fills) plus a barrel that re-exports the whole engine. (DATA_AND_ENGINE.md §4.6)

**Files:**
- Create: `src/engine/solved.ts`
- Create: `src/engine/index.ts`
- Test: `src/engine/__tests__/solved.test.ts`

**Interfaces:**
- Consumes: `Grid`, `PlayGrid` from `@/engine/puzzleTypes`.
- Produces:
  - `isSolved(playGrid: PlayGrid, targetGrid: Grid): boolean`
  - `src/engine/index.ts` re-exporting types + `lineClues`, `deriveClues`, `possibleLines`, `intersectLines`, `analyzePuzzle`, `scoreDifficulty`, `isSolved`.

- [ ] **Step 1: Write the failing test**

Create `src/engine/__tests__/solved.test.ts`:
```typescript
import { isSolved } from '@/engine/solved';
import type { Grid, PlayGrid } from '@/engine/puzzleTypes';

const target: Grid = [
  [1, 0, 1],
  [0, 1, 0],
];

describe('isSolved', () => {
  it('is true when every filled cell matches exactly', () => {
    const play: PlayGrid = [
      [1, 0, 1],
      [0, 1, 0],
    ];
    expect(isSolved(play, target)).toBe(true);
  });

  it('treats marks (2) as non-fills — a mark on a should-fill cell is not solved', () => {
    const play: PlayGrid = [
      [2, 0, 1], // (0,0) should be filled but is marked
      [0, 1, 0],
    ];
    expect(isSolved(play, target)).toBe(false);
  });

  it('allows marks on should-be-empty cells (still solved)', () => {
    const play: PlayGrid = [
      [1, 2, 1], // (0,1) should be empty; a mark there is fine
      [0, 1, 0],
    ];
    expect(isSolved(play, target)).toBe(true);
  });

  it('is false when a cell that should be empty is filled', () => {
    const play: PlayGrid = [
      [1, 1, 1], // (0,1) filled but should be empty
      [0, 1, 0],
    ];
    expect(isSolved(play, target)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- solved` → FAIL.

- [ ] **Step 3: Implement**

Create `src/engine/solved.ts`:
```typescript
import { Grid, PlayGrid } from './puzzleTypes';

/**
 * Exact match: every cell's filled-ness must equal the target.
 * playGrid uses 2 for marks (cognitive aids) — a mark is NOT a fill, so a
 * should-fill cell that is marked counts as incomplete.
 */
export function isSolved(playGrid: PlayGrid, targetGrid: Grid): boolean {
  for (let r = 0; r < targetGrid.length; r += 1) {
    for (let c = 0; c < targetGrid[r].length; c += 1) {
      const shouldFill = targetGrid[r][c] === 1;
      const isFilled = playGrid[r][c] === 1;
      if (shouldFill !== isFilled) return false;
    }
  }
  return true;
}
```

Create `src/engine/index.ts`:
```typescript
export * from './puzzleTypes';
export { lineClues, deriveClues } from './clues';
export { possibleLines, intersectLines } from './lines';
export { analyzePuzzle } from './analyze';
export { scoreDifficulty } from './difficulty';
export { isSolved } from './solved';
```

- [ ] **Step 4: Run the FULL suite + typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: entire suite green (engine tests + scaffold + atoms), tsc exit 0.

- [ ] **Step 5: Check engine coverage meets the ≥95% target**

Run:
```bash
npx jest --coverage --collectCoverageFrom='src/engine/**/*.ts' src/engine 2>&1 | tail -20
```
Expected: `src/engine` statements/functions/lines ≥ 95%, branches ≥ 90%. If a branch is uncovered, add a focused test for it (e.g. an empty-grid guard) before committing.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(engine): add win detection + engine barrel

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the executor

- Pure functions only — if you find yourself importing React, theme, or AsyncStorage into `src/engine/`, stop; it doesn't belong here.
- The spec references comparing engine output to a Python reference and `sample_pack.json`. Those files don't exist in this repo — tests assert hand-computed values instead. Do not fabricate a Python file or sample pack.
- `possibleLines` is exponential in the worst case but bounded by grid size ≤ 25; no memoization needed at this layer (the app caches per-puzzle at load time, a later concern).
- Keep each engine function in its own file so the barrel stays the only cross-module surface. Molecules/organisms and the content pipeline are separate plans that build on this.
