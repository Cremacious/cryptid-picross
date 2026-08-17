import React, { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { colors, typography, spacing, radius, border } from '@/theme';
import { Puzzle } from '@/engine';
import { useUiStore, useProgressStore, MISTAKE_LIMIT } from '@/state';
import { IconButton, Button } from '@/components/atoms';
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
  const reset = useUiStore((s) => s.reset);
  const heartsLeft = Math.max(0, MISTAKE_LIMIT - errors);

  const [hintsRemaining, setHintsRemaining] = useState(HINT_LIMIT);

  // Live timer (stops at win).
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    if (status === 'won' || status === 'lost' || startedAt == null) return;
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

      {/* Hearts (3 mistakes) + timer */}
      <View style={{ alignItems: 'center', marginVertical: spacing.sm, gap: 2 }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }} accessibilityLabel={`${heartsLeft} of ${MISTAKE_LIMIT} mistakes remaining`}>
          {Array.from({ length: MISTAKE_LIMIT }).map((_, i) => (
            <Text
              key={i}
              testID={`heart-${i}`}
              style={{ fontSize: 44, lineHeight: 48, color: i < heartsLeft ? colors.accent.stampRed : colors.paper.shadow }}
            >
              {i < heartsLeft ? '♥' : '♡'}
            </Text>
          ))}
        </View>
        <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.lg, color: colors.ink.soft }}>{formatTime(elapsed)}</Text>
      </View>

      {/* Grid — the whole board fits on screen (no scroll); centered like nonogram.com. */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm }}>
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

      {/* Fail state: three mistakes end the sighting. */}
      {status === 'lost' ? (
        <View
          testID="play-failed"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(43,36,27,0.6)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}
        >
          <View style={{ backgroundColor: colors.paper.cream, borderRadius: radius.md, borderWidth: border.thin, borderColor: colors.paper.shadow, padding: spacing.lg, gap: spacing.md, alignItems: 'center', maxWidth: 360 }}>
            <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.xl, letterSpacing: typography.letterSpacing.wide, color: colors.ink.primary, textTransform: 'uppercase', textAlign: 'center' }}>
              The trail went cold
            </Text>
            <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.md, color: colors.ink.faded, textAlign: 'center' }}>
              Three mistakes and the sighting slipped away.
            </Text>
            <Button label="Try Again" fullWidth onPress={reset} testID="play-retry" />
            <Text onPress={onExit} accessibilityRole="button" style={{ fontFamily: typography.fontFamily.body, fontSize: typography.size.sm, color: colors.ink.faded, marginTop: spacing.xs }}>
              Back to the region
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default PuzzlePlayScreen;
