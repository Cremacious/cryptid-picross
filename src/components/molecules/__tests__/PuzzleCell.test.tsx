import { render, screen, fireEvent } from '@testing-library/react-native';
import { PuzzleCell } from '@/components/molecules';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const flat = (s: unknown) =>
  Array.isArray(s) ? Object.assign({}, ...(s as unknown[]).flat().filter(Boolean)) : (s as Record<string, unknown>);

describe('PuzzleCell', () => {
  it('renders an empty cell with the paper-cream fill', () => {
    render(<PuzzleCell state={0} size={24} onPress={() => {}} testID="cell" />);
    expect(flat(screen.getByTestId('cell').props.style).backgroundColor).toBe('#F1E8D3');
  });

  it('renders a filled cell with ink', () => {
    render(<PuzzleCell state={1} size={24} onPress={() => {}} testID="cell" />);
    expect(flat(screen.getByTestId('cell').props.style).backgroundColor).toBe('#2B241B');
  });

  it('renders a marked cell with an × glyph', () => {
    render(<PuzzleCell state={2} size={24} onPress={() => {}} testID="cell" />);
    expect(screen.getByText('×')).toBeTruthy();
  });

  it('renders a wrong cell with the warning red fill (Cozy mode)', () => {
    render(<PuzzleCell state={1} isWrong size={24} onPress={() => {}} testID="cell" />);
    expect(flat(screen.getByTestId('cell').props.style).backgroundColor).toBe('#9B3B2E');
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<PuzzleCell state={0} size={24} onPress={onPress} testID="cell" />);
    fireEvent.press(screen.getByTestId('cell'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes its accessibility label', () => {
    render(<PuzzleCell state={1} size={24} onPress={() => {}} accessibilityLabel="row 1, column 1, filled" testID="cell" />);
    expect(screen.getByTestId('cell').props.accessibilityLabel).toBe('row 1, column 1, filled');
  });
});
