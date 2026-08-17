# Quickstart — the commands you actually type

Two parts:
- **Part A** — every day: run *this* app on your phone with live reload.
- **Part B** — from scratch: start a *brand-new* Expo project and get it on your phone.

Copy/paste the commands. `~` means your home folder.

---

## Part A — Run this app on my phone (do this every time)

1. **Turn on the computer.** Make sure the **phone and computer are on the same WiFi.**
2. **Open a terminal** (Ctrl+Alt+T on Linux Mint).
3. Go to the project and start the server:
   ```bash
   cd ~/Code/cryptid-picross
   ```
   ```bash
   npm run dev
   ```
   A QR code appears and it says `Metro waiting on ... :8081`. **Leave this running.**
4. **On the iPhone:** open the **Picross: Cryptozoology** app (the dev-client one you installed).
   - It shows a launcher. Tap your server under **"Development servers."**
   - Not listed? Tap **"Enter URL manually"** and type the `http://…:8081` address shown in the terminal.
5. The game loads. **Edit code in VSCode → save →** it reloads on the phone automatically.
   - To force a reload: press **`r`** in the terminal, or **shake the phone → Reload**.
6. **When done:** click the terminal and press **Ctrl+C** to stop the server.

### If it won't connect
- Different WiFi networks? Stop (Ctrl+C) and run instead:
  ```bash
  npm run dev -- --tunnel
  ```
- "Port 8081 already in use"? An old server is running. Close its terminal, or:
  ```bash
  pkill -f "expo start"
  ```
- You changed a **native** thing (added a package, edited `app.json` plugins/icon) → the phone app
  needs a **rebuild** (see Part B step 5); a reload isn't enough.

---

## Part B — Start a brand-new project and run it on my phone

Do this once per new app. It ends with the same live-reload loop as Part A.

**0. Install once per computer:** Node.js LTS (v20+), Git, and the Expo login:
```bash
npm install -g eas-cli
```

**1. Create the project:**
```bash
cd ~/Code
```
```bash
npx create-expo-app@latest my-new-app
```
```bash
cd my-new-app
```

**2. Add the dev-client (lets you use native modules + a custom dev app):**
```bash
npx expo install expo-dev-client
```

**3. Log in and link the project to Expo/EAS:**
```bash
eas login
```
```bash
eas init
```
(Answer **yes** to create the project. This writes a project id into `app.json`.)

**4. Set up build config, then register your iPhone:**
```bash
eas build:configure
```
```bash
eas device:create
```
For `device:create`, choose **"Website"**, open the link **on the iPhone**, and install the profile
it downloads (Settings will prompt). This registers your phone so builds can install on it.
> Requires a paid **Apple Developer account** ($99/yr) for iOS device builds.

**5. Build the dev-client app and put it on the phone (~15 min):**
```bash
eas build --profile development --platform ios
```
- Log in with your **Apple ID** when asked; let EAS manage the credentials.
- When it finishes, open the build's page (link in the terminal, or expo.dev → your project →
  **Builds**) **in Safari on the iPhone** and tap **Install**.
- On the phone: **Settings → Privacy & Security → Developer Mode → On** (restart when asked).

**6. Start the server and connect (this is your daily loop from now on):**
```bash
npx expo start --dev-client
```
Open the new app on the iPhone → tap your server in the launcher → edit → save → it reloads.

### When to redo the build (step 5)
Only when **native** stuff changes: `npx expo install <a-native-module>`, edits to `app.json`
`plugins`/native config, the app icon/splash, or an Expo SDK upgrade. Plain JS/TS/image edits
never need a rebuild — just reload.

---

### Cheat sheet
| I want to… | Command |
|---|---|
| Run this app on my phone | `cd ~/Code/cryptid-picross` then `npm run dev` |
| Force a reload | press `r` in the terminal (or shake phone → Reload) |
| Stop the server | `Ctrl+C` in the terminal |
| Different WiFi | `npm run dev -- --tunnel` |
| Rebuild the phone app (native changed) | `eas build --profile development --platform ios` |
| Ship a store build | see `docs/LAUNCH.md` |
