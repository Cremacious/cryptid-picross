/**
 * Bulk-validate candidate ASCII grids through the real engine. Reads a JSON
 * file of { name: string[] } grids (or validates the checked-in art libraries
 * when no file is given) and reports, per grid: dims, area, fill %, max runs,
 * line-solvable (unique), and difficulty tier.
 *
 * Usage: npx tsx scripts/validate-art.ts [candidates.json]
 */
import * as fs from 'fs';
import { buildPuzzle } from '@/content/buildPuzzle';
import type { Grid } from '@/engine';
import { asciiToGrid, maxRunsPerLine } from '@/../content/generator/silhouette';
import { normalizeGrid, trimGrid } from '@/../content/generator/variation';

const file = process.argv[2];
let grids: Record<string, string[]> = {};
if (file) {
  grids = JSON.parse(fs.readFileSync(file, 'utf8'));
} else {
  console.error('usage: npx tsx scripts/validate-art.ts candidates.json');
  process.exit(2);
}

let pass = 0;
let fail = 0;
for (const [name, grid] of Object.entries(grids)) {
  try {
    normalizeGrid(grid);
    const rows = grid.length;
    const cols = grid[0].length;
    const trimmed = trimGrid(grid);
    const isTrimmed = trimmed.length === rows && trimmed[0].length === cols;
    const cells = asciiToGrid(grid);
    const filled = cells.flat().reduce((a, b) => a + b, 0);
    const runs = maxRunsPerLine(cells);
    const p = buildPuzzle({
      id: name, name, subtitle: '', grid: cells as unknown as Grid,
      entry: { title: '', body: '', voiceStyle: 'notebook' },
      metadata: { regionId: 'x', order: 1, isCapstone: false },
    });
    const ok = p.isUnique && runs <= 8;
    if (ok) pass += 1; else fail += 1;
    console.log(
      `${ok ? 'PASS' : 'FAIL'} ${name.padEnd(24)} ${rows}x${cols} area=${String(rows * cols).padStart(3)} ` +
      `fill=${Math.round((100 * filled) / (rows * cols))}% runs=${runs} unique=${p.isUnique} ` +
      `tier=${p.difficulty.tier}${isTrimmed ? '' : ' UNTRIMMED'}`,
    );
  } catch (e) {
    fail += 1;
    console.log(`FAIL ${name.padEnd(24)} error: ${(e as Error).message}`);
  }
}
console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
