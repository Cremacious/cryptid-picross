import { assembleRegion, DEFAULT_COUNTS } from '../assembleRegion';
import type { RegionArt, ArtEntry } from '@/../content/art/types';
import { REGION_THEMES } from '../regions';
import { buildPuzzle } from '@/content/buildPuzzle';
import { asciiToGrid } from '../silhouette';
import type { Grid, Tier } from '@/engine';

const theme = REGION_THEMES[0];

// --- Fixtures --------------------------------------------------------------
// Real, engine-verified grids lifted from the already-generated procedural
// catalog (content/<region>/region.gen.json at this commit), NOT synthetic
// solid blocks. A solid NxN block is mathematically incapable of reaching
// Hard/Expert under the real difficulty scorer (segmentLength/asymmetry/
// solveDepth are always 0 for a filled rectangle, capping total at 10 --
// see task-3-report.md for the proof), so the brief's original block()
// fixture could never pass. These shapes have genuine holes/asymmetry and
// were themselves produced (and tier-tagged) by the real engine, so they
// span all four tiers for real.
//
// EASY: content/pnw/region.gen.json puzzles pnw-001, pnw-004, pnw-010, pnw-015.
const EASY_1: string[] = ["..#..",".###.",".###.","..#..","....."];
const EASY_2: string[] = [".....","#####","#####",".###.",".###.",".....","....."];
const EASY_3: string[] = ["..###..","..###..","..###..","..###..","...#...","..###..","..###.."];
const EASY_4: string[] = [".....",".###.",".###.",".###.",".###.",".###.","....."];

// MEDIUM: pnw-026, pnw-030, pnw-040, pnw-050.
const MEDIUM_1: string[] = ["............","............","##.#########","##.######.#.","#####.#.##..","######.#....","#.###.#.....","####.#......","..#...#.....","#...........","............","............"];
const MEDIUM_2: string[] = ["...........","##..###.##.",".#####.#.#.","..###.##...","...###.#.#.","....####.#.","....##.##..",".......###.",".......##..",".........#.","..........."];
const MEDIUM_3: string[] = [".........",".........",".#####.#.",".#######.","..#.#.##.","..#####..","...#.##..",".........","........."];
const MEDIUM_4: string[] = ["............","............","............",".....##...##",".....###.###","..#..#..#.##","######..####","############","##.###.###..","............","............","............"];

// HARD: pnw-061, pnw-064, pnw-070, pnw-080.
const HARD_1: string[] = ["....................","....................","....................","....................","....................","....#...............",".#..................","##.##...............","#.#.#........#......","##..#..###..........","###.##..##...###....","##.#...##.#######..#","##.#..##..#.##.#....",".#.##....##....#.##.","#.#.##..#.##.##.##..","....................","....................","....................","....................","...................."];
const HARD_2: string[] = ["...............","...............",".##..###.####..",".###.###.#.....","..####.###.....",".##.#..###.....",".#..##..#......","..#..##........","..##.##...#....","...#.#.........","...##..........",".#.#...........",".#.............","...............","..............."];
const HARD_3: string[] = ["..................","..................","...............#..","...............#..","...#..........##..",".............#....","............###...","..........#####...","..........###.....","...#...####.###...",".....###.####.#...",".....########.#...","...##.##.##.#.##..",".##.##.#######....",".##..#..##...##...","..................","..................",".................."];
const HARD_4: string[] = ["..................","..................","..................","..................",".##..#.##.##.#....",".#.#####...##..#.#","####.#.##...####..","..###.#..###......","#.#.##.##.##......","##.#.#####........","#..####...........",".####.............","###..#............","..................","..................","..................","..................",".................."];

// EXPERT (non-capstone): pnw-098, appalachia-091, atlantic-097 -- each
// already unique/Expert-tier straight off buildPuzzle after this file's own
// trim/pad pipeline (verified against the real engine while building this
// fixture), so they hold up as genuine Expert candidates through the
// assembler, unlike most 25x25-canvas catalog entries, which lose enough
// bounding-box area on trim to fall to Hard.
const EXPERT_1: string[] = [".........................",".........................",".........................",".###.##.##.....#######.#.","#...#..##..##.######.##..","###.#####.##.#####.......",".####.#..##.##.####......",".#.#####.####.##.........","######...#.#...##........",".#.########..#.#.........","#.##.##.#.####...........",".#.##.#####..............",".#..##.###...............","#.##..#........#.........",".#.#.....................","####.#...................",".###.....................","#.#...#..................","......#..................",".........................",".........................","........##...............",".........................",".........................","........................."];
const EXPERT_2: string[] = ["..#......................",".........................","...#.....................","..#......................","...#.....................","..####...................","..####...................","..#.###...#..........#...","..##.###.................","....##.#.................","..#.#.##.................","....#...#................","..#.#.####...............","..####..###..............","......##.#.#.............","..##..##.####............","..#.#...##..#............","..#..###.##.##...........","......##..#..............","...######..####..........","..#.#.####...#.#.........","..###..#.##.##.##........","...#..#####.#####........","..###..##.#####.##.......","........................."];
const EXPERT_3: string[] = [".....................#...","....................##...","...................###...","..................###....","..................#......","..................#.#....",".................#####...",".................#####...","..................##.....",".......#..........#.##...","................#..#.#...","..............######.....","........#...#..####.#....","........#....#.###.##....",".............#.#.##......","............##..#...#....",".............#..#..###...","...........#.##...##.#...","..#....#...###.##.#.##...","...........#...##..#.#...","..........#.##.###.###...","..........######..#......","..........#.##.##..##....","........##..########.....",".......##.#..#######....."];

// CAPSTONE: appalachia-094's real, unmodified interior pattern, widened from
// its trimmed 25x20 bounding box to a full 25x25 by extending (not
// inventing) the rows that already touched the trim boundary contiguously
// out to both new edges. This is necessary because trim always runs first in
// the assembler's pipeline (per the Behavior spec): the original 25x25-canvas
// asset has blank margin on one side, so trimming it alone leaves a 25x20
// shape (Hard, not Expert) that can never re-grow to a true 25x25 square via
// the pipeline's fixed 1-cell pad. No catalog puzzle across all 5 regions'
// 500 puzzles has a trim-invariant 25x25 (or 23x23, pad-to-25) bounding box
// (verified by exhaustive scan) -- organically-grown blobs essentially never
// touch all four canvas edges at once -- so a literal, unmodified catalog
// puzzle cannot satisfy the assembler's capstone contract. This is the
// smallest real-data-derived fix: same silhouette, same complexity, extended
// (not redrawn) out to the frame. Verified: unique=true, tier=Expert, dims
// stay 25x25 after re-trimming (i.e. it is genuinely trim-invariant).
const CAPSTONE: string[] = [".................#.######","..................#.#####","...................##....",".................##......","..................##.....",".................#.######","..................#######","...............#..##.....","..............#.###..####","###............###.######","...............#.##.#####","..............##.#...####",".............#..####.....",".............#.#.###.....","...............###.#.....",".............######.#....","............####...#.....","............#####.#######","..............###.##.####","###........####.#####....","............#.##.#.######","..........##.##.#...#....","..........##.#..#.##.....",".............###..#######","..........#.#..###.##...."];

const entry = (key: string, grid: string[], kind: ArtEntry['kind'], extra: Partial<ArtEntry> = {}): ArtEntry =>
  ({ key, kind, label: key, grid, ...extra });

const icons: ArtEntry[] = [
  entry('easy-1', EASY_1, 'icon'),
  entry('easy-2', EASY_2, 'icon'),
  entry('easy-3', EASY_3, 'icon'),
  entry('easy-4', EASY_4, 'icon'),
];
const art: RegionArt = {
  regionId: theme.id,
  entries: [
    entry('medium-1', MEDIUM_1, 'creature'),
    entry('medium-2', MEDIUM_2, 'creature'),
    entry('medium-3', MEDIUM_3, 'creature'),
    entry('medium-4', MEDIUM_4, 'creature'),
    entry('hard-1', HARD_1, 'creature'),
    entry('hard-2', HARD_2, 'creature'),
    entry('hard-3', HARD_3, 'creature'),
    entry('hard-4', HARD_4, 'creature'),
    entry('expert-1', EXPERT_1, 'creature'),
    entry('expert-2', EXPERT_2, 'creature'),
    entry('expert-3', EXPERT_3, 'creature'),
    entry('capstone', CAPSTONE, 'creature', { capstone: true }),
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
    // Assert only that the assembler's emitted tier matches a fresh engine
    // recompute -- never assert a fixture's tier a-priori, since the +1-cell
    // pad framing can shift a borderline grid up or down a tier.
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
    // Library holds only the capstone, so capstone reservation itself still
    // succeeds (it needs exactly one valid 25x25 Expert candidate, which this
    // provides) -- the *first* real shortfall is Easy, whose pool is empty
    // with no icons and no other entries. That's what makes /short by/ the
    // correct expected message here; a library missing the capstone entirely
    // would instead throw the capstone-reservation error first.
    expect(() => assembleRegion(theme, { regionId: theme.id, entries: [entry('capstone', CAPSTONE, 'creature', { capstone: true })] }, [], counts))
      .toThrow(/short by/);
  });

  it('DEFAULT_COUNTS sum to 80', () => {
    expect(Object.values(DEFAULT_COUNTS).reduce((a, b) => a + b, 0)).toBe(80);
  });
});
