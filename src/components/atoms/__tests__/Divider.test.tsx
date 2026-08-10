import { render, screen } from '@testing-library/react-native';
import { Divider } from '@/components/atoms';

const flatten = (s: unknown) =>
  Array.isArray(s) ? Object.assign({}, ...(s as unknown[]).flat().filter(Boolean)) : (s as Record<string, unknown>);

describe('Divider', () => {
  it('defaults to a dashed line', () => {
    render(<Divider testID="d" />);
    expect(flatten(screen.getByTestId('d').props.style).borderStyle).toBe('dashed');
  });

  it('supports a solid variant', () => {
    render(<Divider testID="d" variant="solid" />);
    expect(flatten(screen.getByTestId('d').props.style).borderStyle).toBe('solid');
  });

  it('renders two lines for the double variant', () => {
    render(<Divider testID="d" variant="double" />);
    expect(screen.getByTestId('d-line-2')).toBeTruthy();
  });
});
