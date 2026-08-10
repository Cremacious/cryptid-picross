import AsyncStorage from '@react-native-async-storage/async-storage';
import { initSaveSystem, persist, collectSaveState } from '@/state/saveManager';
import { loadSaveState } from '@/state/persistence';
import { useSettingsStore } from '@/state/settingsStore';
import { useProgressStore } from '@/state/progressStore';
import { usePurchaseStore } from '@/state/purchaseStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
  useSettingsStore.getState().hydrate({
    mode: 'cozy', soundEnabled: true, hapticsEnabled: true,
    reduceMotion: false, ambientAudioVolume: 1, effectsAudioVolume: 1,
  });
  useProgressStore.getState().hydrate({ solved: {}, onboardingCompleted: false, firstLaunchAt: 0 });
  usePurchaseStore.getState().hydrate({ ownedRegions: [], ownedPacks: [], lastRestoredAt: null, purchaseHistory: [] });
});

describe('saveManager', () => {
  it('collectSaveState reflects the live store state', () => {
    useSettingsStore.getState().setMode('classic');
    const save = collectSaveState();
    expect(save.version).toBe(1);
    expect(save.settings.mode).toBe('classic');
  });

  it('persists store changes and reloads them (full round-trip)', async () => {
    await initSaveSystem(); // registers the change handler, hydrates default
    useSettingsStore.getState().setMode('classic');
    useProgressStore.getState().markSolved('pnw-001', { time: 42, mistakes: 1 });
    usePurchaseStore.getState().grantRegion('pnw');
    await persist(); // deterministic flush

    const { state } = await loadSaveState();
    expect(state.settings.mode).toBe('classic');
    expect(state.progress.solved['pnw-001'].time).toBe(42);
    expect(state.purchases.ownedRegions).toContain('pnw');
  });

  it('coalesces a burst of un-awaited persist() calls into the freshest snapshot', async () => {
    await initSaveSystem();

    useSettingsStore.getState().setMode('classic');
    persist();
    useProgressStore.getState().markSolved('x', { time: 5, mistakes: 0 });
    persist();
    usePurchaseStore.getState().grantRegion('outback');
    persist();
    useSettingsStore.getState().setMode('cozy');
    await persist();

    const { state } = await loadSaveState();
    expect(state.settings.mode).toBe('cozy');
    expect(state.progress.solved['x'].time).toBe(5);
    expect(state.purchases.ownedRegions).toContain('outback');
  });

  it('initSaveSystem hydrates the stores from a prior save', async () => {
    const prior = collectSaveState();
    prior.settings.mode = 'classic';
    prior.purchases.ownedRegions = ['appalachia'];
    await AsyncStorage.setItem('@picross-cryptozoology/save/v1', JSON.stringify(prior));

    await initSaveSystem();
    expect(useSettingsStore.getState().mode).toBe('classic');
    expect(usePurchaseStore.getState().ownsRegion('appalachia')).toBe(true);
  });
});
