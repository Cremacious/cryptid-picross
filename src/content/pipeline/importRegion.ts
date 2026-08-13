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
