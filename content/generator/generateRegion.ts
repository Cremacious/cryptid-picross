import { buildPuzzle } from '@/content/buildPuzzle';
import type { Tier, Grid as EngineGrid } from '@/engine';
import { generateSilhouette, gridToAscii, mulberry32, type Grid, type RNG, type SilhouetteParams } from './silhouette';
import { RegionTheme } from './regions';
import { makeEntry, makeName, type FieldEntry } from './lore';

export interface GenPuzzle {
  id: string;
  name: string;
  subtitle: string;
  grid: string[]; // ASCII rows ('#'/'.') — the editable source
  entry: FieldEntry;
  order: number;
  tier: Tier;
  isCapstone: boolean;
}

export interface GenRegion {
  id: string;
  name: string;
  tagline: string;
  tint: string;
  isFree: boolean;
  iapProductId?: string;
  puzzles: GenPuzzle[];
}

export const DEFAULT_COUNTS: Record<Tier, number> = { Easy: 25, Medium: 35, Hard: 30, Expert: 10 };

const pick = <T>(rng: RNG, arr: T[]): T => arr[Math.floor(rng() * arr.length)];

/** Per-tier generation params, sized for variety and calibrated to hit that tier. */
function presetFor(tier: Tier, rng: RNG, seed: number): SilhouetteParams {
  switch (tier) {
    case 'Easy':
      return { rows: pick(rng, [5, 6, 7]), cols: pick(rng, [5, 6, 7]), fill: 0.42 + rng() * 0.12, symmetric: true, drift: 0, roughen: 0, maxRuns: 4, seed };
    case 'Medium': {
      const s = pick(rng, [9, 10, 11, 12]);
      const sym = rng() < 0.5;
      return { rows: s, cols: s, fill: 0.36 + rng() * 0.1, symmetric: sym, drift: sym ? 0 : 2 + rng() * 2, roughen: rng() < 0.4 ? 0.2 : 0, maxRuns: 5, seed };
    }
    case 'Hard': {
      const s = pick(rng, [15, 16, 17, 18, 20]);
      return { rows: s, cols: s, fill: 0.3 + rng() * 0.06, symmetric: false, drift: 1.5 + rng() * 2, roughen: 0.3 + rng() * 0.15, seeds: 3, maxRuns: 8, seed };
    }
    case 'Expert':
    default:
      return { rows: 25, cols: 25, fill: 0.32 + rng() * 0.04, symmetric: false, drift: 1.5 + rng() * 2, roughen: 0.3 + rng() * 0.12, seeds: 5, maxRuns: 8, seed };
  }
}

const ORDER: Tier[] = ['Easy', 'Medium', 'Hard', 'Expert'];
const CAP_PER_TIER = 6000; // generous attempt ceiling per tier

/** Generate one region's puzzles, binned strictly by the engine's computed tier. */
export function generateRegion(theme: RegionTheme, counts: Record<Tier, number> = DEFAULT_COUNTS): GenRegion {
  const buckets: Record<Tier, Grid[]> = { Easy: [], Medium: [], Hard: [], Expert: [] };

  for (const tier of ORDER) {
    let attempt = 0;
    while (buckets[tier].length < counts[tier] && attempt < CAP_PER_TIER) {
      const seed = (theme.seed * 1_000_003 + ORDER.indexOf(tier) * 97_003 + attempt * 2_654_435_761) >>> 0;
      const rng = mulberry32(seed ^ 0x9e3779b9);
      const grid = generateSilhouette(presetFor(tier, rng, seed));
      attempt += 1;
      if (!grid) continue;
      const p = buildPuzzle({ id: 't', name: 't', subtitle: 't', grid: grid as unknown as EngineGrid, entry: { title: 't', body: 't', voiceStyle: 'notebook' }, metadata: { regionId: theme.id, order: 1, isCapstone: false } });
      if (!p.isUnique) continue;
      if (p.difficulty.tier === tier && buckets[tier].length < counts[tier]) buckets[tier].push(grid);
    }
    if (buckets[tier].length < counts[tier]) {
      throw new Error(`region ${theme.id}: only filled ${buckets[tier].length}/${counts[tier]} ${tier} in ${attempt} attempts`);
    }
  }

  // Flatten in ascending difficulty, assign order + names + lore.
  const ordered: Array<{ grid: Grid; tier: Tier }> = ORDER.flatMap((t) => buckets[t].map((grid) => ({ grid, tier: t })));
  const used = new Set<string>();
  const puzzles: GenPuzzle[] = ordered.map(({ grid, tier }, i) => {
    const order = i + 1;
    const nameSeed = (theme.seed * 31 + order * 7919) >>> 0;
    const { name, subtitle } = makeName(theme, nameSeed, used);
    const isCapstone = grid.length === 25 && order === ordered.length; // the last (hardest) puzzle
    return {
      id: `${theme.id}-${String(order).padStart(3, '0')}`,
      name: isCapstone ? `${name} — Capstone` : name,
      subtitle,
      grid: gridToAscii(grid),
      entry: makeEntry(theme, name, order, (nameSeed * 13 + 1) >>> 0),
      order,
      tier,
      isCapstone,
    };
  });

  return {
    id: theme.id,
    name: theme.name,
    tagline: theme.tagline,
    tint: theme.tint,
    isFree: theme.isFree,
    iapProductId: theme.iapProductId,
    puzzles,
  };
}
