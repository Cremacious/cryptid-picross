import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { PaperSurface } from '@/components/atoms';

describe('PaperSurface', () => {
  it('renders its children', () => {
    render(
      <PaperSurface testID="surface">
        <Text>inside</Text>
      </PaperSurface>,
    );
    expect(screen.getByTestId('surface')).toBeTruthy();
    expect(screen.getByText('inside')).toBeTruthy();
  });

  it('applies a warm shadow when elevated', () => {
    render(<PaperSurface testID="surface" elevated />);
    const style = screen.getByTestId('surface').props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style.flat()) : style;
    expect(flat.shadowColor).toBe('#8A7443');
  });

  it('renders a region tint overlay when regionTint is set', () => {
    render(<PaperSurface testID="surface" regionTint="#5D6B4E" />);
    expect(screen.getByTestId('tint-overlay')).toBeTruthy();
  });
});
