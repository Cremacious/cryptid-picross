import { usePurchaseStore } from '@/state';
import { OwnedSet } from './types';

/**
 * Merge an owned set from the IAP layer into the purchase store (which is the gate for
 * locked regions and is what gets persisted). Additive on purpose: we only ever GRANT,
 * never replace — so a restore that comes back empty can't wipe existing ownership
 * (the `restore([])` footgun that would clear ownedRegions).
 */
export function applyOwned(owned: OwnedSet | undefined): void {
  if (!owned) return;
  const store = usePurchaseStore.getState();
  owned.regions.forEach((id) => store.grantRegion(id));
  owned.packs.forEach((id) => store.grantPack(id));
}
