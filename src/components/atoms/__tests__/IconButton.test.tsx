import { render, screen, fireEvent } from '@testing-library/react-native';
import { IconButton } from '@/components/atoms';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('IconButton', () => {
  it('renders with its required accessibility label and button role', () => {
    render(<IconButton icon="settings" onPress={() => {}} accessibilityLabel="Settings" testID="ib" />);
    const node = screen.getByTestId('ib');
    expect(node.props.accessibilityRole).toBe('button');
    expect(node.props.accessibilityLabel).toBe('Settings');
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<IconButton icon="back" onPress={onPress} accessibilityLabel="Back" testID="ib" />);
    fireEvent.press(screen.getByTestId('ib'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<IconButton icon="close" onPress={onPress} disabled accessibilityLabel="Close" testID="ib" />);
    fireEvent.press(screen.getByTestId('ib'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('meets the 44pt minimum touch target', () => {
    render(<IconButton icon="hint" onPress={() => {}} accessibilityLabel="Hint" testID="ib" />);
    const style = screen.getByTestId('ib').props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style.flat().filter(Boolean)) : style;
    expect(flat.width).toBeGreaterThanOrEqual(44);
    expect(flat.height).toBeGreaterThanOrEqual(44);
  });
});
