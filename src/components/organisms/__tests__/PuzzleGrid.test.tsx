import { render, screen, fireEvent } from '@testing-library/react-native';
import { PuzzleGrid } from '@/components/organisms';
import { useUiStore } from '@/state';
import type { Puzzle } from '@/engine';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

// Minimal puzzle: only `grid` is used by the organism (clues are derived).
const makePuzzle = (grid: number[][]): Puzzle =>
  ({ id: 'test', name: 'Test', subtitle: '', grid } as unknown as Puzzle);

const TARGET = makePuzzle([
  [1, 0],
  [0, 1],
]);

const flat = (s: unknown) =>
  Array.isArray(s) ? Object.assign({}, ...(s as unknown[]).flat().filter(Boolean)) : (s as Record<string, unknown>);

beforeEach(() => {
  useUiStore.setState({
    target: null, cellState: [], history: [], tool: 'fill',
    errors: 0, status: 'idle', startedAt: null, elapsedMs: null,
  });
});

describe('PuzzleGrid', () => {
  it('renders a cell for every grid position', () => {
    render(<PuzzleGrid puzzle={TARGET} mode="cozy" onWin={() => {}} />);
    expect(screen.getByTestId('cell-0-0')).toBeTruthy();
    expect(screen.getByTestId('cell-0-1')).toBeTruthy();
    expect(screen.getByTestId('cell-1-0')).toBeTruthy();
    expect(screen.getByTestId('cell-1-1')).toBeTruthy();
  });

  it('renders clue numbers derived from the grid', () => {
    render(<PuzzleGrid puzzle={TARGET} mode="cozy" onWin={() => {}} />);
    // rows [1],[1] and cols [1],[1] -> at least four "1" clue labels
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(4);
  });

  it('a tap updates the uiStore cell state', () => {
    render(<PuzzleGrid puzzle={TARGET} mode="cozy" onWin={() => {}} />);
    fireEvent.press(screen.getByTestId('cell-0-0'));
    expect(useUiStore.getState().cellState[0][0]).toBe(1);
  });

  it('fires onWin once when the puzzle is solved', () => {
    const onWin = jest.fn();
    render(<PuzzleGrid puzzle={TARGET} mode="cozy" onWin={onWin} />);
    fireEvent.press(screen.getByTestId('cell-0-0')); // target 1
    fireEvent.press(screen.getByTestId('cell-1-1')); // target 1 -> solved
    expect(onWin).toHaveBeenCalledTimes(1);
    expect(onWin).toHaveBeenCalledWith(expect.any(Number), 0);
  });

  it('does NOT fire onWin on mount when the store was left won by a prior puzzle', () => {
    useUiStore.setState({ status: 'won', elapsedMs: 1234, errors: 3 });
    const onWin = jest.fn();
    render(<PuzzleGrid puzzle={TARGET} mode="cozy" onWin={onWin} />);
    expect(onWin).not.toHaveBeenCalled();
  });

  it('marks a wrong fill in Cozy mode with the warning-red cell', () => {
    render(<PuzzleGrid puzzle={TARGET} mode="cozy" onWin={() => {}} />);
    fireEvent.press(screen.getByTestId('cell-0-1')); // target 0 -> wrong fill
    expect(useUiStore.getState().errors).toBe(1);
    expect(flat(screen.getByTestId('cell-0-1').props.style).backgroundColor).toBe('#9B3B2E');
  });

  it('does NOT mark a wrong fill in Classic mode with the warning-red cell', () => {
    render(<PuzzleGrid puzzle={TARGET} mode="classic" onWin={() => {}} />);
    fireEvent.press(screen.getByTestId('cell-0-1')); // target 0 -> wrong fill, but Classic hides it
    expect(useUiStore.getState().errors).toBe(1);
    expect(flat(screen.getByTestId('cell-0-1').props.style).backgroundColor).not.toBe('#9B3B2E');
  });

  it('reports progress toward the solution when onProgressChange is given', () => {
    const onProgressChange = jest.fn();
    render(<PuzzleGrid puzzle={TARGET} mode="cozy" onWin={() => {}} onProgressChange={onProgressChange} />);
    onProgressChange.mockClear();
    fireEvent.press(screen.getByTestId('cell-0-0')); // 1 of 2 target cells correct
    expect(onProgressChange).toHaveBeenLastCalledWith(0.5);
  });
});
