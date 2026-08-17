import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { Puzzle, deriveClues, PlayCell, isLineComplete } from '@/engine';
import { useUiStore, PuzzleStatus } from '@/state';
import { PuzzleCell } from '@/components/molecules';
import { computeCellSize, computeClueFontSize, ROW_CLUE_GUTTER, COL_CLUE_GUTTER } from './gridSizing';

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

  const { width, height } = useWindowDimensions();
  const cellSize = computeCellSize({ windowWidth: width, windowHeight: height, cols, rows });
  const clueTextStyle = {
    fontFamily: typography.fontFamily.display,
    fontSize: computeClueFontSize(cellSize),
    color: colors.ink.soft,
    lineHeight: computeClueFontSize(cellSize) * 1.15,
  } as const;
  // Applied on top of clueTextStyle once a line is finished: crossed off, like a
  // checklist item in the field notebook, so the player sees the row/column is done.
  const clueDoneStyle = {
    color: colors.ink.faded,
    textDecorationLine: 'line-through' as const,
    opacity: 0.55,
  };

  // Before the init effect runs, cellState may not match dims; treat as empty.
  const ready = cellState.length === rows && (rows === 0 || cellState[0]?.length === cols);
  const stateAt = (r: number, c: number): PlayCell => (ready ? cellState[r][c] : 0);

  // Which rows/columns are finished (filled cells match the target exactly). All-empty
  // lines are skipped so their "0" clue isn't crossed off before the player does anything.
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

  const gridW = cols * cellSize;
  const gridH = rows * cellSize;

  // Pinned clues: the top (column) and left (row) clue strips are driven programmatically
  // to match the cell grid's scroll offset, so they stay aligned and visible while the
  // player pans a grid too big to fit on screen. The strips ignore touches (pointerEvents
  // none) — only the cell area drives the scroll.
  const topCluesRef = useRef<ScrollView>(null);
  const leftCluesRef = useRef<ScrollView>(null);
  const onCellsScrollH = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    topCluesRef.current?.scrollTo({ x: e.nativeEvent.contentOffset.x, animated: false });
  };
  const onCellsScrollV = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    leftCluesRef.current?.scrollTo({ y: e.nativeEvent.contentOffset.y, animated: false });
  };

  const colClueCell = (c: number) => (
    <View
      key={`cc-${c}`}
      style={{ width: cellSize, height: COL_CLUE_GUTTER, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: spacing.xxs }}
    >
      {colClues[c].map((n, i) => (
        <Text key={i} testID={`colclue-${c}-${i}`} allowFontScaling={false} style={[clueTextStyle, colDone[c] && clueDoneStyle]}>
          {n}
        </Text>
      ))}
    </View>
  );

  const rowClueCell = (r: number) => (
    <View
      key={`rc-${r}`}
      style={{ height: cellSize, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xs, paddingRight: spacing.xs }}
    >
      {rowClues[r].map((n, i) => (
        <Text key={i} testID={`rowclue-${r}-${i}`} allowFontScaling={false} style={[clueTextStyle, rowDone[r] && clueDoneStyle]}>
          {n}
        </Text>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, alignSelf: 'stretch' }} accessibilityLabel="Puzzle grid">
      {/* Top strip: fixed corner + horizontally-synced column clues */}
      <View style={{ flexDirection: 'row', height: COL_CLUE_GUTTER }}>
        <View style={{ width: ROW_CLUE_GUTTER }} />
        <ScrollView ref={topCluesRef} horizontal pointerEvents="none" showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', width: gridW }}>
            {Array.from({ length: cols }).map((_, c) => colClueCell(c))}
          </View>
        </ScrollView>
      </View>

      {/* Main: vertically-synced row clues + the 2D-scrollable cell grid */}
      <View style={{ flexDirection: 'row', flex: 1 }}>
        <ScrollView ref={leftCluesRef} pointerEvents="none" showsVerticalScrollIndicator={false} style={{ width: ROW_CLUE_GUTTER }}>
          <View style={{ height: gridH }}>{Array.from({ length: rows }).map((_, r) => rowClueCell(r))}</View>
        </ScrollView>

        <ScrollView style={{ flex: 1 }} onScroll={onCellsScrollV} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
          <ScrollView horizontal onScroll={onCellsScrollH} scrollEventThrottle={16} showsHorizontalScrollIndicator={false} nestedScrollEnabled>
            <View style={{ width: gridW }}>
              {Array.from({ length: rows }).map((_, r) => (
                <View key={`row-${r}`} style={{ flexDirection: 'row' }}>
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
          </ScrollView>
        </ScrollView>
      </View>
    </View>
  );
}

export default PuzzleGrid;
