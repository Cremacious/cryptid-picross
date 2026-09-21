import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { SettingsScreen } from '@/components/screens';
import { safeBack } from '@/utils/safeBack';
import { sampleRegions } from '@/content/sampleRegions';
import { buildRegionCatalog, restorePurchases, applyOwned } from '@/iap';

export default function SettingsRoute() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Restore is reachable here as well as on the paywall, because a player who already owns
  // the unlock never sees a paywall to restore from (playbook §4.8, Apple guideline 3.1.1).
  const onRestore = () => {
    if (busy) return;
    setBusy(true);
    setStatus(null);
    void (async () => {
      const catalog = buildRegionCatalog(sampleRegions.map((r) => r.id));
      const result = await restorePurchases({ catalog });
      if (result.outcome === 'success') {
        applyOwned(result.owned);
        const restored = (result.owned?.packs.length ?? 0) > 0;
        setStatus(restored ? 'Purchases restored.' : 'No previous purchases found.');
      } else if (result.outcome === 'error') {
        setStatus(result.message ?? 'Restore failed.');
      }
      setBusy(false);
    })();
  };

  return (
    <SettingsScreen
      onBack={() => safeBack(router, '/')}
      onRestore={onRestore}
      restoreStatus={status}
      restoreBusy={busy}
    />
  );
}
