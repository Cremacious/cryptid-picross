/**
 * What the drawing depicts, which decides its lore voice:
 *  - icon/item: portable evidence — gets recovered-object lore
 *  - landmark: buildings, structures, rooted flora, landscape — gets
 *    strange-place lore (you can't bag and tag a lighthouse)
 *  - creature: gets sighting lore
 */
export type ArtKind = 'icon' | 'item' | 'landmark' | 'creature';

export interface ArtEntry {
  key: string;
  kind: ArtKind;
  label: string;
  grid: string[];
  flippable?: boolean; // default true; horizontal mirror allowed as a variant
  poses?: string[][]; // optional extra authored poses (each a full grid)
  capstone?: boolean; // marks the 25x25 hero for a region
  /** For shared-pool entries: the only regions allowed to ship this art. Unset = all. */
  regions?: string[];
}

export interface RegionArt {
  regionId: string;
  entries: ArtEntry[];
}
