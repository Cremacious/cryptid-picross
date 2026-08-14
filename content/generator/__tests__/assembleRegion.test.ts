import { assembleRegion, DEFAULT_COUNTS } from '../assembleRegion';
import type { RegionArt, ArtEntry } from '@/../content/art/types';
import { REGION_THEMES } from '../regions';
import { buildPuzzle } from '@/content/buildPuzzle';
import { asciiToGrid } from '../silhouette';
import type { Grid, Tier } from '@/engine';

const theme = REGION_THEMES[0];

// --- Fixtures --------------------------------------------------------------
// Real, engine-verified grids lifted verbatim from the already-generated
// procedural catalog (content/<region>/region.gen.json at this commit),
// grouped by each puzzle's own `.tier` field. The assembler (v2) does NOT
// trim or pad -- it validates and bins each grid at the artist's own canvas
// size, deliberate negative space included -- so a puzzle's stored `.tier`
// is exactly the tier `assembleRegion` will (re)compute for that same grid.
// These are embedded as literal values, not read from the JSON at runtime,
// since those generated files may be replaced by later tasks.
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

// HARD: pnw-062 (17x17, area 289 -- Hard under area-tiering), pnw-064, pnw-070,
// pnw-080. (pnw-061 was a 20x20/area-400 grid that landed in the old
// total-based Hard band but recomputes to Expert under area-tiering, so it's
// swapped here for pnw-062, a real Hard-sized 17x17 grid from the same
// catalog.)
const HARD_1: string[] = [".................",".................",".................","#.....#..........","##...............","###..............","##.##............","###..##..........","###...###........",".####.###........","#.#.##..#.#......","#.######..##.....","#.#..#.#..#.##...",".#...#.###..#..#.",".................",".................","................."];
const HARD_2: string[] = ["...............","...............",".##..###.####..",".###.###.#.....","..####.###.....",".##.#..###.....",".#..##..#......","..#..##........","..##.##...#....","...#.#.........","...##..........",".#.#...........",".#.............","...............","..............."];
const HARD_3: string[] = ["..................","..................","...............#..","...............#..","...#..........##..",".............#....","............###...","..........#####...","..........###.....","...#...####.###...",".....###.####.#...",".....########.#...","...##.##.##.#.##..",".##.##.#######....",".##..#..##...##...","..................","..................",".................."];
const HARD_4: string[] = ["..................","..................","..................","..................",".##..#.##.##.#....",".#.#####...##..#.#","####.#.##...####..","..###.#..###......","#.#.##.##.##......","##.#.#####........","#..####...........",".####.............","###..#............","..................","..................","..................","..................",".................."];

// EXPERT (non-capstone): pnw-091, pnw-095, appalachia-091 -- all real 25x25
// Expert-tagged puzzles, used verbatim (untrimmed).
const EXPERT_1: string[] = [".........................",".........................",".........................",".....#.........#.........",".....#...................",".........................",".........................",".........................","...............#.........","...............#.........",".....#.........#.........",".....#.........#......#..","...............#.##..#.##",".........##.###.#######.#","....##.##.#.######.#####.","##.##.##.#.#####...######","#.#.#.....####...###.#...","..#.#.#.#####.#.##..#.#..",".#...#.....#########.#...","#..#.#..##..#.#.##..#####","#.#.#.####.##..#.####..#.",".........................",".........................",".........................","........................."];
const EXPERT_2: string[] = ["....#....................","....##...................","....#....................","....###..................",".....#.#.................","....#..##................","......###................",".....#..##...............","....####.#...............","....#..#####.............","....##.#.#.#.............","....######.##............","....##.##.##.#...........",".....#.#.#####...........",".........#.####..........",".....##.#.##.............",".....###..###............",".....##########.#........","....#.#.##.#.##..........",".....#....####..##.......","....#.#.#.#..#.####......","....###.#..#.#.####......","....##.##.#..#..###......","......##.####.#######....","........................."];
const EXPERT_3: string[] = ["..#......................",".........................","...#.....................","..#......................","...#.....................","..####...................","..####...................","..#.###...#..........#...","..##.###.................","....##.#.................","..#.#.##.................","....#...#................","..#.#.####...............","..####..###..............","......##.#.#.............","..##..##.####............","..#.#...##..#............","..#..###.##.##...........","......##..#..............","...######..####..........","..#.#.####...#.#.........","..###..#.##.##.##........","...#..#####.#####........","..###..##.#####.##.......","........................."];

// CAPSTONE: pnw-100, the real 25x25 Expert capstone from the pnw catalog
// (isCapstone: true in the source JSON), used verbatim -- no hand-editing
// needed under the no-trim/no-pad v2 pipeline, since the assembler now
// validates grids at their own authored canvas size.
const CAPSTONE: string[] = ["........#####.##..#......","..........##.#.#.##......","........#...#.#.#........",".......########.###......","......#.######.#.........","......#.###.###.#........",".......##.#.###.#........","......####..#.###........","......#.#.#.##...........","......###..##.#..........","............#.#..........",".......#...###...........",".......#.##.#............",".......#..##.............","......###..#.............","......##.####............","......#.#.##.............","........##...............","........###..............","........##...............","......##.##..............","......#.##...............","......#.##...............","........#................","......###................"];

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
    // recompute -- never assert a fixture's tier a-priori.
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
