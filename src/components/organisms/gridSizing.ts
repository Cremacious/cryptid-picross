import { layout } from '@/theme';

/** Horizontal space reserved for the row-clue gutter. */
export const ROW_CLUE_GUTTER = 48;

/** Vertical space reserved for the column-clue gutter above the grid. */
export const COL_CLUE_GUTTER = 56;

/** Header + timer + toolbar + padding reserved from the window height. */
const CHROME_HEIGHT = 300;

/**
 * Comfortable minimum tap target for a play cell. Large grids (e.g. 25×25) no longer
 * shrink below this to fit — instead the grid scrolls (with pinned clues), so cells stay
 * finger-friendly on a phone.
 */
export const PLAY_CELL_MIN = 30;

/**
 * Cell edge (px). Small grids grow to fill the space (up to gridCellMax); large grids
 * hold at PLAY_CELL_MIN and scroll rather than shrinking to an untappable size. Unknown
 * dims (jest / first render) degrade to PLAY_CELL_MIN so the grid still renders.
 */
export function computeCellSize(p: {
  windowWidth: number;
  windowHeight: number;
  cols: number;
  rows: number;
}): number {
  const availW = p.windowWidth - layout.screenPadding * 2 - ROW_CLUE_GUTTER;
  const availH = p.windowHeight - CHROME_HEIGHT - COL_CLUE_GUTTER;
  const byWidth = p.cols > 0 ? Math.floor(availW / p.cols) : layout.gridCellMax;
  const byHeight = p.rows > 0 ? Math.floor(availH / p.rows) : layout.gridCellMax;
  const raw = Math.min(byWidth, byHeight);
  return Math.max(PLAY_CELL_MIN, Math.min(layout.gridCellMax, raw));
}

/** Clue number font that scales with the cell, clamped to a legible range. */
export function computeClueFontSize(cellSize: number): number {
  return Math.max(11, Math.min(18, Math.round(cellSize * 0.36)));
}
