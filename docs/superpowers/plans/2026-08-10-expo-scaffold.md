# Expo App Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up `cryptid-picross` as a buildable Expo (React Native) app whose foundation — routing, TypeScript path alias, the existing design tokens, the two brand fonts, portrait lock, and a testing harness — is wired and verified, with a single themed placeholder Home screen proving it all works end to end.

**Architecture:** Expo managed workflow with Expo Router (file-based routing under `src/app`). The design-token system already authored in `src/theme/` is the styling source of truth; this scaffold makes it importable via an `@/` path alias and renders it on screen with the real Special Elite + Courier Prime fonts loaded through `expo-font`. Testing uses the `jest-expo` preset with React Native Testing Library. No game engine, content pipeline, IAP, or real screens are built here — those are separate plans.

**Tech Stack:** Expo SDK (latest via `create-expo-app`), React Native, TypeScript, Expo Router, `@expo-google-fonts/special-elite` + `@expo-google-fonts/courier-prime`, `expo-font`, `expo-splash-screen`, `expo-screen-orientation`, Jest (`jest-expo`) + `@testing-library/react-native`.

## Global Constraints

- Node present: v24.19.0; npm 11.17.0; `create-expo-app`/Expo CLI available via `npx`. Do not pin an SDK — let `create-expo-app@latest` choose the current SDK.
- Portrait-only app. Orientation locked via `expo-screen-orientation`. Never landscape. (SCREEN_SPECS.md → Global Behaviors → Orientation)
- Routing is Expo Router, file-based, under `src/app/` (Expo Router auto-detects `src/app`). (SCREEN_SPECS.md → Navigation Graph)
- Never inline color/spacing/font/duration values; import from `@/theme`. If a value is missing, add it to `src/theme` + `design/DESIGN_TOKENS.md` first. (COMPONENT_LIBRARY.md → Design System Quick Reference)
- Font role names in `src/theme/typography.ts` are already: `SpecialElite_400Regular`, `CourierPrime_400Regular`, `CourierPrime_400Italic`, `CourierPrime_700Bold`. The loaded font keys MUST match these exactly.
- Preserve existing directories untouched by the generator: `design/`, `setup_design/`, `src/theme/`, `docs/`.
- Every commit message ends with the trailer:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- App identity: display name "Picross: Cryptozoology"; slug `cryptid-picross`; scheme `picrosscrypto`; iOS bundle id `app.picrosscryptozoology`; Android package `app.picrosscryptozoology`. (QA_AND_LAUNCH.md → Store Submission)

---

### Task 1: Generate the base Expo project and merge it into the repo

Generate a blank-TypeScript Expo project in a temp dir and copy it over the existing folder without clobbering our authored files. Initialize git.

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `.gitignore`, `assets/` (all from generator)
- Create: `.git/` (via `git init`)
- Preserve (do NOT overwrite): `design/`, `setup_design/`, `src/theme/`, `docs/`

**Interfaces:**
- Produces: an installed Expo project rooted at `/home/chris/Code/cryptid-picross` with `node_modules/`, and a git repo with one baseline commit.

- [ ] **Step 1: Initialize git in the project**

Run:
```bash
cd /home/chris/Code/cryptid-picross
git init
```

- [ ] **Step 2: Generate a blank-TypeScript project in a temp directory**

Run:
```bash
rm -rf /tmp/cp-scaffold
npx create-expo-app@latest /tmp/cp-scaffold --template blank-typescript --yes
```
Expected: completes with a `/tmp/cp-scaffold` containing `package.json`, `App.tsx`, `app.json`, `tsconfig.json`, `.gitignore`, `assets/`.

- [ ] **Step 3: Copy generated files into the repo, preserving our dirs**

Run:
```bash
rsync -a --exclude node_modules --exclude .git --exclude .expo \
  /tmp/cp-scaffold/ /home/chris/Code/cryptid-picross/
```
Note: the blank template ships no `src/`, so `src/theme/` is untouched. `rsync` merges `assets/` and adds root config files.

- [ ] **Step 4: Install dependencies**

Run:
```bash
cd /home/chris/Code/cryptid-picross
npm install
```
Expected: installs cleanly, `node_modules/` present.

- [ ] **Step 5: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: exits 0, no errors (the generated `App.tsx` typechecks).

- [ ] **Step 6: Commit the baseline**

```bash
git add -A
git commit -m "chore: scaffold blank Expo TypeScript project

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Wire the `@/` path alias across TypeScript, Babel, and Jest, with testing set up

Make `@/theme` (and any `@/*`) resolve everywhere: the TS type-checker, the RN/Babel runtime, and Jest. Install the testing harness and prove it all works with one passing test that imports the existing tokens through the alias.

**Files:**
- Modify: `tsconfig.json` (add `baseUrl` + `paths`)
- Create: `babel.config.js` (add `babel-plugin-module-resolver`)
- Create: `jest.config.js`
- Create: `src/theme/__tests__/colors.test.ts`
- Modify: `package.json` (add `test` script)

**Interfaces:**
- Consumes: `src/theme/index.ts` (already exports `colors`, `typography`, `spacing`, `radius`, `motion`, `layout`).
- Produces: working `@/*` → `src/*` resolution in typecheck, runtime, and tests; an `npm test` script running `jest`.

- [ ] **Step 1: Install testing + alias dev dependencies**

Run:
```bash
cd /home/chris/Code/cryptid-picross
npx expo install jest-expo jest
npm install --save-dev @testing-library/react-native babel-plugin-module-resolver
```

- [ ] **Step 2: Add `baseUrl` and `paths` to tsconfig**

Set `tsconfig.json` to (merge into the existing generated file, keeping `"extends": "expo/tsconfig.base"`):
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 3: Create `babel.config.js` with the module resolver**

Create `babel.config.js`:
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: { '@': './src' },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
    ],
  };
};
```

- [ ] **Step 4: Create `jest.config.js`**

Create `jest.config.js`:
```javascript
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
  ],
};
```

- [ ] **Step 5: Add the `test` script to package.json**

In `package.json` `"scripts"`, add:
```json
"test": "jest"
```

- [ ] **Step 6: Write the failing test (alias + tokens)**

Create `src/theme/__tests__/colors.test.ts`:
```typescript
import { colors, spacing, typography } from '@/theme';

describe('theme tokens via @/ alias', () => {
  it('exposes the paper.cream background', () => {
    expect(colors.paper.cream).toBe('#F1E8D3');
  });

  it('exposes the muted oxblood stamp red (not pure red)', () => {
    expect(colors.accent.stampRed).toBe('#9B3B2E');
    expect(colors.accent.stampRed).not.toBe('#FF0000');
  });

  it('uses a 4-point spacing scale', () => {
    expect(spacing.md).toBe(16);
  });

  it('names the display font Special Elite', () => {
    expect(typography.fontFamily.display).toBe('SpecialElite_400Regular');
  });
});
```

- [ ] **Step 7: Run the test to confirm it passes**

Run:
```bash
npm test -- src/theme/__tests__/colors.test.ts
```
Expected: PASS (4 tests). If it fails on module resolution, re-check `moduleNameMapper` in `jest.config.js`.

- [ ] **Step 8: Verify typecheck still clean**

Run:
```bash
npx tsc --noEmit
```
Expected: exits 0.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: wire @/ path alias for ts, babel, jest + testing harness

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Create the source directory skeleton

Create the `/src` and `/assets` structure the specs assume, each folder carrying a `.gitkeep` so it commits, plus a short `README` note in each top-level `src` folder describing its responsibility.

**Files:**
- Create: `src/components/atoms/.gitkeep`, `src/components/molecules/.gitkeep`, `src/components/organisms/.gitkeep`
- Create: `src/engine/.gitkeep`, `src/content/.gitkeep`, `src/state/.gitkeep`, `src/utils/.gitkeep`
- Create: `assets/images/.gitkeep`, `assets/pixel-art/.gitkeep`, `assets/sounds/.gitkeep`, `assets/fonts/.gitkeep`
- Create: `src/README.md`

**Interfaces:**
- Produces: the canonical directory layout referenced by DATA_AND_ENGINE.md (`src/engine`, `src/content`, `src/state`) and COMPONENT_LIBRARY.md (`src/components/{atoms,molecules,organisms}`).

- [ ] **Step 1: Create the directories with keepers**

Run:
```bash
cd /home/chris/Code/cryptid-picross
for d in src/components/atoms src/components/molecules src/components/organisms \
         src/engine src/content src/state src/utils \
         assets/images assets/pixel-art assets/sounds assets/fonts; do
  mkdir -p "$d" && touch "$d/.gitkeep"
done
```

- [ ] **Step 2: Add a source map README**

Create `src/README.md`:
```markdown
# src/ layout

- `app/` — Expo Router file-based routes (screens).
- `theme/` — design tokens (colors, typography, spacing, motion, layout). Source of truth; see `design/DESIGN_TOKENS.md`.
- `components/{atoms,molecules,organisms}/` — UI per COMPONENT_LIBRARY.md. Atoms hold no state; organisms may talk to stores.
- `engine/` — pure puzzle logic (clue derivation, uniqueness, difficulty, win check) per DATA_AND_ENGINE.md.
- `content/` — region JSON + generated types.
- `state/` — Zustand stores (progress, settings, purchases, ui).
- `utils/` — cross-cutting helpers (sentry, storage, audio).

Import shared code via the `@/` alias, e.g. `import { colors } from '@/theme'`.
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: add src and assets directory skeleton

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Load the brand fonts with a splash-screen gate

Install the two Google-font packages and hold the native splash until they finish loading, so text never renders in a fallback then snaps (avoids FOUT — QA_AND_LAUNCH.md manual checklist). Provide a small `useAppFonts` hook so the root layout stays readable.

**Files:**
- Create: `src/utils/useAppFonts.ts`
- Create: `src/utils/__tests__/useAppFonts.test.ts`

**Interfaces:**
- Consumes: font keys from `@/theme` typography (`SpecialElite_400Regular`, etc.).
- Produces: `useAppFonts(): { fontsLoaded: boolean }` — returns whether all four faces are ready. Consumed by `src/app/_layout.tsx` in Task 6.

- [ ] **Step 1: Install the font packages**

Run:
```bash
cd /home/chris/Code/cryptid-picross
npx expo install expo-font expo-splash-screen \
  @expo-google-fonts/special-elite @expo-google-fonts/courier-prime
```

- [ ] **Step 2: Write the failing test**

Create `src/utils/__tests__/useAppFonts.test.ts`:
```typescript
import { renderHook } from '@testing-library/react-native';
import { useAppFonts } from '@/utils/useAppFonts';

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));

describe('useAppFonts', () => {
  it('reports fonts loaded when expo-font resolves', () => {
    const { result } = renderHook(() => useAppFonts());
    expect(result.current.fontsLoaded).toBe(true);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run:
```bash
npm test -- src/utils/__tests__/useAppFonts.test.ts
```
Expected: FAIL — cannot find module `@/utils/useAppFonts`.

- [ ] **Step 4: Implement the hook**

Create `src/utils/useAppFonts.ts`:
```typescript
import { useFonts } from 'expo-font';
import { SpecialElite_400Regular } from '@expo-google-fonts/special-elite';
import {
  CourierPrime_400Regular,
  CourierPrime_400Italic,
  CourierPrime_700Bold,
} from '@expo-google-fonts/courier-prime';

/**
 * Loads the two brand families. The keys registered here MUST match the names
 * used in src/theme/typography.ts (fontFamily.display / body / bodyItalic / bodyBold).
 */
export function useAppFonts(): { fontsLoaded: boolean } {
  const [fontsLoaded] = useFonts({
    SpecialElite_400Regular,
    CourierPrime_400Regular,
    CourierPrime_400Italic,
    CourierPrime_700Bold,
  });
  return { fontsLoaded };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run:
```bash
npm test -- src/utils/__tests__/useAppFonts.test.ts
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: load Special Elite + Courier Prime via useAppFonts hook

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Configure app identity, portrait lock, and splash

Set the app's name/slug/scheme/bundle ids, add the Expo Router plugin, lock orientation to portrait, and set splash + icon background to the paper cream so the launch feels on-brand.

**Files:**
- Modify: `app.json`
- Modify: `package.json` (set `main` to the Expo Router entry)

**Interfaces:**
- Produces: an `app.json` that declares Expo Router as the entry and forces portrait; consumed by the runtime and by `eas build` later.

- [ ] **Step 1: Install Expo Router and its peers**

Run:
```bash
cd /home/chris/Code/cryptid-picross
npx expo install expo-router expo-screen-orientation \
  react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```

- [ ] **Step 2: Point the app entry at Expo Router**

In `package.json`, set:
```json
"main": "expo-router/entry"
```
Then delete the generated root entry component so Expo Router owns startup:
```bash
rm -f /home/chris/Code/cryptid-picross/App.tsx
```

- [ ] **Step 3: Rewrite `app.json`**

Replace `app.json` with (keep any generated `assets/` icon/splash paths that already exist):
```json
{
  "expo": {
    "name": "Picross: Cryptozoology",
    "slug": "cryptid-picross",
    "scheme": "picrosscrypto",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#F1E8D3"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "app.picrosscryptozoology"
    },
    "android": {
      "package": "app.picrosscryptozoology",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#F1E8D3"
      }
    },
    "plugins": ["expo-router", "expo-font", "expo-splash-screen"],
    "experiments": { "typedRoutes": true }
  }
}
```
Note: if the generated asset filenames differ (e.g. `favicon.png` only), keep the paths that exist and drop the rest — the goal is a valid config, not specific placeholder art.

- [ ] **Step 4: Verify the config is valid**

Run:
```bash
npx expo config --type public > /dev/null && echo "app.json OK"
```
Expected: prints `app.json OK` (non-zero exit means malformed config — fix before continuing).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: configure app identity, portrait lock, expo-router entry

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Build the themed Home placeholder + router skeleton

Create the root layout (font gate + portrait lock + splash hide + stack) and a single themed Home screen that uses the tokens and fonts — the proof the whole scaffold works. Cover it with a render test.

**Files:**
- Create: `src/app/_layout.tsx`
- Create: `src/app/index.tsx`
- Create: `src/app/__tests__/index.test.tsx`

**Interfaces:**
- Consumes: `useAppFonts` (Task 4); `colors`, `typography`, `spacing` from `@/theme`.
- Produces: a running app that renders "PICROSS: CRYPTOZOOLOGY" over paper cream in the display font — the baseline every future screen replaces/extends.

- [ ] **Step 1: Create the root layout**

Create `src/app/_layout.tsx`:
```tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { useAppFonts } from '@/utils/useAppFonts';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { fontsLoaded } = useAppFonts();

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.paper.cream },
        }}
      />
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 2: Create the themed Home placeholder**

Create `src/app/index.tsx`:
```tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/theme';

export default function Home() {
  return (
    <View style={styles.screen} testID="home-screen">
      <Text style={styles.kicker}>FIELD GUIDE</Text>
      <Text style={styles.title}>PICROSS{'\n'}CRYPTOZOOLOGY</Text>
      <Text style={styles.prompt}>tap to begin your investigation</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper.cream,
    padding: spacing.lg,
    gap: spacing.md,
  },
  kicker: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.size.sm,
    letterSpacing: typography.letterSpacing.wider,
    color: colors.accent.candleGlow,
  },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.size['2xl'],
    letterSpacing: typography.letterSpacing.wide,
    textAlign: 'center',
    color: colors.ink.primary,
  },
  prompt: {
    fontFamily: typography.fontFamily.body,
    fontStyle: 'italic',
    fontSize: typography.size.md,
    color: colors.ink.faded,
  },
});
```

- [ ] **Step 3: Write the failing render test**

Create `src/app/__tests__/index.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import Home from '@/app/index';

describe('Home placeholder', () => {
  it('renders the themed title and prompt', () => {
    render(<Home />);
    expect(screen.getByTestId('home-screen')).toBeTruthy();
    expect(screen.getByText('tap to begin your investigation')).toBeTruthy();
  });
});
```

- [ ] **Step 4: Run the test to verify it fails, then passes**

Run:
```bash
npm test -- src/app/__tests__/index.test.tsx
```
Expected first run (before Step 1–2 exist): FAIL. After Steps 1–2: PASS. (If executing in order, this is the pass run.)

- [ ] **Step 5: Verify the whole suite + typecheck**

Run:
```bash
npm test && npx tsc --noEmit
```
Expected: all tests pass, tsc exits 0.

- [ ] **Step 6: Boot-check the app bundles without runtime error**

Run:
```bash
npx expo export --platform ios --output-dir /tmp/cp-export >/tmp/cp-export.log 2>&1; echo "exit: $?"
```
Expected: `exit: 0` and a populated `/tmp/cp-export`. This confirms Metro resolves the `@/` alias, fonts, and router entry in a production bundle without a device. (If it fails, read `/tmp/cp-export.log`.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: themed Home placeholder + Expo Router root layout

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the executor

- **Running the app visually** is out of scope for these gates (no device/emulator assumed); Step 6 of Task 6 uses `expo export` as a headless bundle check. To see it live later, use `npx expo start` and the `/run` workflow.
- If `create-expo-app` changes its default asset filenames, adjust the `app.json` asset paths in Task 5 to match what actually exists in `assets/` — do not invent paths.
- The blank template may already include a `tsconfig.json`, `.gitignore`, and `App.tsx`; Task 1 pulls them in and later tasks modify/remove them as noted.
- This scaffold intentionally builds **one** screen. Regions, Puzzle Play, Reveal, the engine, content pipeline, stores, and IAP are separate specs/plans (SCREEN_SPECS.md, DATA_AND_ENGINE.md, COMPONENT_LIBRARY.md).
