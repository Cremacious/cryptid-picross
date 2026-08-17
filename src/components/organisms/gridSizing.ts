import { layout } from '@/theme';

/**
 * Layout for the play grid, sized so the WHOLE puzzle (clue gutters + every cell) fits on
 * screen without scrolling — the nonogram.com approach: small cells, but the full board is
 * always visible. The clue gutters grow with the longest clue so dense Expert boards still
 * fit, and cells shrink to fill whatever space is left.
 */
export interface GridLayout {
  cellSize: number;
  /** Width of the left row-clue gutter. */
  rowGutter: number;
  /** Height of the top column-clue gutter. */
  colGutter: number;
  /** Clue number font size (scaled down with the cell so digits fit the pills). */
  clueFont: number;
  clueLine: number;
}

/** Header + timer/hearts + toolbar + padding reserved from the window height. */
const CHROME_HEIGHT = 300;
/** Reserved px per clue number: width in the row gutter, height in the column gutter. */
const CLUE_UNIT = 13;
/** Cells never go below this — below it a nonogram is genuinely untappable. */
const CELL_MIN = 9;

export function computeGridLayout(p: {
  windowWidth: number;
  windowHeight: number;
  rows: number;
  cols: number;
  /** Most clue numbers in any single row / column (from deriveClues). */
  maxRowClue: number;
  maxColClue: number;
}): GridLayout {
  const rowGutter = Math.max(30, p.maxRowClue * CLUE_UNIT + 10);
  const colGutter = Math.max(30, p.maxColClue * CLUE_UNIT + 8);
  const availW = p.windowWidth - layout.screenPadding * 2 - rowGutter;
  const availH = p.windowHeight - CHROME_HEIGHT - colGutter;
  const byW = p.cols > 0 ? availW / p.cols : layout.gridCellMax;
  const byH = p.rows > 0 ? availH / p.rows : layout.gridCellMax;
  const cellSize = Math.max(CELL_MIN, Math.min(layout.gridCellMax, Math.floor(Math.min(byW, byH))));
  const clueFont = Math.max(8, Math.min(13, Math.round(cellSize * 0.82)));
  return { cellSize, rowGutter, colGutter, clueFont, clueLine: clueFont + 2 };
}
