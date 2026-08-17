import { create } from 'zustand';
import { Grid, PlayCell, PlayGrid, isSolved } from '@/engine';

export type Tool = 'fill' | 'mark';
export type PuzzleStatus = 'idle' | 'playing' | 'won' | 'lost';

/** Wrong fills allowed before the puzzle fails (nonogram-style 3-strikes). */
export const MISTAKE_LIMIT = 3;

interface TapAction {
  r: number;
  c: number;
  prev: PlayCell;
  next: PlayCell;
  countedError: boolean;
}

interface UiState {
  target: Grid | null;
  cellState: PlayGrid;
  history: TapAction[];
  tool: Tool;
  errors: number;
  status: PuzzleStatus;
  startedAt: number | null;
  elapsedMs: number | null;
}

interface UiStore extends UiState {
  init: (target: Grid) => void;
  setTool: (tool: Tool) => void;
  tap: (r: number, c: number, toolOverride?: Tool) => void;
  undo: () => void;
  reset: () => void;
  isWon: () => boolean;
}

const emptyGrid = (rows: number, cols: number): PlayGrid =>
  Array.from({ length: rows }, () => new Array<PlayCell>(cols).fill(0));

const dims = (target: Grid): { rows: number; cols: number } => {
  const rows = target.length;
  return { rows, cols: rows > 0 ? target[0].length : 0 };
};

const setCell = (grid: PlayGrid, r: number, c: number, value: PlayCell): PlayGrid =>
  grid.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? value : cell)) : row));

const INITIAL: UiState = {
  target: null,
  cellState: [],
  history: [],
  tool: 'fill',
  errors: 0,
  status: 'idle',
  startedAt: null,
  elapsedMs: null,
};

export const useUiStore = create<UiStore>((set, get) => ({
  ...INITIAL,

  init: (target) => {
    const { rows, cols } = dims(target);
    set({
      target,
      cellState: emptyGrid(rows, cols),
      history: [],
      tool: 'fill',
      errors: 0,
      status: 'playing',
      startedAt: Date.now(),
      elapsedMs: null,
    });
  },

  setTool: (tool) => set({ tool }),

  tap: (r, c, toolOverride) => {
    const { target, cellState, status, tool, errors, history, startedAt, elapsedMs } = get();
    if (target === null || status === 'won' || status === 'lost') return;

    const prev = cellState[r][c];
    // A wrong cell (3) is locked — it's a confirmed-empty from a mistake and can't change.
    if (prev === 3) return;

    const useTool = toolOverride ?? tool;
    // Fill on an empty/marked cell: correct -> fill (1); wrong -> auto-mark X + lock (3),
    // like nonogram.com, so the board stays consistent and can always be completed.
    let nextVal: PlayCell;
    let isWrongFill = false;
    if (useTool === 'fill') {
      if (prev === 1) nextVal = 0;
      else if (target[r][c] === 1) nextVal = 1;
      else {
        nextVal = 3;
        isWrongFill = true;
      }
    } else {
      nextVal = prev === 2 ? 0 : 2;
    }
    const nextGrid = setCell(cellState, r, c, nextVal);

    const solved = isSolved(nextGrid, target);
    const newErrors = errors + (isWrongFill ? 1 : 0);
    const lost = !solved && newErrors >= MISTAKE_LIMIT;

    set({
      cellState: nextGrid,
      history: [...history, { r, c, prev, next: nextVal, countedError: isWrongFill }],
      errors: newErrors,
      status: solved ? 'won' : lost ? 'lost' : 'playing',
      elapsedMs: solved && startedAt !== null ? Date.now() - startedAt : elapsedMs,
    });
  },

  undo: () => {
    const { history, cellState, target, errors, elapsedMs } = get();
    if (history.length === 0) return;
    const last = history[history.length - 1];
    const nextGrid = setCell(cellState, last.r, last.c, last.prev);
    const solved = target !== null && isSolved(nextGrid, target);
    set({
      cellState: nextGrid,
      history: history.slice(0, -1),
      errors: errors - (last.countedError ? 1 : 0),
      status: solved ? 'won' : 'playing',
      elapsedMs: solved ? elapsedMs : null,
    });
  },

  reset: () => {
    const { target } = get();
    if (target === null) return;
    const { rows, cols } = dims(target);
    set({
      cellState: emptyGrid(rows, cols),
      history: [],
      errors: 0,
      status: 'playing',
      startedAt: Date.now(),
      elapsedMs: null,
    });
  },

  isWon: () => get().status === 'won',
}));
