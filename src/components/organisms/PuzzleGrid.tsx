import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { colors, typography, spacing, layout } from '@/theme';
import { Puzzle, deriveClues, PlayCell } from '@/engine';
import { useUiStore, PuzzleStatus } from '@/state';
import { PuzzleCell } from '@/components/molecules';

export interface PuzzleGridProps {
  puzzle: Puzzle;
  mode: 'cozy' | 'classic';
  onWin: (time: number, mistakes: number) => void;
  onProgressChange?: (progress: number) => void;
}

const ROW_CLUE_WIDTH = 48;

const clueTextStyle = {
  fontFamily: typography.fontFamily.display,
  fontSize: typography.size.xs,
  color: colors.ink.soft,
  lineHeight: typography.size.xs * 1.15,
};

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

  // Initialize the store for this puzzle on mount / puzzle change.
  useEffect(() => {
    init(target);
  }, [init, target]);

  // Fire onWin once, on the genuine play -> won transition. Never on mount from
  // a stale `won` left by a previous puzzle (prev starts null -> first tick can't fire).
  const prevStatusRef = useRef<PuzzleStatus | null>(null);
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (prev !== null && prev !== 'won' && status === 'won') {
      onWin(elapsedMs != null ? Math.round(elapsedMs / 1000) : 0, errors);
    }
    prevStatusRef.current = status;
  }, [status, elapsedMs, errors, onWin]);

  // Optional progress reporting: fraction of target-filled cells correctly filled.
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

  // Stable per-cell handlers (tap is a stable zustand action) so PuzzleCell's memo holds.
  const handlers = useMemo(
    () =>
      Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => () => tap(r, c)),
      ),
    [rows, cols, tap],
  );

  const { width } = useWindowDimensions();
  const available = width > 0 ? width - spacing.md * 2 - ROW_CLUE_WIDTH : cols * layout.gridCellMin;
  const cellSize = Math.max(
    layout.gridCellMin,
    Math.min(layout.gridCellMax, Math.floor(available / Math.max(cols, 1))),
  );

  // Before the init effect runs, cellState may not match dims; treat as empty.
  const ready = cellState.length === rows && (rows === 0 || cellState[0]?.length === cols);
  const stateAt = (r: number, c: number): PlayCell => (ready ? cellState[r][c] : 0);

  const describe = (r: number, c: number): string => {
    const s = stateAt(r, c);
    const word = s === 1 ? 'filled' : s === 2 ? 'marked' : 'empty';
    return `row ${r + 1}, column ${c + 1}, ${word}`;
  };

  return (
    <View accessibilityLabel="Puzzle grid">
      {/* Column clues */}
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: ROW_CLUE_WIDTH }} />
        {Array.from({ length: cols }).map((_, c) => (
          <View
            key={`cc-${c}`}
            style={{ width: cellSize, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: spacing.xxs }}
          >
            {colClues[c].map((n, i) => (
              <Text key={i} allowFontScaling={false} style={clueTextStyle}>
                {n}
              </Text>
            ))}
          </View>
        ))}
      </View>

      {/* Rows: clue gutter + cells */}
      {Array.from({ length: rows }).map((_, r) => (
        <View key={`row-${r}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{ width: ROW_CLUE_WIDTH, flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.xs, paddingRight: spacing.xs }}
          >
            {rowClues[r].map((n, i) => (
              <Text key={i} allowFontScaling={false} style={clueTextStyle}>
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
