import type {
  SaveStateV1, SolvedEntry, ProgressStateV1, SettingsStateV1, PurchaseStateV1,
} from '@/state/saveTypes';

describe('save-state schema', () => {
  it('composes into a valid v1 save object', () => {
    const solved: SolvedEntry = { time: 42, mistakes: 1, solvedAt: 1, lastPlayedAt: 2, playCount: 3 };
    const progress: ProgressStateV1 = { solved: { 'pnw-001': solved }, onboardingCompleted: true, firstLaunchAt: 0 };
    const settings: SettingsStateV1 = {
      mode: 'cozy', soundEnabled: true, hapticsEnabled: true,
      reduceMotion: false, ambientAudioVolume: 1, effectsAudioVolume: 1,
    };
    const purchases: PurchaseStateV1 = {
      ownedRegions: ['pnw'], ownedPacks: [], lastRestoredAt: null,
      purchaseHistory: [{ productId: 'pnw', purchasedAt: 10 }],
    };
    const save: SaveStateV1 = { version: 1, savedAt: 99, progress, settings, purchases };
    expect(save.version).toBe(1);
    expect(save.progress.solved['pnw-001'].time).toBe(42);
    expect(save.settings.mode).toBe('cozy');
    expect(save.purchases.ownedRegions[0]).toBe('pnw');
  });
});
