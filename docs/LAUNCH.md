# Launch Runbook — Picross: Cryptozoology (iOS)

The repo side of the work (code, config, docs) is done. What's left is dashboard and store
operations — App Store Connect, RevenueCat, screenshots, the privacy/age-rating questionnaire,
the production build, and submission. Your fixed values:

| Thing | Value |
|---|---|
| App name | `Picross: Cryptozoology` |
| iOS bundle id | `app.picrosscryptozoology` |
| Apple Team ID | `WUTKJ9KNVQ` |
| Version | `1.0.0` |
| IAP product (non-consumable) | `bundle.all` — display name `Unlock Everything`, description `Unlock all 5 regions.` |
| Price | `$1.99` |
| RevenueCat entitlement | `bundle` |
| RevenueCat offering | `default` — one Lifetime package containing `bundle.all` |
| RevenueCat iOS key → | `app.json` → `expo.extra.revenueCat.iosApiKey` |
| iPad support | dropped — `app.json` → `ios.supportsTablet: false`. iPhone screenshots only. |
| Support URL | `https://cremacious.github.io/cryptid-picross/support/` |
| Privacy Policy URL | `https://cremacious.github.io/cryptid-picross/privacy-policy/` |

There is no ad layer in this build — no third-party advertising SDK and no data collection for
tracking purposes, and so nothing about removing ads to advertise. The single monetization path
is the `$1.99` unlock above.

For the exact click-by-click path through each step below, see
[`docs/superpowers/plans/2026-09-21-app-store-launch.md`](superpowers/plans/2026-09-21-app-store-launch.md)
(Tasks 8–14). This file is the short version — what remains, in order.

---

## 1. App Store Connect audit

Confirm the app record and the `bundle.all` IAP are set up correctly before touching anything
else: accept any pending Developer Program license agreement, record the numeric Apple ID
(`ascAppId`, needed for `eas submit`), confirm the IAP is still editable (not stuck in
"Waiting for Review"), set its price to `$1.99` and re-check it after a page reload, fix its
description to `Unlock all 5 regions.` (the old copy mentioned removing ads), and confirm the
Paid Apps Agreement (tax/banking) is Active — without it, sandbox purchase testing can't run.

## 2. RevenueCat audit

Confirm the App Store app's credentials are an **In-App Purchase Key (`.p8`)** plus its Key ID
and Issuer ID — **not** the legacy App-Specific Shared Secret. RevenueCat runs on StoreKit 2,
which the shared secret does not support; getting this wrong costs hours of confused debugging
later. Also confirm: entitlement `bundle` has `bundle.all` attached, the `default` offering is
marked *current* and contains one Lifetime package, and the iOS SDK key matches
`app.json` → `expo.extra.revenueCat.iosApiKey`. Delete any leftover test entitlements/products
from earlier setup attempts so the real config stays readable.

## 3. Screenshots

Two different things, both iPhone-only now:
- The IAP review screenshot (exactly 640×920, RGB, no alpha) showing the paywall.
- The App Store screenshot set (exactly 1284×2778) — a solved reveal, the Expeditions region
  map, a puzzle mid-solve, a case file, and the paywall. Use this pass to actually play the
  app and fix anything it turns up.

## 4. Privacy and age-rating questionnaire

App Privacy: answer "Yes, we collect data" (RevenueCat's own privacy manifest requires it) and
declare exactly two data types — Purchase History and Device ID, neither linked to identity,
neither used to track. Paste in the Privacy Policy URL above. Age rating: target 4+,
**"Third-party advertising: No"** (there is no ad SDK in this build).

## 5. Production build

Confirm `eas.json` → `submit.production.ios` has `ascAppId` (from step 1) and `appleTeamId`
(`WUTKJ9KNVQ`) filled in, then from `/home/chris/Code/cryptid-picross`, in a real terminal (not
through an agent — it prompts for Apple 2FA):

```bash
npx tsc --noEmit && npm test 2>&1 | tail -5   # confirm the tree is green first
eas build --profile production --platform ios
eas submit --profile production --platform ios
```

Let EAS generate its own App Store Connect API key when prompted (role: App Manager). Wait for
TestFlight processing (5–15 minutes).

## 6. Sandbox purchase test

This is the gate that actually matters — everything before it is configuration. Create a
sandbox tester in App Store Connect, install the TestFlight build on a physical iPhone, sign
into the sandbox account on-device, and buy `bundle.all` from the paywall — confirm it shows
$1.99 and all 5 regions unlock. Delete and reinstall the app, then verify restore works from
**both** places: the paywall's Restore Purchases and Settings → Restore Purchases. Also confirm
the no-ads build: no permission prompt for tracking appears at launch, no full-screen ad ever
appears, and Settings has no ad-related privacy row.

## 7. Submission

Attach the build to the 1.0 version, set manual release, then submit the app **and** the
`bundle.all` IAP together in a single draft (never "Create New Submission" for the IAP — that
creates a competing submission). Paste the App Review notes from `docs/app-store-listing.md`.
Confirm the draft reads "Items Ready to Submit (2)" before submitting, then verify both the app
and the IAP independently reach "Waiting for Review".

---

### Where to get help

Come back at any step and I can: edit `app.json`/`eas.json` with real IDs, wire anything in
code, debug a build error, or double-check a dashboard setting against
`docs/superpowers/plans/2026-09-21-app-store-launch.md`.
