# Launch Runbook — Picross: Cryptozoology (iOS)

The complete, ordered path from zero to live on the App Store. Do the phases top-to-bottom;
each one unblocks the next. Your fixed values:

| Thing | Value |
|---|---|
| App name | `Picross: Cryptozoology` |
| iOS bundle id | `app.picrosscryptozoology` |
| Version | `1.0.0` |
| IAP product (non-consumable, $4.99) | `bundle.all` |
| RevenueCat entitlement | `bundle` |
| RevenueCat iOS key → | `app.json` → `expo.extra.revenueCat.iosApiKey` |
| AdMob App ID → | `app.json` → `expo.react-native-google-mobile-ads.ios_app_id` |
| Interstitial ad unit → | `app.json` → `expo.extra.admob.iosInterstitialAdUnitId` |

---

## Phase 0 — Accounts (do these first; approvals can take a day)

- [ ] **Apple Developer Program** — enroll at [developer.apple.com/programs](https://developer.apple.com/programs/) ($99/yr). This gates everything.
- [ ] **Expo account** (free) — [expo.dev](https://expo.dev). Then locally: `npm i -g eas-cli` and `eas login`.
- [ ] **Google AdMob** (free) — [admob.google.com](https://admob.google.com).
- [ ] **RevenueCat** (free) — [app.revenuecat.com](https://app.revenuecat.com).

## Phase 1 — Link the project to EAS

- [ ] In the repo: `eas init` — creates/links the EAS project and writes `extra.eas.projectId` into `app.json`. Commit that change.
- [ ] `app.json` identity is already set (name, bundle id, version, portrait, encryption flag).

## Phase 2 — Create the app in App Store Connect

- [ ] [App Store Connect](https://appstoreconnect.apple.com) → **Apps → +** → New App: iOS, name **Picross: Cryptozoology**, primary language, bundle ID **`app.picrosscryptozoology`** (if it's not in the dropdown, first register it under [Certificates, Identifiers & Profiles → Identifiers](https://developer.apple.com/account/resources/identifiers/list), or let `eas build` create it), SKU = any unique string (e.g. `picross-crypto-001`).
- [ ] Write down two values you'll need for `eas submit`:
  - **Apple ID (ascAppId)** — App → App Information → "Apple ID" (a number).
  - **Team ID** — [developer.apple.com/account](https://developer.apple.com/account) → Membership → Team ID.

## Phase 3 — Create the $4.99 in-app purchase

- [ ] App Store Connect → your app → **Monetization → In-App Purchases → +** → **Non-Consumable**.
  - Product ID: **`bundle.all`** (must match exactly).
  - Reference name: `All-access unlock`.
  - Price: **$4.99** (pick the tier).
  - Localization → Display name `Unlock Everything`, description `Unlock all 5 regions and remove ads.`
  - Add a review screenshot (a photo of the paywall) + review note.
  - Save. Status becomes "Ready to Submit" — it submits together with your first build.

## Phase 4 — RevenueCat (drives the unlock)

- [ ] RevenueCat → **Create Project**.
- [ ] **Add app** → App Store → bundle id `app.picrosscryptozoology`. Paste your **App Store Connect in-app-purchase shared secret** (App Store Connect → Users and Access → Integrations → In-App Purchase, or the app's App-Specific Shared Secret).
- [ ] **Entitlements** → new entitlement, identifier **`bundle`**.
- [ ] **Products** → add product `bundle.all` (import from App Store). Attach it to the `bundle` entitlement.
- [ ] **Offerings** → create/confirm the current offering has a package containing `bundle.all`.
- [ ] **API keys** → copy the **Apple / iOS public SDK key** → paste into `app.json` → `expo.extra.revenueCat.iosApiKey`. Commit.

## Phase 5 — AdMob (the ads)

- [ ] AdMob → **Apps → Add app** → iOS, "Picross: Cryptozoology" (not yet on the store = "No"). Copy the **App ID** (`ca-app-pub-XXXX~YYYY`).
- [ ] **Ad units → Add ad unit → Interstitial**. Copy the **ad unit ID** (`ca-app-pub-XXXX/ZZZZ`).
- [ ] In `app.json`: replace the Google **test** app id in `expo.react-native-google-mobile-ads.ios_app_id` with your real App ID, and put the interstitial unit id in `expo.extra.admob.iosInterstitialAdUnitId`. Commit.
  - Keep using **test** ad unit ids on your own device during development — never tap your own live ads (AdMob can ban the account).

## Phase 6 — First build + test on a device

- [ ] Create a **sandbox tester**: App Store Connect → Users and Access → Sandbox → Testers → +.
- [ ] `eas build --profile development --platform ios` (dev client) or `--profile preview` (standalone). Install on your iPhone.
- [ ] On device, verify: buy `bundle.all` (sandbox) → all regions unlock + ads stop; delete + reinstall → **Restore Purchases** re-unlocks; the ATT prompt appears before ads; a test interstitial shows after ~every 3rd solve.

## Phase 7 — Assets + store listing

- [ ] App icon `assets/icon.png` (1024², no alpha) — confirm final.
- [ ] **Screenshots** (App Store Connect → your version): iPhone 6.9" (or 6.7") **and** 6.5". Add iPad 12.9" only if `app.json` keeps `ios.supportsTablet: true` — otherwise set it false to skip iPad. Suggested shots are in `docs/app-store-listing.md`.
- [ ] Paste **name / subtitle / description / keywords / promo text** from `docs/app-store-listing.md`.
- [ ] Host `docs/privacy-policy.md` (fill the `[FILL IN]` blanks first) at a public HTTPS URL → paste into **App Privacy → Privacy Policy URL**. Add a Support URL.
- [ ] Complete **App Privacy** (declare AdMob + RevenueCat data), **Age rating** (target 4+, "third-party advertising: yes").

## Phase 8 — Production build → TestFlight

- [ ] Fill `eas.json` → `submit.production.ios`: `appleId` (your Apple email), `ascAppId` (Phase 2), `appleTeamId` (Phase 2).
- [ ] `eas build --profile production --platform ios`.
- [ ] `eas submit --profile production --platform ios` → uploads to App Store Connect → TestFlight processing (~15–30 min).
- [ ] TestFlight → add yourself/testers → install → re-test IAP + ads on the real store pipeline.

## Phase 9 — Submit for review

- [ ] App Store Connect → your app → the **1.0 version**: attach the build, attach the `bundle.all` IAP, confirm all metadata/screenshots/privacy are complete.
- [ ] Paste the **App Review notes** from `docs/app-store-listing.md` (how to reach the paywall + that ads are AdMob).
- [ ] **Submit for Review**. Respond to any feedback. On approval, release (manual or automatic).

---

### Where to get help
Come back at any phase and I can: edit `app.json`/`eas.json` with your real IDs, wire anything
in code, debug a build error, or double-check a dashboard setting. The GitHub issues in the
**v1.0 App Store Launch** milestone map 1:1 to these phases.
