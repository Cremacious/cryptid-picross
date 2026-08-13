import { render, screen, fireEvent } from '@testing-library/react-native';
import Home from '@/app/index';
import { useProgressStore } from '@/state';

jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light' } }));

describe('Home main menu', () => {
  beforeEach(() => {
    useProgressStore.getState().hydrate({ solved: {}, onboardingCompleted: true, firstLaunchAt: 0 });
  });

  it('renders the main menu with Begin + Settings, no Continue without history', () => {
    render(<Home />);
    expect(screen.getByTestId('home-screen')).toBeTruthy();
    expect(screen.getByTestId('menu-begin')).toBeTruthy();
    expect(screen.getByTestId('menu-settings')).toBeTruthy();
    expect(screen.queryByTestId('menu-continue')).toBeNull();
  });

  it('shows Continue once a puzzle has been played', () => {
    useProgressStore.getState().markSolved('sample-plus', { time: 20, mistakes: 0 });
    render(<Home />);
    expect(screen.getByTestId('menu-continue')).toBeTruthy();
  });
});
