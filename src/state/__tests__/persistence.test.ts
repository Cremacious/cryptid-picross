import AsyncStorage from '@react-native-async-storage/async-storage';
import { SAVE_KEY, createDefaultSaveState, loadSaveState, writeSaveState } from '@/state/persistence';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('persistence', () => {
  it('returns a default save when storage is empty (not recovered)', async () => {
    const { state, recovered } = await loadSaveState();
    expect(recovered).toBe(false);
    expect(state.version).toBe(1);
    expect(state.settings.mode).toBe('cozy');
    expect(state.progress.solved).toEqual({});
    expect(state.purchases.ownedRegions).toEqual([]);
  });

  it('round-trips a written save', async () => {
    const save = createDefaultSaveState(123);
    save.settings.mode = 'classic';
    save.progress.solved['p1'] = { time: 30, mistakes: 0, solvedAt: 1, lastPlayedAt: 1, playCount: 1 };
    await writeSaveState(save);
    const { state, recovered } = await loadSaveState();
    expect(recovered).toBe(false);
    expect(state.settings.mode).toBe('classic');
    expect(state.progress.solved['p1'].time).toBe(30);
  });

  it('recovers from corrupt JSON: backs it up, resets to default, flags recovery', async () => {
    await AsyncStorage.setItem(SAVE_KEY, '{ this is not valid json');
    const { state, recovered } = await loadSaveState();
    expect(recovered).toBe(true);
    expect(state.progress.solved).toEqual({}); // reset to default
    const keys = await AsyncStorage.getAllKeys();
    expect(keys.some((k) => k.startsWith('@picross-cryptozoology/save/corrupt/'))).toBe(true);
  });

  it('recovers from valid JSON that is not an object (null): backs it up, resets to default, flags recovery', async () => {
    await AsyncStorage.setItem(SAVE_KEY, 'null');
    const { state, recovered } = await loadSaveState();
    expect(recovered).toBe(true);
    expect(state.progress.solved).toEqual({});
    const keys = await AsyncStorage.getAllKeys();
    expect(keys.some((k) => k.startsWith('@picross-cryptozoology/save/corrupt/'))).toBe(true);
  });

  it('recovers from valid JSON that is not an object (number): resets to default', async () => {
    await AsyncStorage.setItem(SAVE_KEY, '123');
    const { state, recovered } = await loadSaveState();
    expect(recovered).toBe(true);
    expect(state.progress.solved).toEqual({});
  });
});
