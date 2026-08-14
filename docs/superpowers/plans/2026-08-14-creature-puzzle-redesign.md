# Creature Puzzle Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 500 procedural blob puzzles with 400 hand-drawn puzzles (icons, items, creatures) that read as real pictures, each uniquely line-solvable and correctly tiered.

**Architecture:** A hand-drawn ASCII **art library** (`content/art/`) feeds a pure **assembler** (`content/generator/assembleRegion.ts`) that applies safe variation (flip / frame) and validates each candidate through the existing `buildPuzzle` engine, filling per-tier quotas and writing `region.gen.json`. The app side (`buildRegionJson` → `src/content/regions/*.json`) is unchanged. The old blob generator is retired.

**Tech Stack:** TypeScript, tsx (build scripts), Jest + @testing-library/react-native, Expo v57. Engine at `src/engine/`, content pipeline at `content/`.

## Global Constraints

- **Total: 400 puzzles = 5 regions × 80.** Per-region tiers **exactly 20 Easy / 28 Medium / 22 Hard / 10 Expert**.
- **Exactly one 25×25 capstone per region** (an Expert, placed last).
- **Free/paid:** `pnw` + `appalachia` free (160); `greatlakes`, `southwest`, `atlantic` paid (240). Product ids unchanged (`region.<id>`, bundle `bundle.all`).
- **Uniqueness is mandatory:** every puzzle must satisfy `isUnique === true` (pure line-solvable via `analyzePuzzle`). Never ship a puzzle with `requiresGuessing`.
- **Tier is computed, never assumed:** bin by `scoreDifficulty(...).tier`. Tier is derived from grid **area** (recalibrated in Task 5b, because the old noise-based `total` could not tier recognizable art): `area ≤ 64` Easy (≤8×8), `≤ 168` Medium (≤~12×14), `≤ 360` Hard (≤~18×20), `≥ 361` Expert (19×19+, incl. the 25×25 capstone). The five difficulty axes + `total` are still computed for information; only the tier derivation is area-based.
- **Grid format:** ASCII rows of `#` (filled) and `.` (empty); every row same length; same format as `region.gen.json` today.
- **Run guard:** no line may exceed **8 runs** (keeps `analyzePuzzle` fast at 25×25).
- **Determinism:** all generation seeded by `theme.seed` (mulberry32); re-running produces the same catalog.
- **Read the versioned Expo docs** at https://docs.expo.dev/versions/v57.0.0/ before any Expo/RN change (per AGENTS.md).
- **Commit message trailer:** end every commit with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Work on a feature branch**, not `main`. The aggregate `catalog.test` is the acceptance test for the content phase and stays red until all five regions are authored — expected on a feature branch.

---

## File Structure

**Create:**
- `content/art/types.ts` — `ArtKind`, `ArtEntry`, `RegionArt` types (pure data contracts).
- `content/art/icons.ts` — shared evidence/item icon pool (`ICONS: ArtEntry[]`).
- `content/art/pnw.ts`, `appalachia.ts`, `greatlakes.ts`, `southwest.ts`, `atlantic.ts` — per-region bestiaries (`REGION_ART_<ID>: RegionArt`).
- `content/art/index.ts` — `ICONS` re-export + `REGION_ART: Record<string, RegionArt>`.
- `content/generator/variation.ts` — pure grid transforms (`normalizeGrid`, `trimGrid`, `flipH`, `padTo`, `dims`).
- `content/generator/assembleRegion.ts` — the assembler + `GenPuzzle`/`GenRegion`/`DEFAULT_COUNTS`.
- `content/generator/__tests__/variation.test.ts`, `content/generator/__tests__/assembleRegion.test.ts`.

**Modify:**
- `content/generator/silhouette.ts` — delete blob functions, keep helpers.
- `content/generator/lore.ts` — add `nameForEntry(...)` so names match the depicted subject.
- `scripts/generate-puzzles.ts` — call `assembleRegion` from the art registry.
- `scripts/build-puzzle-lab.ts` — group the contact sheet by subject.
- `content/generator/buildRegionJson.ts` — import `GenRegion` from `assembleRegion`.
- `src/content/__tests__/catalog.test.tsx` — 400/80 + tier split 20/28/22/10.
- `src/components/screens/__tests__/RegionsScreen.test.tsx`, `src/iap/__tests__/*` — only if they assert 100/500 (grep first).

**Delete:**
- `content/generator/generateRegion.ts` (blob generation path).

---

## Phase A — Pipeline & harness

### Task 1: Grid variation helpers

**Files:**
- Create: `content/generator/variation.ts`
- Test: `content/generator/__tests__/variation.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `dims(grid: string[]): { rows: number; cols: number }`
  - `normalizeGrid(grid: string[]): string[]` — throws if rows differ in length or contain chars other than `#`/`.`; returns the grid unchanged otherwise.
  - `trimGrid(grid: string[]): string[]` — crop to the bounding box of `#` cells (throws if grid is empty of `#`).
  - `flipH(grid: string[]): string[]` — mirror each row left-to-right.
  - `padTo(grid: string[], rows: number, cols: number, offR: number, offC: number): string[]` — place `grid`'s cells into an all-`.` canvas of `rows×cols` at offset `(offR, offC)`; throws if it would not fit.

- [ ] **Step 1: Write the failing test**

```ts
import { dims, normalizeGrid, trimGrid, flipH, padTo } from '../variation';

describe('variation helpers', () => {
  it('dims reports rows and cols', () => {
    expect(dims(['##.', '..#'])).toEqual({ rows: 2, cols: 3 });
  });

  it('normalizeGrid rejects ragged rows', () => {
    expect(() => normalizeGrid(['##', '#'])).toThrow();
  });

  it('normalizeGrid rejects stray characters', () => {
    expect(() => normalizeGrid(['#x'])).toThrow();
  });

  it('trimGrid crops to the filled bounding box', () => {
    expect(trimGrid(['....', '.##.', '.#..', '....'])).toEqual(['##', '#.']);
  });

  it('flipH mirrors horizontally', () => {
    expect(flipH(['#..', '.##'])).toEqual(['..#', '##.']);
  });

  it('padTo centers a shape into a larger canvas', () => {
    expect(padTo(['#'], 3, 3, 1, 1)).toEqual(['...', '.#.', '...']);
  });

  it('padTo throws when the shape does not fit', () => {
    expect(() => padTo(['##'], 2, 2, 0, 1)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest content/generator/__tests__/variation.test.ts`
Expected: FAIL with "Cannot find module '../variation'".

- [ ] **Step 3: Write minimal implementation**

```ts
// content/generator/variation.ts
export function dims(grid: string[]): { rows: number; cols: number } {
  return { rows: grid.length, cols: grid[0]?.length ?? 0 };
}

export function normalizeGrid(grid: string[]): string[] {
  const width = grid[0]?.length ?? 0;
  for (const row of grid) {
    if (row.length !== width) throw new Error('variation: ragged grid');
    if (!/^[#.]*$/.test(row)) throw new Error('variation: grid must be # / . only');
  }
  return grid;
}

export function trimGrid(grid: string[]): string[] {
  let top = grid.length, bottom = -1, left = grid[0]?.length ?? 0, right = -1;
  grid.forEach((row, r) => {
    for (let c = 0; c < row.length; c += 1) {
      if (row[c] === '#') {
        top = Math.min(top, r); bottom = Math.max(bottom, r);
        left = Math.min(left, c); right = Math.max(right, c);
      }
    }
  });
  if (bottom < 0) throw new Error('variation: empty grid (no # cells)');
  const out: string[] = [];
  for (let r = top; r <= bottom; r += 1) out.push(grid[r].slice(left, right + 1));
  return out;
}

export function flipH(grid: string[]): string[] {
  return grid.map((row) => row.split('').reverse().join(''));
}

export function padTo(grid: string[], rows: number, cols: number, offR: number, offC: number): string[] {
  const { rows: gr, cols: gc } = dims(grid);
  if (offR < 0 || offC < 0 || offR + gr > rows || offC + gc > cols) {
    throw new Error('variation: shape does not fit padded canvas');
  }
  const out: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    if (r < offR || r >= offR + gr) { out.push('.'.repeat(cols)); continue; }
    const row = grid[r - offR];
    out.push('.'.repeat(offC) + row + '.'.repeat(cols - offC - gc));
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest content/generator/__tests__/variation.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add content/generator/variation.ts content/generator/__tests__/variation.test.ts
git commit -m "feat(content): pure grid variation helpers (flip/trim/pad)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Art library types + shared icon pool

**Files:**
- Create: `content/art/types.ts`, `content/art/icons.ts`
- Test: `content/art/__tests__/icons.test.ts`

**Interfaces:**
- Consumes: `buildPuzzle` from `@/content/buildPuzzle`; `asciiToGrid` from `content/generator/silhouette`; `normalizeGrid`, `trimGrid` from `content/generator/variation`.
- Produces:
  - `type ArtKind = 'icon' | 'item' | 'creature';`
  - `interface ArtEntry { key: string; kind: ArtKind; label: string; grid: string[]; flippable?: boolean; poses?: string[][]; capstone?: boolean; }`
  - `interface RegionArt { regionId: string; entries: ArtEntry[]; }`
  - `const ICONS: ArtEntry[]` — the shared evidence/item pool (≥ 20 entries, each `kind: 'icon' | 'item'`, sized 5–8, drawn to score Easy).

**Design notes:**
- Icons are the raw art at their natural size (trimmed). The assembler adds any framing. Author them so `trimGrid` is a no-op (no blank border).
- Author each to be line-solvable at its own size; the test enforces it. Nudge cells until unique.
- Aim for instantly-readable emblems: footprint, eye-in-the-dark, saucer/UFO, feather, claw-rake, tooth/fang, egg, jar/specimen, lantern, paw, track-pair, handprint, camera, tent, tuft-of-fur, etc.

- [ ] **Step 1: Write the failing test**

```ts
import { ICONS } from '../icons';
import { buildPuzzle } from '@/content/buildPuzzle';
import { asciiToGrid } from '@/../content/generator/silhouette';
import { normalizeGrid, trimGrid } from '@/../content/generator/variation';
import type { Grid } from '@/engine';

describe('shared icon pool', () => {
  it('has at least 20 icons with unique keys', () => {
    expect(ICONS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(ICONS.map((i) => i.key)).size).toBe(ICONS.length);
  });

  it.each(ICONS.map((i) => [i.key, i] as const))('icon %s is valid, trimmed, small, unique, Easy', (_k, icon) => {
    normalizeGrid(icon.grid);
    expect(trimGrid(icon.grid)).toEqual(icon.grid); // no blank border
    const { rows, cols } = { rows: icon.grid.length, cols: icon.grid[0].length };
    expect(Math.max(rows, cols)).toBeLessThanOrEqual(8);
    const p = buildPuzzle({
      id: icon.key, name: icon.label, subtitle: '', grid: asciiToGrid(icon.grid) as unknown as Grid,
      entry: { title: '', body: '', voiceStyle: 'notebook' },
      metadata: { regionId: 'x', order: 1, isCapstone: false },
    });
    expect(p.isUnique).toBe(true);
    expect(p.difficulty.tier).toBe('Easy');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest content/art/__tests__/icons.test.ts`
Expected: FAIL ("Cannot find module '../icons'").

- [ ] **Step 3: Write `types.ts`, then author `icons.ts`**

```ts
// content/art/types.ts
export type ArtKind = 'icon' | 'item' | 'creature';
export interface ArtEntry {
  key: string;
  kind: ArtKind;
  label: string;
  grid: string[];
  flippable?: boolean; // default true; horizontal mirror allowed as a variant
  poses?: string[][];  // optional extra authored poses (each a full grid)
  capstone?: boolean;  // marks the 25x25 hero for a region
}
export interface RegionArt {
  regionId: string;
  entries: ArtEntry[];
}
```

```ts
// content/art/icons.ts  (author ≥20; format shown — draw the rest to the same bar)
import type { ArtEntry } from './types';

export const ICONS: ArtEntry[] = [
  { key: 'footprint', kind: 'icon', label: 'Cast Footprint', grid: [
    '.#.#.',
    '.###.',
    '#####',
    '.###.',
    '..#..',
  ] },
  { key: 'eye', kind: 'icon', label: 'Eyeshine', grid: [
    '.....',
    '##.##',
    '#####',
    '.###.',
    '..#..',
  ] },
  { key: 'saucer', kind: 'item', label: 'The Object', grid: [
    '..#..',
    '.###.',
    '#####',
    '.#.#.',
  ] },
  // ...author the remaining icons (feather, claw-rake, tooth, egg, jar, lantern,
  //    paw, handprint, camera, tent, fur-tuft, track-pair, ...) to the same format.
];
```

> During authoring, run the test after each icon (or use the Puzzle Lab, Task 4) — the `isUnique` + `Easy` assertions are the gate. If an icon is not unique, adjust a cell or two until it is; if it scores Medium, shrink it.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest content/art/__tests__/icons.test.ts`
Expected: PASS (≥ 20 parametrized cases).

- [ ] **Step 5: Commit**

```bash
git add content/art/types.ts content/art/icons.ts content/art/__tests__/icons.test.ts
git commit -m "feat(content): art-library types + shared evidence icon pool

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: The assembler

**Files:**
- Create: `content/generator/assembleRegion.ts`
- Modify: `content/generator/lore.ts` (add `nameForEntry`)
- Test: `content/generator/__tests__/assembleRegion.test.ts`

**Interfaces:**
- Consumes: `buildPuzzle`; `asciiToGrid`, `mulberry32` from `silhouette`; `flipH`, `trimGrid`, `padTo`, `dims`, `normalizeGrid` from `variation`; `RegionTheme` from `regions`; `makeEntry`, `nameForEntry` from `lore`; `ArtEntry`, `RegionArt` from `content/art/types`.
- Produces:
  - `interface GenPuzzle { id: string; name: string; subtitle: string; grid: string[]; entry: FieldEntry; order: number; tier: Tier; isCapstone: boolean; }`
  - `interface GenRegion { id: string; name: string; tagline: string; tint: string; isFree: boolean; iapProductId?: string; puzzles: GenPuzzle[]; }`
  - `const DEFAULT_COUNTS: Record<Tier, number> = { Easy: 20, Medium: 28, Hard: 22, Expert: 10 };`
  - `function assembleRegion(theme: RegionTheme, art: RegionArt, icons: ArtEntry[], counts?: Record<Tier, number>): GenRegion`
- In `lore.ts`: `function nameForEntry(theme: RegionTheme, label: string, seed: number, used: Set<string>): { name: string; subtitle: string }` — e.g. `The {descriptor} {label}` / `{label} of {place}` / `The {label}`, deduped against `used`, subtitle = a `theme.places` pick.

**Behavior spec (implement to this):**
1. **Candidate pool.** For every source entry (`icons` first, then `art.entries`) and every pose it has (`[entry.grid, ...(entry.poses ?? [])]`): take the trimmed grid, then forms = `[grid]` plus `flipH(grid)` when `entry.flippable !== false`; for each form, framings = `[trimmed]` and `padTo(trimmed, rows+2, cols+2, 1, 1)` (1-cell margin). Skip a framing if any line would exceed 8 runs.
2. **Validate.** Run each candidate through `buildPuzzle`; keep only `isUnique`. Record `{ entryKey, label, kind, grid, tier: difficulty.tier, area }`. Dedup by exact grid string.
3. **Capstone.** The single `entry.capstone === true` in `art.entries` must yield a `25×25`, `isUnique`, Expert candidate; reserve it as the last Expert. Throw if it does not.
4. **Fill quotas.** Seed `rng = mulberry32(theme.seed ^ 0x5f3759df)`. For each tier `Easy→Medium→Hard→Expert`, select `counts[tier]` candidates whose computed `tier` matches, preferring not-yet-used `entryKey`s first (diversity), then `rng` order. Throw a clear error if a tier is short: `region <id>: <tier> short by <n> (unique candidates: <m>)`.
5. **Assemble.** Concatenate Easy→Expert, capstone last. Assign `order` (1-based), `name`/`subtitle` via `nameForEntry(theme, label, seed, used)`, `entry` via `makeEntry`, `isCapstone`. Return `GenRegion`.

- [ ] **Step 1: Write the failing test** (uses a tiny fake library so it runs fast and asserts the contract)

```ts
import { assembleRegion, DEFAULT_COUNTS } from '../assembleRegion';
import type { RegionArt, ArtEntry } from '@/../content/art/types';
import { REGION_THEMES } from '../regions';
import { buildPuzzle } from '@/content/buildPuzzle';
import { asciiToGrid } from '../silhouette';
import type { Grid, Tier } from '@/engine';

const theme = REGION_THEMES[0];

// Minimal square block N×N (line-solvable, tier grows with N) for deterministic tests.
const block = (n: number): string[] => Array.from({ length: n }, () => '#'.repeat(n));
const entry = (key: string, n: number, kind: ArtEntry['kind'], extra: Partial<ArtEntry> = {}): ArtEntry =>
  ({ key, kind, label: key, grid: block(n), ...extra });

// Enough distinct sizes per tier to fill a tiny quota.
const icons: ArtEntry[] = Array.from({ length: 6 }, (_, i) => entry(`ic${i}`, 5, 'icon'));
const art: RegionArt = {
  regionId: theme.id,
  entries: [
    ...Array.from({ length: 8 }, (_, i) => entry(`med${i}`, 10, 'creature')),
    ...Array.from({ length: 6 }, (_, i) => entry(`hard${i}`, 16, 'creature')),
    ...Array.from({ length: 3 }, (_, i) => entry(`exp${i}`, 22, 'creature')),
    entry('cap', 25, 'creature', { capstone: true }),
  ],
};
const counts: Record<Tier, number> = { Easy: 4, Medium: 4, Hard: 4, Expert: 3 };

describe('assembleRegion', () => {
  const region = assembleRegion(theme, art, icons, counts);

  it('fills the exact per-tier quota', () => {
    const t: Record<Tier, number> = { Easy: 0, Medium: 0, Hard: 0, Expert: 0 };
    for (const p of region.puzzles) t[p.tier] += 1;
    expect(t).toEqual(counts);
  });

  it('produces only unique puzzles binned by computed tier', () => {
    for (const p of region.puzzles) {
      const built = buildPuzzle({
        id: p.id, name: p.name, subtitle: p.subtitle, grid: asciiToGrid(p.grid) as unknown as Grid,
        entry: p.entry, metadata: { regionId: region.id, order: p.order, isCapstone: p.isCapstone },
      });
      expect(built.isUnique).toBe(true);
      expect(built.difficulty.tier).toBe(p.tier);
    }
  });

  it('places exactly one 25x25 capstone last', () => {
    const caps = region.puzzles.filter((p) => p.isCapstone);
    expect(caps).toHaveLength(1);
    expect(caps[0].grid.length).toBe(25);
    expect(region.puzzles[region.puzzles.length - 1]).toBe(caps[0]);
  });

  it('gives every puzzle a unique ordered id and a non-empty name', () => {
    region.puzzles.forEach((p, i) => {
      expect(p.order).toBe(i + 1);
      expect(p.id).toBe(`${region.id}-${String(i + 1).padStart(3, '0')}`);
      expect(p.name.length).toBeGreaterThan(0);
    });
  });

  it('throws a clear error when a tier cannot be filled', () => {
    expect(() => assembleRegion(theme, { regionId: theme.id, entries: [entry('cap', 25, 'creature', { capstone: true })] }, [], counts))
      .toThrow(/short by/);
  });

  it('DEFAULT_COUNTS sum to 80', () => {
    expect(Object.values(DEFAULT_COUNTS).reduce((a, b) => a + b, 0)).toBe(80);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest content/generator/__tests__/assembleRegion.test.ts`
Expected: FAIL ("Cannot find module '../assembleRegion'").

- [ ] **Step 3: Add `nameForEntry` to `lore.ts`, then implement `assembleRegion.ts`** per the Behavior spec above. Key points: use `maxRunsPerLine` (from `silhouette`) to enforce the 8-run guard before validating; dedup candidates by `grid.join('\n')`; seed all RNG from `theme.seed` for determinism.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest content/generator/__tests__/assembleRegion.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add content/generator/assembleRegion.ts content/generator/lore.ts content/generator/__tests__/assembleRegion.test.ts
git commit -m "feat(content): art-library assembler (safe variation + engine validation)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Rewire scripts, retire blob code, group the Puzzle Lab

**Files:**
- Create: `content/art/index.ts`
- Modify: `scripts/generate-puzzles.ts`, `content/generator/buildRegionJson.ts`, `content/generator/silhouette.ts`, `scripts/build-puzzle-lab.ts`
- Delete: `content/generator/generateRegion.ts`

**Interfaces:**
- Consumes: `assembleRegion`, `GenRegion` from `assembleRegion`; `ICONS` from `content/art/icons`; per-region `RegionArt` from `content/art/<id>`.
- Produces: `content/art/index.ts` exports `ICONS` and `REGION_ART: Record<string, RegionArt>` keyed by region id.

- [ ] **Step 1: Create the art registry**

```ts
// content/art/index.ts
import type { RegionArt } from './types';
import { REGION_ART_PNW } from './pnw';
import { REGION_ART_APPALACHIA } from './appalachia';
import { REGION_ART_GREATLAKES } from './greatlakes';
import { REGION_ART_SOUTHWEST } from './southwest';
import { REGION_ART_ATLANTIC } from './atlantic';
export { ICONS } from './icons';
export const REGION_ART: Record<string, RegionArt> = {
  pnw: REGION_ART_PNW,
  appalachia: REGION_ART_APPALACHIA,
  greatlakes: REGION_ART_GREATLAKES,
  southwest: REGION_ART_SOUTHWEST,
  atlantic: REGION_ART_ATLANTIC,
};
```

> Region art files (`content/art/pnw.ts` etc.) do not exist yet. To keep this task compiling and to let the pipeline run region-by-region in Phase B, create each as a **stub now** and fill it in its own task: `export const REGION_ART_PNW: RegionArt = { regionId: 'pnw', entries: [] };` (repeat for the five ids). An empty region will make `assembleRegion` throw "short by" — expected until authored.

- [ ] **Step 2: Point `generate-puzzles.ts` at the assembler**

Replace the `generateRegion(theme)` call with:

```ts
import { assembleRegion } from '@/../content/generator/assembleRegion';
import { ICONS, REGION_ART } from '@/../content/art';
// ...
const gen = assembleRegion(theme, REGION_ART[theme.id], ICONS);
```

Keep the rest of the script (writing `region.gen.json` + built JSON, the per-tier console summary) unchanged — `gen.puzzles[].tier` still exists.

- [ ] **Step 3: Fix `buildRegionJson.ts` import**

Change `import { GenRegion } from './generateRegion';` → `import { GenRegion } from './assembleRegion';`.

- [ ] **Step 4: Strip blob code from `silhouette.ts`**

Delete `growBlob`, `roughen`, `recenter`, `mirror`, `generateSilhouette`, `SilhouetteParams`, `Grid`/`RNG` only if now unused (keep them — `mulberry32` returns `RNG`, `asciiToGrid` returns `Grid`). Keep: `mulberry32`, `zeros` (if used), `maxRunsPerLine`, `filledCount`, `gridToAscii`, `asciiToGrid`, `Grid`, `RNG`. Then delete `content/generator/generateRegion.ts`.

- [ ] **Step 5: Group the Puzzle Lab by subject**

In `scripts/build-puzzle-lab.ts`, the embedded contact sheet currently lists puzzles flat. Add a grouping toggle/heading by the subject key. Since `region.gen.json` puzzles don't carry the art key, group by `name` prefix (the `label`) — add a secondary sort so same-subject variants sit together, and update the header copy from "500-puzzle" to "400-puzzle". (Keep the live uniqueness/tier readout and export logic intact.)

- [ ] **Step 6: Typecheck + run the pipeline unit tests**

Run: `npx tsc --noEmit && npx jest content/`
Expected: PASS. (`generate-puzzles` will throw on empty regions — that is Phase B.)

- [ ] **Step 7: Commit**

```bash
git add content/art/index.ts content/art/pnw.ts content/art/appalachia.ts content/art/greatlakes.ts content/art/southwest.ts content/art/atlantic.ts scripts/generate-puzzles.ts scripts/build-puzzle-lab.ts content/generator/buildRegionJson.ts content/generator/silhouette.ts
git rm content/generator/generateRegion.ts
git commit -m "refactor(content): wire assembler + art registry, retire blob generator

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Update the acceptance tests to 400 / 80

**Files:**
- Modify: `src/content/__tests__/catalog.test.tsx`
- Modify (only if grep shows 100/500 assertions): `src/components/screens/__tests__/RegionsScreen.test.tsx`, `src/iap/__tests__/*`

**Interfaces:** none (test-only).

- [ ] **Step 1: Grep for stale counts**

Run: `grep -rn "\b100\b\|\b500\b" src/content/__tests__ src/components/screens/__tests__ src/iap/__tests__`
Note every hit; update each to the new model.

- [ ] **Step 2: Edit `catalog.test.tsx`**

Set `const TARGET: Record<Tier, number> = { Easy: 20, Medium: 28, Hard: 22, Expert: 10 };`, change `toBe(500)` → `toBe(400)`, and `toHaveLength(100)` → `toHaveLength(80)`. Leave the free/paid, capstone, and uniqueness assertions as-is.

- [ ] **Step 3: Run the acceptance test (expected RED until content lands)**

Run: `npx jest src/content/__tests__/catalog.test.tsx`
Expected: FAIL — regions still hold old blob JSON. This is the content-phase acceptance gate; it goes green in Phase B. Commit the updated expectations now.

- [ ] **Step 4: Commit**

```bash
git add src/content/__tests__/catalog.test.tsx
git commit -m "test(content): assert 400 puzzles / 80 per region / 20-28-22-10 split

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Phase B — Content authoring (one task per region)

**Every region task follows the same loop.** These are art-authoring tasks, not pure code — the "tests" are the assembler succeeding, the catalog slice going green, and a human visual pass in the Puzzle Lab. Author to the tier→size→subject table in the Global Constraints and the spec.

**Per-region recipe (target ≈ how the 80 break down):**
- **Easy (20):** filled from the shared `ICONS` pool (flips + framing) plus 3–5 region-specific items authored in the region file. No new creatures needed.
- **Medium (28):** ~10–12 authored subjects at 9–12px (simple creatures + medium items), expanded by flips/poses.
- **Hard (22):** ~8–10 authored creatures at 14–18px, expanded by flips/second pose.
- **Expert (10):** ~5–7 authored creatures at 20–25px, including the one `capstone: true` at 25×25.
- Net new authored masters per region ≈ **22–28** (creatures + items). Reuse the region's `creatures`/`descriptors` word pools (`content/generator/regions.ts`) for naming via `nameForEntry`.

**Quality bar (Puzzle Lab visual pass — reject and redraw if any fail):**
- The subject is recognizable *as the named thing* at a glance, from the silhouette alone.
- The creature fills most of its canvas (no tiny shape marooned in blank space).
- No salt-and-pepper interior noise; detail reads as anatomy (limb, wing, head, tail), not static.
- Variants of one creature (flip / second pose) are visibly different, not obviously the same grid mirrored.

**Example authored master (the bar for a Hard creature — a winged humanoid ~14×15):**

```ts
{ key: 'mothman', kind: 'creature', label: 'Mothman', capstone: false, grid: [
  '......###......',
  '.....#####.....',
  '.....#.#.#.....',
  '......###......',
  '..#...###...#..',
  '.###..###..###.',
  '####.#####.####',
  '.####.###.####.',
  '..##..###..##..',
  '......###......',
  '.....##.##.....',
  '.....#...#.....',
  '....##...##....',
  '...##.....##...',
] },
```

> This grid is illustrative of *format and density*, not a final asset — validate and nudge it to `isUnique` in the Puzzle Lab before shipping. If it scores the wrong tier, resize; the assembler bins by computed tier and will reject a mis-sized piece with a "short by" error for the intended tier.

---

### Task 6: Author region `pnw` (quality bar — review before the rest)

**Files:**
- Modify: `content/art/pnw.ts` (fill `REGION_ART_PNW.entries`)
- Regenerate: `content/pnw/region.gen.json`, `src/content/regions/pnw.json` (via script)

- [ ] **Step 1: Author `content/art/pnw.ts`** — Sasquatch/Bigfoot heroes (multiple poses/angles), Batsquatch, Tree Watcher, Timber Giant, plus a couple of "Visitors" (UFO/grey) and region items (trail-cam, ranger cabin, plaster track). Follow the per-region recipe counts and the quality bar.

- [ ] **Step 2: Assemble the region**

Run: `npm run generate-puzzles -- pnw`
Expected: exits 0 and prints `pnw ... 80 puzzles ... E20/M28/H22/X10`. If it throws `short by`, author more subjects for that tier (or resize mis-tiered ones) and re-run.

- [ ] **Step 3: Visual review in the Puzzle Lab**

Run: `npm run build-puzzle-lab`
Then open `content/puzzle-lab.html` in a browser and eyeball all 80 grouped by subject against the quality bar. Redraw any that fail; re-run Steps 2–3 until the region reads well. (Grids hand-tweaked in the Lab can be pasted back into `content/art/pnw.ts` so the source stays canonical.)

- [ ] **Step 4: Run the region's tests**

Run: `npx jest src/content/__tests__/catalog.test.tsx -t "pnw"`
Expected: the `pnw` parametrized cases (80 puzzles, tier split, one capstone) PASS. (Aggregate `toBe(400)` still fails until all regions are done.)

- [ ] **Step 5: Commit**

```bash
git add content/art/pnw.ts content/pnw/region.gen.json src/content/regions/pnw.json
git commit -m "content(pnw): hand-drawn 80-puzzle region (icons + bestiary)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

**→ STOP for user review of `pnw` in the Puzzle Lab before proceeding. This is the quality gate for the whole catalog.**

---

### Task 7: Author region `appalachia`

Same loop as Task 6. Subjects: Mothman (Hard/Expert hero, multiple poses), Flatwoods Monster, Snallygaster, Sheepsquatch, Grafton Monster, a Visitors thread beat, region items (TNT bunker, lantern). Capstone: a 25×25 Mothman or Snallygaster.

- [ ] **Step 1:** Author `content/art/appalachia.ts`.
- [ ] **Step 2:** `npm run generate-puzzles -- appalachia` → `E20/M28/H22/X10`.
- [ ] **Step 3:** `npm run build-puzzle-lab` → visual pass, redraw failures.
- [ ] **Step 4:** `npx jest src/content/__tests__/catalog.test.tsx -t "appalachia"` → PASS.
- [ ] **Step 5:** Commit `content(appalachia): hand-drawn 80-puzzle region` (with trailer).

---

### Task 8: Author region `greatlakes`

Same loop. Subjects: Dogman (hero, poses), Bessie/Pressie lake serpents (surfacing/coiled variants — great "same creature, different angle"), Melon Heads, Mishipeshu, Visitors beat, items (ore-dock, ferry lantern). Capstone: 25×25 lake serpent or Dogman.

- [ ] **Step 1:** Author `content/art/greatlakes.ts`.
- [ ] **Step 2:** `npm run generate-puzzles -- greatlakes` → `E20/M28/H22/X10`.
- [ ] **Step 3:** `npm run build-puzzle-lab` → visual pass.
- [ ] **Step 4:** `npx jest src/content/__tests__/catalog.test.tsx -t "greatlakes"` → PASS.
- [ ] **Step 5:** Commit `content(greatlakes): hand-drawn 80-puzzle region` (with trailer).

---

### Task 9: Author region `southwest`

Same loop. Subjects: Chupacabra (hero), Thunderbird (vast-winged Expert), Skinwalker, Owlman, Mogollon Monster, Night Crawler (thin-legged — good short-run detail), Visitors beat (UFO over mesa), items (cattle-skull, dowsing rod). Capstone: 25×25 Thunderbird (wingspan fills the canvas).

- [ ] **Step 1:** Author `content/art/southwest.ts`.
- [ ] **Step 2:** `npm run generate-puzzles -- southwest` → `E20/M28/H22/X10`.
- [ ] **Step 3:** `npm run build-puzzle-lab` → visual pass.
- [ ] **Step 4:** `npx jest src/content/__tests__/catalog.test.tsx -t "southwest"` → PASS.
- [ ] **Step 5:** Commit `content(southwest): hand-drawn 80-puzzle region` (with trailer).

---

### Task 10: Author region `atlantic` + final green

Same loop. Subjects: Champ/Gloucester sea serpents (long-necked, coiling, surfacing/diving variants), Dover Demon, Pukwudgie, Glawackus, Visitors beat, items (breakwater lantern, ship's bell). Capstone: 25×25 sea serpent.

- [ ] **Step 1:** Author `content/art/atlantic.ts`.
- [ ] **Step 2:** `npm run generate-puzzles -- atlantic` → `E20/M28/H22/X10`.
- [ ] **Step 3:** `npm run build-puzzle-lab` → visual pass.
- [ ] **Step 4: Full acceptance run (now all five regions exist)**

Run: `npx jest && npx tsc --noEmit`
Expected: PASS — including `catalog.test` `toBe(400)`, every region 80, tier splits, one capstone each, all `isUnique`.

- [ ] **Step 5: Commit**

```bash
git add content/art/atlantic.ts content/atlantic/region.gen.json src/content/regions/atlantic.json
git commit -m "content(atlantic): hand-drawn 80-puzzle region — catalog complete (400)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review (completed against the spec)

- **Spec coverage:** subject model → Tasks 2, 6–10 + Global Constraints table; hand-drawn library + safe-variation assembler → Tasks 1, 3; app-side unchanged → Task 4 (only imports rewired); uniqueness + computed tier → enforced in Tasks 2, 3 and asserted in Task 5; 400/80 counts, free/paid, capstone → Task 5 + Phase B; Puzzle Lab grouped review → Task 4 Step 5, used in Tasks 6–10; retire blob generator → Task 4; Visitors/UFO thread + items → Phase B recipes. Rollout order (pipeline → pnw quality gate → rest) → task order + STOP after Task 6.
- **Placeholder scan:** no TBD/TODO/"handle edge cases". Content tasks intentionally define a recipe + acceptance gates rather than pre-drawing 400 grids; format/quality bar are pinned by concrete example masters (Tasks 2, Phase B) and enforced by tests + the Puzzle Lab.
- **Type consistency:** `ArtEntry`/`RegionArt` (Task 2) consumed unchanged in Tasks 3–4; `GenPuzzle`/`GenRegion`/`DEFAULT_COUNTS` defined in Task 3, imported by `buildRegionJson`/`generate-puzzles` in Task 4; `nameForEntry` signature defined in Task 3 and used there; variation helper signatures (Task 1) match their calls in Task 3.
