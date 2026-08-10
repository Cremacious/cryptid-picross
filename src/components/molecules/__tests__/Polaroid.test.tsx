import { render, screen } from '@testing-library/react-native';
import { Polaroid } from '@/components/molecules';
import type { Grid } from '@/engine';

const GRID: Grid = [
  [1, 0],
  [0, 1],
];

describe('Polaroid', () => {
  it('renders the caption and the pixel-art container', () => {
    render(<Polaroid grid={GRID} caption="Mothman · Silver Bridge" testID="polaroid" />);
    expect(screen.getByText('Mothman · Silver Bridge')).toBeTruthy();
    expect(screen.getByTestId('polaroid-art')).toBeTruthy();
  });

  it('renders with animateIn without crashing', () => {
    render(<Polaroid grid={GRID} caption="X" animateIn testID="polaroid" />);
    expect(screen.getByTestId('polaroid')).toBeTruthy();
  });

  it('renders in place with animateIn disabled', () => {
    render(<Polaroid grid={GRID} caption="Y" animateIn={false} testID="polaroid" />);
    expect(screen.getByTestId('polaroid')).toBeTruthy();
  });
});
