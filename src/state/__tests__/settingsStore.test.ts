import { useSettingsStore } from '@/state/settingsStore';
import { notifyChange } from '@/state/saveBus';

jest.mock('@/state/saveBus', () => ({
  notifyChange: jest.fn(),
  setChangeHandler: jest.fn(),
}));

beforeEach(() => {
  (notifyChange as jest.Mock).mockClear();
  useSettingsStore.getState().hydrate({
    mode: 'cozy', soundEnabled: true, hapticsEnabled: true,
    reduceMotion: false, ambientAudioVolume: 1, effectsAudioVolume: 1,
  });
});

describe('settingsStore', () => {
  it('setMode updates state and notifies for persistence', () => {
    useSettingsStore.getState().setMode('classic');
    expect(useSettingsStore.getState().mode).toBe('classic');
    expect(notifyChange).toHaveBeenCalledTimes(1);
  });

  it('toggles sound, haptics, and reduce-motion', () => {
    useSettingsStore.getState().setSoundEnabled(false);
    useSettingsStore.getState().setHapticsEnabled(false);
    useSettingsStore.getState().setReduceMotion(true);
    const s = useSettingsStore.getState();
    expect(s.soundEnabled).toBe(false);
    expect(s.hapticsEnabled).toBe(false);
    expect(s.reduceMotion).toBe(true);
  });

  it('sets volumes and hydrates from a save slice', () => {
    useSettingsStore.getState().setAmbientVolume(0.5);
    useSettingsStore.getState().setEffectsVolume(0.25);
    expect(useSettingsStore.getState().ambientAudioVolume).toBe(0.5);
    expect(useSettingsStore.getState().effectsAudioVolume).toBe(0.25);
    useSettingsStore.getState().hydrate({
      mode: 'classic', soundEnabled: false, hapticsEnabled: false,
      reduceMotion: true, ambientAudioVolume: 0, effectsAudioVolume: 0,
    });
    expect(useSettingsStore.getState().mode).toBe('classic');
  });
});
