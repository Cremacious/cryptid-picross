import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { colors, typography } from '@/theme';
import { Puzzle, deriveClues, PlayCell, isLineComplete } from '@/engine';
import { useUiStore, PuzzleStatus } from '@/state';
import { PuzzleCell } from '@/components/molecules';
import { computeGridLayout } from './gridSizing';

export interface PuzzleGridProps {
  puzzle: Puzzle;
  mode: 'cozy' | 'classic';
  onWin: (time: number, mistakes: number) => void;
  onProgressChange?: (progress: number) => void;
}

export function PuzzleGrid({ puzzle, mode, onWin, onProgressChange }: PuzzleGridProps) {
  const target = puzzle.grid;
  const rows = target.length;
  const cols = rows > 0 ? target[0].length : 0;

  const { row: rowClues, col: colClues } = useMemo(() => deriveClues(target), [target]);

  const cellState = useUiStore((s) => s.cellState);
  const status = useUiStore((s) => s.status);
  const errors = useUiStore((s) => s.errors);
  const elapsedMs = useUiStore((s) => s.elapsedMs);
  const tap = useUiStore((s) => s.tap);
  const init = useUiStore((s) => s.init);

  useEffect(() => {
    init(target);
  }, [init, target]);

  // Fire onWin once, on the genuine play -> won transition.
  const prevStatusRef = useRef<PuzzleStatus | null>(null);
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (prev !== null && prev !== 'won' && status === 'won') {
      onWin(elapsedMs != null ? Math.round(elapsedMs / 1000) : 0, errors);
    }
    prevStatusRef.current = status;
  }, [status, elapsedMs, errors, onWin]);

  useEffect(() => {
    if (!onProgressChange) return;
    let targetFilled = 0;
    let correct = 0;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (target[r][c] === 1) {
          targetFilled += 1;
          if (cellState[r]?.[c] === 1) correct += 1;
        }
      }
    }
    onProgressChange(targetFilled > 0 ? correct / targetFilled : 0);
  }, [cellState, onProgressChange, target, rows, cols]);

  const handlers = useMemo(
    () => Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => () => tap(r, c))),
    [rows, cols, tap],
  );

  const { width, height } = useWindowDimensions();
  const maxRowClue = useMemo(() => rowClues.reduce((m, c) => Math.max(m, c.length), 1), [rowClues]);
  const maxColClue = useMemo(() => colClues.reduce((m, c) => Math.max(m, c.length), 1), [colClues]);
  const { cellSize, rowGutter, colGutter, clueFont, clueLine } = computeGridLayout({
    windowWidth: width,
    windowHeight: height,
    rows,
    cols,
    maxRowClue,
    maxColClue,
  });

  const clueTextStyle = {
    fontFamily: typography.fontFamily.display,
    fontSize: clueFont,
    lineHeight: clueLine,
    color: colors.ink.soft,
  } as const;
  const clueDoneStyle = { color: colors.ink.faded, textDecorationLine: 'line-through' as const, opacity: 0.5 };

  const ready = cellState.length === rows && (rows === 0 || cellState[0]?.length === cols);
  const stateAt = (r: number, c: number): PlayCell => (ready ? cellState[r][c] : 0);

  const rowDone = useMemo(
    () =>
      Array.from(
        { length: rows },
        (_, r) => ready && target[r].some((v) => v === 1) && isLineComplete(cellState[r], target[r]),
      ),
    [ready, cellState, target, rows],
  );
  const colDone = useMemo(
    () =>
      Array.from({ length: cols }, (_, c) => {
        const targetCol = target.map((line) => line[c]);
        if (!ready || !targetCol.some((v) => v === 1)) return false;
        return isLineComplete(
          cellState.map((line) => line[c]),
          targetCol,
        );
      }),
    [ready, cellState, target, cols],
  );

  const describe = (r: number, c: number): string => {
    const s = stateAt(r, c);
    const word = s === 1 ? 'filled' : s === 2 ? 'marked' : 'empty';
    return `row ${r + 1}, column ${c + 1}, ${word}`;
  };

  return (
    <View accessibilityLabel="Puzzle grid" style={{ alignSelf: 'center' }}>
      {/* Column-clue strip: fixed corner + a pill per column */}
      <View style={{ flexDirection: 'row', height: colGutter }}>
        <View style={{ width: rowGutter }} />
        {Array.from({ length: cols }).map((_, c) => (
          <View key={`cc-${c}`} style={{ width: cellSize, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 3 }}>
            {colClues[c].map((n, i) => (
              <Text key={i} testID={`colclue-${c}-${i}`} allowFontScaling={false} style={[clueTextStyle, colDone[c] && clueDoneStyle]}>
                {n}
              </Text>
            ))}
          </View>
        ))}
      </View>

      {/* Rows: a row-clue pill + the cells */}
      {Array.from({ length: rows }).map((_, r) => (
        <View key={`row-${r}`} style={{ flexDirection: 'row', height: cellSize }}>
          <View
            style={{ width: rowGutter, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, paddingRight: 6 }}
          >
            {rowClues[r].map((n, i) => (
              <Text key={i} testID={`rowclue-${r}-${i}`} allowFontScaling={false} style={[clueTextStyle, rowDone[r] && clueDoneStyle]}>
                {n}
              </Text>
            ))}
          </View>
          {Array.from({ length: cols }).map((_, c) => {
            const s = stateAt(r, c);
            const isWrong = mode === 'cozy' && s === 1 && target[r][c] === 0;
            return (
              <PuzzleCell
                key={`cell-${r}-${c}`}
                testID={`cell-${r}-${c}`}
                state={s}
                isWrong={isWrong}
                size={cellSize}
                onPress={handlers[r][c]}
                boldRight={(c + 1) % 5 === 0 && c < cols - 1}
                boldBottom={(r + 1) % 5 === 0 && r < rows - 1}
                accessibilityLabel={describe(r, c)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default PuzzleGrid;
