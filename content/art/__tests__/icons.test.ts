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
