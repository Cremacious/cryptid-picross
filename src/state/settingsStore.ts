import { create } from 'zustand';
import { SettingsStateV1 } from './saveTypes';
import { notifyChange } from './saveBus';

interface SettingsStore extends SettingsStateV1 {
  setMode: (mode: 'cozy' | 'classic') => void;
  setSoundEnabled: (v: boolean) => void;
  setHapticsEnabled: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setAmbientVolume: (v: number) => void;
  setEffectsVolume: (v: number) => void;
  hydrate: (s: SettingsStateV1) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  mode: 'cozy',
  soundEnabled: true,
  hapticsEnabled: true,
  reduceMotion: false,
  ambientAudioVolume: 1,
  effectsAudioVolume: 1,
  setMode: (mode) => { set({ mode }); notifyChange(); },
  setSoundEnabled: (soundEnabled) => { set({ soundEnabled }); notifyChange(); },
  setHapticsEnabled: (hapticsEnabled) => { set({ hapticsEnabled }); notifyChange(); },
  setReduceMotion: (reduceMotion) => { set({ reduceMotion }); notifyChange(); },
  setAmbientVolume: (ambientAudioVolume) => { set({ ambientAudioVolume }); notifyChange(); },
  setEffectsVolume: (effectsAudioVolume) => { set({ effectsAudioVolume }); notifyChange(); },
  hydrate: (s) => set({ ...s }),
}));
