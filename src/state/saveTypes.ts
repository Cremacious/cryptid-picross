export interface SolvedEntry {
  time: number; // best solve time in seconds
  mistakes: number; // wrong fills on the best run
  solvedAt: number; // Unix ms of first solve
  lastPlayedAt: number; // Unix ms of most recent play
  playCount: number; // total times solved
}

export interface ProgressStateV1 {
  solved: Record<string, SolvedEntry>; // key = puzzle id
  onboardingCompleted: boolean;
  firstLaunchAt: number;
}

export interface SettingsStateV1 {
  mode: 'cozy' | 'classic';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  reduceMotion: boolean;
  ambientAudioVolume: number; // 0..1
  effectsAudioVolume: number; // 0..1
}

export interface PurchaseHistoryEntry {
  productId: string;
  purchasedAt: number;
  price?: string;
}

export interface PurchaseStateV1 {
  ownedRegions: string[];
  ownedPacks: string[];
  lastRestoredAt: number | null;
  purchaseHistory: PurchaseHistoryEntry[];
}

export interface SaveStateV1 {
  version: 1;
  savedAt: number; // Unix ms
  progress: ProgressStateV1;
  settings: SettingsStateV1;
  purchases: PurchaseStateV1;
}
