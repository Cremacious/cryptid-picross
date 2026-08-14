/**
 * Rebuild app Region JSON from edited source files. Run this after tweaking any grid in a
 * content/<id>/region.gen.json — it re-derives clues/tier and rewrites src/content/regions/
 * <id>.json without regenerating (fast, deterministic).
 *
 * Usage: npm run build-regions -- [regionId ...]   (no args = all regions with a source file)
 */
import * as fs from 'fs';
import * as path from 'path';
import type { Tier } from '@/engine';
import { REGION_THEMES } from '@/../content/generator/regions';
import { buildRegionJson } from '@/../content/generator/buildRegionJson';
import type { GenRegion } from '@/../content/generator/assembleRegion';

const ROOT = process.cwd();
const filter = process.argv.slice(2);
const themes = filter.length ? REGION_THEMES.filter((t) => filter.includes(t.id)) : REGION_THEMES;

let built = 0;
for (const theme of themes) {
  const srcPath = path.join(ROOT, 'content', theme.id, 'region.gen.json');
  if (!fs.existsSync(srcPath)) {
    console.error(`! ${theme.id}: no source at ${path.relative(ROOT, srcPath)} — run generate-puzzles first`);
    continue;
  }
  const gen = JSON.parse(fs.readFileSync(srcPath, 'utf8')) as GenRegion;
  const region = buildRegionJson(gen);
  const outDir = path.join(ROOT, 'src', 'content', 'regions');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${theme.id}.json`), `${JSON.stringify(region, null, 2)}\n`);

  const tiers: Record<Tier, number> = { Easy: 0, Medium: 0, Hard: 0, Expert: 0 };
  for (const p of region.puzzles) tiers[p.difficulty.tier] += 1;
  built += 1;
  console.log(`${theme.id.padEnd(11)} rebuilt ${region.puzzles.length} puzzles  E${tiers.Easy}/M${tiers.Medium}/H${tiers.Hard}/X${tiers.Expert}`);
}
console.log(`\nRebuilt ${built} region(s).`);
