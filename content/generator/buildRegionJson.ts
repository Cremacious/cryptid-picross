import { buildPuzzle } from '@/content/buildPuzzle';
import type { Region, Grid } from '@/engine';
import { asciiToGrid } from './silhouette';
import { GenRegion } from './assembleRegion';

/** Turn an editable generated region (ASCII grids + lore) into the app's Region JSON. */
export function buildRegionJson(gen: GenRegion): Region {
  const puzzles = gen.puzzles.map((p) =>
    buildPuzzle({
      id: p.id,
      name: p.name,
      subtitle: p.subtitle,
      grid: asciiToGrid(p.grid) as unknown as Grid,
      entry: p.entry,
      metadata: { regionId: gen.id, order: p.order, isCapstone: p.isCapstone },
    }),
  );
  return {
    id: gen.id,
    name: gen.name,
    tagline: gen.tagline,
    tint: gen.tint,
    isFree: gen.isFree,
    iapProductId: gen.iapProductId,
    puzzles,
    totalPuzzles: puzzles.length,
  };
}
