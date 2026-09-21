import type { ArtEntry } from './types';

/**
 * Shared evidence/item icon pool. Each icon is pinned to exactly ONE region
 * via `regions`, so no icon grid ever ships twice in the catalog — the rest
 * of a region's Easy tier comes from its own art library's easy section.
 * Each grid is hand-authored to: be already trimmed (no blank border), have
 * max dimension <= 8, be line-solvable ("unique"), score the Easy difficulty
 * tier, and differ from every other icon by a clear margin of cells.
 * See content/art/__tests__/icons.test.ts for the gate.
 */
export const ICONS: ArtEntry[] = [
  // --- evidence icons ---------------------------------------------------
  {
    key: 'footprint',
    kind: 'icon',
    label: 'Cast Footprint',
    regions: ['pnw'],
    grid: [
      '.#.#.',
      '.###.',
      '#####',
      '.###.',
      '..#..',
    ],
  },
  {
    key: 'eye',
    kind: 'icon',
    label: 'Eyeshine',
    regions: ['atlantic'],
    grid: [
      '..###..',
      '.#####.',
      '##.#.##',
      '.#####.',
      '..###..',
    ],
  },
  {
    key: 'feather',
    kind: 'icon',
    label: 'Molted Feather',
    regions: ['appalachia'],
    grid: [
      '..#..',
      '#####',
      '.###.',
      '.###.',
      '..#..',
      '..#..',
      '..#..',
      '..#..',
    ],
  },
  {
    key: 'claw-rake',
    kind: 'icon',
    label: 'Claw Rake',
    regions: ['southwest'],
    // three near-parallel gashes of similar length (4/5/4), independent from
    // row 0 (no shared "handle" row) so they read as scratches, not a trident.
    grid: [
      '#.#.#',
      '#.#.#',
      '#.#.#',
      '#.#.#',
      '..#..',
    ],
  },
  {
    key: 'fang',
    kind: 'icon',
    label: 'Fang Mark',
    regions: ['greatlakes'],
    grid: [
      '#####',
      '.###.',
      '.###.',
      '..#..',
      '..#..',
    ],
  },
  {
    key: 'track-pair',
    kind: 'icon',
    label: 'Track Pair',
    regions: ['atlantic'],
    // two self-contained toe-pad-heel prints, fully separated by an empty
    // column (col 3) -- no connecting cells, so they read as two distinct
    // footprints in a trail rather than one joined shape.
    grid: [
      '.#...#.',
      '###.###',
      '###.###',
      '.#...#.',
      '.#...#.',
    ],
  },
  {
    key: 'handprint',
    kind: 'icon',
    label: 'Handprint',
    regions: ['atlantic'],
    grid: [
      '#.#.#.#',
      '#######',
      '#######',
      '#######',
      '.#####.',
      '..###..',
    ],
  },
  {
    key: 'paw',
    kind: 'icon',
    label: 'Paw Print',
    regions: ['greatlakes'],
    grid: [
      '#.#.#.#',
      '.......',
      '.#####.',
      '#######',
      '#######',
      '.#####.',
    ],
  },
  {
    key: 'bite-mark',
    kind: 'icon',
    label: 'Bite Mark',
    regions: ['atlantic'],
    grid: [
      '..###..',
      '.#####.',
      '#####..',
      '####...',
      '#######',
      '.#####.',
      '..###..',
    ],
  },

  // --- item icons ---------------------------------------------------------
  {
    key: 'saucer',
    kind: 'item',
    label: 'The Object',
    regions: ['southwest'],
    // dome over a wide hull, on splayed landing skids -- unmistakably a craft,
    // not a tent: the hull overhangs and the silhouette narrows again below.
    grid: [
      '...##...',
      '..####..',
      '.######.',
      '########',
      '########',
      '.##..##.',
    ],
  },
  {
    key: 'jar',
    kind: 'item',
    label: 'Specimen Jar',
    regions: ['pnw'],
    grid: [
      '.####.',
      '#....#',
      '#....#',
      '#....#',
      '#....#',
      '######',
    ],
  },
  {
    key: 'lantern',
    kind: 'item',
    label: 'Field Lantern',
    regions: ['appalachia'],
    grid: [
      '..#..',
      '.###.',
      '#####',
      '#.#.#',
      '#####',
      '.###.',
    ],
  },
  {
    key: 'tent',
    kind: 'item',
    label: 'Camp Tent',
    regions: ['pnw'],
    grid: [
      '...#...',
      '..###..',
      '.#####.',
      '#######',
      '##.#.##',
    ],
  },
  {
    key: 'camera',
    kind: 'item',
    label: 'Trail Camera',
    regions: ['pnw'],
    grid: [
      '..##...',
      '#######',
      '#.....#',
      '#.###.#',
      '#.....#',
      '#######',
    ],
  },
  {
    key: 'egg',
    kind: 'item',
    label: 'Mystery Egg',
    regions: ['southwest'],
    grid: [
      '..##..',
      '.####.',
      '######',
      '######',
      '######',
      '.####.',
    ],
  },
  {
    key: 'boot',
    kind: 'item',
    label: 'Muddy Boot',
    regions: ['appalachia'],
    grid: [
      '##....',
      '##....',
      '##....',
      '##....',
      '######',
    ],
  },
  {
    key: 'film-strip',
    kind: 'item',
    label: 'Film Strip',
    regions: ['greatlakes'],
    grid: [
      '#.#.#.#',
      '#######',
      '#.....#',
      '#.....#',
      '#######',
      '#.#.#.#',
    ],
  },
  {
    key: 'radio-tower',
    kind: 'landmark',
    label: 'Radio Tower',
    regions: ['appalachia'],
    grid: [
      '..#..',
      '.###.',
      '.#.#.',
      '#...#',
      '#...#',
      '#####',
    ],
  },
  {
    key: 'tag',
    kind: 'item',
    label: 'Evidence Tag',
    regions: ['southwest'],
    grid: [
      '.###..',
      '.#.#..',
      '.###..',
      '######',
      '######',
      '######',
      '..##..',
    ],
  },
  {
    key: 'magnifier',
    kind: 'item',
    label: 'Magnifying Glass',
    regions: ['greatlakes'],
    grid: [
      '.###.',
      '#####',
      '#####',
      '.###.',
      '...#.',
      '....#',
    ],
  },
];
