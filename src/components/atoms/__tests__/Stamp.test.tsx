import { render, screen } from '@testing-library/react-native';
import { Stamp } from '@/components/atoms';

describe('Stamp', () => {
  it('renders its text uppercased-in-style and readable', () => {
    render(<Stamp text="Sighting Confirmed" testID="stamp" />);
    expect(screen.getByText('Sighting Confirmed')).toBeTruthy();
    expect(screen.getByTestId('stamp')).toBeTruthy();
  });

  it('uses the oxblood stamp red border by default', () => {
    render(<Stamp text="Redacted" testID="stamp" />);
    const style = screen.getByTestId('stamp').props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style.flat().filter(Boolean)) : style;
    expect(flat.borderColor).toBe('#9B3B2E');
  });

  it('renders with animateIn without crashing', () => {
    render(<Stamp text="Unlocked" testID="stamp" animateIn />);
    expect(screen.getByTestId('stamp')).toBeTruthy();
  });
});
