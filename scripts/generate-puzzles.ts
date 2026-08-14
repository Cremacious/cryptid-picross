/**
 * Procedurally generate the full puzzle catalog. For each region it writes:
 *   - content/<id>/region.gen.json  — the editable source (ASCII grids + names + lore)
 *   - src/content/regions/<id>.json — the built app Region (clues/tier derived by the engine)
 *
 * Reproducible: each region is seeded, so re-running produces the same catalog. Tweak a
 * grid in region.gen.json and run `npm run build-regions` to rebuild without regenerating.
 *
 * Usage: npm run generate-puzzles -- [regionId ...]   (no args = all regions)
 */
import * as fs from 'fs';
import * as path from 'path';
import type { Tier } from '@/engine';
import { REGION_THEMES } from '@/../content/generator/regions';
import { assembleRegion } from '@/../content/generator/assembleRegion';
import { buildRegionJson } from '@/../content/generator/buildRegionJson';
import { ICONS, REGION_ART } from '@/../content/art';

const ROOT = process.cwd();
const filter = process.argv.slice(2);
const themes = filter.length ? REGION_THEMES.filter((t) => filter.includes(t.id)) : REGION_THEMES;

if (themes.length === 0) {
  console.error(`No matching regions. Known: ${REGION_THEMES.map((t) => t.id).join(', ')}`);
  process.exit(2);
}

let grand = 0;
for (const theme of themes) {
  const t0 = Date.now();
  const gen = assembleRegion(theme, REGION_ART[theme.id], ICONS);
  const region = buildRegionJson(gen);

  const srcDir = path.join(ROOT, 'content', theme.id);
  fs.mkdirSync(srcDir, { recursive: true });
  fs.writeFileSync(path.join(srcDir, 'region.gen.json'), `${JSON.stringify(gen, null, 2)}\n`);

  const outDir = path.join(ROOT, 'src', 'content', 'regions');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${theme.id}.json`), `${JSON.stringify(region, null, 2)}\n`);

  const tiers: Record<Tier, number> = { Easy: 0, Medium: 0, Hard: 0, Expert: 0 };
  for (const p of gen.puzzles) tiers[p.tier] += 1;
  grand += gen.puzzles.length;
  console.log(
    `${theme.id.padEnd(11)} ${gen.puzzles.length} puzzles  ${theme.isFree ? 'FREE ' : 'PAID '}  ` +
      `E${tiers.Easy}/M${tiers.Medium}/H${tiers.Hard}/X${tiers.Expert}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`,
  );
}
console.log(`\nTotal: ${grand} puzzles across ${themes.length} region(s).`);
