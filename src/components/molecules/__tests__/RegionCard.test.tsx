import { render, screen, fireEvent } from '@testing-library/react-native';
import { RegionCard } from '@/components/molecules';
import type { Region } from '@/engine';

const REGION = {
  id: 'pnw',
  name: 'The Pacific Northwest',
  tagline: 'Where the trees watch',
  tint: '#5D6B4E',
  puzzles: [],
  totalPuzzles: 100,
  isFree: true,
} as unknown as Region;

const flat = (s: unknown) =>
  Array.isArray(s) ? Object.assign({}, ...(s as unknown[]).flat().filter(Boolean)) : (s as Record<string, unknown>);

describe('RegionCard', () => {
  it('renders the region name and progress', () => {
    render(<RegionCard region={REGION} progress={{ solved: 12, total: 100 }} isLocked={false} isComingSoon={false} onPress={() => {}} testID="card" />);
    expect(screen.getByText('The Pacific Northwest')).toBeTruthy();
    expect(screen.getByText(/12\s*\/\s*100/)).toBeTruthy();
  });

  it('dims and shows a lock affordance when locked', () => {
    render(<RegionCard region={REGION} progress={{ solved: 0, total: 100 }} isLocked isComingSoon={false} onPress={() => {}} testID="card" />);
    expect(flat(screen.getByTestId('card').props.style).opacity).toBeCloseTo(0.45, 2);
    expect(screen.getByTestId('card-lock')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<RegionCard region={REGION} progress={{ solved: 0, total: 100 }} isLocked={false} isComingSoon={false} onPress={onPress} testID="card" />);
    fireEvent.press(screen.getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
