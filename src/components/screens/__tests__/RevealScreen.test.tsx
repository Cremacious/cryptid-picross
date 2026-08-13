import { render, screen, fireEvent } from '@testing-library/react-native';
import { RevealScreen } from '@/components/screens';
import { buildPuzzle } from '@/content/buildPuzzle';
import type { FieldEntry, PuzzleMetadata } from '@/engine';

const entry: FieldEntry = { title: 'THE CROSSING · CASE 001', body: 'A shape at the crossing.', voiceStyle: 'notebook' };
const metadata: PuzzleMetadata = { regionId: 'pnw', order: 1, isCapstone: false };
const easyPuzzle = buildPuzzle({ id: 'r1', name: 'The Crossing', subtitle: 'Field Test', grid: [[1, 0], [0, 1]], entry, metadata });

describe('RevealScreen', () => {
  it('renders the confirmed stamp, polaroid caption, and case file', () => {
    render(<RevealScreen puzzle={easyPuzzle} onBackToSelection={() => {}} testID="reveal" />);
    expect(screen.getByText('Sighting Confirmed')).toBeTruthy();
    expect(screen.getByText(/The Crossing/)).toBeTruthy();
    expect(screen.getByText('THE CROSSING · CASE 001')).toBeTruthy();
    expect(screen.getByText('A shape at the crossing.')).toBeTruthy();
  });

  it('shows a new-best callout when isNewBest and bestTime are given', () => {
    render(<RevealScreen puzzle={easyPuzzle} bestTime={75} isNewBest onBackToSelection={() => {}} testID="reveal" />);
    expect(screen.getByText(/New Best · 01:15/)).toBeTruthy();
  });

  it('always offers Back to the List and calls it', () => {
    const onBackToSelection = jest.fn();
    render(<RevealScreen puzzle={easyPuzzle} onBackToSelection={onBackToSelection} testID="reveal" />);
    fireEvent.press(screen.getByTestId('reveal-back'));
    expect(onBackToSelection).toHaveBeenCalledTimes(1);
  });

  it('shows Next Sighting only when onNext is given, and calls it', () => {
    const onNext = jest.fn();
    const { rerender } = render(<RevealScreen puzzle={easyPuzzle} onBackToSelection={() => {}} testID="reveal" />);
    expect(screen.queryByTestId('reveal-next')).toBeNull(); // last puzzle: no next
    rerender(<RevealScreen puzzle={easyPuzzle} onNext={onNext} onBackToSelection={() => {}} testID="reveal" />);
    fireEvent.press(screen.getByTestId('reveal-next'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
