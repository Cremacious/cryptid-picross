import { buildPuzzle } from '@/content/buildPuzzle';
import type { Tier, Grid as EngineGrid } from '@/engine';
import { asciiToGrid, maxRunsPerLine, mulberry32, type RNG } from './silhouette';
import { dims, flipH, padTo, trimGrid, normalizeGrid } from './variation';
import { RegionTheme } from './regions';
import { makeEntry, nameForEntry, type FieldEntry } from './lore';
import type { ArtEntry, ArtKind, RegionArt } from '../art/types';

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

export const DEFAULT_COUNTS: Record<Tier, number> = { Easy: 20, Medium: 28, Hard: 22, Expert: 10 };

const TIER_ORDER: Tier[] = ['Easy', 'Medium', 'Hard', 'Expert'];
const MAX_RUNS = 8;

/** A validated, unique candidate puzzle harvested from one art-library pose/form/framing. */
interface Candidate {
  entryKey: string;
  label: string;
  kind: ArtKind;
  grid: string[];
  tier: Tier;
  area: number;
}

const DUMMY_ENTRY: FieldEntry = { title: 'candidate', body: 'candidate', voiceStyle: 'notebook' };

/** Validate one ASCII framing through the engine; return its computed tier iff line-solvable. */
function tierOf(regionId: string, framing: string[]): Tier | null {
  const grid = asciiToGrid(framing) as unknown as EngineGrid;
  const built = buildPuzzle({
    id: 'candidate',
    name: 'candidate',
    subtitle: 'candidate',
    grid,
    entry: DUMMY_ENTRY,
    metadata: { regionId, order: 0, isCapstone: false },
  });
  return built.isUnique ? built.difficulty.tier : null;
}

/** Deterministic in-place Fisher-Yates shuffle driven by a seeded RNG. */
function shuffle<T>(arr: T[], rng: RNG): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Expand a hand-drawn art library (icons + region entries) into the full pool of
 * unique candidate puzzles: every pose x mirrored form x (trimmed / 1-cell-padded)
 * framing that passes the 8-run guard and is line-solvable.
 */
function collectCandidates(regionId: string, sources: ArtEntry[]): Candidate[] {
  const candidates: Candidate[] = [];
  const seenGrids = new Set<string>();

  for (const source of sources) {
    const poseGrids: string[][] = [source.grid, ...(source.poses ?? [])];
    for (const poseGrid of poseGrids) {
      const trimmedBase = trimGrid(normalizeGrid(poseGrid));
      const forms: string[][] = [trimmedBase];
      if (source.flippable !== false) forms.push(flipH(trimmedBase));

      for (const form of forms) {
        const { rows, cols } = dims(form);
        const framings: string[][] = [form, padTo(form, rows + 2, cols + 2, 1, 1)];

        for (const framing of framings) {
          if (maxRunsPerLine(asciiToGrid(framing)) > MAX_RUNS) continue;
          const key = framing.join('\n');
          if (seenGrids.has(key)) continue;

          const tier = tierOf(regionId, framing);
          if (!tier) continue;

          seenGrids.add(key);
          const fd = dims(framing);
          candidates.push({
            entryKey: source.key,
            label: source.label,
            kind: source.kind,
            grid: framing,
            tier,
            area: fd.rows * fd.cols,
          });
        }
      }
    }
  }
  return candidates;
}

/**
 * Assemble a full region's puzzles from a hand-drawn art library: harvest every safe
 * variation (pose x mirror x framing), validate each through the engine, reserve the
 * capstone, then fill each tier's quota deterministically from `theme.seed`.
 */
export function assembleRegion(
  theme: RegionTheme,
  art: RegionArt,
  icons: ArtEntry[],
  counts: Record<Tier, number> = DEFAULT_COUNTS
): GenRegion {
  const candidates = collectCandidates(theme.id, [...icons, ...art.entries]);

  // --- Reserve the capstone: the region's one 25x25 Expert hero, placed last. ---
  const capstoneEntry = art.entries.find((e) => e.capstone === true);
  if (!capstoneEntry) {
    throw new Error(`region ${theme.id}: no capstone entry marked in art library`);
  }
  const capIdx = candidates.findIndex(
    (c) => c.entryKey === capstoneEntry.key && c.tier === 'Expert' && c.grid.length === 25 && (c.grid[0]?.length ?? 0) === 25
  );
  if (capIdx === -1) {
    throw new Error(`region ${theme.id}: capstone entry '${capstoneEntry.key}' did not yield a unique 25x25 Expert puzzle`);
  }
  const capstoneCandidate = candidates[capIdx];
  candidates.splice(capIdx, 1);

  // --- Fill quotas per tier, preferring entryKey diversity, then seeded order. ---
  const rng = mulberry32(theme.seed ^ 0x5f3759df);
  const usedEntryKeys = new Set<string>();
  const selected: Record<Tier, Candidate[]> = { Easy: [], Medium: [], Hard: [], Expert: [] };

  for (const tier of TIER_ORDER) {
    const need = tier === 'Expert' ? counts.Expert - 1 : counts[tier];
    const pool = candidates.filter((c) => c.tier === tier);
    const shuffled = shuffle(pool, rng);
    const unused = shuffled.filter((c) => !usedEntryKeys.has(c.entryKey));
    const rest = shuffled.filter((c) => usedEntryKeys.has(c.entryKey));
    const picked = [...unused, ...rest].slice(0, need);

    if (picked.length < need) {
      throw new Error(`region ${theme.id}: ${tier} short by ${need - picked.length} (unique candidates: ${pool.length})`);
    }
    picked.forEach((c) => usedEntryKeys.add(c.entryKey));
    selected[tier] = picked;
  }

  // --- Assemble: Easy -> Expert, capstone last. Assign order/name/entry. ---
  const ordered: Candidate[] = [
    ...selected.Easy,
    ...selected.Medium,
    ...selected.Hard,
    ...selected.Expert,
    capstoneCandidate,
  ];
  const usedNames = new Set<string>();
  const puzzles: GenPuzzle[] = ordered.map((c, i) => {
    const order = i + 1;
    const isCapstone = c === capstoneCandidate;
    const nameSeed = (theme.seed * 31 + order * 7919) >>> 0;
    const { name, subtitle } = nameForEntry(theme, c.label, nameSeed, usedNames);
    const entrySeed = (nameSeed * 13 + 1) >>> 0;
    return {
      id: `${theme.id}-${String(order).padStart(3, '0')}`,
      name,
      subtitle,
      grid: c.grid,
      entry: makeEntry(theme, name, order, entrySeed),
      order,
      tier: c.tier,
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
