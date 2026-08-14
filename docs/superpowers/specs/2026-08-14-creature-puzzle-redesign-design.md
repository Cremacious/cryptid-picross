# Creature Puzzle Redesign — Design

**Goal:** Replace the 500 procedurally-generated blob puzzles with **400 hand-drawn puzzles
that read as actual creatures, evidence, and creature-related items** — while keeping every
puzzle uniquely line-solvable and correctly tiered by the existing engine.

## Why the current puzzles look bad

The procedural generator (`content/generator/silhouette.ts` + `generateRegion.ts`) manufactures
difficulty by growing a connected blob and then **punching random interior holes** (`roughen`) to
shorten runs and add asymmetry — the axes the difficulty scorer rewards. At Easy sizes (5–7px) a
compact symmetric blob reads acceptably, but at Hard/Expert sizes (15–25px) the hole-punching
produces salt-and-pepper noise that reads as TV static, not a creature.

**Key insight:** the difficulty scorer (`src/engine/difficulty.ts`) rewards size, asymmetry, short
segments, and solve depth — and a **real creature drawn in profile is naturally asymmetric with
varied detail**. Good creature art hits Hard/Expert *on its own*, without noise. Good art and the
difficulty tiers are aligned, not in conflict. So this is an **art-production** change, not an
engine change.

## Subject model (what each puzzle depicts)

Subjects are chosen so their natural size/detail land them in the intended tier:

| Tier | Size (px) | Subject |
|------|-----------|---------|
| Easy | 5–8 | **Cryptid evidence icons + small related items** — footprint, eye-in-the-dark, UFO/saucer, feather, claw marks, tooth, track, handprint, egg, jar, lantern. Instantly readable; naturally Easy. |
| Medium | 9–12 | **Simple whole creatures + medium items** — bat, owl, serpent coil, small biped; nest, tent, trail-cam, crop-circle. |
| Hard | 14–18 | **Detailed creatures** — the region's signature cryptids in profile/pose; scene items (UFO over trees, cabin). |
| Expert | 20–25 | **Showpiece creatures** — full-detail heroes; exactly one 25×25 capstone per region. |

- **Per-region bestiary** (~15–22 distinct creatures each), region-flavored: Sasquatch/PNW,
  Mothman & Flatwoods Monster/Appalachia, Thunderbird & Dogman/Great Lakes, Chupacabra &
  Skinwalker/Southwest, Jersey Devil & sea serpents/Atlantic.
- **Cross-region "Visitors" thread** — UFOs, greys, little green men, abduction scenes — seeds a
  few puzzles in every region and may invent freely (not tied to real cryptid lore).
- **Creature-related items** are a first-class subject type across Easy/Medium (and a few Hard
  scenes), giving the case-file theme texture and adding variety toward 400 without more creatures.
- **Variation is safe-only:** horizontal flip (facing direction), canvas framing/placement, and a
  second *authored* pose for hero creatures. **No random hole-punching.** "Same creature, different
  angle/pose" fills multiple slots for hero creatures without looking repetitive.

## Hard constraints (unchanged engine rules)

1. **Uniqueness = line-solvable.** `analyzePuzzle` (`src/engine/analyze.ts`) accepts a puzzle only
   if iterated row/column intersection fully determines it. Hand-drawn art is **not** automatically
   line-solvable, so a meaningful fraction of pieces will need small cell nudges to become solvable.
   This is absorbed into the authoring loop (draw → validate → nudge). The engine is **not** changed.
2. **Computed tier binning.** Every grid is scored by `scoreDifficulty`; puzzles are binned by the
   *computed* tier, never an assumed one. Art that lands off its intended tier is resized/reframed.
3. **Few runs per line** so `analyzePuzzle` stays fast at 25×25 (existing `maxRunsPerLine` guard).

## Counts

- **400 total = 5 regions × 80.**
- **Per-region tiers: 20 Easy / 28 Medium / 22 Hard / 10 Expert** (binned by computed tier, within
  the same tolerance the catalog test already uses), **exactly one 25×25 capstone** each.
- **Free/paid unchanged:** `pnw` + `appalachia` free (160); `greatlakes`, `southwest`, `atlantic`
  paid (240). IAP copy already reads "All 5 Regions"; product ids unchanged.

## Architecture

The app side is untouched — `region.gen.json` (ASCII grids + lore) remains the editable source,
and `buildRegionJson.ts` / `build-regions.ts` still derive clues/tier/uniqueness into
`src/content/regions/<id>.json`. Only the **authoring layer** changes.

- **`content/art/`** — hand-drawn ASCII art library, authored once:
  - `icons` pool (evidence + small items), shared across regions.
  - per-region `bestiary` (creatures + larger items).
  - Each entry: `{ key, kind: 'icon' | 'item' | 'creature', grid: string[], flippable: boolean,
    poses?: string[][] }`. `grid` uses `#`/`.` rows, same format as `region.gen.json`.
- **`content/generator/assembleRegion.ts`** (replaces the blob path in `generateRegion.ts`):
  selects library entries for a region, applies safe variation (flip / frame / placement / authored
  pose), runs each candidate through `buildPuzzle` to require `isUnique` and bin by computed tier
  until the 20/28/22/10 quota is met, guarantees one 25×25 capstone, attaches names + lore
  (`makeName` / `makeEntry`), and writes `region.gen.json`.
- **Retire:** `silhouette.ts` blob generation (`growBlob` / `roughen` / `mirror`) and
  `presetFor`. Keep helpers `asciiToGrid`, `mulberry32`, `maxRunsPerLine`, `filledCount`.
- **Puzzle Lab** (`content/puzzle-lab.html`) — add grouped-by-creature/kind review so a whole
  region can be eyeballed quickly; keep the live uniqueness/tier readout and export.
- **`scripts/generate-puzzles.ts`** — re-point to the assembler.

## Validation

`src/content/__tests__/catalog.test.tsx` updated to assert: 400 total; each region exactly 80;
per-region tier counts within tolerance of 20/28/22/10; every puzzle `isUnique`; exactly one 25×25
capstone per region; 160 free / 240 paid. `RegionsScreen` / IAP tests updated for 80-per-region.

## Units & boundaries

- **Art library** (`content/art/`) — pure data (ASCII grids); no logic. Understandable in
  isolation; a bad-looking creature is fixed here.
- **Assembler** (`assembleRegion.ts`) — pure function: `(theme, library, counts) → GenRegion`.
  Depends on `buildPuzzle` (validation) + lore. Testable without the app.
- **Build** (`build-regions.ts`, unchanged) — `region.gen.json → app JSON`.
- **Review** (Puzzle Lab) — read-only-ish view over built grids with in-page re-derivation.

## Production plan (rollout de-risks quality)

1. **Pipeline first** — art-library format + assembler + Puzzle Lab grouped review + updated tests
   (tests may temporarily allow < 5 built regions during rollout).
2. **One region end-to-end** (recommend `pnw`) as the quality bar — author icons + bestiary,
   assemble 80, review in Puzzle Lab, iterate on the art until it reads well and every puzzle is
   unique + correctly tiered.
3. **Roll out the remaining four** on the proven pipeline, region by region, reusing the shared
   icon pool and the Visitors thread.

## Rejected alternatives

- **Smarter procedural part-assembly generator** (assemble creatures from body/head/limb parts):
  classic "uncanny" trap — at 400 scale it still produces off-looking creatures. Hand-drawn is the
  only reliable path to recognizability.
- **Relax uniqueness to allow deeper-than-line logic:** would cut authoring cost but changes the
  play guarantee (players relying on line-logic get stuck) and the engine/tests. Rejected — keep
  line-solvable.
- **Keep 500 / cut to ~50:** user chose 400 via more creature *and item* variation.
