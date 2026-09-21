# Design — Picross: Cryptozoology v1.0 App Store launch

**Date:** 2026-09-21
**Status:** Approved, ready for implementation planning

## Context

The app is feature-complete and healthy: `tsc --noEmit` is clean and 290 tests pass
across 60 suites. The IAP layer is fully wired to RevenueCat and the ads layer is fully
built. What remains is launch work, not feature work.

Two facts reshape that work:

1. **The dashboards are in a half-finished, unverified state.** RevenueCat and App Store
   Connect setup was started in August and abandoned mid-way so DoughMate could go first
   as a test run. A stale project memory claims both are "fully wired"; that claim is
   **not trusted** and must be re-verified by inspection. The same memory notes leftover
   onboarding-wizard clutter in RevenueCat, which is consistent with a partial setup.
2. **DoughMate is still under review.** Cryptid Picross is queued behind it. Every step
   below can be completed now except the final Submit for Review.

The reference for all Apple/RevenueCat procedure is the playbook at
`/home/chris/Code/app-launch/README.md`, written from the DoughMate run. Section
references below (§1.9, §5.1, ...) point into it.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Ads in 1.0 | **No ads.** Full strip, history retained in git. | Removes the test-ad-ID landmine, shrinks the privacy questionnaire, drops the ATT prompt, and removes a class of review rejection. Recoverable for 1.1 from commits `10d53ed` and `c83ae36`. |
| Unlock price | **$1.99** (was $3.99) | User decision. |
| iPad | **Dropped for 1.0** (`supportsTablet: false`) | Eliminates the required iPad 12.9" screenshot set. App still runs in iPhone-compatibility mode. |
| Dashboard work | User drives; Claude writes the click path and verifies repo state | Claude cannot and must not enter Apple/RevenueCat credentials or 2FA codes. |

### Fixed identifiers (do not change)

| Thing | Value |
|---|---|
| App Store listing name | `Picross: Cryptozoology` |
| iOS bundle id | `app.picrosscryptozoology` |
| Version | `1.0.0` |
| IAP product id | `bundle.all` (Non-Consumable — **permanent, cannot change**) |
| IAP price | **$1.99** |
| RevenueCat entitlement | `bundle` |
| RevenueCat offering | `default`, one Lifetime package |
| RevenueCat iOS SDK key | `appl_RSatTAWNpxHgDqgpRkxUOquSibF` → `app.json` → `extra.revenueCat.iosApiKey` |
| Apple Team ID | `WUTKJ9KNVQ` |
| EAS project id | `cd62e744-d6aa-454e-ae24-67d4ba0af97b` |

`bundle.all` and `bundle` must match between code and RevenueCat character-for-character.
A typo means purchases succeed and nothing unlocks.

### Inputs still needed from Chris

These are unknown at spec time and block specific steps. Everything else can proceed
without them.

| Input | Blocks | Note |
|---|---|---|
| **Support URL** | App Store Connect listing (Apple requires it) | Nothing suitable exists yet. Cheapest option: a `docs/support.md` page on the same GitHub Pages site as the privacy policy. |
| **Support/contact email** | Privacy policy lines 4 and 70; the Support page | **`Codemackcreations@gmail.com`**. The personal address must never appear in any published file. |
| **Developer name** | Privacy policy line 5 | The individual name used for the Individual enrollment. |
| **Privacy policy effective date** | Privacy policy line 3 | Use the date it actually goes live. |
| **`ascAppId`** | `eas.json`, and therefore `eas submit` | The numeric "Apple ID" on App Store Connect → App Information. Read during the Section 2 audit. |

Hosting is settled: `Cremacious/cryptid-picross` is already **public**, so GitHub Pages
can serve the policy from this repo's `docs/` folder — no second repo needed.

---

## Section 1 — Repo changes

### 1a-0. Fix Settings → Restore Purchases (added during planning)

**Found while planning, not in the original approved scope.** `SettingsScreen`'s `onRestore`
is an empty stub (`src/components/screens/SettingsScreen.tsx:51-54`) whose comment says real
wiring "lands with RevenueCat" — it never did. The paywall's restore is real; the Settings one
silently does nothing.

This is a launch blocker, not cleanup: Apple Guideline 3.1.1 requires a working restore for
non-consumables, playbook §4.8 requires it reachable outside the paywall, and a reviewer who
taps a dead button is a rejection risk.

The fix makes `SettingsScreen` presentational (`onRestore`, `restoreStatus`, `restoreBusy`
props) with the settings route performing the real restore, and extracts `BUNDLE_PRODUCT_ID`
into `src/iap/catalog.ts` so the paywall and settings routes cannot drift apart on the product
id — the character-for-character risk called out above.

### 1a. Strip ads

**Delete outright:**
- `src/ads/` in its entirety — `index.ts`, `adsStore.ts`, `interstitialPolicy.ts`,
  `config.ts`, `types.ts`, `backend.ts`, `backend.native.ts`, `noopBackend.ts`
- `src/ads/__tests__/adsStore.test.ts`, `src/ads/__tests__/interstitialPolicy.test.ts`

**Edit — every remaining reference to `@/ads`:**
- `src/app/_layout.tsx` — drop the `initAds` import and the `void initAds()` call
- `src/app/reveal/[id].tsx` — drop the `maybeShowInterstitialAfterSolve` import; the
  `leave` helper collapses to calling `go()` directly, so the async wrapper and its
  explanatory comment go too
- `src/components/screens/SettingsScreen.tsx` — drop the `isAdsPlatform` /
  `presentAdPrivacyOptions` import, the `adsRemoved` selector, the `showAdPrivacy`
  flag, and the row it gates

**Edit — the ad-free concept itself:**
- `src/state/purchaseStore.ts` — remove `adsRemoved()` and retarget its doc comment.
  Region unlocking already reads `ownedPacks.includes('bundle')` directly, so nothing
  depends on it once Settings stops calling it.
- `src/state/__tests__/purchaseStore.test.ts` — remove the `adsRemoved` test case
  (lines 46–50). The adjacent `grantPack` coverage stays.

**Edit — user-facing copy:**
- `src/components/screens/PaywallScreen.tsx:66` — "One-time purchase · unlocks all 5
  regions and removes ads" loses the ads clause.

**Edit — `app.json`:**
- remove the `react-native-google-mobile-ads` plugin block (currently holding Google's
  **test** App IDs — §5.1)
- remove the `expo-tracking-transparency` plugin block
- remove `android.permissions` (its only entry is `com.google.android.gms.permission.AD_ID`)
- remove `extra.admob`

**Edit — `package.json`:** drop `react-native-google-mobile-ads` and
`expo-tracking-transparency`, then reinstall so the lockfile matches.

Both are native modules, so this mandates a fresh production build — which is needed
anyway.

**Verification:** `npx tsc --noEmit` clean and the full suite green at exactly
**59 suites / 283 tests** — the 60/290 baseline, plus 1 suite and 4 tests from the restore fix
in 1a-0, minus the 2 ads suites (10 tests) and the 1 `adsRemoved` case. Any other delta means
something was removed that shouldn't have been. No remaining match for
`grep -rn "@/ads\|adsRemoved\|google-mobile-ads\|tracking-transparency" src/ app.json package.json`.

### 1b. Price → $1.99

The displayed price comes from StoreKit at runtime — `getStorePricing()` reads
`pkg.product.priceString` (`src/iap/purchases.native.ts:56`). Everything below is the
**fallback** shown on web and in unprovisioned dev builds, plus documentation. No logic
changes.

- `src/iap/mockPurchases.ts:11` — `MOCK_PRICING` → `'$1.99'`
- `src/iap/__tests__/mockPurchases.test.ts:15,17` — expectation and test name
- `src/components/screens/__tests__/PaywallScreen.test.tsx:10` — fixture
- `src/content/__tests__/catalog.test.tsx:19` — test name
- Doc comments: `src/iap/purchases.native.ts:12`, `src/state/purchaseStore.ts:7`,
  `src/app/paywall/[id].tsx:21`

### 1c. iPad off

`app.json` → `ios.supportsTablet: false`.

### 1d. `eas.json`

`submit.production.ios` currently has only `appleTeamId`. Add `ascAppId` (the numeric
Apple ID from App Information) once Section 2 confirms it. Without `ascAppId`, `eas submit`
cannot find the app record (§8.2).

**No `appleId` field.** `eas.json` is committed to a public repo and `appleId` is the Apple
Developer account login — a personal address that must not be published. EAS prompts for it,
or reads `EXPO_APPLE_ID`. The numeric `ascAppId` and Team ID are not secrets and are safe to
commit.

### 1e. Documentation

- **`docs/privacy-policy.md`** — rewrite. With AdMob gone, the entire advertising
  section, the IDFA/Advertising-ID language, and the ATT discussion are deleted. What
  remains is a short policy covering local-on-device storage plus RevenueCat purchase
  processing. Resolve all 5 `[FILL IN]` markers: effective date (line 3), contact email
  (lines 4 and 70 — same value), developer name (line 5), and the "before publishing"
  instruction block (line 7), which is deleted rather than filled.
- **`docs/app-store-listing.md`** — price → $1.99; remove "ad-free" from the description
  bullet; rewrite the App Review notes to drop the ads and ATT paragraph; fill the
  Support URL and Privacy Policy URL blanks; remove the iPad screenshot caveat.
- **`docs/LAUNCH.md`** — currently describes a from-zero flow that no longer matches
  reality (it still says $3.99 and has a whole AdMob phase). Rewrite as the actual
  remaining path, structured as the audit-then-fix of Section 2 plus the Section 3 tail.
- **`docs/EAS_BUILD.md:73`** — price.

### 1f. Issue hygiene

14 open issues, several describing finished work, and #7/#12 still saying $4.99.

- Close as won't-do-for-1.0: **#9, #10, #11, #12** (all ads), **#16** (Android)
- Close as done: **#2** (EAS linked, identity set), **#3** (icon shipped in `c2c5cae`)
- Correct the price on **#7**, and retitle to reflect $1.99
- Leave open and re-scope to match this spec: **#1, #4, #5, #6, #8, #14, #15, #17**

---

## Section 2 — Dashboard reconciliation

**Audit first, fix second.** Record what is actually there before changing anything; do
not assume the memory file or the old runbook is accurate.

### App Store Connect

1. **§1.0 first** — check the Apps page for a yellow "Program License Agreement has been
   updated" banner. It silently blocks submission at the very end. Accept at
   developer.apple.com/account if present.
2. Confirm the app record exists, name is `Picross: Cryptozoology`, bundle ID is
   `app.picrosscryptozoology`.
3. Confirm `bundle.all` exists, type **Non-Consumable**, and its status. It must be at
   **"Prepare for Submission" / "Missing Metadata"** — *not* "Waiting for Review". If it
   was ever pushed via "Add for Review" the metadata goes read-only (§1.4).
4. **Change the price to $1.99** — Price Schedule → ➕ → Global Price Change → US base
   price → Make Price Change Now → Confirm. A price change on an IAP that has never been
   released does **not** trigger re-review (§1.9). Then **reload the page and re-open
   Current Price to confirm it actually saved** — §1.9 warns the dialog can appear to
   accept a click and silently not apply it.
5. **Edit the IAP localization.** The description currently reads "Unlock all 5 regions
   and remove ads." The ads half is now false. New copy: display name `Unlock Everything`
   (unchanged), description `Unlock all 5 regions.` This is precisely the stale-metadata
   trap of §1.8 — Apple's purchase sheet reads the display name, and reviewers read the
   description.
6. Confirm Availability = all countries.
7. Check **Business → Agreements, Tax & Banking**: the Paid Apps Agreement must read
   **Active**, with bank and W-9 complete. Until it is Active, StoreKit returns zero
   products and RevenueCat logs "offerings empty" — expected, not a code bug. DoughMate
   having been submitted suggests this has since gone Active, but verify.

### RevenueCat

1. Confirm the App Store app is registered with bundle id `app.picrosscryptozoology` and
   shows the green **"Valid credentials"** chip. Credentials must be an **In-App Purchase
   Key (`.p8`)**, not the legacy shared secret — RevenueCat uses StoreKit 2 (§4.3).
2. Confirm entitlement **`bundle`** exists and has product **`bundle.all`** attached.
3. Confirm the **`default`** offering exists with exactly one **Lifetime** package
   pointing at `bundle.all`. Hover the checkmark badge to confirm the offering is marked
   **current** (§4.6) — a non-current offering returns empty `availablePackages`, and
   `purchaseByProductId()` would report "That item is not available right now."
4. **Delete the leftover onboarding clutter**: the `Picross Cryptids Pro` entitlement and
   the 3 Test Store products (Monthly/Yearly/Lifetime). Harmless but confusing.
5. Confirm the iOS public SDK key still matches `appl_RSatTAWNpxHgDqgpRkxUOquSibF`. If it
   was regenerated, update `app.json`.
6. Paste RevenueCat's notification URL into App Store Connect → App Information → **App
   Store Server Notifications**, for **both** Production and Sandbox (§4.11).

---

## Section 3 — Assets and submission

### Privacy policy hosting

Public repo, page on `main` (a `docs/` folder is fine) with an empty `.nojekyll` file,
GitHub Pages enabled via Settings → Pages → Deploy from branch. Verify the URL returns
200 before pasting it into App Store Connect.

### Screenshots — two different things

**IAP review screenshot:** exactly **640×920**, RGB, **no alpha channel**, showing the
paywall with the purchase button active (§1.3). This is what clears the IAP's "Missing
Metadata".

**App Store screenshots:** exactly **1284×2778**, iPhone only now that iPad is dropped.
Per §1.10 this is a QA pass, not a chore — populating the app with real content to
capture it is how you find the bugs. **Only the first 3 appear on the install sheet**, so
upload in deliberate order, then reload the page and confirm they stuck in that order.
Target shots: solved reveal, the Expeditions region map, a puzzle mid-solve, a creature
case file, and the paywall.

### App Privacy questionnaire

Removing ads materially simplifies this. The top-level answer is still **"Yes, this app
collects data"** — RevenueCat ships a `PrivacyInfo.xcprivacy` declaring collection, and
Apple cross-checks declared labels against bundled SDK manifests, so answering "No" is a
real rejection risk (§2.1).

| Data type | Linked to identity | Used to track | Purposes |
|---|---|---|---|
| Purchases → Purchase History | No | No | App Functionality, Analytics |
| Identifiers → Device ID | No | No | **App Functionality only** (RevenueCat restore lookup) |

Changes from the playbook's AdMob-era table: **Usage Data → Advertising Data drops off
entirely**, and Device ID **loses its Third-Party Advertising purpose**. Crash Data and
Performance Data stay unselected — no crash/analytics SDK is initialized in this app; if
one is ever wired up, come back and declare it. Payment Info stays unchecked: StoreKit
handles payment outside the app. Local AsyncStorage data is not "collected" at all.

### Age rating

Target 4+. **Third-party advertising: No** (changed by the ads strip). Unrestricted web
access: No.

### Remaining URLs

Support URL is required and currently blank. Marketing URL is optional.

### Build, test, submit

1. `cd` into the app directory — every `eas` command, every time (§8.6).
2. Sandbox tester: App Store Connect → Users and Access → Sandbox → Testers → ➕.
3. `eas build --profile production --platform ios` — **interactively the first time**, so
   Apple 2FA can be answered (§8.1). Note the real build number from the "Incremented
   buildNumber" line rather than assuming it (§8.5).
4. `eas submit --profile production --platform ios` — let EAS generate its own App Store
   Connect API key, role **App Manager** (§8.3).
5. Wait for TestFlight processing (5–15 min, email arrives). Then the real gate: **buy
   `bundle.all` in sandbox → confirm all 5 regions unlock → delete and reinstall →
   confirm Restore Purchases re-unlocks.**
6. Attach that build to the 1.0 version and Save. Set **Manually release this version**
   and Save (§1.11).
7. **Park here until DoughMate is approved.**

### The two-part submission (§1.11)

The app and the IAP are separate items and both must reach "Waiting for Review":

- Version page → **Add for Review** → a draft panel opens showing **(1)**. **Stop.**
- Go to the IAP → the **chevron** beside Add for Review → **add to the existing draft**.
  Never "Create New Submission".
- Confirm the panel reads **Items Ready to Submit (2)** → Submit for Review.
- Verify the app *and* the IAP each independently read **Waiting for Review**.

### If it comes back Guideline 2.1 "Information Needed"

Likely on an early app (§1.12). It is an information request, not a defect — **no new
build**. Record 60–90s on a physical device starting from the home screen and ending on
the paid features working, answer the questions from the source so every count is real,
keep both the reply and the Notes under 4000 characters, then Update Review → Resubmit.
Note that the no-ads build makes this video simpler: no ATT prompt to explain.

---

## Risks

- **The dashboards may differ from every written record.** This is why Section 2 is an
  audit. If `bundle.all` turns out to have been pushed to "Add for Review", its metadata
  is read-only and the price/description edits need that submission withdrawn first.
- **The Paid Apps Agreement gates all purchase testing.** If it is not Active, Section 3
  step 5 cannot run. Everything else proceeds; the sandbox test becomes the last gate.
- **$1.99 is the bottom price tier** for a 400-puzzle game, and Apple's derived
  international prices are not obvious conversions (§1.9 saw $2.99 US produce $4.99 AUD).
  Skim the 175-row confirmation table. This is a deliberate user decision, noted here
  only so it is a decision and not an accident.
- **Ads are recoverable but not free to restore.** The 1.1 ads work means reverting the
  strip *and* doing the AdMob dashboard setup that was never completed, *and* re-opening
  the privacy labels and age rating.

## Out of scope

Android/Google Play (issue #16), any gameplay or content change, real iPad layout, and
re-introducing ads.

## Success criteria

1. `npx tsc --noEmit` clean; full suite green; no reference to ads or AdMob anywhere in
   `src/`, `app.json`, or `package.json`.
2. App Store Connect shows `bundle.all` at $1.99, Non-Consumable, no "remove ads" copy,
   with a valid 640×920 review screenshot and no Missing Metadata.
3. RevenueCat shows entitlement `bundle` ← `bundle.all` ← current `default` offering,
   green credentials, and no leftover Test Store clutter.
4. A sandbox purchase unlocks all 5 regions, and Restore re-unlocks after a reinstall — from
   **both** the paywall and Settings.
5. A production build sits in TestFlight, tested, with the version set to manual release
   — waiting only on DoughMate's approval to submit.
