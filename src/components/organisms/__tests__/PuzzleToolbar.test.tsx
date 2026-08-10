import { render, screen, fireEvent } from '@testing-library/react-native';
import { PuzzleToolbar } from '@/components/organisms';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const baseProps = {
  activeTool: 'fill' as const,
  mode: 'cozy' as const,
  onToolChange: jest.fn(),
  onUndo: jest.fn(),
  onHint: jest.fn(),
  canUndo: true,
  hintCount: 3,
};

describe('PuzzleToolbar', () => {
  it('renders the four core tools', () => {
    render(<PuzzleToolbar {...baseProps} />);
    expect(screen.getByTestId('tool-fill')).toBeTruthy();
    expect(screen.getByTestId('tool-mark')).toBeTruthy();
    expect(screen.getByTestId('tool-undo')).toBeTruthy();
    expect(screen.getByTestId('tool-hint')).toBeTruthy();
  });

  it('switches tool when Mark is tapped', () => {
    const onToolChange = jest.fn();
    render(<PuzzleToolbar {...baseProps} onToolChange={onToolChange} />);
    fireEvent.press(screen.getByTestId('tool-mark'));
    expect(onToolChange).toHaveBeenCalledWith('mark');
  });

  it('does not undo when canUndo is false', () => {
    const onUndo = jest.fn();
    render(<PuzzleToolbar {...baseProps} canUndo={false} onUndo={onUndo} />);
    fireEvent.press(screen.getByTestId('tool-undo'));
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('shows the hint count and disables hint at zero', () => {
    const onHint = jest.fn();
    render(<PuzzleToolbar {...baseProps} hintCount={0} onHint={onHint} />);
    fireEvent.press(screen.getByTestId('tool-hint'));
    expect(onHint).not.toHaveBeenCalled();
  });

  it('shows Check My Work only in Classic mode and calls it', () => {
    const onCheckWork = jest.fn();
    const { rerender } = render(<PuzzleToolbar {...baseProps} mode="cozy" onCheckWork={onCheckWork} />);
    expect(screen.queryByTestId('tool-check')).toBeNull();
    rerender(<PuzzleToolbar {...baseProps} mode="classic" onCheckWork={onCheckWork} />);
    fireEvent.press(screen.getByTestId('tool-check'));
    expect(onCheckWork).toHaveBeenCalledTimes(1);
  });
});
