# DATA_AND_ENGINE.md
### Picross: Cryptozoology — Data Schemas, Save State, and Engine Algorithms

*This document is the formal specification for every piece of typed data in the app and every algorithm the puzzle engine implements. Claude Code should treat this as the source of truth; if the code disagrees with this document, the document is right and the code needs to be fixed.*

---

## Section 1 — Core TypeScript Types

All types live in `/src/engine/puzzleTypes.ts` and `/src/content/content.d.ts`. Every screen, component, and store imports from these files. Never inline types.

### 1.1 Primitives

```typescript
// A single cell in the source-of-truth puzzle grid
export type Cell = 0 | 1;  // 0 = empty, 1 = filled

// A row or column of the grid
export type Line = Cell[];

// The entire puzzle grid
export type Grid = Line[];  // grid[row][col]

// A single clue = list of run lengths for one row/column
// [0] means "empty line, no filled cells"
export type Clue = number[];

// All clues for a puzzle
export type Clues = Clue[];

// The state of a cell during play (different from source-of-truth Cell)
export type PlayCell = 0 | 1 | 2;  // 0 = empty, 1 = filled by user, 2 = marked with X

// The player's in-progress grid
export type PlayGrid = PlayCell[][];
```

### 1.2 Difficulty

```typescript
export type Tier = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface DifficultyScore {
  size: number;         // 0-5, from grid area
  density: number;      // 0-5, distance from 50% fill
  segmentLength: number; // 0-5, inverse of average run length
  asymmetry: number;    // 0-5, mirror symmetry distance
  solveDepth: number;   // 0-5, propagation rounds needed
  total: number;        // sum, 0-25
  tier: Tier;           // bucketed from total
}
```

### 1.3 Puzzle

```typescript
export interface Puzzle {
  id: string;                    // stable unique ID (e.g., "pnw-001")
  name: string;                  // in-game display name
  subtitle: string;              // "Sasquatch · Ape Canyon, WA"
  grid: Grid;                    // source of truth (server-authoritative)
  rowClues: Clues;               // derived from grid, cached for perf
  colClues: Clues;               // derived from grid, cached for perf
  fillRatio: number;             // % of filled cells, 0..1
  isUnique: boolean;             // true if pure logic solves it
  requiresGuessing: boolean;     // inverse of isUnique, semantic alias
  difficulty: DifficultyScore;
  entry: FieldEntry;             // the case file unlocked on solve
  metadata: PuzzleMetadata;
}

export interface PuzzleMetadata {
  regionId: string;              // 'pnw' | 'appalachia' | 'british' | 'outback'
  order: number;                 // 1-100 within region
  isCapstone: boolean;           // true for the 25×25 region flagship
  cryptidName?: string;          // optional link to a cryptid the puzzle depicts
  culturalSource?: {             // if drawn from Indigenous folklore
    tradition: string;
    creditText: string;
    furtherReading?: string;     // URL
  };
}
```

### 1.4 Field Entry

```typescript
export interface FieldEntry {
  title: string;                 // "MOTHMAN · POINT PLEASANT"
  body: string;                  // 1-3 paragraph case file text
  voiceStyle: VoiceStyle;        // which regional voice
  yearReported?: number;         // optional in-fiction date
  witnessCredibility?: 'low' | 'medium' | 'high';
}

export type VoiceStyle =
  | 'notebook'      // Pacific Northwest — terse, clinical
  | 'firstPerson'   // Appalachia — atmospheric, personal
  | 'victorian'     // British Isles — correspondence-style
  | 'deadpan';      // Australian Outback — dry, understated
```

### 1.5 Region

```typescript
export interface Region {
  id: string;
  name: string;                  // "The Pacific Northwest"
  tagline: string;               // "Where the trees watch"
  tint: string;                  // hex color from theme tokens
  puzzles: Puzzle[];             // ordered, length ~100
  totalPuzzles: number;          // convenience, === puzzles.length
  isFree: boolean;               // Region 1 = true; others = false
  iapProductId?: string;         // RevenueCat product ID if paid
}
```

### 1.6 Purchase Info

```typescript
export interface PurchaseInfo {
  ownedRegions: string[];        // e.g., ['pnw', 'appalachia']
  ownedPacks: string[];          // e.g., ['halloween-2027']
  purchasedFullBundle: boolean;  // convenience flag
  lastRestoredAt: number | null; // timestamp of last restore-purchases call
}
```

---

## Section 2 — Content File Schemas

Every content file on disk follows one of these exact shapes. Validation is run via `/scripts/validate-content.ts` on every build. A malformed content file must fail the build, not silently ship.

### 2.1 Region JSON — `/src/content/regions/{regionId}.json`

```json
{
  "$schema": "../../schemas/region.schema.json",
  "id": "pnw",
  "name": "The Pacific Northwest",
  "tagline": "Where the trees watch",
  "tint": "#5D6B4E",
  "isFree": true,
  "iapProductId": null,
  "puzzles": [
    {
      "id": "pnw-001",
      "name": "The Roadside Encounter",
      "subtitle": "Anomalous Craft · Route 30, near Astoria",
      "grid": [[0,0,1,1,1,1,0,0], /* ... */],
      "entry": {
        "title": "UNIDENTIFIED CRAFT · Case 004",
        "body": "Trucker reported a \"flying saucer, but not funny\"...",
        "voiceStyle": "notebook",
        "yearReported": 1987,
        "witnessCredibility": "medium"
      },
      "metadata": {
        "regionId": "pnw",
        "order": 1,
        "isCapstone": false
      }
    },
    // ... 99 more
  ]
}
```

Note: `rowClues`, `colClues`, `fillRatio`, `isUnique`, `requiresGuessing`, and `difficulty` are auto-derived at content import time by the engine — do NOT hand-author these fields.

### 2.2 Pixel Art Files

Location: `/assets/pixel-art/{regionId}/{puzzleId}.png`

**Naming convention:** `{regionId}-{order:03d}-{cryptidSlug}.png` (e.g., `pnw-001-ufo.png`, `appalachia-042-mothman.png`)

**Format rules:**
- PNG only, no JPG (JPG compression destroys pixel-perfect edges)
- Palette: black-and-white only. Non-transparent, non-white pixels become filled cells.
- Threshold: any pixel with average RGB < 128 = filled (`1`), else empty (`0`).
- Grid dimensions must match the target puzzle size (5×5 through 25×25).
- No borders. Every pixel is a cell.

### 2.3 Field Entry Markdown — `/content-authoring/{regionId}/entries.md`

Field entries are authored in markdown (easier to write and edit) then compiled to JSON. Format:

```markdown
## pnw-001 · The Roadside Encounter

**Voice:** notebook
**Year:** 1987
**Credibility:** medium

Trucker reported a "flying saucer, but not funny" hovering above the treeline for approximately eleven minutes before departing at high velocity. Witness passed a breathalyzer. Radio silence on all trucker channels during the sighting — restored the moment the object vanished. Recommend further investigation.

---

## pnw-002 · The Colony

...
```

The build script `/scripts/compile-entries.ts` parses this format and merges the entries into the region JSON files matched by ID.

### 2.4 Cultural Attribution File — `/content-authoring/cultural-credits.json`

When a cryptid is drawn from a living cultural tradition, its attribution goes here. The build script cross-references and injects into the puzzle metadata.

```json
{
  "thunderbird": {
    "tradition": "Various Indigenous peoples of the Pacific Northwest",
    "creditText": "Thunderbird appears in the traditions of the Kwakwaka'wakw, Haida, Coast Salish, and other Indigenous peoples. This depiction is atmospheric only and does not claim to represent any single tradition's teachings.",
    "furtherReading": "https://..."
  },
  "bunyip": { /* ... */ },
  "wampusCat": { /* ... */ }
}
```

---

## Section 3 — Save State Schema

Everything that persists across sessions lives in AsyncStorage under a single key. Schema is versioned to allow forward-compatible migrations.

### 3.1 The Root Save Object

Key: `@picross-cryptozoology/save/v1`

```typescript
export interface SaveStateV1 {
  version: 1;
  savedAt: number;               // Unix ms timestamp
  progress: ProgressStateV1;
  settings: SettingsStateV1;
  purchases: PurchaseStateV1;
}

export interface ProgressStateV1 {
  solved: Record<string, {       // key = puzzle id
    time: number;                // seconds to solve (best time)
    mistakes: number;            // wrong fills made on best run
    solvedAt: number;            // Unix ms of first solve
    lastPlayedAt: number;        // Unix ms of most recent play
    playCount: number;           // total times solved
  }>;
  onboardingCompleted: boolean;
  firstLaunchAt: number;         // for total-play-time analytics
}

export interface SettingsStateV1 {
  mode: 'cozy' | 'classic';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  reduceMotion: boolean;         // manual override of system setting
  ambientAudioVolume: number;    // 0..1
  effectsAudioVolume: number;    // 0..1
}

export interface PurchaseStateV1 {
  ownedRegions: string[];
  ownedPacks: string[];
  lastRestoredAt: number | null;
  purchaseHistory: {
    productId: string;
    purchasedAt: number;
    price?: string;              // display price at time of purchase
  }[];
}
```

### 3.2 What Does NOT Persist

The following are ephemeral and rebuilt from scratch each session:

- Current puzzle in progress (cellState, history, timer, tool selection)
- Navigation state (Expo Router handles this in-memory)
- Ad SDK internal state
- Any UI overlays / modals

**Rationale:** persisting mid-puzzle state doubles storage complexity for a feature that fires <1% of sessions (background→resume mid-puzzle). If a user backgrounds during a solve, they restart the puzzle. This is documented in the settings screen as a known behavior.

### 3.3 Schema Versioning & Migration

Every save has a `version` field. The load flow:

```typescript
async function loadSaveState(): Promise<SaveStateV1> {
  const raw = await AsyncStorage.getItem('@picross-cryptozoology/save/v1');
  if (raw) {
    const parsed = JSON.parse(raw);
    return parsed;  // already v1
  }

  // Check for older versions to migrate
  const rawV0 = await AsyncStorage.getItem('@picross-cryptozoology/save/v0');
  if (rawV0) return migrateV0toV1(JSON.parse(rawV0));

  return createDefaultSaveState();
}
```

**Rule:** never break v1 schema in place. If v2 is needed later, add a new storage key and a `migrateV1toV2()` function. Old versions must remain readable for at least 2 major app releases.

### 3.4 Corruption Handling

If AsyncStorage returns corrupt JSON:

1. Log the corruption event (analytics + Sentry).
2. Back up the corrupt string to `@picross-cryptozoology/save/corrupt/{timestamp}`.
3. Reset to default state.
4. Show a one-time toast on next home screen: "Some saved progress couldn't be loaded. Sorry about that."

Never silently lose data. Never crash on corruption.

---

## Section 4 — Engine Algorithms

Formal spec for every algorithm in `/src/engine/`. The Python source (`nonogram_engine.py`) is the reference implementation; the TypeScript port must be functionally identical.

### 4.1 Clue Derivation — `deriveClues(grid: Grid): { row: Clues; col: Clues }`

**Input:** a `Grid` (2D array of `0` and `1`).

**Output:** two arrays of `Clue`. `row[i]` is the clue for row `i`. `col[j]` is the clue for column `j`.

**Algorithm:**

```
function lineClues(line: Line): Clue:
    runs = []
    currentRun = 0
    for cell in line:
        if cell == 1:
            currentRun += 1
        else if currentRun > 0:
            runs.push(currentRun)
            currentRun = 0
    if currentRun > 0:
        runs.push(currentRun)
    return runs.length > 0 ? runs : [0]
```

**Correctness:** for any grid, `deriveClues` produces the unique clue lists that describe that grid. No ambiguity.

**Complexity:** O(rows × cols).

### 4.2 Line Candidate Enumeration — `possibleLines(clue: Clue, length: number): Line[]`

**Input:** a single clue (e.g., `[2, 3]`) and a line length (e.g., 10).

**Output:** every valid arrangement of the runs in a line of that length.

**Algorithm:** recursive placement, respecting minimum gaps of 1 between consecutive runs. See `_possible_lines()` in the Python source for reference implementation.

**Complexity:** exponential in worst case, bounded in practice by grid size ≤ 25. Precompute and cache per line at puzzle load time to avoid recomputation.

### 4.3 Line Intersection — `intersectLines(candidates: Line[]): (Cell | null)[]`

**Input:** a list of candidate lines (all same length).

**Output:** an array where each position is:
- `1` if every candidate has `1` there
- `0` if every candidate has `0` there
- `null` if candidates disagree

This is the "logical guaranteed" state per cell after considering all candidates.

### 4.4 Uniqueness Check + Solve Depth — `analyzePuzzle(rowClues, colClues): { unique: boolean; depth: number }`

**Purpose:** determine whether a puzzle can be solved by pure line-by-line logic without guessing, and how many propagation rounds it takes.

**Algorithm:**

```
Initialize an empty solution grid (all cells = null)
For each row and col, compute all possible line candidates

For depth = 1 to 50:
    changed = false

    For each row:
        Filter row candidates against known cells
        If no candidates remain: return { unique: false, depth }
        Intersect remaining candidates
        Apply guaranteed cells to solution grid
        If any cell changed: changed = true

    For each col:
        Same as row propagation

    If all cells solved: return { unique: true, depth }
    If not changed this round: return { unique: false, depth }

Return { unique: false, depth: 50 }
```

**Semantic notes:**
- `unique: true` means the puzzle is fully solvable by pure logical deduction, with no guessing required. Guaranteed to be well-formed for players.
- `unique: false` means the puzzle either (a) has multiple valid solutions, or (b) requires backtracking/guessing to solve. Both make it a bad puzzle for shipping. Flag with `requiresGuessing: true` in metadata.
- `depth` measures logical difficulty independently of grid size — a 15×15 puzzle solvable in depth 2 is easier than a 10×10 in depth 6.

### 4.5 Difficulty Scoring — `scoreDifficulty(grid, rowClues, colClues, unique, depth): DifficultyScore`

Five axes, each 0–5. Total is 0–25. Tier is bucketed from total.

**Axis 1 — Size**

```
area = rows × cols
if area ≤ 25:  score = 1.0
elif area ≥ 625: score = 5.0
else: score = 1.0 + 4.0 × (area - 25) / 600
```

**Axis 2 — Density**

```
fillRatio = sumOfFilledCells / totalCells
deviation = abs(fillRatio - 0.5) × 2   // 0..1
score = min(5, deviation × 5)
```

Rationale: puzzles further from 50% fill are harder because they have more empty regions requiring elimination logic.

**Axis 3 — Segment Length**

```
allRuns = flatten(rowClues + colClues) where run > 0
avgRun = mean(allRuns)
if avgRun >= 6: score = 0
else: score = clamp(6 - avgRun, 0, 5)
```

Rationale: shorter runs create more ambiguity, requiring more deduction.

**Axis 4 — Asymmetry**

```
horizontalDiffs = count cells where grid[r][c] != grid[r][cols-1-c]
verticalDiffs   = count cells where grid[r][c] != grid[rows-1-r][c]
bestSymmetry = min(horizontalDiffs, verticalDiffs) / totalCells
score = min(5, bestSymmetry × 10)
```

Rationale: symmetric puzzles can be half-solved and doubled, effectively halving difficulty.

**Axis 5 — Solve Depth**

```
if not unique: score = 5.0
else: score = clamp((depth - 1) × 0.8, 0, 5)
```

Rationale: puzzles requiring many propagation rounds — or unsolvable by pure logic — are genuinely harder.

**Total → Tier bucketing:**

```
total < 8:      Easy
total < 14:     Medium
total < 19:     Hard
total >= 19:    Expert
```

### 4.6 Win Detection — `isSolved(playGrid, targetGrid): boolean`

**Rule:** every cell must match exactly.

```
for r in rows:
    for c in cols:
        shouldFill = targetGrid[r][c] === 1
        isFilled = playGrid[r][c] === 1
        if shouldFill !== isFilled: return false
return true
```

**Important:** `playGrid` uses `2` for marks (which are cognitive aids, not fills). Marks never count as fills for win detection. A cell marked with `2` in a should-fill position = incomplete.

---

## Section 5 — Content Import Pipeline

The end-to-end flow from author-produced files to shipped app content.

### 5.1 Author's Deliverables (per region)

- 100 PNG files in `/assets/pixel-art/{regionId}/`
- `/content-authoring/{regionId}/entries.md` with 100 markdown entries
- Any new entries added to `/content-authoring/cultural-credits.json`

### 5.2 The Import Script — `/scripts/import-region.ts`

Run: `npm run import-region -- --region pnw`

**Steps:**

1. Scan `/assets/pixel-art/pnw/` for all PNGs
2. For each PNG:
   - Load with sharp or jimp
   - Convert to `Grid` (thresholded)
   - Derive clues via `deriveClues()`
   - Run uniqueness/depth analysis
   - Score difficulty
   - Extract cryptid slug from filename
   - Look up cultural attribution if applicable
3. Parse `/content-authoring/pnw/entries.md`
4. Match entries to puzzles by ID (filename order)
5. Warn on any unmatched puzzles or entries
6. Emit `/src/content/regions/pnw.json`
7. Print summary: puzzle count per tier, uniqueness failures, warnings

**Validation gates (script exits non-zero if):**
- Puzzle count ≠ 100
- Any puzzle has no matching entry
- Any puzzle marked as capstone is not 25×25
- Any puzzle marked in a difficulty folder but scored a different tier (unless overridden with `--allow-tier-drift`)
- Any cryptid marked with cultural attribution but missing credit text

### 5.3 Content Validation — `/scripts/validate-content.ts`

Run: `npm run validate-content`

Runs on every build (CI hook). Checks every content file for:

- Schema validity (matches TypeScript types)
- Grid dimensions match declared size
- Row/col clues re-derive to match stored values
- All required fields present
- Cultural credits present where required
- No duplicate puzzle IDs across regions
- Tier distribution per region matches target (100 puzzles, ~25/35/30/10 split)

**Fails the build if any check fails.** Content bugs never ship silently.

### 5.4 Difficulty Rebalancing — `/scripts/rebalance-difficulty.ts`

Run periodically during content development. Re-scores every puzzle and suggests moves.

Output: markdown report listing:
- Puzzles that scored a different tier than their folder assignment
- Puzzles flagged `requiresGuessing: true` (probably should be redrawn)
- Regions with poor tier distribution (e.g., only 5 Expert puzzles out of a target of 10)

---

## Section 6 — Performance Guardrails

Numeric limits Claude Code should enforce in code and tests:

| Metric | Target | Hard limit |
|---|---|---|
| App cold start | < 1.5s | < 3.0s |
| Home → puzzle load | < 300ms | < 800ms |
| Puzzle grid tap → visual response | < 16ms | < 33ms |
| Puzzle solve check per tap | < 5ms | < 20ms |
| Save state write | < 50ms | < 200ms |
| Full content load into memory | < 20MB | < 40MB |
| Individual puzzle memory footprint | < 8KB | < 32KB |

If any hard limit is hit in profiling, that's a bug, not a limitation.

Load content lazily: only the current region's puzzles need to be in memory at a time. Other regions load on-demand from `/src/content/regions/*.json` via Metro's async require.

---

*End of DATA_AND_ENGINE.md. All types, schemas, algorithms, and pipelines documented. If a new type or algorithm is needed during development, add it here first and get sign-off before implementing.*
