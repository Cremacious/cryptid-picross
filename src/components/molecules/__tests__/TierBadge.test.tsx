import { render, screen } from '@testing-library/react-native';
import { TierBadge } from '@/components/molecules';

const flat = (s: unknown) =>
  Array.isArray(s) ? Object.assign({}, ...(s as unknown[]).flat().filter(Boolean)) : (s as Record<string, unknown>);

describe('TierBadge', () => {
  it('renders the tier name in uppercase-capable text', () => {
    render(<TierBadge tier="Expert" testID="badge" />);
    expect(screen.getByText('Expert')).toBeTruthy();
  });

  it('colors Expert with the oxblood stamp red', () => {
    render(<TierBadge tier="Expert" testID="badge" />);
    expect(flat(screen.getByTestId('badge').props.style).backgroundColor).toBe('#9B3B2E');
  });

  it('colors Easy with the moss region tint', () => {
    render(<TierBadge tier="Easy" testID="badge" />);
    expect(flat(screen.getByTestId('badge').props.style).backgroundColor).toBe('#5D6B4E');
  });
});
