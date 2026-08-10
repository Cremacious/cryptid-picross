import AsyncStorage from '@react-native-async-storage/async-storage';
import { SaveStateV1 } from './saveTypes';

export const SAVE_KEY = '@picross-cryptozoology/save/v1';
const CORRUPT_PREFIX = '@picross-cryptozoology/save/corrupt/';

export function createDefaultSaveState(now: number = Date.now()): SaveStateV1 {
  return {
    version: 1,
    savedAt: now,
    progress: { solved: {}, onboardingCompleted: false, firstLaunchAt: now },
    settings: {
      mode: 'cozy',
      soundEnabled: true,
      hapticsEnabled: true,
      reduceMotion: false,
      ambientAudioVolume: 1,
      effectsAudioVolume: 1,
    },
    purchases: { ownedRegions: [], ownedPacks: [], lastRestoredAt: null, purchaseHistory: [] },
  };
}

/**
 * Load the save. Empty storage -> fresh default. Corrupt JSON -> back up the
 * bad string, return a default, and flag recovery so the UI can apologize.
 * (Future save versions migrate here before returning.)
 */
export async function loadSaveState(): Promise<{ state: SaveStateV1; recovered: boolean }> {
  const raw = await AsyncStorage.getItem(SAVE_KEY);
  if (raw == null) return { state: createDefaultSaveState(), recovered: false };
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) throw new Error('non-object save');
    return { state: parsed as SaveStateV1, recovered: false };
  } catch {
    try {
      await AsyncStorage.setItem(CORRUPT_PREFIX + String(Date.now()), raw);
    } catch {
      // best-effort backup; never throw from load
    }
    return { state: createDefaultSaveState(), recovered: true };
  }
}

export async function writeSaveState(state: SaveStateV1): Promise<void> {
  const toWrite: SaveStateV1 = { ...state, savedAt: Date.now() };
  await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(toWrite));
}
