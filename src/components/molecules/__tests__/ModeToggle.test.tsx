import { render, screen, fireEvent } from '@testing-library/react-native';
import { ModeToggle } from '@/components/molecules';

describe('ModeToggle', () => {
  it('renders both modes', () => {
    render(<ModeToggle mode="cozy" onChange={() => {}} testID="mode" />);
    expect(screen.getByText('Cozy')).toBeTruthy();
    expect(screen.getByText('Classic')).toBeTruthy();
  });

  it('marks the active mode selected for accessibility', () => {
    render(<ModeToggle mode="cozy" onChange={() => {}} testID="mode" />);
    expect(screen.getByTestId('mode-cozy').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('mode-classic').props.accessibilityState.selected).toBe(false);
  });

  it('calls onChange when the other mode is tapped', () => {
    const onChange = jest.fn();
    render(<ModeToggle mode="cozy" onChange={onChange} testID="mode" />);
    fireEvent.press(screen.getByTestId('mode-classic'));
    expect(onChange).toHaveBeenCalledWith('classic');
  });
});
