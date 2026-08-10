import { loadSaveState, writeSaveState } from './persistence';
import { setChangeHandler } from './saveBus';
import { SaveStateV1 } from './saveTypes';
import { useSettingsStore } from './settingsStore';
import { useProgressStore } from './progressStore';
import { usePurchaseStore } from './purchaseStore';

/** Assemble the single save object from the three live stores. */
export function collectSaveState(): SaveStateV1 {
  const s = useSettingsStore.getState();
  const p = useProgressStore.getState();
  const pur = usePurchaseStore.getState();
  return {
    version: 1,
    savedAt: Date.now(),
    settings: {
      mode: s.mode,
      soundEnabled: s.soundEnabled,
      hapticsEnabled: s.hapticsEnabled,
      reduceMotion: s.reduceMotion,
      ambientAudioVolume: s.ambientAudioVolume,
      effectsAudioVolume: s.effectsAudioVolume,
    },
    progress: { solved: p.solved, onboardingCompleted: p.onboardingCompleted, firstLaunchAt: p.firstLaunchAt },
    purchases: {
      ownedRegions: pur.ownedRegions,
      ownedPacks: pur.ownedPacks,
      lastRestoredAt: pur.lastRestoredAt,
      purchaseHistory: pur.purchaseHistory,
    },
  };
}

/** Push a loaded save's slices into the stores. */
export function hydrateFromSave(save: SaveStateV1): void {
  useSettingsStore.getState().hydrate(save.settings);
  useProgressStore.getState().hydrate(save.progress);
  usePurchaseStore.getState().hydrate(save.purchases);
}

// Coalescing writer: every call chains onto a single queue and returns the
// tail, so `await persist()` resolves only after the latest write completes
// (no race). The `dirty` flag collapses a burst of calls into one write with
// the freshest state; the `.catch` keeps a failed write from poisoning the queue.
let queue: Promise<void> = Promise.resolve();
let dirty = false;

export function persist(): Promise<void> {
  dirty = true;
  queue = queue
    .then(async () => {
      if (!dirty) return;
      dirty = false;
      await writeSaveState(collectSaveState());
    })
    .catch(() => {
      // best-effort persistence; a failed write must not break the chain
    });
  return queue;
}

/** Boot: load, hydrate, and wire the persist handler. Returns the load result. */
export async function initSaveSystem(): Promise<{ state: SaveStateV1; recovered: boolean }> {
  const result = await loadSaveState();
  hydrateFromSave(result.state);
  setChangeHandler(() => {
    void persist();
  });
  return result;
}
