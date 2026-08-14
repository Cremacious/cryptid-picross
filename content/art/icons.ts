import type { ArtEntry } from './types';

/**
 * Shared evidence/item icon pool. Fills the Easy tier of every region.
 * Each grid is hand-authored to: be already trimmed (no blank border), have
 * max dimension <= 8, be line-solvable ("unique"), and score the Easy
 * difficulty tier. See content/art/__tests__/icons.test.ts for the gate.
 */
export const ICONS: ArtEntry[] = [
  // --- evidence icons ---------------------------------------------------
  {
    key: 'footprint',
    kind: 'icon',
    label: 'Cast Footprint',
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
    grid: [
      '#####',
      '.###.',
      '.###.',
      '..#..',
      '..#..',
    ],
  },
  {
    key: 'fur-tuft',
    kind: 'icon',
    label: 'Tuft of Fur',
    grid: [
      '#.#.#',
      '#.#.#',
      '#####',
      '.###.',
      '..#..',
    ],
  },
  {
    key: 'track-pair',
    kind: 'icon',
    label: 'Track Pair',
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
    key: 'horn',
    kind: 'icon',
    label: 'Curved Horn',
    grid: [
      '#####',
      '.###.',
      '.##..',
      '.##..',
      '..#..',
    ],
  },
  {
    key: 'scale',
    kind: 'icon',
    label: 'Shed Scale',
    grid: [
      '..#..',
      '.###.',
      '#####',
      '.###.',
      '..#..',
    ],
  },
  {
    key: 'bite-mark',
    kind: 'icon',
    label: 'Bite Mark',
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
    grid: [
      '...#...',
      '..###..',
      '.#####.',
      '#######',
      '.#.#.#.',
    ],
  },
  {
    key: 'jar',
    kind: 'item',
    label: 'Specimen Jar',
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
    kind: 'item',
    label: 'Radio Tower',
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
    key: 'compass',
    kind: 'item',
    label: 'Compass Needle',
    // a directional needle -- wide arrowhead pointing "north" over a thin
    // tapering shaft, so it reads as a compass needle rather than a gem.
    grid: [
      '..#..',
      '.###.',
      '#####',
      '..#..',
      '..#..',
      '..#..',
    ],
  },
  {
    key: 'magnifier',
    kind: 'item',
    label: 'Magnifying Glass',
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
