import { render, screen, fireEvent } from '@testing-library/react-native';
import { PuzzleCard } from '@/components/molecules';

describe('PuzzleCard', () => {
  it('hides the name as ??? when unsolved and shows the sighting number', () => {
    render(<PuzzleCard puzzleNumber={1} puzzleName="The Roadside Encounter" size="8x8" tier="Easy" isSolved={false} onPress={() => {}} testID="card" />);
    expect(screen.getByText('???')).toBeTruthy();
    expect(screen.getByText(/SIGHTING\s*001/)).toBeTruthy();
    expect(screen.queryByText('The Roadside Encounter')).toBeNull();
  });

  it('reveals the name, a check, and the best time when solved', () => {
    render(<PuzzleCard puzzleNumber={14} puzzleName="The Colony" size="10x8" tier="Medium" isSolved bestTime={75} bestMistakes={1} onPress={() => {}} testID="card" />);
    expect(screen.getByText('The Colony')).toBeTruthy();
    expect(screen.getByText(/01:15/)).toBeTruthy();
    expect(screen.getByTestId('card-check')).toBeTruthy();
  });

  it('renders a tier badge and calls onPress', () => {
    const onPress = jest.fn();
    render(<PuzzleCard puzzleNumber={2} puzzleName="???" size="5x5" tier="Expert" isSolved={false} onPress={onPress} testID="card" />);
    expect(screen.getByText('Expert')).toBeTruthy();
    fireEvent.press(screen.getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows best time without mistakes count when bestMistakes is undefined', () => {
    render(<PuzzleCard puzzleNumber={3} puzzleName="Solved Puzzle" size="8x10" tier="Hard" isSolved bestTime={125} onPress={() => {}} testID="card" />);
    expect(screen.getByText(/02:05/)).toBeTruthy();
    expect(screen.queryByText(/mistakes/)).toBeNull();
    expect(screen.getByTestId('card-check')).toBeTruthy();
  });
});
