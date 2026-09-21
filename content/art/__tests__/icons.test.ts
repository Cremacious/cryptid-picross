import { ICONS } from '../icons';
import { REGION_THEMES } from '../../generator/regions';
import { buildPuzzle } from '@/content/buildPuzzle';
import { asciiToGrid } from '@/../content/generator/silhouette';
import { normalizeGrid, trimGrid, flipH } from '@/../content/generator/variation';
import type { Grid } from '@/engine';

/** Cells differing between two same-size ASCII grids. */
const cellDiff = (a: string[], b: string[]): number => {
  let d = 0;
  for (let r = 0; r < a.length; r += 1) {
    for (let c = 0; c < a[r].length; c += 1) if (a[r][c] !== b[r][c]) d += 1;
  }
  return d;
};

// Two same-size icons must differ by more cells than this, in both direct and
// mirrored orientation. The old pool shipped pairs at distance 2 (fang vs
// horn, tent vs saucer) that solved near-identically.
const MIN_PAIR_DISTANCE = 5;

describe('shared icon pool', () => {
  it('has unique keys', () => {
    expect(new Set(ICONS.map((i) => i.key)).size).toBe(ICONS.length);
  });

  it('pins every icon to exactly one known region, spread evenly', () => {
    const regionIds = REGION_THEMES.map((t) => t.id);
    const perRegion: Record<string, number> = Object.fromEntries(regionIds.map((id) => [id, 0]));
    for (const icon of ICONS) {
      expect(icon.regions).toBeDefined();
      expect(icon.regions).toHaveLength(1);
      const region = icon.regions![0];
      expect(regionIds).toContain(region);
      perRegion[region] += 1;
    }
    // Even spread keeps every region's Easy tier equally icon-light.
    for (const id of regionIds) expect(perRegion[id]).toBe(ICONS.length / regionIds.length);
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

  it(`no two same-size icons are within ${MIN_PAIR_DISTANCE} cells of each other (incl. mirrored)`, () => {
    const tooClose: string[] = [];
    for (let i = 0; i < ICONS.length; i += 1) {
      for (let j = i + 1; j < ICONS.length; j += 1) {
        const a = ICONS[i].grid;
        const b = ICONS[j].grid;
        if (a.length !== b.length || a[0].length !== b[0].length) continue;
        const d = Math.min(cellDiff(a, b), cellDiff(a, flipH(b)));
        if (d < MIN_PAIR_DISTANCE) tooClose.push(`${ICONS[i].key} ~ ${ICONS[j].key} (d=${d})`);
      }
    }
    expect(tooClose).toEqual([]);
  });
});
