import * as fs from 'fs';
import { PNG } from 'pngjs';
import { Grid } from '@/engine';
import { imageToGrid } from './imageToGrid';

/** Build-time only: decode a PNG file to a Grid. Do NOT import from app code. */
export function loadPngGrid(filePath: string, threshold = 128): Grid {
  const png = PNG.sync.read(fs.readFileSync(filePath));
  return imageToGrid(png.data, png.width, png.height, threshold);
}
