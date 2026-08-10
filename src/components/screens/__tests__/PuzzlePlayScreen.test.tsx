import { render, screen, fireEvent } from '@testing-library/react-native';
import { PuzzlePlayScreen } from '@/components/screens';
import { buildPuzzle } from '@/content/buildPuzzle';
import { useUiStore, useProgressStore } from '@/state';
import type { FieldEntry, PuzzleMetadata } from '@/engine';

jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light' } }));

const entry: FieldEntry = { title: 'X', body: 'Y', voiceStyle: 'notebook' };
const metadata: PuzzleMetadata = { regionId: 'pnw', order: 7, isCapstone: false };
const PUZZLE = buildPuzzle({ id: 'p-test', name: 'Test', subtitle: 'sub', grid: [[1, 0], [0, 1]], entry, metadata });

beforeEach(() => {
  useUiStore.setState({ target: null, cellState: [], history: [], tool: 'fill', errors: 0, status: 'idle', startedAt: null, elapsedMs: null });
  useProgressStore.getState().hydrate({ solved: {}, onboardingCompleted: false, firstLaunchAt: 0 });
});

describe('PuzzlePlayScreen', () => {
  it('renders the grid, toolbar, tier badge, and timer', () => {
    render(<PuzzlePlayScreen puzzle={PUZZLE} mode="cozy" onExit={() => {}} />);
    expect(screen.getByTestId('cell-0-0')).toBeTruthy();
    expect(screen.getByTestId('tool-fill')).toBeTruthy();
    expect(screen.getByText(PUZZLE.difficulty.tier)).toBeTruthy();
    expect(screen.getByText(/00:00/)).toBeTruthy();
  });

  it('switches the active tool via the toolbar', () => {
    render(<PuzzlePlayScreen puzzle={PUZZLE} mode="cozy" onExit={() => {}} />);
    fireEvent.press(screen.getByTestId('tool-mark'));
    expect(useUiStore.getState().tool).toBe('mark');
  });

  it('reveals a correct cell when Hint is tapped', () => {
    render(<PuzzlePlayScreen puzzle={PUZZLE} mode="cozy" onExit={() => {}} />);
    fireEvent.press(screen.getByTestId('tool-hint'));
    // first target-filled unfilled cell is (0,0)
    expect(useUiStore.getState().cellState[0][0]).toBe(1);
    expect(useUiStore.getState().errors).toBe(0); // hint is never a mistake
  });

  it('marks the puzzle solved in progressStore on win', () => {
    const onSolved = jest.fn();
    render(<PuzzlePlayScreen puzzle={PUZZLE} mode="cozy" onExit={() => {}} onSolved={onSolved} />);
    fireEvent.press(screen.getByTestId('cell-0-0'));
    fireEvent.press(screen.getByTestId('cell-1-1'));
    expect(useProgressStore.getState().isSolved('p-test')).toBe(true);
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  it('calls onExit from the back control', () => {
    const onExit = jest.fn();
    render(<PuzzlePlayScreen puzzle={PUZZLE} mode="cozy" onExit={onExit} />);
    fireEvent.press(screen.getByTestId('play-back'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
