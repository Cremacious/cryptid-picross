# Development setup — run on device with live reload

How to work on this app from any computer and see your VSCode changes reload on your
iPhone in seconds. Repo: `https://github.com/Cremacious/cryptid-picross`.

## The three pieces (this clears up everything)

| Piece | What it is | When you touch it |
|---|---|---|
| **EAS build** (`eas build`) | Builds the native iOS app on Expo's servers. Produces the installable **dev-client** app. | Only when **native** changes (add/remove a native module, change `app.json` plugins/native config, icon/splash, or bump the Expo SDK). |
| **Metro dev server** (`expo start`) | Runs on your computer, serves your **JavaScript**. This is what hot-reloads. | Every dev session. |
| **Dev-client app on the phone** | A one-time install of the native shell. Connects to whatever Metro server is running. | Install once per phone; reuse across computers/sessions. |

**Key point:** the dev-client app already on your iPhone connects to *any* computer's Metro
server for this project. So on a new computer you usually just **clone + install + start** —
no rebuild needed unless native code changed.

## One-time setup on a new computer

1. Install **Node.js LTS** (v20+) and **Git**. (Optional: **VSCode**, and on macOS **Watchman**: `brew install watchman`.)
2. Clone + install:
   ```bash
   git clone https://github.com/Cremacious/cryptid-picross.git
   cd cryptid-picross
   npm install
   ```
3. Log in to Expo (account `codemack-dev`):
   ```bash
   npx eas-cli@latest login
   ```
   The project is already linked (`app.json` → `extra.eas.projectId`), so no `eas init` needed.

## One-time setup per iPhone (only if the dev client isn't installed yet)

Skip this if your phone already has the **Picross: Cryptozoology** dev-client app.

1. Build the dev client (native, ~15 min on Expo's servers):
   ```bash
   npx eas-cli@latest build --profile development --platform ios
   ```
   (First time on a new Apple account it asks to log in with your Apple ID and registers the
   device — use `eas device:create` → **Website** method to register a new iPhone first.)
2. From the build's page on [expo.dev → your project → Builds](https://expo.dev/accounts/codemack-dev/projects/cryptid-picross/builds), open it **in Safari on the iPhone** and tap **Install**.
3. On the phone: **Settings → Privacy & Security → Developer Mode → On** (restart when prompted).

## Daily workflow (the fast loop)

1. Start the dev server:
   ```bash
   npm run dev
   ```
   (equivalently `npx expo start --dev-client`)
2. Open the **Picross: Cryptozoology** (dev-client) app on your iPhone. It shows a launcher —
   tap your running server under **Development servers**, or **Enter URL manually** with the
   `http://<your-computer-ip>:8081` shown in the terminal.
3. Edit code in VSCode → **save**. **Fast Refresh** applies most changes automatically. To force
   it: press **`r`** in the terminal, or shake the phone → **Reload**.

**Requirement:** phone and computer on the **same WiFi**. On different networks, use a tunnel:
```bash
npx expo start --dev-client --tunnel
```

## When do I need to rebuild the dev client?

- **Just JS/TS/assets changed** (screens, logic, images, most fixes) → **no rebuild**, just reload.
- **Native changed** (`npx expo install <native-module>`, edits to `app.json` `plugins`/native
  config, app icon/splash, Expo SDK bump) → **rebuild** the dev client:
  ```bash
  npx eas-cli@latest build --profile development --platform ios
  ```
  then reinstall it on the phone. (Expo warns "your dev client is out of date" when this is needed.)

## Other builds

- **Preview** (`--profile preview`) — a standalone install (no Metro needed) to hand to a tester.
- **Production** (`--profile production`) — the App Store build. See `docs/LAUNCH.md`.

## Troubleshooting

- **"Port 8081 is running this app in another window"** → an old `expo start` is still running.
  Kill it (`Ctrl+C` in that terminal, or accept port 8082) or `pkill -f "expo start"`.
- **Phone won't connect** → same WiFi? Try `--tunnel`. Or in the dev-client launcher, enter the
  `http://<ip>:8081` URL manually.
- **"Untrusted Developer"** on first open → Settings → General → VPN & Device Management → your
  profile → Trust.
- **Changes not showing** → make sure Fast Refresh is on (dev menu), or press `r` / shake → Reload.
- **App crashes on launch after adding a package** → you added native code; rebuild the dev client.
