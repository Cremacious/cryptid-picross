# Puzzle Catalog & Procedural Generator — Design

**Goal:** A full 500-puzzle catalog across 5 regions, procedurally generated (engine-verified),
plus a browser tool to review and tweak every puzzle without playing them.

## Catalog

- **5 regions × 100 puzzles = 500.** 2 free (200) + 3 paid (300).

| # | id | Region | Access | Product id |
|---|----|--------|--------|-----------|
| 1 | `pnw` | The Pacific Northwest | Free | — |
| 2 | `appalachia` | Appalachia | Free | — |
| 3 | `greatlakes` | The Great Lakes | Paid | `region.greatlakes` |
| 4 | `southwest` | The Desert Southwest | Paid | `region.southwest` |
| 5 | `atlantic` | New England & the Atlantic | Paid | `region.atlantic` |

- **Bundle:** `bundle.all` unlocks all 5 — "All 5 Regions — $6.99" (regions $2.99 each).
- **Per region tier split:** ~25 Easy / 35 Medium / 30 Hard / 10 Expert, binned by the
  engine's *computed* tier (never assumed), plus exactly **one 25×25 capstone** (an Expert).

## Difficulty levers (from `scoreDifficulty`)

Total 0–25, bucketed: <8 Easy, <14 Medium, <19 Hard, ≥19 Expert. Axes: size (area),
density (|fill−0.5|), segment length (short runs = harder), asymmetry (bilateral symmetry
= 0), solve depth (propagation rounds; non-line-solvable = max but that's rejected).
Consequences for generation:
- Low tiers: small + symmetric (recognizable, reliably Easy/Medium).
- High tiers: larger + **asymmetric** + moderate depth (symmetry alone caps at ~Medium).
- **Uniqueness = line-solvable** (`analyzePuzzle`), which enumerates all line candidates, so
  grids must stay **connected with few runs per line** or 25×25 validation explodes.

## Procedural silhouette generator

`content/generator/` (build-time, run via tsx):
- **silhouette.ts** — grow a single connected blob from seed(s); optional vertical-axis
  mirroring for creature-like symmetry; target size band + fill; reject grids whose worst
  line exceeds a run-count cap (keeps `analyzePuzzle` fast).
- **validate** — `buildPuzzle` → require `isUnique` (line-solvable) and bin by computed tier.
- **names.ts / lore.ts** — themed cryptid names + field-note entries (varied voice / year /
  credibility), templated per region, hand-authored for the 5 capstones + region heroes.
- **generateRegion.ts** — fill each region to 25/35/30/10 by generating across size bands and
  binning; guarantee one 25×25 capstone; write an editable source file.

**Source format** (human-editable, the tweak target): `content/<id>/region.gen.json` — region
meta + `puzzles: [{ id, name, subtitle, grid: string[] (`#`/`.` rows), entry }]`. A build step
runs each grid through `buildPuzzle` and writes `src/content/regions/<id>.json` (what the app
imports). Tweaking a grid + re-running the build updates the app; no code changes.

## Review / tweak tool

A self-contained HTML "Puzzle Lab" (`content/puzzle-lab.html`, opened in the browser):
- **Contact sheet** of all 500 silhouettes with region/tier/size/name; filter by region & tier.
- **Editor**: click a puzzle → toggle cells; live clue preview + a uniqueness/tier readout
  (a minimal line-solver ported to JS); **export** changed puzzles as JSON to paste back into
  the source file. Lets Chris fix silhouettes without playing anything.

## App wiring

- Replace the hardcoded/sample `sampleRegions` with the 5 generated region JSONs; `isFree`
  true for pnw + appalachia. `getSampleRegion`/`getPuzzleById` unchanged (already iterate all).
- Paywall/bundle copy → "All 5 Regions"; catalog `bundleProductId` already `bundle.all`.

## Validation

Tests assert: each region has exactly 100 puzzles; tier distribution within tolerance of
25/35/30/10; every puzzle `isUnique`; exactly one 25×25 capstone per region; total 500 /
200 free / 300 premium.

## Rollout

Generate + validate **one region at a time**; ship the generator + tool + region 1 first for
review, then the remaining four, then app wiring + monetization copy.
