import { render, screen, fireEvent } from '@testing-library/react-native';
import { PuzzleGrid } from '@/components/organisms';
import { sampleRegions } from '@/content/sampleRegions';
import { useUiStore } from '@/state';
import type { Puzzle } from '@/engine';

jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light' } }));

const allPuzzles: Puzzle[] = sampleRegions.flatMap((r) => r.puzzles);

beforeEach(() => {
  useUiStore.setState({
    target: null, cellState: [], history: [], tool: 'fill',
    errors: 0, status: 'idle', startedAt: null, elapsedMs: null,
  });
});

describe('every sample puzzle solves to a win via real taps', () => {
  it('has at least one sample puzzle to check', () => {
    expect(allPuzzles.length).toBeGreaterThanOrEqual(1);
  });

  it.each(allPuzzles.map((p) => [p.id, p] as const))(
    'puzzle %s reaches won with zero mistakes when its solution cells are tapped',
    (_id, puzzle) => {
      const onWin = jest.fn();
      render(<PuzzleGrid puzzle={puzzle} mode="cozy" onWin={onWin} />);
      // tap exactly the filled (target === 1) cells
      puzzle.grid.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell === 1) fireEvent.press(screen.getByTestId(`cell-${r}-${c}`));
        });
      });
      expect(useUiStore.getState().status).toBe('won');
      expect(onWin).toHaveBeenCalledTimes(1);
      expect(onWin).toHaveBeenCalledWith(expect.any(Number), 0);
    },
  );
});
