import React, { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { Puzzle } from '@/engine';
import { useUiStore, useProgressStore } from '@/state';
import { IconButton } from '@/components/atoms';
import { TierBadge } from '@/components/molecules';
import { PuzzleGrid, PuzzleToolbar } from '@/components/organisms';
import { formatTime } from '@/utils/formatTime';

export interface PuzzlePlayScreenProps {
  puzzle: Puzzle;
  mode: 'cozy' | 'classic';
  onExit: () => void;
  onSolved?: (time: number, mistakes: number) => void;
}

const HINT_LIMIT = 3;

const pad3 = (n: number) => String(n).padStart(3, '0');

export function PuzzlePlayScreen({ puzzle, mode, onExit, onSolved }: PuzzlePlayScreenProps) {
  const tool = useUiStore((s) => s.tool);
  const setTool = useUiStore((s) => s.setTool);
  const undo = useUiStore((s) => s.undo);
  const tap = useUiStore((s) => s.tap);
  const historyLength = useUiStore((s) => s.history.length);
  const errors = useUiStore((s) => s.errors);
  const status = useUiStore((s) => s.status);
  const startedAt = useUiStore((s) => s.startedAt);
  const cellState = useUiStore((s) => s.cellState);

  const [hintsRemaining, setHintsRemaining] = useState(HINT_LIMIT);

  // Live timer (stops at win).
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    if (status === 'won' || startedAt == null) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status, startedAt]);
  const elapsed = startedAt != null ? Math.max(0, Math.floor((nowMs - startedAt) / 1000)) : 0;

  const handleWin = useCallback(
    (time: number, mistakes: number) => {
      useProgressStore.getState().markSolved(puzzle.id, { time, mistakes });
      onSolved?.(time, mistakes);
    },
    [puzzle.id, onSolved],
  );

  const handleHint = useCallback(() => {
    if (hintsRemaining <= 0) return;
    const grid = puzzle.grid;
    for (let r = 0; r < grid.length; r += 1) {
      for (let c = 0; c < grid[r].length; c += 1) {
        if (grid[r][c] === 1 && cellState[r]?.[c] !== 1) {
          tap(r, c, 'fill');
          setHintsRemaining((h) => h - 1);
          return;
        }
      }
    }
  }, [hintsRemaining, puzzle.grid, cellState, tap]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper.cream, padding: spacing.md }}>
      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton icon="back" variant="ghost" accessibilityLabel="Back" onPress={onExit} testID="play-back" />
        <TierBadge tier={puzzle.difficulty.tier} />
      </View>

      {/* Header */}
      <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.xl, letterSpacing: typography.letterSpacing.wider, color: colors.ink.primary, textTransform: 'uppercase', marginTop: spacing.sm }}>
        {`Sighting ${pad3(puzzle.metadata.order)}`}
      </Text>
      <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.sm, color: colors.ink.faded }}>
        {puzzle.subtitle}
      </Text>

      {/* Timer + mistakes */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginVertical: spacing.sm }}>
        <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.sm, color: colors.ink.soft }}>{formatTime(elapsed)}</Text>
        <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.sm, color: colors.ink.faded }}>·</Text>
        <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.sm, color: errors > 0 ? colors.accent.stampRed : colors.ink.soft }}>
          {`${errors} mistakes`}
        </Text>
      </View>

      {/* Grid */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <PuzzleGrid puzzle={puzzle} mode={mode} onWin={handleWin} />
      </View>

      {/* Toolbar */}
      <PuzzleToolbar
        activeTool={tool}
        mode={mode}
        onToolChange={setTool}
        onUndo={undo}
        onHint={handleHint}
        canUndo={historyLength > 0}
        hintCount={hintsRemaining}
        testID="play-toolbar"
      />
    </View>
  );
}

export default PuzzlePlayScreen;
