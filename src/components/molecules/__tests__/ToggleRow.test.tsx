import { render, screen, fireEvent } from '@testing-library/react-native';
import { ToggleRow } from '@/components/molecules';

describe('ToggleRow', () => {
  it('renders its label and description', () => {
    render(<ToggleRow label="Sound" description="Ambient + effects" value onValueChange={() => {}} testID="row" />);
    expect(screen.getByText('Sound')).toBeTruthy();
    expect(screen.getByText('Ambient + effects')).toBeTruthy();
  });

  it('reflects its value on the switch', () => {
    render(<ToggleRow label="Sound" value={false} onValueChange={() => {}} testID="row" />);
    expect(screen.getByTestId('row-switch').props.value).toBe(false);
  });

  it('calls onValueChange when toggled', () => {
    const onValueChange = jest.fn();
    render(<ToggleRow label="Sound" value={false} onValueChange={onValueChange} testID="row" />);
    fireEvent(screen.getByTestId('row-switch'), 'valueChange', true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});
