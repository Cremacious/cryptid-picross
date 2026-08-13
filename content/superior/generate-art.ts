/**
 * Placeholder art generator for the "Lake Superior" sample region. Writes one PNG per
 * puzzle from an ASCII grid (`#` = filled/black, `.` = empty/white) into ./art, named
 * `{regionId}-{order}-{slug}.png` for the import-region CLI. Real cryptid pixel art
 * replaces these later; the shapes here are all verified uniquely solvable by the engine.
 *
 * Run:  npx tsx content/superior/generate-art.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';

const ART_DIR = path.join(__dirname, 'art');

const PUZZLES: { file: string; art: string }[] = [
  {
    // superior-001 · The Crossing (5x5, Easy)
    file: 'superior-001-logging-road.png',
    art: `
      ..#..
      ..#..
      #####
      ..#..
      ..#..`,
  },
  {
    // superior-002 · Hollow-Eyes (7x7, Easy)
    file: 'superior-002-the-stare.png',
    art: `
      ..###..
      .#####.
      ##.#.##
      #######
      #.#.#.#
      #.....#
      #.....#`,
  },
  {
    // superior-003 · The Antlered (7x7, Medium)
    file: 'superior-003-ridge-line.png',
    art: `
      #.#....
      #.#.#..
      ####.#.
      .####..
      ..###..
      ..###..
      .##.##.`,
  },
  {
    // superior-004 · The Lake Serpent (10x10, Medium)
    file: 'superior-004-deep-water.png',
    art: `
      .#........
      ###.......
      .####.....
      ...####.#.
      ....#####.
      .########.
      ..######..
      ...####...
      ....##....
      ..........`,
  },
];

function parse(art: string): number[][] {
  return art
    .trim()
    .split('\n')
    .map((r) => r.trim().split('').map((c) => (c === '#' ? 1 : 0)));
}

function writePng(grid: number[][], file: string): void {
  const height = grid.length;
  const width = grid[0].length;
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const filled = grid[y][x] === 1;
      png.data[i] = filled ? 0 : 255;
      png.data[i + 1] = filled ? 0 : 255;
      png.data[i + 2] = filled ? 0 : 255;
      png.data[i + 3] = 255;
    }
  }
  fs.writeFileSync(path.join(ART_DIR, file), PNG.sync.write(png));
}

fs.mkdirSync(ART_DIR, { recursive: true });
for (const { file, art } of PUZZLES) {
  const grid = parse(art);
  writePng(grid, file);
  console.log(`wrote ${file}  (${grid.length}x${grid[0].length})`);
}
