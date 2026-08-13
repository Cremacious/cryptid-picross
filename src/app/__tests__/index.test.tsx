import { render, screen } from '@testing-library/react-native';
import Home from '@/app/index';
import { useProgressStore } from '@/state';

describe('Home placeholder', () => {
  beforeEach(() => {
    useProgressStore.getState().hydrate({ solved: {}, onboardingCompleted: true, firstLaunchAt: 0 });
  });

  it('renders the themed title and prompt', async () => {
    await render(<Home />);
    expect(screen.getByTestId('home-screen')).toBeTruthy();
    expect(screen.getByText('tap to begin your investigation')).toBeTruthy();
  });
});
