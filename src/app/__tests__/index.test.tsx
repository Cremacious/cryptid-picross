import { render, screen } from '@testing-library/react-native';
import Home from '@/app/index';

describe('Home placeholder', () => {
  it('renders the themed title and prompt', async () => {
    await render(<Home />);
    expect(screen.getByTestId('home-screen')).toBeTruthy();
    expect(screen.getByText('tap to begin your investigation')).toBeTruthy();
  });
});
