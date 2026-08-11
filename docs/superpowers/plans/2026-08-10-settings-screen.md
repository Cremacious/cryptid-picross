# Settings Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Settings screen — a `ModeToggle` and `ToggleRow` molecule, a `SettingsScreen` composing the investigation-style toggle, sound/haptics/reduce-motion switches, a solved-count stat + two-step Clear Data, a mock Restore, and version — wired to `settingsStore`/`progressStore`, reachable from a Home gear.

**Architecture:** `ModeToggle` (cozy/classic cards) and `ToggleRow` (labeled RN `Switch`) are presentational molecules driven by props. `SettingsScreen` reads/writes the `settingsStore` (mode, sound, haptics, reduceMotion) and `progressStore` (solved count, clearAll) directly and groups the controls in `PaperSurface` sections. Clear Data is a two-step inline confirm (no modal system needed). Restore is a safe mock no-op (real IAP deferred). The `/settings` route is thin; a Home gear navigates to it.

**Tech Stack:** React Native + Expo Router, TypeScript, Zustand (`@/state`), Jest + `@testing-library/react-native` v13.

## Global Constraints

- Never inline color/spacing/font values; import from `@/theme`. (COMPONENT_LIBRARY.md Design System Quick Reference)
- Molecules import atoms/molecules; screens import atoms/molecules/organisms/stores/utils; routes import screens/stores. No upward imports. (COMPONENT_LIBRARY.md Part 6)
- Settings changes go through `settingsStore` actions (each persists via the store's `notifyChange`). (COMPONENT_LIBRARY.md 3.4)
- "Clear All Data" clears **progress only** (`progressStore.clearAll` → solved + onboarding reset); it MUST NOT clear `purchaseStore` (never silently revoke purchases). This is a deliberate, safer deviation from the spec's blanket "clear all stores". (SCREEN_SPECS.md Screen 8 + safety)
- Restore Purchases is a **mock no-op** (must NOT call `purchaseStore.restore([])`, which would wipe owned regions). Real RevenueCat restore is deferred. (carried lesson from the paywall fix)
- `@testing-library/react-native` is v13 — synchronous `render`/`fireEvent`; RN `Switch` toggled via `fireEvent(node, 'valueChange', next)`. Reset `settingsStore`/`progressStore` in `beforeEach`.
- Every commit message ends with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Project root: `/home/chris/Code/cryptid-picross`.

---

### Task 1: ModeToggle molecule

The Cozy/Classic investigation-style switcher. (COMPONENT_LIBRARY.md 2.7)

**Files:**
- Create: `src/components/molecules/ModeToggle.tsx`
- Modify: `src/components/molecules/index.ts`
- Test: `src/components/molecules/__tests__/ModeToggle.test.tsx`

**Interfaces:**
- Consumes: `@/theme`.
- Produces: `ModeToggle` with props `{ mode: 'cozy' | 'classic'; onChange: (mode: 'cozy' | 'classic') => void; testID?: string }`.

- [ ] **Step 1: Write the failing test**

Create `src/components/molecules/__tests__/ModeToggle.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ModeToggle } from '@/components/molecules';

describe('ModeToggle', () => {
  it('renders both modes', () => {
    render(<ModeToggle mode="cozy" onChange={() => {}} testID="mode" />);
    expect(screen.getByText('Cozy')).toBeTruthy();
    expect(screen.getByText('Classic')).toBeTruthy();
  });

  it('marks the active mode selected for accessibility', () => {
    render(<ModeToggle mode="cozy" onChange={() => {}} testID="mode" />);
    expect(screen.getByTestId('mode-cozy').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('mode-classic').props.accessibilityState.selected).toBe(false);
  });

  it('calls onChange when the other mode is tapped', () => {
    const onChange = jest.fn();
    render(<ModeToggle mode="cozy" onChange={onChange} testID="mode" />);
    fireEvent.press(screen.getByTestId('mode-classic'));
    expect(onChange).toHaveBeenCalledWith('classic');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- ModeToggle` → FAIL.

- [ ] **Step 3: Implement**

Create `src/components/molecules/ModeToggle.tsx`:
```tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { colors, typography, spacing, radius, border } from '@/theme';

export interface ModeToggleProps {
  mode: 'cozy' | 'classic';
  onChange: (mode: 'cozy' | 'classic') => void;
  testID?: string;
}

const OPTIONS: { key: 'cozy' | 'classic'; name: string; desc: string }[] = [
  { key: 'cozy', name: 'Cozy', desc: 'Wrong cells turn red as you go.' },
  { key: 'classic', name: 'Classic', desc: 'No hints — check your work yourself.' },
];

export function ModeToggle({ mode, onChange, testID }: ModeToggleProps) {
  return (
    <View testID={testID} style={{ flexDirection: 'row', gap: spacing.sm }}>
      {OPTIONS.map((opt) => {
        const active = mode === opt.key;
        return (
          <Pressable
            key={opt.key}
            testID={`${testID}-${opt.key}`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.key)}
            style={{
              flex: 1,
              padding: spacing.md,
              borderRadius: radius.md,
              borderWidth: border.thick,
              borderColor: colors.ink.primary,
              backgroundColor: active ? colors.ink.primary : 'transparent',
            }}
          >
            <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.md, letterSpacing: typography.letterSpacing.wide, textTransform: 'uppercase', color: active ? colors.paper.cream : colors.ink.primary }}>
              {opt.name}
            </Text>
            <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.xs, color: active ? colors.paper.stained : colors.ink.faded, marginTop: spacing.xxs }}>
              {opt.desc}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default ModeToggle;
```
Add to `src/components/molecules/index.ts`:
```typescript
export { ModeToggle, default as ModeToggleDefault } from './ModeToggle';
export type { ModeToggleProps } from './ModeToggle';
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- ModeToggle && npx tsc --noEmit` → PASS (3), exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(molecules): add ModeToggle

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: ToggleRow molecule

A labeled RN `Switch` row for boolean settings. (COMPONENT_LIBRARY.md 3.4 — Sound & Haptics / Accessibility rows)

**Files:**
- Create: `src/components/molecules/ToggleRow.tsx`
- Modify: `src/components/molecules/index.ts`
- Test: `src/components/molecules/__tests__/ToggleRow.test.tsx`

**Interfaces:**
- Consumes: `@/theme`.
- Produces: `ToggleRow` with props `{ label: string; description?: string; value: boolean; onValueChange: (v: boolean) => void; testID?: string }`.

- [ ] **Step 1: Write the failing test**

Create `src/components/molecules/__tests__/ToggleRow.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ToggleRow } from '@/components/molecules';

describe('ToggleRow', () => {
  it('renders its label and description', () => {
    render(<ToggleRow label="Sound" description="Ambient + effects" value onValueChange={() => {}} testID="row" />);
    expect(screen.getByText('Sound')).toBeTruthy();
    expect(screen.getByText('Ambient + effects')).toBeTruthy();
  });

  it('reflects its value on the switch', () => {
    render(<ToggleRow label="Sound" value={false} onValueChange={() => {}} testID="row" />);
    expect(screen.getByTestId('row-switch').props.value).toBe(false);
  });

  it('calls onValueChange when toggled', () => {
    const onValueChange = jest.fn();
    render(<ToggleRow label="Sound" value={false} onValueChange={onValueChange} testID="row" />);
    fireEvent(screen.getByTestId('row-switch'), 'valueChange', true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- ToggleRow` → FAIL.

- [ ] **Step 3: Implement**

Create `src/components/molecules/ToggleRow.tsx`:
```tsx
import React from 'react';
import { View, Text, Switch } from 'react-native';
import { colors, typography, spacing } from '@/theme';

export interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  testID?: string;
}

export function ToggleRow({ label, description, value, onValueChange, testID }: ToggleRowProps) {
  return (
    <View testID={testID} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs, gap: spacing.md }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: typography.fontFamily.body, fontSize: typography.size.md, color: colors.ink.primary }}>{label}</Text>
        {description ? (
          <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.xs, color: colors.ink.faded }}>{description}</Text>
        ) : null}
      </View>
      <Switch
        testID={`${testID}-switch`}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.region.pnw, false: colors.paper.shadow }}
        thumbColor={colors.paper.cream}
      />
    </View>
  );
}

export default ToggleRow;
```
Add to `src/components/molecules/index.ts`:
```typescript
export { ToggleRow, default as ToggleRowDefault } from './ToggleRow';
export type { ToggleRowProps } from './ToggleRow';
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- ToggleRow && npx tsc --noEmit` → PASS (3), exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(molecules): add ToggleRow

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: SettingsScreen component

Groups the controls, wired to the stores. (SCREEN_SPECS.md Screen 8; COMPONENT_LIBRARY.md 3.4)

**Files:**
- Create: `src/components/screens/SettingsScreen.tsx`
- Modify: `src/components/screens/index.ts`
- Test: `src/components/screens/__tests__/SettingsScreen.test.tsx`

**Interfaces:**
- Consumes: `@/theme`; `useSettingsStore`, `useProgressStore` from `@/state`; `IconButton`, `Button`, `Divider`, `PaperSurface` from `@/components/atoms`; `ModeToggle`, `ToggleRow` from `@/components/molecules`.
- Produces: `SettingsScreen` with props `{ onBack: () => void; testID?: string }`.

- [ ] **Step 1: Write the failing test**

Create `src/components/screens/__tests__/SettingsScreen.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SettingsScreen } from '@/components/screens';
import { useSettingsStore, useProgressStore } from '@/state';

beforeEach(() => {
  useSettingsStore.getState().hydrate({ mode: 'cozy', soundEnabled: true, hapticsEnabled: true, reduceMotion: false, ambientAudioVolume: 1, effectsAudioVolume: 1 });
  useProgressStore.getState().hydrate({ solved: {}, onboardingCompleted: false, firstLaunchAt: 0 });
});

describe('SettingsScreen', () => {
  it('renders the sections and the current solved count', () => {
    useProgressStore.getState().markSolved('p1', { time: 10, mistakes: 0 });
    render(<SettingsScreen onBack={() => {}} testID="settings" />);
    expect(screen.getByText(/Settings/i)).toBeTruthy();
    expect(screen.getByText('Cozy')).toBeTruthy();
    expect(screen.getByText(/1 sighting/)).toBeTruthy();
  });

  it('switches the game mode via the ModeToggle', () => {
    render(<SettingsScreen onBack={() => {}} testID="settings" />);
    fireEvent.press(screen.getByTestId('settings-mode-classic'));
    expect(useSettingsStore.getState().mode).toBe('classic');
  });

  it('toggles sound off through the store', () => {
    render(<SettingsScreen onBack={() => {}} testID="settings" />);
    fireEvent(screen.getByTestId('settings-sound-switch'), 'valueChange', false);
    expect(useSettingsStore.getState().soundEnabled).toBe(false);
  });

  it('clears progress only after a two-step confirm', () => {
    useProgressStore.getState().markSolved('p1', { time: 10, mistakes: 0 });
    render(<SettingsScreen onBack={() => {}} testID="settings" />);
    // first tap arms the confirm; does not clear
    fireEvent.press(screen.getByTestId('settings-clear'));
    expect(useProgressStore.getState().isSolved('p1')).toBe(true);
    // second tap clears
    fireEvent.press(screen.getByTestId('settings-clear'));
    expect(useProgressStore.getState().isSolved('p1')).toBe(false);
  });

  it('calls onBack from the back control', () => {
    const onBack = jest.fn();
    render(<SettingsScreen onBack={onBack} testID="settings" />);
    fireEvent.press(screen.getByTestId('settings-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- SettingsScreen` → FAIL.

- [ ] **Step 3: Implement**

Create `src/components/screens/SettingsScreen.tsx`:
```tsx
import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { useSettingsStore, useProgressStore } from '@/state';
import { IconButton, Button, Divider, PaperSurface } from '@/components/atoms';
import { ModeToggle, ToggleRow } from '@/components/molecules';

export interface SettingsScreenProps {
  onBack: () => void;
  testID?: string;
}

const APP_VERSION = '1.0.0';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.sm, letterSpacing: typography.letterSpacing.wider, color: colors.ink.faded, textTransform: 'uppercase', marginBottom: spacing.sm }}>
      {children}
    </Text>
  );
}

export function SettingsScreen({ onBack, testID }: SettingsScreenProps) {
  const mode = useSettingsStore((s) => s.mode);
  const setMode = useSettingsStore((s) => s.setMode);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const setReduceMotion = useSettingsStore((s) => s.setReduceMotion);
  const solvedCount = useProgressStore((s) => Object.keys(s.solved).length);
  const clearAll = useProgressStore((s) => s.clearAll);

  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearAll();
    setConfirmClear(false);
  };

  const onRestore = () => {
    // MOCK: no real receipts to restore yet. Must NOT wipe purchaseStore.
    // Real restore-purchases wiring lands with RevenueCat.
  };

  return (
    <ScrollView testID={testID} style={{ flex: 1, backgroundColor: colors.paper.cream }} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton icon="back" variant="ghost" accessibilityLabel="Back" onPress={onBack} testID="settings-back" />
        <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.xl, letterSpacing: typography.letterSpacing.wider, color: colors.ink.primary, textTransform: 'uppercase', marginLeft: spacing.sm }}>
          Settings
        </Text>
      </View>

      <PaperSurface variant="aged" padding="md">
        <SectionLabel>Investigation Style</SectionLabel>
        <ModeToggle mode={mode} onChange={setMode} testID="settings-mode" />
      </PaperSurface>

      <PaperSurface variant="aged" padding="md">
        <SectionLabel>Sound &amp; Haptics</SectionLabel>
        <ToggleRow label="Sound" description="Ambient and effects" value={soundEnabled} onValueChange={setSoundEnabled} testID="settings-sound" />
        <Divider />
        <ToggleRow label="Haptics" description="Vibration feedback" value={hapticsEnabled} onValueChange={setHapticsEnabled} testID="settings-haptics" />
      </PaperSurface>

      <PaperSurface variant="aged" padding="md">
        <SectionLabel>Accessibility</SectionLabel>
        <ToggleRow label="Reduce Motion" description="Calmer animations" value={reduceMotion} onValueChange={setReduceMotion} testID="settings-reduce-motion" />
      </PaperSurface>

      <PaperSurface variant="aged" padding="md">
        <SectionLabel>Field Data</SectionLabel>
        <Text style={{ fontFamily: typography.fontFamily.body, fontSize: typography.size.md, color: colors.ink.soft, marginBottom: spacing.sm }}>
          {`${solvedCount} sighting${solvedCount === 1 ? '' : 's'} confirmed`}
        </Text>
        <Button
          label={confirmClear ? 'Tap again to confirm' : 'Clear All Data'}
          variant="danger"
          fullWidth
          onPress={handleClear}
          testID="settings-clear"
        />
      </PaperSurface>

      <PaperSurface variant="aged" padding="md">
        <SectionLabel>Purchases</SectionLabel>
        <Button label="Restore Purchases" variant="secondary" fullWidth onPress={onRestore} testID="settings-restore" />
      </PaperSurface>

      <Text style={{ fontFamily: typography.fontFamily.body, fontSize: typography.size.xs, color: colors.ink.faded, textAlign: 'center', marginTop: spacing.sm }}>
        {`Picross: Cryptozoology · v${APP_VERSION}`}
      </Text>
    </ScrollView>
  );
}

export default SettingsScreen;
```
Add to `src/components/screens/index.ts`:
```typescript
export { SettingsScreen, default as SettingsScreenDefault } from './SettingsScreen';
export type { SettingsScreenProps } from './SettingsScreen';
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- SettingsScreen && npx tsc --noEmit` → PASS (5), exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(screens): add SettingsScreen

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: `/settings` route + Home gear

Wire Settings into Expo Router and add a gear to Home. (SCREEN_SPECS.md Screen 2/8)

**Files:**
- Create: `src/app/settings.tsx`
- Modify: `src/app/index.tsx` (add a settings gear)

**Interfaces:**
- Consumes: `expo-router`; `SettingsScreen` from `@/components/screens`; `IconButton` from `@/components/atoms`.
- Produces: a `/settings` route; Home has a gear that navigates to it.

- [ ] **Step 1: Create the settings route**

Create `src/app/settings.tsx`:
```tsx
import React from 'react';
import { useRouter } from 'expo-router';
import { SettingsScreen } from '@/components/screens';

export default function SettingsRoute() {
  const router = useRouter();
  return <SettingsScreen onBack={() => router.back()} />;
}
```

- [ ] **Step 2: Add a gear to Home**

Modify `src/app/index.tsx`: add a settings gear that navigates to `/settings`. Import `IconButton` from `@/components/atoms`. Inside the `View` (before the content, positioned top-right), add:
```tsx
<View style={styles.gear}>
  <IconButton icon="settings" variant="ghost" accessibilityLabel="Settings" onPress={() => router.push('/settings')} testID="home-settings" />
</View>
```
And add to the `StyleSheet`:
```tsx
gear: { position: 'absolute', top: spacing.xl, right: spacing.md },
```
Keep the existing Home content, the `home-play-sample` entry, `useRouter`, and all other styles unchanged; this is an addition.

- [ ] **Step 3: Full suite + typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: entire suite green, tsc exit 0.

- [ ] **Step 4: Runnable check (headless bundle)**

Run:
```bash
rm -rf /tmp/cp-settings-export && npx expo export --platform ios --output-dir /tmp/cp-settings-export >/tmp/cp-settings.log 2>&1; echo "export exit: $?"
```
Expected: `export exit: 0`. If it fails, read `/tmp/cp-settings.log`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(app): add /settings route + Home gear

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the executor

- Clear All Data clears **progress only** (via `progressStore.clearAll`) — it must NOT touch `purchaseStore` (never silently revoke purchases). Two-step inline confirm, no modal.
- Restore is a documented mock no-op — must NOT call `purchaseStore.restore([])` (that clears owned regions). Real IAP restore lands with RevenueCat.
- Settings changes flow through `settingsStore` actions, which persist via the save system already in place.
- "Larger Cells" accessibility toggle and audio-volume sliders are deferred (no `largerCells` field in the store yet); only mode / sound / haptics / reduce-motion are exposed here.
- The proper Confirm dialog modal (SCREEN_SPECS global) is a later polish; the two-step button confirm is the v1 stand-in.
