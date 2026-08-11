import { render, screen, fireEvent } from '@testing-library/react-native';
import { PuzzleListScreen } from '@/components/screens';
import { getSampleRegion } from '@/content/sampleRegions';
import { useProgressStore } from '@/state';
import type { Region } from '@/engine';

const PNW = getSampleRegion('pnw') as Region;

beforeEach(() => {
  useProgressStore.getState().hydrate({ solved: {}, onboardingCompleted: false, firstLaunchAt: 0 });
});

describe('PuzzleListScreen', () => {
  it('renders the region name and hides unsolved puzzle names as ???', () => {
    render(<PuzzleListScreen region={PNW} onSelectPuzzle={() => {}} onBack={() => {}} testID="list" />);
    expect(screen.getByText('The Pacific Northwest')).toBeTruthy();
    expect(screen.getAllByText('???').length).toBe(PNW.puzzles.length);
  });

  it('reveals a puzzle name once it is solved', () => {
    const first = PNW.puzzles[0];
    useProgressStore.getState().markSolved(first.id, { time: 42, mistakes: 0 });
    render(<PuzzleListScreen region={PNW} onSelectPuzzle={() => {}} onBack={() => {}} testID="list" />);
    expect(screen.getByText(first.name)).toBeTruthy();
  });

  it('calls onSelectPuzzle when a card is tapped', () => {
    const onSelectPuzzle = jest.fn();
    render(<PuzzleListScreen region={PNW} onSelectPuzzle={onSelectPuzzle} onBack={() => {}} testID="list" />);
    fireEvent.press(screen.getByTestId(`puzzle-${PNW.puzzles[0].id}`));
    expect(onSelectPuzzle).toHaveBeenCalledWith(PNW.puzzles[0].id);
  });

  it('calls onBack from the back control', () => {
    const onBack = jest.fn();
    render(<PuzzleListScreen region={PNW} onSelectPuzzle={() => {}} onBack={onBack} testID="list" />);
    fireEvent.press(screen.getByTestId('list-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
