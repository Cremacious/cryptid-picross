import { render, screen, fireEvent } from '@testing-library/react-native';
import { RevealScreen } from '@/components/screens';
import { buildPuzzle } from '@/content/buildPuzzle';
import type { FieldEntry, PuzzleMetadata } from '@/engine';

const entry: FieldEntry = { title: 'THE CROSSING · CASE 001', body: 'A shape at the crossing.', voiceStyle: 'notebook' };
const metadata: PuzzleMetadata = { regionId: 'pnw', order: 1, isCapstone: false };
const easyPuzzle = buildPuzzle({ id: 'r1', name: 'The Crossing', subtitle: 'Field Test', grid: [[1, 0], [0, 1]], entry, metadata });

describe('RevealScreen', () => {
  it('renders the confirmed stamp, polaroid caption, and case file', () => {
    render(<RevealScreen puzzle={easyPuzzle} onAddToGuide={() => {}} testID="reveal" />);
    expect(screen.getByText('Sighting Confirmed')).toBeTruthy();
    expect(screen.getByText(/The Crossing/)).toBeTruthy();
    expect(screen.getByText('THE CROSSING · CASE 001')).toBeTruthy();
    expect(screen.getByText('A shape at the crossing.')).toBeTruthy();
  });

  it('shows a new-best callout when isNewBest and bestTime are given', () => {
    render(<RevealScreen puzzle={easyPuzzle} bestTime={75} isNewBest onAddToGuide={() => {}} testID="reveal" />);
    expect(screen.getByText(/New Best · 01:15/)).toBeTruthy();
  });

  it('does not show the new-best callout without isNewBest', () => {
    render(<RevealScreen puzzle={easyPuzzle} bestTime={75} onAddToGuide={() => {}} testID="reveal" />);
    expect(screen.queryByText(/New Best/)).toBeNull();
  });

  it('calls onAddToGuide from the button', () => {
    const onAddToGuide = jest.fn();
    render(<RevealScreen puzzle={easyPuzzle} onAddToGuide={onAddToGuide} testID="reveal" />);
    fireEvent.press(screen.getByTestId('reveal-add'));
    expect(onAddToGuide).toHaveBeenCalledTimes(1);
  });
});
