import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/atoms';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('Button', () => {
  it('renders its label', () => {
    render(<Button label="Add to Guide" onPress={() => {}} />);
    expect(screen.getByText('Add to Guide')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<Button label="Go" onPress={onPress} testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button label="Go" onPress={onPress} disabled testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a spinner and hides the label while loading', () => {
    render(<Button label="Saving" onPress={() => {}} loading testID="btn" />);
    expect(screen.queryByText('Saving')).toBeNull();
    expect(screen.getByTestId('btn-spinner')).toBeTruthy();
  });

  it('exposes an accessible button role and defaults the label', () => {
    render(<Button label="Restore" onPress={() => {}} testID="btn" />);
    const node = screen.getByTestId('btn');
    expect(node.props.accessibilityRole).toBe('button');
    expect(node.props.accessibilityLabel).toBe('Restore');
  });
});
