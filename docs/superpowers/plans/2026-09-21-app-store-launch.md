# Picross: Cryptozoology v1.0 App Store Launch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get Picross: Cryptozoology to "production build sitting in TestFlight, tested, ready to submit" — no ads, a $1.99 all-access unlock, iPhone only — parked behind DoughMate's approval.

**Architecture:** Tasks 1–7 are repo changes verified by the existing Jest suite. Tasks 8–14 are dashboard and store operations that Chris performs; Claude supplies the exact click path and verifies anything that lands back in the repo. The ads layer is deleted wholesale rather than disabled, so no ad SDK ships in the binary and the privacy questionnaire shrinks accordingly.

**Tech Stack:** Expo SDK 57 / React Native 0.86, expo-router, Zustand, `react-native-purchases` (RevenueCat), Jest + `@testing-library/react-native`, EAS Build/Submit.

**Spec:** `docs/superpowers/specs/2026-09-21-app-store-launch-design.md`
**Procedure reference:** `/home/chris/Code/app-launch/README.md` (the DoughMate playbook). Section marks below (§1.9, §4.8, ...) point into it.

## Global Constraints

- **Never change these identifiers** — they are permanent or already live in dashboards:
  `app.picrosscryptozoology` (bundle id), `bundle.all` (IAP product id, Non-Consumable),
  `bundle` (RevenueCat entitlement), `default` (offering), `appl_RSatTAWNpxHgDqgpRkxUOquSibF`
  (RevenueCat iOS SDK key), `WUTKJ9KNVQ` (Apple Team ID),
  `cd62e744-d6aa-454e-ae24-67d4ba0af97b` (EAS project id).
- **Price is `$1.99`** everywhere it appears in copy or fallbacks. The live price comes from
  StoreKit at runtime; repo strings are fallback-only.
- **No ads.** After Task 3 there must be zero matches for
  `grep -rn "@/ads\|adsRemoved\|google-mobile-ads\|tracking-transparency" src/ app.json package.json`.
- **Version stays `1.0.0`.** Build numbers are set remotely (`eas.json` → `appVersionSource: remote`).
- **Test baseline:** 60 suites / 290 tests pass today. Task 1 **adds** 1 suite and 4 tests
  (61 / 294). Tasks 2–3 then remove the 2 ads suites (10 tests) and the 1 `adsRemoved` case,
  landing at **59 suites / 283 tests**, which is the number every later task should see.
  Any other count means something was removed that shouldn't have been.
- **Run every `eas` command from `/home/chris/Code/cryptid-picross`** (§8.6).
- Commit after each task. Never commit `node_modules`.

---

## File Structure

**Created**
- `src/iap/catalog.ts` — single definition of the product id plus a catalog builder, so the paywall and settings routes cannot drift apart on `bundle.all`.
- `docs/support.md` — the Support URL page Apple requires.
- `.nojekyll` (repo root or `docs/`) — stops GitHub Pages running Jekyll.

**Modified**
- `src/components/screens/SettingsScreen.tsx` — gains a real `onRestore` prop; loses the ad-privacy block.
- `src/app/settings.tsx` — performs the actual restore.
- `src/app/paywall/[id].tsx` — consumes the shared catalog.
- `src/app/_layout.tsx`, `src/app/reveal/[id].tsx` — lose their `@/ads` calls.
- `src/state/purchaseStore.ts` — loses `adsRemoved()`.
- `src/iap/mockPurchases.ts`, `src/iap/index.ts`, `src/iap/purchases.native.ts` — price fallback, exports, doc comment.
- `app.json`, `package.json`, `eas.json` — config.
- `docs/privacy-policy.md`, `docs/app-store-listing.md`, `docs/LAUNCH.md`, `docs/EAS_BUILD.md`.

**Deleted**
- `src/ads/` entirely (8 source files + 2 test files).

---

## Task 1: Wire Settings → Restore Purchases to the real IAP layer

**Why this is first:** it is a genuine defect, not cleanup. `SettingsScreen.onRestore` is an
empty stub (`src/components/screens/SettingsScreen.tsx:51-54`) whose comment says real wiring
"lands with RevenueCat" — it never did. Tapping the button does nothing, silently. Apple
Guideline 3.1.1 requires a working restore for non-consumables, and playbook §4.8 calls for it
to be reachable outside the paywall. A reviewer who taps a dead button is a rejection risk.

**Files:**
- Create: `src/iap/catalog.ts`
- Create: `src/iap/__tests__/catalog.test.ts`
- Modify: `src/iap/index.ts`
- Modify: `src/components/screens/SettingsScreen.tsx:10-13` (props), `:37-38` (selector), `:51-54` (stub), `:96-99` (button block)
- Modify: `src/app/settings.tsx` (whole file)
- Modify: `src/app/paywall/[id].tsx:20-23` (local const), `:34-39` (catalog memo)
- Test: `src/components/screens/__tests__/SettingsScreen.test.tsx`

**Interfaces:**
- Consumes: `RegionCatalog` from `src/iap/types.ts` — `{ allRegionIds: string[]; bundleProductId: string }`.
  `restorePurchases({ catalog }): Promise<PurchaseResult>` and
  `applyOwned(owned: OwnedSet | undefined): void` from `@/iap` — note `applyOwned` already tolerates
  `undefined` and only ever grants, never replaces, so a restore that comes back empty cannot wipe
  existing ownership.
- Produces: `BUNDLE_PRODUCT_ID: string` and `buildRegionCatalog(allRegionIds: string[]): RegionCatalog`,
  both exported from `@/iap`. `SettingsScreenProps` gains `onRestore?: () => void`.

> **Layering note:** `buildRegionCatalog` takes region ids as a parameter rather than importing
> `@/content`. The `iap` module must not depend on `content` — routes already import both and
> pass the ids in.

- [ ] **Step 1: Write the failing catalog test**

Create `src/iap/__tests__/catalog.test.ts`:

```ts
import { BUNDLE_PRODUCT_ID, buildRegionCatalog } from '@/iap';

describe('IAP catalog', () => {
  it('pins the all-access product id to the App Store Connect product', () => {
    expect(BUNDLE_PRODUCT_ID).toBe('bundle.all');
  });

  it('builds a catalog whose bundle product is the all-access product', () => {
    const catalog = buildRegionCatalog(['pnw', 'appalachia']);
    expect(catalog).toEqual({
      allRegionIds: ['pnw', 'appalachia'],
      bundleProductId: 'bundle.all',
    });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest src/iap/__tests__/catalog.test.ts`
Expected: FAIL — `"@/iap" has no exported member 'BUNDLE_PRODUCT_ID'`.

- [ ] **Step 3: Create the catalog module**

Create `src/iap/catalog.ts`:

```ts
import { RegionCatalog } from './types';

/**
 * The single all-access non-consumable. This string must match the Product ID in App Store
 * Connect character-for-character — a mismatch means purchases succeed and nothing unlocks.
 * Apple product ids are permanent and cannot be renamed after creation.
 */
export const BUNDLE_PRODUCT_ID = 'bundle.all';

/**
 * Build the catalog the IAP layer uses to map an entitlement back to region ids. Region ids
 * are passed in rather than imported so this module stays free of any `@/content` dependency.
 */
export function buildRegionCatalog(allRegionIds: string[]): RegionCatalog {
  return { allRegionIds, bundleProductId: BUNDLE_PRODUCT_ID };
}
```

Add to `src/iap/index.ts`, directly beneath the existing `export * from './types';` line:

```ts
export { BUNDLE_PRODUCT_ID, buildRegionCatalog } from './catalog';
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx jest src/iap/__tests__/catalog.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Write the failing SettingsScreen test**

Append inside the existing `describe('SettingsScreen', ...)` block in
`src/components/screens/__tests__/SettingsScreen.test.tsx`:

```tsx
  it('invokes onRestore when Restore Purchases is pressed', () => {
    const onRestore = jest.fn();
    render(<SettingsScreen onBack={() => {}} onRestore={onRestore} testID="settings" />);
    fireEvent.press(screen.getByTestId('settings-restore'));
    expect(onRestore).toHaveBeenCalledTimes(1);
  });

  it('shows restore status text when one is supplied', () => {
    render(<SettingsScreen onBack={() => {}} restoreStatus="Purchases restored." testID="settings" />);
    expect(screen.getByText('Purchases restored.')).toBeTruthy();
  });
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx jest src/components/screens/__tests__/SettingsScreen.test.tsx`
Expected: FAIL — `onRestore` is not called (the stub swallows the press), and no status text renders.

- [ ] **Step 7: Make SettingsScreen presentational**

In `src/components/screens/SettingsScreen.tsx`, replace the props interface (lines 10-13):

```tsx
export interface SettingsScreenProps {
  onBack: () => void;
  /** Runs the real store restore. Supplied by the settings route. */
  onRestore?: () => void;
  /** Result message from the last restore attempt, shown beneath the button. */
  restoreStatus?: string | null;
  /** Disables the restore button while a restore is in flight. */
  restoreBusy?: boolean;
  testID?: string;
}
```

Change the component signature (line 25) to:

```tsx
export function SettingsScreen({ onBack, onRestore, restoreStatus, restoreBusy, testID }: SettingsScreenProps) {
```

Delete the `onRestore` stub (lines 51-54) entirely — the prop replaces it.

Replace the Purchases block (lines 96-99) with:

```tsx
      <PaperSurface variant="aged" padding="md">
        <SectionLabel>Purchases</SectionLabel>
        <Button
          label={restoreBusy ? 'Restoring…' : 'Restore Purchases'}
          variant="secondary"
          fullWidth
          disabled={restoreBusy}
          onPress={onRestore}
          testID="settings-restore"
        />
        {restoreStatus ? (
          <Text
            testID="settings-restore-status"
            style={{ fontFamily: typography.fontFamily.body, fontSize: typography.size.sm, color: colors.ink.faded, textAlign: 'center', marginTop: spacing.sm }}
          >
            {restoreStatus}
          </Text>
        ) : null}
      </PaperSurface>
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx jest src/components/screens/__tests__/SettingsScreen.test.tsx`
Expected: PASS.

- [ ] **Step 9: Do the real restore in the settings route**

Replace the whole of `src/app/settings.tsx`:

```tsx
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
```

- [ ] **Step 10: Point the paywall at the shared catalog**

In `src/app/paywall/[id].tsx`, delete the local constant and its comment (lines 20-23), add
`BUNDLE_PRODUCT_ID` and `buildRegionCatalog` to the existing `from '@/iap'` import, and replace
the `catalog` memo (lines 34-39) with:

```tsx
  const catalog: RegionCatalog = useMemo(
    () => buildRegionCatalog(sampleRegions.map((r) => r.id)),
    [],
  );
```

Every other `BUNDLE_PRODUCT_ID` reference in the file now resolves to the import. Confirm
`sampleRegions` is already imported in this file; if only `getSampleRegion` is imported, add
`sampleRegions` to that import.

- [ ] **Step 11: Verify the whole suite and types**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -5`
Expected: tsc silent; **61 suites / 294 tests** pass (baseline 60/290, plus 1 new suite of 2 and 2 new SettingsScreen cases).

- [ ] **Step 12: Commit**

```bash
git add src/iap/catalog.ts src/iap/__tests__/catalog.test.ts src/iap/index.ts \
        src/components/screens/SettingsScreen.tsx \
        src/components/screens/__tests__/SettingsScreen.test.tsx \
        src/app/settings.tsx "src/app/paywall/[id].tsx"
git commit -m "fix(iap): make Settings → Restore Purchases actually restore

The button was an empty stub since before RevenueCat was wired, so it
silently did nothing. Apple guideline 3.1.1 requires a working restore
for non-consumables and it must be reachable outside the paywall, which
a player who already owns the unlock never sees.

Also pulls bundle.all into src/iap/catalog.ts so the paywall and settings
routes cannot drift apart on the product id."
```

---

## Task 2: Remove ads from the application code

**Files:**
- Delete: `src/ads/` (all of `index.ts`, `adsStore.ts`, `interstitialPolicy.ts`, `config.ts`, `types.ts`, `backend.ts`, `backend.native.ts`, `noopBackend.ts`, `__tests__/adsStore.test.ts`, `__tests__/interstitialPolicy.test.ts`)
- Modify: `src/app/_layout.tsx:13` (import), `:38-39` (call)
- Modify: `src/app/reveal/[id].tsx:8` (import), `:32-38` (leave helper), `:44-45` (call sites)
- Modify: `src/components/screens/SettingsScreen.tsx:8` (import), `:37-38` (selectors), `:101-112` (privacy block)
- Modify: `src/components/screens/PaywallScreen.tsx:66` (copy)
- Modify: `src/state/purchaseStore.ts:7-8` (interface), `:22` (implementation)
- Test: `src/state/__tests__/purchaseStore.test.ts:46-50` (delete case)

**Interfaces:**
- Consumes: nothing new.
- Produces: `PurchaseStore` no longer has `adsRemoved()`. Region ownership is read via
  `ownsRegion(id)` or `ownedPacks.includes('bundle')` directly, both of which already exist.

- [ ] **Step 1: Delete the ads module**

```bash
git rm -r src/ads
```

- [ ] **Step 2: Run the suite to see exactly what breaks**

Run: `npx tsc --noEmit`
Expected: FAIL — three unresolved `@/ads` imports, in `src/app/_layout.tsx`,
`src/app/reveal/[id].tsx`, and `src/components/screens/SettingsScreen.tsx`. This list is the
work queue for the next three steps.

- [ ] **Step 3: Unwire `_layout.tsx`**

Delete line 13 (`import { initAds } from '@/ads';`) and lines 38-39:

```tsx
    // No-op on web; on native for non-paying players it runs consent + preloads an ad.
    void initAds();
```

Everything else in that `useEffect` stays.

- [ ] **Step 4: Unwire `reveal/[id].tsx`**

Delete line 8 (`import { maybeShowInterstitialAfterSolve } from '@/ads';`) and the whole
`leave` helper with its comment (lines 32-38). Then simplify the two call sites so navigation
happens directly:

```tsx
    <RevealScreen
      puzzle={puzzle}
      bestTime={entry?.time}
      onNext={next ? () => router.replace(`/puzzle/${next.id}`) : undefined}
      onBackToSelection={() => safeBack(router, `/region/${regionId}`)}
    />
```

- [ ] **Step 5: Unwire `SettingsScreen.tsx`**

Delete line 8 (`import { isAdsPlatform, presentAdPrivacyOptions } from '@/ads';`) and the two
selector lines:

```tsx
  const adsRemoved = usePurchaseStore((s) => s.adsRemoved());
  const showAdPrivacy = isAdsPlatform() && !adsRemoved;
```

Delete the entire `{showAdPrivacy ? (...) : null}` block (lines 101-112). `usePurchaseStore` is
now unused in this file — remove it from the `@/state` import on line 5, leaving
`useSettingsStore, useProgressStore`.

- [ ] **Step 6: Remove the ad-free concept from the purchase store**

In `src/state/purchaseStore.ts`, delete the interface member (lines 7-8):

```ts
  /** True once the $3.99 all-access unlock is owned — unlocks all regions AND removes ads. */
  adsRemoved: () => boolean;
```

and the implementation (line 22): `adsRemoved: () => get().ownedPacks.includes('bundle'),`

- [ ] **Step 7: Drop the now-meaningless test**

In `src/state/__tests__/purchaseStore.test.ts`, delete lines 46-50:

```ts
  it('adsRemoved is true only once the bundle pack is owned', () => {
    expect(usePurchaseStore.getState().adsRemoved()).toBe(false);
    usePurchaseStore.getState().grantPack('bundle');
    expect(usePurchaseStore.getState().adsRemoved()).toBe(true);
  });
```

- [ ] **Step 8: Fix the paywall copy**

`src/components/screens/PaywallScreen.tsx:66` — the ads clause is now false:

```tsx
          One-time purchase · unlocks all 5 regions
```

- [ ] **Step 9: Verify**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -5`
Expected: tsc silent; **59 suites / 283 tests** (from 61/294: minus 2 ads suites = 10 tests, minus the 1 `adsRemoved` case).

Run: `grep -rn "@/ads\|adsRemoved" src/`
Expected: no output.

- [ ] **Step 10: Commit**

```bash
git add -A src/
git commit -m "feat(ads): remove the ad layer for the 1.0 launch

AdMob was never provisioned — app.json still held Google's test App IDs —
and shipping without ads shrinks the privacy questionnaire, drops the ATT
prompt, and removes a class of review rejection. The \$1.99 unlock is the
only monetization in 1.0.

Recoverable for a later 1.1 from commits 10d53ed and c83ae36."
```

---

## Task 3: Remove the ad dependencies and native config

**Files:**
- Modify: `app.json` (plugins, android permissions, extra)
- Modify: `package.json` (dependencies)
- Modify: `package-lock.json` (regenerated)

**Interfaces:**
- Consumes: nothing.
- Produces: an `app.json` whose `plugins` array is `["expo-router", "expo-font", "expo-splash-screen"]` and whose `extra` has no `admob` key.

- [ ] **Step 1: Strip `app.json`**

Remove the entire `react-native-google-mobile-ads` plugin entry (the array form holding the
`iosAppId` / `androidAppId` / `userTrackingUsageDescription` keys — those App IDs are Google's
**test** IDs, §5.1) and the entire `expo-tracking-transparency` plugin entry. The `plugins`
array reduces to:

```json
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-splash-screen"
    ],
```

Remove the `android.permissions` key entirely — its only entry is
`"com.google.android.gms.permission.AD_ID"`, which exists solely for ads.

Remove the `extra.admob` object. `extra` keeps `revenueCat`, `router`, and `eas` untouched.

- [ ] **Step 2: Drop the dependencies**

```bash
npm uninstall react-native-google-mobile-ads expo-tracking-transparency
```

- [ ] **Step 3: Verify nothing references them**

Run: `grep -rn "google-mobile-ads\|tracking-transparency" src/ app.json package.json`
Expected: no output.

Run: `npx tsc --noEmit && npm test 2>&1 | tail -5`
Expected: tsc silent; **59 suites / 283 tests** — unchanged from Task 2, since this task only removes config and unused packages.

- [ ] **Step 4: Confirm the Expo config still resolves**

Run: `npx expo config --type public > /dev/null && echo "config OK"`
Expected: `config OK`. This catches a malformed `app.json` immediately rather than at build time.

- [ ] **Step 5: Commit**

```bash
git add app.json package.json package-lock.json
git commit -m "build: drop the AdMob and tracking-transparency native modules

Removes the plugin blocks (which still held Google's test App IDs), the
AD_ID Android permission, and extra.admob. Both are native modules, so
this mandates a fresh production build — which 1.0 needs anyway."
```

---

## Task 4: Price to $1.99, iPad off, and the submit config

**Files:**
- Modify: `src/iap/mockPurchases.ts:11`
- Modify: `src/iap/__tests__/mockPurchases.test.ts:15,17`
- Modify: `src/components/screens/__tests__/PaywallScreen.test.tsx:10`
- Modify: `src/content/__tests__/catalog.test.tsx:19`
- Modify: `src/iap/purchases.native.ts:12`, `src/state/purchaseStore.ts:7`, `src/app/paywall/[id].tsx` (doc comment)
- Modify: `app.json` (`ios.supportsTablet`)
- Modify: `eas.json` (`submit.production.ios`)

**Interfaces:**
- Consumes: `MOCK_PRICING: StorePricing` from `src/iap/types.ts`.
- Produces: `MOCK_PRICING.unlockPrice === '$1.99'`.

> The runtime price is **not** this constant — `getStorePricing()` reads
> `pkg.product.priceString` from StoreKit (`src/iap/purchases.native.ts:56`). These strings are
> the fallback for web and unprovisioned dev builds. The authoritative change is Task 8.

- [ ] **Step 1: Update the failing expectations first**

In `src/iap/__tests__/mockPurchases.test.ts`, change the test name and assertion:

```ts
  it('returns the fixed placeholder pricing ($1.99 unlock)', async () => {
    expect(await getStorePricing({ bundleProductId: 'bundle.all' })).toEqual(MOCK_PRICING);
    expect(MOCK_PRICING.unlockPrice).toBe('$1.99');
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/iap/__tests__/mockPurchases.test.ts`
Expected: FAIL — `Expected: "$1.99"  Received: "$3.99"`.

- [ ] **Step 3: Change the constant**

`src/iap/mockPurchases.ts:11`:

```ts
export const MOCK_PRICING: StorePricing = { unlockPrice: '$1.99' };
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest src/iap/__tests__/mockPurchases.test.ts`
Expected: PASS.

- [ ] **Step 5: Update the remaining price strings**

- `src/components/screens/__tests__/PaywallScreen.test.tsx:10` — `unlockPrice: '$1.99',`
- `src/content/__tests__/catalog.test.tsx:19` — test name → `'marks two regions free and three paid (all unlocked by the single $1.99 purchase)'`
- `src/iap/purchases.native.ts:12` — doc comment → ``a single non-consumable product `bundle.all` ($1.99) attached to a "bundle"``
- `src/state/purchaseStore.ts:7` — the `adsRemoved` comment was deleted in Task 2; if any `$3.99` remains in this file, correct it to `$1.99`
- `src/app/paywall/[id].tsx` — the local `BUNDLE_PRODUCT_ID` comment was deleted in Task 1; if any `$3.99` remains in this file, correct it

Verify none are left: `grep -rn '3\.99\|4\.99' src/` → expected: no output.

- [ ] **Step 6: Turn iPad off**

`app.json` → `ios.supportsTablet`:

```json
      "supportsTablet": false,
```

This is what removes the required iPad 12.9" screenshot set. The app still runs on iPad in
iPhone-compatibility mode.

- [ ] **Step 7: Fill in the submit config**

`eas.json` → `submit.production.ios`. `ascAppId` is read during Task 8 — **leave this step
unchecked until then** and come back:

```json
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "REPLACE_WITH_NUMERIC_APPLE_ID_FROM_TASK_8",
        "appleTeamId": "WUTKJ9KNVQ"
      }
    }
  }
```

Without `ascAppId`, `eas submit` cannot locate the app record (§8.2).

⚠️ **Do not add an `appleId` field.** `eas.json` is committed to a **public** repo, and
`appleId` is the Apple Developer account login — a personal address that must not be
published. EAS prompts for it interactively, or reads the `EXPO_APPLE_ID` environment
variable. Task 12 runs the build interactively anyway (§8.1), so the prompt costs nothing.

The numeric `ascAppId` and the Team ID are **not** secrets — they appear in public Expo
configs routinely and are safe to commit.

- [ ] **Step 8: Verify**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -5 && npx expo config --type public > /dev/null && echo "config OK"`
Expected: tsc silent; **59 suites / 283 tests**; `config OK`.

- [ ] **Step 9: Commit**

```bash
git add src/ app.json eas.json
git commit -m "feat(iap): price the all-access unlock at \$1.99; drop iPad for 1.0

Repo strings are the fallback shown on web and unprovisioned dev builds —
the live price comes from StoreKit. The authoritative change is the App
Store Connect price schedule.

supportsTablet: false removes the required iPad 12.9\" screenshot set."
```

---

## Task 5: Privacy policy, support page, and GitHub Pages

**Files:**
- Modify: `docs/privacy-policy.md`
- Create: `docs/support.md`
- Create: `docs/.nojekyll`

**Inputs (confirmed 2026-09-21 — use these exact values):**
1. Contact email — **`Codemackcreations@gmail.com`**
2. Developer name — **`CodeMack`**
3. Effective date — **`2026-09-21`**

⚠️ The personal address `chrismackall3@gmail.com` must **never** appear in any published
file, this repo included. If you find it anywhere outside a gitignored path, remove it.

- [ ] **Step 1: Rewrite the privacy policy**

Resolve all 5 `[FILL IN]` markers in `docs/privacy-policy.md`: effective date (line 3), contact
email (lines 4 **and** 70 — same value), developer name (line 5), and delete the "Before
publishing" instruction blockquote (line 7) rather than filling it.

Then **delete the entire "Advertising — Google AdMob" section** and every reference to IDFA,
Advertising ID, App Tracking Transparency, personalized ads, and ad consent. Nothing in the
shipping app collects any of it any more, and an over-broad policy contradicts the App Privacy
labels declared in Task 12 — Apple cross-checks the two.

What remains: puzzle progress, settings, and purchases stored **locally on device**; purchases
processed by Apple and validated through RevenueCat; no account, no login, no analytics SDK.

- [ ] **Step 2: Write the support page**

Create `docs/support.md` — Apple requires a reachable Support URL. Substitute the real email
for `<CONTACT EMAIL>`:

```markdown
# Support — Picross: Cryptozoology

Picross: Cryptozoology is a single-player nonogram puzzle game: 400 hand-drawn puzzles
across five regions, each one hiding a cryptid to uncover.

## Contact

Questions, bug reports, and feedback: **<CONTACT EMAIL>**

I'm a solo developer and reply within a few business days. Including your device model and
iOS version helps a lot with bug reports.

## Restoring a purchase

The all-access unlock is a one-time purchase tied to your Apple ID, so it carries across
reinstalls and to your other devices.

1. Open **Settings** in the app
2. Tap **Restore Purchases**

You can also restore from the unlock screen itself. If a restore doesn't bring back a
purchase you've made, email me with the date of purchase and I'll sort it out.

## Progress and data

Puzzle progress and settings are stored **on your device only** — there's no account and no
login. Deleting the app deletes that progress, and it can't be recovered. Your purchase is
unaffected and can always be restored.

## Privacy

See the [privacy policy](privacy-policy).
```

- [ ] **Step 3: Add `.nojekyll`**

```bash
touch docs/.nojekyll
```

Empty file. It stops GitHub Pages running its Jekyll build and serving the files unpredictably.

- [ ] **Step 4: Commit and push**

```bash
git add docs/privacy-policy.md docs/support.md docs/.nojekyll
git commit -m "docs: publishable privacy policy + support page

Drops the entire AdMob/IDFA/ATT section — nothing in the 1.0 app collects
any of it, and an over-broad policy contradicts the App Privacy labels."
git push
```

- [ ] **Step 5: Enable GitHub Pages**

`Cremacious/cryptid-picross` is already **public**, so no new repo is needed. GitHub →
Settings → Pages → Source: **Deploy from a branch** → Branch `main`, folder `/docs` → Save.
Wait 1–2 minutes for the first deploy.

- [ ] **Step 6: Verify both URLs return 200**

```bash
curl -o /dev/null -s -w "%{http_code}\n" https://cremacious.github.io/cryptid-picross/privacy-policy
curl -o /dev/null -s -w "%{http_code}\n" https://cremacious.github.io/cryptid-picross/support
```

Expected: `200` twice. A 404 usually means Pages hasn't finished its first deploy, or the file
is on a branch other than `main`. Record both URLs — Task 12 pastes them into App Store Connect.

---

## Task 6: Bring the launch docs in line with reality

**Files:**
- Modify: `docs/app-store-listing.md`
- Modify: `docs/LAUNCH.md`
- Modify: `docs/EAS_BUILD.md:73`

- [ ] **Step 1: Update the listing copy**

In `docs/app-store-listing.md`:
- Description bullet: `Two regions free to play. Unlock everything — all 5 regions — with a single one-time purchase.` (drop "ad-free")
- Screenshot list item 5: `The paywall ("Unlock Everything — $1.99")`
- Age rating note: **third-party advertising is now No**; rewrite that paragraph
- Screenshot sizes: iPhone only; delete the iPad caveat, since `supportsTablet` is now false
- URLs: fill Support URL and Privacy Policy URL from Task 5
- **App Review notes** — rewrite completely, since the ads and ATT paragraph is now wrong:

```
- This is a single-player nonogram puzzle game. No account or login.
- Paywall: open a locked region (Great Lakes / Southwest / Atlantic) from the Expeditions
  screen to see the single $1.99 non-consumable "Unlock Everything" (product id bundle.all),
  which unlocks all 5 regions.
- Restore Purchases is available on the paywall and in Settings.
- No ads, no third-party advertising SDK, no tracking.
- No special demo account is required.
```

- [ ] **Step 2: Rewrite `docs/LAUNCH.md`**

It currently describes a from-zero flow that no longer matches reality — $3.99 throughout, a
whole AdMob phase (Phase 5), and a Phase 4 that says to use the App Store Connect **shared
secret**, which is wrong (RevenueCat is on StoreKit 2 and needs a `.p8` In-App Purchase Key,
§4.3). Replace the body with the audit-then-fix structure of Tasks 8–14, keeping the fixed-values
table at the top and correcting it: price `$1.99`, no AdMob rows, `supportsTablet: false`.

- [ ] **Step 3: Fix the stray price**

`docs/EAS_BUILD.md:73` — `$3.99` → `$1.99`.

Verify: `grep -rn '3\.99\|4\.99' docs/ src/ --include=*.md --include=*.ts --include=*.tsx | grep -v superpowers/specs`
Expected: no output. (The spec file legitimately records the old price as history.)

- [ ] **Step 4: Commit**

```bash
git add docs/
git commit -m "docs: relaunch runbook and listing copy for the no-ads \$1.99 build

LAUNCH.md described a from-zero flow that no longer matches: \$3.99, an
AdMob phase, and a RevenueCat step calling for the legacy shared secret
instead of a .p8 key."
```

---

## Task 7: Issue hygiene

14 issues are open, several describing finished work, and #7/#12 still say $4.99. A stale
tracker is worse than none — it will be consulted during the submission scramble.

- [ ] **Step 1: Close the ads issues as out of scope for 1.0**

```bash
for n in 9 10 11 12; do
  gh issue close "$n" --comment "Out of scope for 1.0 — shipping without ads (see docs/superpowers/specs/2026-09-21-app-store-launch-design.md). The ad layer is removed from the build; recoverable from commits 10d53ed and c83ae36 if ads return in 1.1."
done
```

- [ ] **Step 2: Close the Android issue**

```bash
gh issue close 16 --comment "Deferred — 1.0 is iOS only."
```

- [ ] **Step 3: Close the finished work**

```bash
gh issue close 2 --comment "Done — EAS project linked (79ac81b), app identity and versioning set in app.json."
gh issue close 3 --comment "Done — final icon shipped in c2c5cae."
```

- [ ] **Step 4: Correct the priced issue**

```bash
gh issue edit 7 --title "Create the \$1.99 all-access IAP product (\`bundle.all\`)"
gh issue comment 7 --body "Price is now \$1.99 (was \$3.99, originally \$4.99). The product already exists in App Store Connect from the August setup — this is a price-schedule change plus a description edit (the current description says 'remove ads', which is no longer true), not a fresh creation. See Task 8 of docs/superpowers/plans/2026-09-21-app-store-launch.md."
```

- [ ] **Step 5: Verify the remaining set**

```bash
gh issue list --state open
```

Expected: **#1, #4, #5, #6, #8, #14, #15, #17** — and nothing else. These map onto Tasks 8–14.

---

## Task 8: App Store Connect audit and fixes

**Chris drives.** Claude cannot enter Apple credentials or 2FA. Work through this in order and
report what you actually see at each step — the setup was abandoned mid-way in August, so
**verify, never assume**.

- [ ] **Step 1: Check the License Agreement banner first (§1.0)**

On the Apps page, look for a yellow *"The Apple Developer Program License Agreement has been
updated"* banner. If present, accept at [developer.apple.com/account](https://developer.apple.com/account).
This is separate from the Paid Apps Agreement and silently blocks submission at the very end —
which is why it goes first, not last.

- [ ] **Step 2: Confirm the app record**

Name `Picross: Cryptozoology`, bundle ID `app.picrosscryptozoology`. **Record the numeric
"Apple ID" from App Information — that value is the `ascAppId` that Task 4 Step 7 is waiting on.**

- [ ] **Step 3: Confirm the IAP exists and its status**

Monetization → In-App Purchases. Expected: `bundle.all`, type **Non-Consumable**.

⚠️ Its status must be **"Prepare for Submission"** or **"Missing Metadata"**. If it reads
"Waiting for Review" or "In Review", it was pushed via "Add for Review" and its metadata is
**read-only** (§1.4) — the price and description edits below will be impossible until that
submission is withdrawn. Report the status before changing anything.

- [ ] **Step 4: Change the price to $1.99 (§1.9)**

Price Schedule → ➕ → **Global Price Change** → pick the **US $1.99** base price → *Make Price
Change Now* → Confirm. The confirm step shows a 175-row table of derived per-storefront
prices — skim it; Apple's conversions are not proportional.

A price change on an IAP that has **never been released does not trigger re-review**, so this
is safe to do now.

- [ ] **Step 5: Verify the price actually saved**

⚠️ **Reload the page** and re-open **Current Price**. §1.9 records that App Store Connect
re-renders dialogs mid-interaction, so a click landing a fraction late hits nothing and reports
nothing — a price change can appear to go through and simply not have.

Expected: **$1.99**.

- [ ] **Step 6: Fix the IAP description**

It currently reads *"Unlock all 5 regions and remove ads."* The second half is now false, and
stale IAP metadata is exactly the §1.8 trap — the reviewer reads this text.

- Display Name: `Unlock Everything` (unchanged — Apple's purchase sheet shows this)
- Description: `Unlock all 5 regions.`

- [ ] **Step 7: Confirm availability**

Availability → all countries and regions.

- [ ] **Step 8: Check Agreements, Tax & Banking**

Business → Agreements, Tax, and Banking. The **Paid Apps** agreement must read **Active**, with
bank details and the W-9 complete.

If it is not Active: everything else in this plan still proceeds, but the sandbox purchase test
(Task 13) cannot run. Until it is Active, StoreKit returns zero products and RevenueCat logs
`offerings empty` (`rev.cat/why-are-offerings-empty`) — **that is expected, not a code bug.**
Do not go debugging the app over it.

- [ ] **Step 9: Report back**

Report: the Apple ID number, the IAP status, the confirmed price after reload, and the
agreement status. The Apple ID number unblocks Task 4 Step 7.

---

## Task 9: RevenueCat audit and cleanup

**Chris drives.** Project "Picross Cryptids" at [app.revenuecat.com](https://app.revenuecat.com).

- [ ] **Step 1: Confirm the App Store app and its credentials**

Bundle id `app.picrosscryptozoology`, with the green **"Valid credentials"** chip showing.

Credentials must be an **In-App Purchase Key (`.p8`)** plus Key ID and Issuer ID — *not* the
legacy App-Specific Shared Secret. RevenueCat uses StoreKit 2 (§4.3). If it is on the shared
secret, replace it. (Note: `docs/LAUNCH.md` gave the wrong advice here before Task 6 fixed it.)

- [ ] **Step 2: Confirm the entitlement**

Entitlement identifier **`bundle`**, with product **`bundle.all`** attached.

This must match `ownedFromCustomerInfo()` in `src/iap/purchases.native.ts:33`, which checks
`activeIds.has('bundle')`. A mismatch means purchases succeed and nothing unlocks.

- [ ] **Step 3: Confirm the offering**

Offering **`default`**, containing exactly one **Lifetime** package pointing at `bundle.all`.

**Hover the checkmark badge to confirm the offering is marked *current*** (§4.6). This matters
more than it looks: `getStorePricing()` and `purchaseByProductId()` both read
`offerings.current.availablePackages`. A non-current offering returns an empty array, the
paywall falls back to the mock price, and any purchase attempt reports *"That item is not
available right now."*

- [ ] **Step 4: Delete the leftover onboarding clutter**

From the abandoned August setup: the **"Picross Cryptids Pro"** entitlement and the **3 Test
Store products** (Monthly / Yearly / Lifetime). Harmless, but they make the real config hard to
read and invite a wrong-entitlement mistake later. The real setup is exactly `bundle` +
`bundle.all`.

- [ ] **Step 5: Confirm the SDK key matches the app**

API keys → the Apple/iOS **public** SDK key must still be `appl_RSatTAWNpxHgDqgpRkxUOquSibF`,
matching `app.json` → `extra.revenueCat.iosApiKey`. If it was regenerated, update `app.json`
and commit.

- [ ] **Step 6: Wire server notifications (§4.11)**

Copy RevenueCat's Apple server notification URL into App Store Connect → App Information →
**App Store Server Notifications**, for **both** Production and Sandbox. Two minutes, and it
keeps entitlements accurate on refunds and cancellations.

---

## Task 10: The two screenshot sets

These are two different things that share a word, and conflating them wastes an afternoon (§1.3, §1.10).

- [ ] **Step 1: IAP review screenshot — exactly 640×920**

RGB, **no alpha channel**, showing the paywall with the purchase button visibly active. Upload
under the IAP's own "Review Information". This is what clears its **Missing Metadata** status.

Verify before uploading:

```bash
file /path/to/iap-review.png
```

Expected: `PNG image data, 640 x 920, 8-bit/color RGB, non-interlaced`. If it says **RGBA**,
strip the alpha channel — Apple rejects alpha here.

- [ ] **Step 2: App Store screenshots — exactly 1284×2778**

iPhone only now that `supportsTablet` is false. Per §1.10 the conversion that works is: trim
the bottom sliver, scale to width, then pad the top with the app's background colour
(`#F1E8D3`).

- [ ] **Step 3: Treat the capture as a QA pass, not a chore**

§1.10's main lesson: populating the app with realistic content to photograph it is how you find
the bugs. Solve real puzzles, unlock real regions. **Fix what this turns up** before continuing.

Target shots, in upload order — **only the first 3 appear on the install sheet**:
1. A solved reveal (creature + "sighting confirmed")
2. The Expeditions region map
3. A puzzle mid-solve (clue pills + mistake hearts)
4. A creature's field-note case file
5. The paywall

- [ ] **Step 4: Verify they stuck, in order**

Upload, then **reload the page** and confirm both that they saved and that the order held.
App Store Connect silently drops uploads more often than you would expect.

---

## Task 11: App Privacy, age rating, and listing metadata

- [ ] **Step 1: App Privacy — answer Yes, then declare exactly two types**

Top-level: **"Yes, we collect data."** Do not answer No. RevenueCat ships a
`PrivacyInfo.xcprivacy` manifest declaring collection, and Apple's build processing cross-checks
your label against every bundled SDK's manifest — a mismatch gets flagged (§2.1).

| Data type | Linked to identity | Used to track | Purposes |
|---|---|---|---|
| Purchases → **Purchase History** | No | No | App Functionality, Analytics |
| Identifiers → **Device ID** | No | No | **App Functionality only** |

Changed by the ads removal, versus the playbook's AdMob-era table: **Usage Data → Advertising
Data is not declared at all**, and Device ID **loses its Third-Party Advertising purpose**.

Leave unselected: Crash Data and Performance Data (no crash or analytics SDK is initialized in
this app), **Payment Info** (StoreKit handles payment outside the app — Apple's own form says
so), and everything else. Local AsyncStorage data is not "collected" under Apple's definition
at all.

- [ ] **Step 2: Privacy Policy URL**

Paste the Task 5 URL. It must return 200.

- [ ] **Step 3: Age rating**

App Information → Age Rating. Target **4+**. **Third-party advertising: No** — changed by the
ads strip. Unrestricted Web Access: No. No violence, no mature content.

- [ ] **Step 4: Listing metadata**

Paste name, subtitle, promotional text, keywords, description, and the rewritten App Review
notes from `docs/app-store-listing.md` (Task 6). Category: Games → Puzzle. Fill the Support URL
from Task 5.

---

## Task 12: Production build

- [ ] **Step 1: Confirm `ascAppId` is in place**

Task 4 Step 7 must be complete with the real number from Task 8. Check:

```bash
grep -A4 '"ios"' eas.json
```

Expected: `appleId`, `ascAppId` (numeric, not the placeholder), and `appleTeamId`.

- [ ] **Step 2: Confirm the tree is clean and green**

```bash
npx tsc --noEmit && npm test 2>&1 | tail -5 && git status --short
```

Expected: tsc silent, 59 suites / 283 tests, no uncommitted changes.

- [ ] **Step 3: Build — interactively (§8.1, §8.6)**

From `/home/chris/Code/cryptid-picross`:

```bash
eas build --profile production --platform ios
```

Run this **in a real terminal, not through an agent** — the first production build prompts for
Apple 2FA and must be answered live.

- [ ] **Step 4: Record the real build number (§8.5)**

Read the actual value off the `Incremented buildNumber` line in the build output. Never assume
the next number — `appVersionSource: remote` means EAS decides it.

- [ ] **Step 5: Submit to App Store Connect (§8.3)**

```bash
eas submit --profile production --platform ios
```

Let EAS **generate its own** App Store Connect API key when prompted, with role **App Manager**.

- [ ] **Step 6: Wait for TestFlight processing**

5–15 minutes; an email arrives. "Submitted" here means *uploaded for processing*, not *submitted
for review* (§8.4) — Apple review has not started and will not until Task 14.

---

## Task 13: The real purchase test

**This is the gate that matters.** Everything up to here is configuration; this proves the
unlock actually works. **Requires the Paid Apps Agreement to read Active** (Task 8 Step 8) —
if it does not, park here.

- [ ] **Step 1: Create a sandbox tester**

App Store Connect → Users and Access → Sandbox → Testers → ➕. Use an email address that is
**not** your Apple ID.

- [ ] **Step 2: Install from TestFlight and sign in**

Install the Task 12 build on a physical iPhone. Sign into the sandbox account on the device
(Settings → App Store → Sandbox Account), not into the main App Store.

- [ ] **Step 3: Buy**

Open a locked region (Great Lakes, Southwest, or Atlantic) from Expeditions → the paywall
appears → confirm it reads **$1.99** (not the `$1.99` mock fallback — verify it came from the
store by checking that the price renders in the device's local currency formatting) → purchase.

Expected: all 5 regions unlock.

- [ ] **Step 4: Verify restore — both paths**

Delete the app, reinstall from TestFlight, then verify **both**:
1. Paywall → Restore Purchases → regions unlock
2. **Settings → Restore Purchases → shows "Purchases restored."** — this is the Task 1 fix, and
   the first time it has ever been exercised against a real receipt.

- [ ] **Step 5: Smoke-test the no-ads build**

Confirm what the ads removal changed: **no ATT permission prompt** appears at launch, **no
interstitial** appears after solving several puzzles, and Settings has **no "Ad Privacy
Choices" row**.

- [ ] **Step 6: Attach the build and set manual release (§1.11)**

On the 1.0 version page: attach the build → **Save**. Set **"Manually release this version"** →
**Save**. Manual release is what keeps Cryptid Picross behind DoughMate even if it is approved
first.

- [ ] **Step 7: Park here until DoughMate is approved**

---

## Task 14: Submit for review

**Do not start until DoughMate is approved.** The app and the IAP are two separate items and
both must reach "Waiting for Review" — this is the step most likely to go wrong (§1.11).

- [ ] **Step 1: Re-read the IAP metadata against the shipped build (§1.8)**

Metadata goes stale. Confirm the display name (`Unlock Everything`), the description (`Unlock
all 5 regions.` — **no mention of ads**), and the review screenshot all describe the build that
is actually in TestFlight.

- [ ] **Step 2: Open the draft from the version page**

Version page → **Add for Review**. A draft panel opens showing **(1)**. **Stop here.** Do not
submit.

- [ ] **Step 3: Add the IAP to that same draft**

Go to the IAP → the **chevron** beside "Add for Review" → add to the **existing draft**.

⚠️ **Never "Create New Submission"** — that produces two competing submissions.

- [ ] **Step 4: Confirm the count, then submit**

The panel must read **Items Ready to Submit (2)**. If it reads (1), the IAP did not attach — go
back to Step 3. Then Submit for Review.

- [ ] **Step 5: Verify both items independently**

The app **and** the IAP must each read **Waiting for Review** on their own pages. Check both;
one can land without the other.

- [ ] **Step 6: If it returns Guideline 2.1 "Information Needed" (§1.12)**

Likely on an early app. It is an **information request, not a defect — do not upload a new
build.**

- Record 60–90s on a physical device, **starting from the home screen**, ending on the paid
  features working.
- Answer the questions **from the source**, so every cap and count is real.
- Keep both the reply and the Notes under **4000 characters**.
- If you already own the IAP and so could not film the payment sheet, say so explicitly in the
  reply.
- The no-ads build makes this easier than DoughMate's: there is no ATT prompt and no ad SDK to
  explain.
- Reply with the recording attached, paste the same answers into Notes → Save → version page
  **Update Review** → submission page **Resubmit to App Review**.
- Verify both items read Waiting for Review again and the count is still **(2)**.

- [ ] **Step 7: After approval**

Read the product page preview once, then press **Release**.

---

## Verification Summary

| Gate | Command / check | Expected |
|---|---|---|
| After Task 1 | `npx tsc --noEmit && npm test` | 61 suites / 294 tests |
| After Task 2 | `npm test`; `grep -rn "@/ads\|adsRemoved" src/` | 59 suites / 283 tests; no matches |
| After Task 3 | `npx expo config --type public` | resolves; no ad packages in `package.json` |
| After Task 4 | `grep -rn '3\.99\|4\.99' src/` | no matches |
| After Task 5 | `curl -o /dev/null -s -w "%{http_code}" <pages URLs>` | 200 for both |
| After Task 7 | `gh issue list --state open` | exactly #1, #4, #5, #6, #8, #14, #15, #17 |
| After Task 8 | price re-checked after a page reload | $1.99 |
| After Task 13 | sandbox buy → reinstall → restore from **both** paywall and Settings | all 5 regions unlock both ways |
| After Task 14 | app and IAP pages checked separately | both "Waiting for Review" |
