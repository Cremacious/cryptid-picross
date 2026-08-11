import { render, screen, fireEvent } from '@testing-library/react-native';
import { SettingsScreen } from '@/components/screens';
import { useSettingsStore, useProgressStore } from '@/state';

beforeEach(() => {
  useSettingsStore.getState().hydrate({ mode: 'cozy', soundEnabled: true, hapticsEnabled: true, reduceMotion: false, ambientAudioVolume: 1, effectsAudioVolume: 1 });
  useProgressStore.getState().hydrate({ solved: {}, onboardingCompleted: false, firstLaunchAt: 0 });
});

describe('SettingsScreen', () => {
  it('renders the sections and the current solved count', () => {
    useProgressStore.getState().markSolved('p1', { time: 10, mistakes: 0 });
    render(<SettingsScreen onBack={() => {}} testID="settings" />);
    expect(screen.getByText(/Settings/i)).toBeTruthy();
    expect(screen.getByText('Cozy')).toBeTruthy();
    expect(screen.getByText(/1 sighting/)).toBeTruthy();
  });

  it('switches the game mode via the ModeToggle', () => {
    render(<SettingsScreen onBack={() => {}} testID="settings" />);
    fireEvent.press(screen.getByTestId('settings-mode-classic'));
    expect(useSettingsStore.getState().mode).toBe('classic');
  });

  it('toggles sound off through the store', () => {
    render(<SettingsScreen onBack={() => {}} testID="settings" />);
    fireEvent(screen.getByTestId('settings-sound-switch'), 'valueChange', false);
    expect(useSettingsStore.getState().soundEnabled).toBe(false);
  });

  it('clears progress only after a two-step confirm', () => {
    useProgressStore.getState().markSolved('p1', { time: 10, mistakes: 0 });
    render(<SettingsScreen onBack={() => {}} testID="settings" />);
    // first tap arms the confirm; does not clear
    fireEvent.press(screen.getByTestId('settings-clear'));
    expect(useProgressStore.getState().isSolved('p1')).toBe(true);
    // second tap clears
    fireEvent.press(screen.getByTestId('settings-clear'));
    expect(useProgressStore.getState().isSolved('p1')).toBe(false);
  });

  it('calls onBack from the back control', () => {
    const onBack = jest.fn();
    render(<SettingsScreen onBack={onBack} testID="settings" />);
    fireEvent.press(screen.getByTestId('settings-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
