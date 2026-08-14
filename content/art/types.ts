export type ArtKind = 'icon' | 'item' | 'creature';

export interface ArtEntry {
  key: string;
  kind: ArtKind;
  label: string;
  grid: string[];
  flippable?: boolean; // default true; horizontal mirror allowed as a variant
  poses?: string[][]; // optional extra authored poses (each a full grid)
  capstone?: boolean; // marks the 25x25 hero for a region
}

export interface RegionArt {
  regionId: string;
  entries: ArtEntry[];
}
