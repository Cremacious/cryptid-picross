import { render, screen, fireEvent } from '@testing-library/react-native';
import { MainMenuScreen } from '@/components/screens';

jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light' } }));

const noop = () => {};

describe('MainMenuScreen', () => {
  it('renders the title and the Begin + Settings entries', () => {
    render(<MainMenuScreen onBegin={noop} onContinue={noop} onSettings={noop} showContinue={false} testID="menu" />);
    expect(screen.getByText(/PICROSS/i)).toBeTruthy();
    expect(screen.getByTestId('menu-begin')).toBeTruthy();
    expect(screen.getByTestId('menu-settings')).toBeTruthy();
  });

  it('hides Continue when there is no history', () => {
    render(<MainMenuScreen onBegin={noop} onContinue={noop} onSettings={noop} showContinue={false} testID="menu" />);
    expect(screen.queryByTestId('menu-continue')).toBeNull();
  });

  it('shows Continue and calls it when history exists', () => {
    const onContinue = jest.fn();
    render(<MainMenuScreen onBegin={noop} onContinue={onContinue} onSettings={noop} showContinue testID="menu" />);
    fireEvent.press(screen.getByTestId('menu-continue'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('calls onBegin and onSettings from their entries', () => {
    const onBegin = jest.fn();
    const onSettings = jest.fn();
    render(<MainMenuScreen onBegin={onBegin} onContinue={noop} onSettings={onSettings} showContinue={false} testID="menu" />);
    fireEvent.press(screen.getByTestId('menu-begin'));
    fireEvent.press(screen.getByTestId('menu-settings'));
    expect(onBegin).toHaveBeenCalledTimes(1);
    expect(onSettings).toHaveBeenCalledTimes(1);
  });
});
