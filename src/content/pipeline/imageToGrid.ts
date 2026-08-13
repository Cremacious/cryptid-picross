import { Grid, Cell } from '@/engine';

/**
 * Convert RGBA pixel data to a source-of-truth Grid.
 * A pixel is filled (1) when non-transparent (alpha > 0) AND average RGB < threshold.
 * (DATA_AND_ENGINE.md §2.2)
 */
export function imageToGrid(
  pixels: ArrayLike<number>,
  width: number,
  height: number,
  threshold = 128,
): Grid {
  const grid: Grid = [];
  for (let y = 0; y < height; y += 1) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      const avg = (r + g + b) / 3;
      row.push(a > 0 && avg < threshold ? 1 : 0);
    }
    grid.push(row);
  }
  return grid;
}
