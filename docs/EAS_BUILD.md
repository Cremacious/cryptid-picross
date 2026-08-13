# Building & submitting with EAS

The app is configured for [EAS Build](https://docs.expo.dev/build/introduction/).
Build profiles live in [`eas.json`](../eas.json); app identity (name, version,
bundle id `app.picrosscryptozoology`, icons) lives in [`app.json`](../app.json).

Builds run in Expo's cloud, so they work from Linux — no local Xcode/Android
Studio needed. You only need a Mac to *run* an iOS simulator build locally;
device/TestFlight/Play testing does not.

## One-time setup

```bash
npm install -g eas-cli      # or prefix commands with: npx eas-cli@latest
eas login                   # your Expo account
eas init                    # links the project, writes extra.eas.projectId into app.json
```

`appVersionSource` is `remote`, so EAS owns the build number / version code and
`production` builds auto-increment them — you don't bump versions by hand.

## Profiles (in `eas.json`)

| Profile | What it produces | Use for |
| --- | --- | --- |
| `development` | dev client, internal | day-to-day dev with native modules |
| `preview` | Android **APK**, iOS **simulator** build, internal | quick install on a test device / sharable link |
| `production` | Android **.aab**, iOS store build, auto-incremented | store submission |

## Common commands

```bash
# Android APK you can sideload on a device (fastest way to test on real hardware)
eas build --profile preview --platform android

# iOS: internal distribution needs an Apple Developer account ($99/yr) for device UDIDs,
# or use TestFlight via a production build + submit (below).
eas build --profile production --platform ios

# Store-ready builds for both platforms
eas build --profile production --platform all
```

## Submitting to the stores

Fill in the `submit.production` section of `eas.json` with your store
credentials (see the [submit docs](https://docs.expo.dev/submit/introduction/)),
then:

```bash
eas submit --profile production --platform android   # Google Play
eas submit --profile production --platform ios       # App Store Connect / TestFlight
```

## In-app purchases (RevenueCat)

Region unlocks go through RevenueCat via a small adapter in [`src/iap/`](../src/iap).
It is **mock by default**: with no API keys the app grants regions instantly and
locally, so the web preview and un-provisioned dev builds keep working. Real
purchases activate only when keys are present **and** the app runs as a native
build (`react-native-purchases` is a native module — it does not work in Expo Go
or the web preview).

### Turning on real purchases

1. Create a [RevenueCat](https://www.revenuecat.com/) project; add your App Store
   and Play Console apps.
2. Put the platform API keys in `app.json` → `expo.extra.revenueCat`:
   ```json
   "extra": { "revenueCat": { "iosApiKey": "appl_XXX", "androidApiKey": "goog_XXX" } }
   ```
3. Create store products and map them in RevenueCat:
   - one product per paid region, its identifier = that region's `iapProductId`
     (e.g. `region.appalachia`);
   - one all-regions product with identifier `bundle.all`.
4. Create RevenueCat **entitlements** and attach the products. The adapter maps an
   active entitlement to a region when the entitlement identifier equals the
   region id **or** its product id; an entitlement named `bundle` (or matching
   `bundle.all`) unlocks every region. Add all region products to the current
   **offering** so prices and purchases resolve.
5. Build a dev/preview native build and test on a device with a sandbox account.

No config plugin is needed — `react-native-purchases` autolinks during prebuild.

## Still needed before a real store release

- **Apple Developer** account + **Google Play Console** account.
- Fill `submit.production.ios` (`appleId`, `ascAppId`, `appleTeamId`) and
  `submit.production.android` (`serviceAccountKeyPath`, `track`).
- Replace the placeholder region art with final cryptid pixel art (see
  [`scripts/README.md`](../scripts/README.md)).
- Real in-app purchases: the RevenueCat adapter is wired (see above) but runs in
  mock mode until you add API keys + store products and build natively.
