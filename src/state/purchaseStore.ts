import { create } from 'zustand';
import { PurchaseStateV1 } from './saveTypes';
import { notifyChange } from './saveBus';

interface PurchaseStore extends PurchaseStateV1 {
  ownsRegion: (id: string) => boolean;
  /** True once the $4.99 all-access unlock is owned — unlocks all regions AND removes ads. */
  adsRemoved: () => boolean;
  grantRegion: (id: string, price?: string) => void;
  grantPack: (id: string, price?: string) => void;
  restore: (regions: string[], packs?: string[]) => void;
  clearAll: () => void;
  hydrate: (s: PurchaseStateV1) => void;
}

export const usePurchaseStore = create<PurchaseStore>((set, get) => ({
  ownedRegions: [],
  ownedPacks: [],
  lastRestoredAt: null,
  purchaseHistory: [],
  ownsRegion: (id) => get().ownedRegions.includes(id),
  adsRemoved: () => get().ownedPacks.includes('bundle'),
  grantRegion: (id, price) => {
    if (get().ownedRegions.includes(id)) return;
    set({
      ownedRegions: [...get().ownedRegions, id],
      purchaseHistory: [...get().purchaseHistory, { productId: id, purchasedAt: Date.now(), price }],
    });
    notifyChange();
  },
  grantPack: (id, price) => {
    if (get().ownedPacks.includes(id)) return;
    set({
      ownedPacks: [...get().ownedPacks, id],
      purchaseHistory: [...get().purchaseHistory, { productId: id, purchasedAt: Date.now(), price }],
    });
    notifyChange();
  },
  restore: (regions, packs = []) => {
    set({
      ownedRegions: Array.from(new Set(regions)),
      ownedPacks: Array.from(new Set(packs)),
      lastRestoredAt: Date.now(),
    });
    notifyChange();
  },
  clearAll: () => {
    set({ ownedRegions: [], ownedPacks: [], lastRestoredAt: null, purchaseHistory: [] });
    notifyChange();
  },
  hydrate: (s) => set({ ...s }),
}));
