# Content Import Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the content-import pipeline — `imageToGrid` (RGBA → thresholded `Grid`), `parseEntries` (entries.md → `FieldEntry` map), `assembleRegion`/`validateRegion` (grids + entries → validated `Region` via the engine), and `loadPngGrid` (pngjs) + `importRegion` (scan a folder of PNGs → a `Region`), all jest-tested including an end-to-end run on a generated PNG fixture.

**Architecture:** Pure, composable functions under `src/content/pipeline/`. `imageToGrid`/`parseEntries`/`assembleRegion` have no I/O and reuse the engine + `buildPuzzle`. `loadPngGrid` (pngjs) and `importRegion` (Node `fs`) are the only I/O pieces — **build-time only, never imported by app code** (so Metro never bundles `fs`/`pngjs`). The pipeline turns the author's deliverables (PNG pixel-art named `{regionId}-{order}-{slug}.png` + an `entries.md`) into a validated `Region`, deriving clues/difficulty/uniqueness through the existing engine.

**Tech Stack:** TypeScript, `pngjs` (pure-JS PNG codec, dev dependency), Jest. Reuses `@/engine` + `buildPuzzle`.

## Global Constraints

- Pipeline I/O modules (`loadPngGrid`, `importRegion`) are **build-time only** — no app screen/route/store may import them (they pull in Node `fs`/`pngjs`). The pure modules (`imageToGrid`, `parseEntries`, `assembleRegion`) are I/O-free. (DATA_AND_ENGINE.md §5; keeps the RN bundle clean)
- Pixel threshold: a pixel is filled (`1`) when it is non-transparent (`alpha > 0`) AND its average RGB `< 128`; else empty (`0`). (DATA_AND_ENGINE.md §2.2)
- Do NOT hand-author puzzle derived fields — derive via the engine through `buildPuzzle`. (DATA_AND_ENGINE.md §2.1)
- PNG filenames follow `{regionId}-{order}-{slug}.png`; the puzzle id is `{regionId}-{order}`; a puzzle is a capstone when its grid is 25×25. (DATA_AND_ENGINE.md §2.2, §5.2)
- Validation surfaces (does not silently drop) problems: unmatched puzzle↔entry, non-unique (`requiresGuessing`) puzzles, duplicate ids, mis-sized capstones. (DATA_AND_ENGINE.md §5.2–5.3)
- `pngjs` goes in **devDependencies** (build-time). If jest can't resolve/transform it, add `pngjs` to `transformIgnorePatterns`.
- Jest tests only (Node functions) — no rendering. Every commit message ends with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Project root: `/home/chris/Code/cryptid-picross`.

---

### Task 1: imageToGrid

Threshold RGBA pixel data into a `Grid`. (DATA_AND_ENGINE.md §2.2)

**Files:**
- Create: `src/content/pipeline/imageToGrid.ts`
- Test: `src/content/pipeline/__tests__/imageToGrid.test.ts`

**Interfaces:**
- Consumes: `Grid`, `Cell` from `@/engine`.
- Produces: `imageToGrid(pixels: ArrayLike<number>, width: number, height: number, threshold?: number): Grid`.

- [ ] **Step 1: Write the failing test**

Create `src/content/pipeline/__tests__/imageToGrid.test.ts`:
```typescript
import { imageToGrid } from '@/content/pipeline/imageToGrid';

// helper: build an RGBA buffer from a map fn
const rgba = (w: number, h: number, at: (x: number, y: number) => [number, number, number, number]) => {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const [r, g, b, a] = at(x, y);
      const i = (y * w + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a;
    }
  }
  return data;
};

describe('imageToGrid', () => {
  it('fills dark, opaque pixels and leaves white/transparent empty', () => {
    // 2x2: top-left black (fill), top-right white (empty), bottom-left transparent (empty), bottom-right dark-but-transparent (empty)
    const data = rgba(2, 2, (x, y) => {
      if (x === 0 && y === 0) return [0, 0, 0, 255]; // fill
      if (x === 1 && y === 0) return [255, 255, 255, 255]; // white -> empty
      if (x === 0 && y === 1) return [0, 0, 0, 0]; // transparent -> empty
      return [10, 10, 10, 0]; // dark but transparent -> empty
    });
    expect(imageToGrid(data, 2, 2)).toEqual([[1, 0], [0, 0]]);
  });

  it('respects the threshold boundary (avg < threshold fills)', () => {
    const gray = rgba(1, 1, () => [127, 127, 127, 255]);
    const lighter = rgba(1, 1, () => [128, 128, 128, 255]);
    expect(imageToGrid(gray, 1, 1, 128)).toEqual([[1]]); // 127 < 128 -> fill
    expect(imageToGrid(lighter, 1, 1, 128)).toEqual([[0]]); // 128 not < 128 -> empty
  });

  it('produces a grid of the right dimensions', () => {
    const data = rgba(3, 2, () => [0, 0, 0, 255]);
    const grid = imageToGrid(data, 3, 2);
    expect(grid.length).toBe(2);
    expect(grid[0].length).toBe(3);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- imageToGrid` → FAIL.

- [ ] **Step 3: Implement**

Create `src/content/pipeline/imageToGrid.ts`:
```typescript
import { Grid, Cell } from '@/engine';

/**
 * Convert RGBA pixel data to a source-of-truth Grid.
 * A pixel is filled (1) when non-transparent (alpha > 0) AND average RGB < threshold.
 * (DATA_AND_ENGINE.md §2.2)
 */
export function imageToGrid(
  pixels: ArrayLike<number>,
  width: number,
  height: number,
  threshold = 128,
): Grid {
  const grid: Grid = [];
  for (let y = 0; y < height; y += 1) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      const avg = (r + g + b) / 3;
      row.push(a > 0 && avg < threshold ? 1 : 0);
    }
    grid.push(row);
  }
  return grid;
}
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- imageToGrid && npx tsc --noEmit` → PASS (3), exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(pipeline): add imageToGrid PNG-threshold conversion

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: parseEntries

Parse the author's `entries.md` into a map of `FieldEntry` by puzzle id. (DATA_AND_ENGINE.md §2.3)

**Files:**
- Create: `src/content/pipeline/parseEntries.ts`
- Test: `src/content/pipeline/__tests__/parseEntries.test.ts`

**Interfaces:**
- Consumes: `FieldEntry`, `VoiceStyle` from `@/engine`.
- Produces: `parseEntries(markdown: string): Record<string, FieldEntry>`.

- [ ] **Step 1: Write the failing test**

Create `src/content/pipeline/__tests__/parseEntries.test.ts`:
```typescript
import { parseEntries } from '@/content/pipeline/parseEntries';

const MD = `## pnw-001 · The Roadside Encounter

**Voice:** notebook
**Year:** 1987
**Credibility:** medium

Trucker reported a flying saucer hovering above the treeline.
Radio silence during the sighting.

---

## pnw-002 · The Colony

**Voice:** firstPerson

They came at dusk and did not leave a trail.
`;

describe('parseEntries', () => {
  it('parses id, title, voice, year, credibility, and body', () => {
    const entries = parseEntries(MD);
    expect(Object.keys(entries).sort()).toEqual(['pnw-001', 'pnw-002']);
    const e = entries['pnw-001'];
    expect(e.title).toBe('The Roadside Encounter');
    expect(e.voiceStyle).toBe('notebook');
    expect(e.yearReported).toBe(1987);
    expect(e.witnessCredibility).toBe('medium');
    expect(e.body).toMatch(/Trucker reported/);
    expect(e.body).toMatch(/Radio silence/);
  });

  it('defaults voice to notebook and omits optional fields when absent', () => {
    const e = parseEntries(MD)['pnw-002'];
    expect(e.voiceStyle).toBe('firstPerson');
    expect(e.yearReported).toBeUndefined();
    expect(e.witnessCredibility).toBeUndefined();
    expect(e.body).toMatch(/came at dusk/);
  });

  it('returns an empty map for empty input', () => {
    expect(parseEntries('')).toEqual({});
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- parseEntries` → FAIL.

- [ ] **Step 3: Implement**

Create `src/content/pipeline/parseEntries.ts`:
```typescript
import { FieldEntry, VoiceStyle } from '@/engine';

const VOICES: VoiceStyle[] = ['notebook', 'firstPerson', 'victorian', 'deadpan'];

/**
 * Parse entries.md (DATA_AND_ENGINE.md §2.3) into { id -> FieldEntry }.
 * Each entry is a `## <id> · <title>` block followed by optional
 * **Voice:** / **Year:** / **Credibility:** lines and a body, ended by `---` or EOF.
 * (Body paragraphs are joined into one for v1; multi-paragraph preservation is a later refinement.)
 */
export function parseEntries(markdown: string): Record<string, FieldEntry> {
  const entries: Record<string, FieldEntry> = {};
  const blocks = markdown.split(/^##\s+/m).map((b) => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n');
    const header = lines[0];
    const headerMatch = header.match(/^(\S+)\s*·\s*(.+)$/);
    if (!headerMatch) continue;
    const id = headerMatch[1].trim();
    const title = headerMatch[2].trim();

    let voiceStyle: VoiceStyle = 'notebook';
    let yearReported: number | undefined;
    let witnessCredibility: FieldEntry['witnessCredibility'];
    const bodyLines: string[] = [];

    for (const raw of lines.slice(1)) {
      const line = raw.trim();
      if (line === '---') break;
      if (line === '') continue;

      const vm = line.match(/^\*\*Voice:\*\*\s*(.+)$/i);
      if (vm) {
        const v = vm[1].trim() as VoiceStyle;
        if (VOICES.includes(v)) voiceStyle = v;
        continue;
      }
      const ym = line.match(/^\*\*Year:\*\*\s*(\d+)$/i);
      if (ym) {
        yearReported = parseInt(ym[1], 10);
        continue;
      }
      const cm = line.match(/^\*\*Credibility:\*\*\s*(low|medium|high)$/i);
      if (cm) {
        witnessCredibility = cm[1].toLowerCase() as FieldEntry['witnessCredibility'];
        continue;
      }
      bodyLines.push(line);
    }

    entries[id] = {
      title,
      body: bodyLines.join(' ').replace(/\s+/g, ' ').trim(),
      voiceStyle,
      ...(yearReported !== undefined ? { yearReported } : {}),
      ...(witnessCredibility ? { witnessCredibility } : {}),
    };
  }

  return entries;
}
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- parseEntries && npx tsc --noEmit` → PASS (3), exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(pipeline): add parseEntries markdown parser

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: assembleRegion + validateRegion

Turn grids + entries into a validated `Region` via the engine. (DATA_AND_ENGINE.md §5.2–5.3)

**Files:**
- Create: `src/content/pipeline/assembleRegion.ts`
- Test: `src/content/pipeline/__tests__/assembleRegion.test.ts`

**Interfaces:**
- Consumes: `Region` from `@/engine`; `buildPuzzle`, `PuzzleInput` from `../buildPuzzle`.
- Produces:
  - `RegionMeta = { id; name; tagline; tint; isFree; iapProductId? }`
  - `assembleRegion(meta: RegionMeta, puzzleInputs: PuzzleInput[]): Region`
  - `validateRegion(region: Region): string[]`

- [ ] **Step 1: Write the failing test**

Create `src/content/pipeline/__tests__/assembleRegion.test.ts`:
```typescript
import { assembleRegion, validateRegion } from '@/content/pipeline/assembleRegion';
import type { PuzzleInput } from '@/content/buildPuzzle';
import type { FieldEntry } from '@/engine';

const entry: FieldEntry = { title: 'X', body: 'Y', voiceStyle: 'notebook' };
const meta = { id: 'pnw', name: 'PNW', tagline: 't', tint: '#5D6B4E', isFree: true };

const uniquePlus: PuzzleInput = {
  id: 'pnw-001', name: 'Plus', subtitle: 's',
  grid: [[0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [1, 1, 1, 1, 1], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0]],
  entry, metadata: { regionId: 'pnw', order: 1, isCapstone: false },
};
const ambiguous: PuzzleInput = {
  id: 'pnw-002', name: 'Checker', subtitle: 's',
  grid: [[1, 0], [0, 1]], // 2x2 checkerboard -> not uniquely solvable
  entry, metadata: { regionId: 'pnw', order: 2, isCapstone: false },
};

describe('assembleRegion', () => {
  it('builds a region with derived puzzles', () => {
    const region = assembleRegion(meta, [uniquePlus]);
    expect(region.id).toBe('pnw');
    expect(region.totalPuzzles).toBe(1);
    expect(region.puzzles[0].rowClues).toEqual([[1], [1], [5], [1], [1]]);
    expect(region.puzzles[0].isUnique).toBe(true);
  });
});

describe('validateRegion', () => {
  it('returns no warnings for a clean region', () => {
    expect(validateRegion(assembleRegion(meta, [uniquePlus]))).toEqual([]);
  });

  it('warns about a puzzle that requires guessing', () => {
    const warnings = validateRegion(assembleRegion(meta, [ambiguous]));
    expect(warnings.some((w) => w.includes('pnw-002') && /guess/i.test(w))).toBe(true);
  });

  it('warns about duplicate puzzle ids', () => {
    const warnings = validateRegion(assembleRegion(meta, [uniquePlus, { ...uniquePlus }]));
    expect(warnings.some((w) => /duplicate/i.test(w))).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- assembleRegion` → FAIL.

- [ ] **Step 3: Implement**

Create `src/content/pipeline/assembleRegion.ts`:
```typescript
import { Region } from '@/engine';
import { buildPuzzle, PuzzleInput } from '../buildPuzzle';

export interface RegionMeta {
  id: string;
  name: string;
  tagline: string;
  tint: string;
  isFree: boolean;
  iapProductId?: string;
}

/** Build a Region by deriving each puzzle from its authored grid via the engine. */
export function assembleRegion(meta: RegionMeta, puzzleInputs: PuzzleInput[]): Region {
  const puzzles = puzzleInputs.map(buildPuzzle);
  return { ...meta, puzzles, totalPuzzles: puzzles.length };
}

/** Surface content problems (never silently ship them). Returns human-readable warnings. */
export function validateRegion(region: Region): string[] {
  const warnings: string[] = [];
  const seen = new Set<string>();
  for (const p of region.puzzles) {
    if (seen.has(p.id)) warnings.push(`duplicate puzzle id: ${p.id}`);
    seen.add(p.id);
    if (p.requiresGuessing) warnings.push(`puzzle ${p.id} requires guessing (not uniquely solvable)`);
    if (!p.entry || !p.entry.body) warnings.push(`puzzle ${p.id} is missing a field entry`);
    const rows = p.grid.length;
    const cols = rows > 0 ? p.grid[0].length : 0;
    if (p.metadata.isCapstone && (rows !== 25 || cols !== 25)) {
      warnings.push(`capstone ${p.id} is ${rows}x${cols}, not 25x25`);
    }
  }
  return warnings;
}
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- assembleRegion && npx tsc --noEmit` → PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(pipeline): add assembleRegion + validateRegion

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: loadPngGrid + importRegion (end-to-end)

The I/O layer: decode PNG files (pngjs) and orchestrate a full folder import, proven end-to-end on a generated fixture. (DATA_AND_ENGINE.md §5.2)

**Files:**
- Create: `src/content/pipeline/loadPngGrid.ts`
- Create: `src/content/pipeline/importRegion.ts`
- Create: `src/content/pipeline/index.ts`
- Modify: `package.json` (dev deps)
- Test: `src/content/pipeline/__tests__/importRegion.test.ts`

**Interfaces:**
- Consumes: `pngjs`, Node `fs`/`path`; `imageToGrid`, `parseEntries`, `assembleRegion`/`validateRegion`; `PuzzleInput` from `../buildPuzzle`; `Grid`, `Region` from `@/engine`.
- Produces:
  - `loadPngGrid(filePath: string, threshold?: number): Grid`
  - `importRegion(opts: { artDir: string; entriesPath: string; region: RegionMeta }): { region: Region; warnings: string[] }`
  - `src/content/pipeline/index.ts` re-exporting the pipeline.

- [ ] **Step 1: Install pngjs (dev)**

Run:
```bash
cd /home/chris/Code/cryptid-picross
npm install --save-dev pngjs @types/pngjs
```

- [ ] **Step 2: Write the failing end-to-end test**

Create `src/content/pipeline/__tests__/importRegion.test.ts`:
```typescript
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PNG } from 'pngjs';
import { importRegion } from '@/content/pipeline/importRegion';

// A 5x5 plus (uniquely solvable). Black+opaque = fill, white = empty.
const PLUS = [
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [1, 1, 1, 1, 1],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
];

function writePlusPng(file: string) {
  const png = new PNG({ width: 5, height: 5 });
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 5; x += 1) {
      const i = (y * 5 + x) * 4;
      const filled = PLUS[y][x] === 1;
      png.data[i] = filled ? 0 : 255;
      png.data[i + 1] = filled ? 0 : 255;
      png.data[i + 2] = filled ? 0 : 255;
      png.data[i + 3] = 255;
    }
  }
  fs.writeFileSync(file, PNG.sync.write(png));
}

describe('importRegion (end-to-end)', () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-import-'));
    writePlusPng(path.join(dir, 'pnw-001-testcryptid.png'));
    fs.writeFileSync(
      path.join(dir, 'entries.md'),
      '## pnw-001 · Test Cryptid\n\n**Voice:** notebook\n**Year:** 1974\n\nA shape stood at the crossing.\n',
    );
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('imports PNGs + entries into a validated region', () => {
    const { region, warnings } = importRegion({
      artDir: dir,
      entriesPath: path.join(dir, 'entries.md'),
      region: { id: 'pnw', name: 'PNW', tagline: 'trees watch', tint: '#5D6B4E', isFree: true },
    });
    expect(region.puzzles).toHaveLength(1);
    const p = region.puzzles[0];
    expect(p.id).toBe('pnw-001');
    expect(p.name).toBe('Test Cryptid');
    expect(p.grid).toEqual(PLUS);
    expect(p.rowClues).toEqual([[1], [1], [5], [1], [1]]);
    expect(p.isUnique).toBe(true);
    expect(p.entry.body).toMatch(/crossing/);
    expect(p.entry.yearReported).toBe(1974);
    expect(warnings).toEqual([]);
  });

  it('warns when a PNG has no matching entry', () => {
    writePlusPng(path.join(dir, 'pnw-002-orphan.png'));
    const { warnings } = importRegion({
      artDir: dir,
      entriesPath: path.join(dir, 'entries.md'),
      region: { id: 'pnw', name: 'PNW', tagline: 't', tint: '#5D6B4E', isFree: true },
    });
    expect(warnings.some((w) => w.includes('pnw-002'))).toBe(true);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- importRegion` → FAIL (no module). If it instead fails on a `pngjs` transform error, add `pngjs` to `transformIgnorePatterns` in `jest.config.js` and re-run.

- [ ] **Step 4: Implement**

Create `src/content/pipeline/loadPngGrid.ts`:
```typescript
import * as fs from 'fs';
import { PNG } from 'pngjs';
import { Grid } from '@/engine';
import { imageToGrid } from './imageToGrid';

/** Build-time only: decode a PNG file to a Grid. Do NOT import from app code. */
export function loadPngGrid(filePath: string, threshold = 128): Grid {
  const png = PNG.sync.read(fs.readFileSync(filePath));
  return imageToGrid(png.data, png.width, png.height, threshold);
}
```

Create `src/content/pipeline/importRegion.ts`:
```typescript
import * as fs from 'fs';
import * as path from 'path';
import { Region } from '@/engine';
import { PuzzleInput } from '../buildPuzzle';
import { loadPngGrid } from './loadPngGrid';
import { parseEntries } from './parseEntries';
import { assembleRegion, validateRegion, RegionMeta } from './assembleRegion';

const humanize = (slug: string): string =>
  slug.split('-').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');

/**
 * Build-time only: scan a folder of `{regionId}-{order}-{slug}.png` files, decode each
 * to a Grid, match to entries.md, derive puzzles via the engine, and validate. Do NOT
 * import from app code (pulls in fs/pngjs). (DATA_AND_ENGINE.md §5.2)
 */
export function importRegion(opts: {
  artDir: string;
  entriesPath: string;
  region: RegionMeta;
}): { region: Region; warnings: string[] } {
  const entries = parseEntries(fs.readFileSync(opts.entriesPath, 'utf8'));
  const files = fs
    .readdirSync(opts.artDir)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .sort();

  const warnings: string[] = [];
  const inputs: PuzzleInput[] = [];

  for (const file of files) {
    const m = file.match(/^([a-z0-9]+)-(\d+)-(.+)\.png$/i);
    if (!m) {
      warnings.push(`skipped unrecognized filename: ${file}`);
      continue;
    }
    const [, , orderStr, slug] = m;
    const order = parseInt(orderStr, 10);
    const id = `${opts.region.id}-${orderStr}`;
    const grid = loadPngGrid(path.join(opts.artDir, file));
    const entry = entries[id];
    if (!entry) {
      warnings.push(`no entry for ${id} (from ${file})`);
      continue;
    }
    const rows = grid.length;
    const cols = rows > 0 ? grid[0].length : 0;
    inputs.push({
      id,
      name: entry.title,
      subtitle: humanize(slug),
      grid,
      entry,
      metadata: { regionId: opts.region.id, order, isCapstone: rows === 25 && cols === 25 },
    });
  }

  const region = assembleRegion(opts.region, inputs);
  return { region, warnings: [...warnings, ...validateRegion(region)] };
}
```

Create `src/content/pipeline/index.ts`:
```typescript
export { imageToGrid } from './imageToGrid';
export { parseEntries } from './parseEntries';
export { assembleRegion, validateRegion } from './assembleRegion';
export type { RegionMeta } from './assembleRegion';
export { loadPngGrid } from './loadPngGrid';
export { importRegion } from './importRegion';
```

- [ ] **Step 5: Run the pipeline tests + full suite + typecheck**

Run: `npm test -- pipeline && npm test && npx tsc --noEmit`
Expected: pipeline tests pass, entire suite green, tsc exit 0.

- [ ] **Step 6: Confirm the app bundle is unaffected (pipeline stays build-time)**

Run:
```bash
rm -rf /tmp/cp-pipeline-export && npx expo export --platform ios --output-dir /tmp/cp-pipeline-export >/tmp/cp-pipeline.log 2>&1; echo "export exit: $?"
```
Expected: `export exit: 0`. Because no app screen/route imports `src/content/pipeline/*`, Metro must not pull `fs`/`pngjs` into the bundle. If export fails referencing `fs`/`pngjs`, something in `src/app`/`src/components` imported the pipeline — remove that import.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(pipeline): add loadPngGrid + importRegion end-to-end importer

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the executor

- The pipeline is **build-time only**: `loadPngGrid`/`importRegion` import `fs`/`pngjs`. Never import them from `src/app`, `src/components`, or stores — Step 6's export check guards this.
- `pngjs` is a pure-JS PNG codec (no native build); it belongs in devDependencies. If jest errors transforming it, add `pngjs` to `transformIgnorePatterns`.
- The importer derives everything through the engine (`buildPuzzle`) — clues, difficulty, uniqueness — so the author only supplies pixel-art + prose. A non-unique grid surfaces as a warning, not a silent ship.
- A thin CLI (`scripts/import-region.ts`) that calls `importRegion` and writes `src/content/regions/{id}.json` is a trivial later add; it's out of scope here (the tested `importRegion` function is the pipeline; wiring a CLI needs a Node path-alias runner, a separate concern).
- Multi-paragraph entry bodies, cultural-attribution injection (§2.4), and the difficulty-rebalance report (§5.4) are later refinements.
