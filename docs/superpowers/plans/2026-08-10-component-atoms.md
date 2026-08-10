# Component Library — Atoms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the five atom components from COMPONENT_LIBRARY.md — `PaperSurface`, `Divider`, `Stamp`, `Button`, `IconButton` — styled entirely from `@/theme`, animated with Reanimated 3, each with a test covering its documented states, and each exported from an atoms barrel.

**Architecture:** Atoms are stateless UI primitives that take props and render (COMPONENT_LIBRARY.md Part 1). They import only from `@/theme` and, for animation, Reanimated 3 (native-thread; the JS `Animated` API is banned per QA_AND_LAUNCH.md §4.4). Motion respects reduced-motion via Reanimated's `useReducedMotion()` (the app-level `settingsStore` doesn't exist yet; system setting is the source until it does). Each component lives in its own file under `src/components/atoms/` and is re-exported from `src/components/atoms/index.ts`.

**Tech Stack:** React Native + Expo SDK 57, TypeScript, `react-native-reanimated` (v4, SDK-57 compatible), `expo-linear-gradient`, `expo-haptics`, `@expo/vector-icons` (bundled with Expo), Jest (`jest-expo`) + `@testing-library/react-native` v13.

## Global Constraints

- Never inline color/spacing/font/duration/radius values; import from `@/theme`. Missing value → add to `src/theme` + `design/DESIGN_TOKENS.md` first. (COMPONENT_LIBRARY.md → Design System Quick Reference)
- Props are semantic (`variant`, `size`, `disabled`), never literal (`marginTop`, `backgroundColor`). One-off adjustments only via the `style` escape hatch. (COMPONENT_LIBRARY.md Part 6)
- Every event handler prop is named `on<Verb>` (e.g. `onPress`). (COMPONENT_LIBRARY.md Part 6)
- Atoms MUST NOT import molecules or organisms. Atoms hold no state beyond animation/interaction locals. (COMPONENT_LIBRARY.md Part 1 & 6)
- All animation runs on the native thread via Reanimated 3 — no `Animated` API from `react-native`. (QA_AND_LAUNCH.md §4.4)
- Reduced motion (system setting via `useReducedMotion()`): collapse every animation to its final state instantly — no scale-in, no press-scale. (QA_AND_LAUNCH.md §2.6)
- Touch targets ≥ 44pt; icon-only buttons MUST have `accessibilityLabel`; interactive elements set `accessibilityRole`. (COMPONENT_LIBRARY.md Part 4)
- Testing: `@testing-library/react-native` is **v13** — `render` and `renderHook` are **synchronous**; do NOT `await` them in new tests.
- Every commit message ends with the trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Project root: `/home/chris/Code/cryptid-picross`. `.npmrc` sets `legacy-peer-deps=true`; use `npx expo install` for native deps so versions match SDK 57.

---

### Task 1: Animation / gradient / haptics foundation

Install and wire Reanimated 3 (babel plugin + jest mock), `expo-linear-gradient`, and `expo-haptics`. Verify the existing suite still passes and the app still bundles — Reanimated's babel plugin ordering is the usual failure point.

**Files:**
- Modify: `babel.config.js` (add reanimated plugin LAST)
- Create: `jest.setup.js`
- Modify: `jest.config.js` (register `setupFiles`)
- Modify: `package.json` (deps via expo install)
- Create: `src/components/atoms/__tests__/reanimated-smoke.test.tsx`

**Interfaces:**
- Produces: a working Reanimated 3 runtime + test environment that all later atom tasks rely on. No exported API.

- [ ] **Step 1: Install the native dependencies**

Run:
```bash
cd /home/chris/Code/cryptid-picross
npx expo install react-native-reanimated expo-linear-gradient expo-haptics
```
Then note the installed Reanimated major — it decides the babel plugin in Step 2:
```bash
node -p "require('react-native-reanimated/package.json').version"
ls node_modules/react-native-worklets/package.json 2>/dev/null && echo "worklets present"
```
Reanimated **4.x** relies on a separate `react-native-worklets` package (expo install usually adds it automatically; if not, run `npx expo install react-native-worklets`). Reanimated **3.x** does not.

- [ ] **Step 2: Add the worklets/Reanimated babel plugin LAST (version-dependent)**

The plugin MUST be the last entry in `plugins`, after `module-resolver`. **Which plugin depends on the installed Reanimated major:**
- Reanimated **4.x** → `'react-native-worklets/plugin'`
- Reanimated **3.x** → `'react-native-reanimated/plugin'`

Use the one matching Step 1's output. For Reanimated 4 (the likely SDK 57 version), `babel.config.js` is:
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
      'react-native-worklets/plugin', // Reanimated 4: MUST be last. (Reanimated 3 → 'react-native-reanimated/plugin')
    ],
  };
};
```
If unsure, the installed Reanimated version's official docs are authoritative on the plugin name. Getting this wrong makes Metro/`expo export` fail in Step 7 — that's the signal you picked the wrong plugin.

- [ ] **Step 3: Create the jest setup with the Reanimated mock**

Create `jest.setup.js`:
```javascript
// Reanimated's official jest mock — makes animated components render in tests.
require('react-native-reanimated').setUpTests?.();
```
Note: if this version of Reanimated does not export `setUpTests`, fall back to the documented mock for the installed version (e.g. `jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))`). Choose whichever makes Step 6 pass; document which you used in the report.

- [ ] **Step 4: Register the setup file in jest.config.js**

Add `setupFiles` to `jest.config.js` (keep the existing `preset`, `moduleNameMapper`, `transformIgnorePatterns`):
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-reanimated|react-native-worklets))',
  ],
};
```

- [ ] **Step 5: Write a smoke test that renders a Reanimated view**

Create `src/components/atoms/__tests__/reanimated-smoke.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import Animated from 'react-native-reanimated';

describe('reanimated foundation', () => {
  it('renders an Animated.View without crashing', () => {
    render(<Animated.View testID="anim" />);
    expect(screen.getByTestId('anim')).toBeTruthy();
  });
});
```

- [ ] **Step 6: Run the full suite — everything green**

Run:
```bash
npm test
```
Expected: all suites pass, including the new smoke test (7 tests total). If the Reanimated mock errors, fix `jest.setup.js` per Step 3's note.

- [ ] **Step 7: Verify the app still bundles (babel plugin didn't break Metro)**

Run:
```bash
npx tsc --noEmit && rm -rf /tmp/cp-atoms-export && npx expo export --platform ios --output-dir /tmp/cp-atoms-export >/tmp/cp-atoms.log 2>&1; echo "export exit: $?"
```
Expected: `tsc` exits 0 and `export exit: 0`. If export fails, read `/tmp/cp-atoms.log` (usual cause: reanimated plugin not last).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: add reanimated 3 + linear-gradient + haptics foundation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: PaperSurface atom

Textured paper background wrapper. Every card/panel uses it; nothing floats on transparent. (COMPONENT_LIBRARY.md 1.5)

**Files:**
- Create: `src/components/atoms/PaperSurface.tsx`
- Create: `src/components/atoms/index.ts`
- Test: `src/components/atoms/__tests__/PaperSurface.test.tsx`

**Interfaces:**
- Consumes: `@/theme` (`colors`, `spacing`, `radius`).
- Produces: `PaperSurface` (default export + named) with props:
  ```typescript
  interface PaperSurfaceProps {
    children?: React.ReactNode;
    variant?: 'cream' | 'aged' | 'stained';   // default 'cream'
    elevated?: boolean;                         // adds warm shadow
    padding?: keyof typeof spacing;             // default 'md'
    regionTint?: string;                        // hex overlaid ~10% opacity
    style?: StyleProp<ViewStyle>;
    testID?: string;
  }
  ```
  and `src/components/atoms/index.ts` re-exporting it.

- [ ] **Step 1: Write the failing test**

Create `src/components/atoms/__tests__/PaperSurface.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { PaperSurface } from '@/components/atoms';

describe('PaperSurface', () => {
  it('renders its children', () => {
    render(
      <PaperSurface testID="surface">
        <Text>inside</Text>
      </PaperSurface>,
    );
    expect(screen.getByTestId('surface')).toBeTruthy();
    expect(screen.getByText('inside')).toBeTruthy();
  });

  it('applies a warm shadow when elevated', () => {
    render(<PaperSurface testID="surface" elevated />);
    const style = screen.getByTestId('surface').props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style.flat()) : style;
    expect(flat.shadowColor).toBe('#8A7443');
  });

  it('renders a region tint overlay when regionTint is set', () => {
    render(<PaperSurface testID="surface" regionTint="#5D6B4E" />);
    expect(screen.getByTestId('tint-overlay')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- PaperSurface`
Expected: FAIL — cannot find module `@/components/atoms`.

- [ ] **Step 3: Implement PaperSurface**

Create `src/components/atoms/PaperSurface.tsx`:
```tsx
import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius } from '@/theme';

export interface PaperSurfaceProps {
  children?: React.ReactNode;
  variant?: 'cream' | 'aged' | 'stained';
  elevated?: boolean;
  padding?: keyof typeof spacing;
  regionTint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const BASE: Record<NonNullable<PaperSurfaceProps['variant']>, string> = {
  cream: colors.paper.cream,
  aged: colors.paper.aged,
  stained: colors.paper.stained,
};

// The single warm-shadow recipe (DESIGN_TOKENS §1.7). Never a cold gray shadow.
const ELEVATION: ViewStyle = {
  shadowColor: colors.shadow.color,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
  elevation: 3,
};

export function PaperSurface({
  children,
  variant = 'cream',
  elevated = false,
  padding = 'md',
  regionTint,
  style,
  testID,
}: PaperSurfaceProps) {
  const base = BASE[variant];
  return (
    <View
      testID={testID}
      style={[{ borderRadius: radius.md, overflow: 'hidden' }, elevated && ELEVATION, style]}
    >
      {/* 2-stop paper gradient: highlight → base (grain PNG is a later asset) */}
      <LinearGradient
        colors={[colors.paper.highlight, base]}
        style={{ padding: spacing[padding] }}
      >
        {regionTint ? (
          <View
            testID="tint-overlay"
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: regionTint,
              opacity: 0.1,
            }}
          />
        ) : null}
        {children}
      </LinearGradient>
    </View>
  );
}

export default PaperSurface;
```

Create `src/components/atoms/index.ts`:
```typescript
export { PaperSurface, default as PaperSurfaceDefault } from './PaperSurface';
export type { PaperSurfaceProps } from './PaperSurface';
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- PaperSurface`
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc --noEmit && git add -A && git commit -m "feat(atoms): add PaperSurface

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Divider atom

Dashed horizontal line between sections. Dashed is the house default; solid feels clinical. (COMPONENT_LIBRARY.md 1.4)

**Files:**
- Create: `src/components/atoms/Divider.tsx`
- Modify: `src/components/atoms/index.ts` (add export)
- Test: `src/components/atoms/__tests__/Divider.test.tsx`

**Interfaces:**
- Consumes: `@/theme` (`colors`, `spacing`).
- Produces: `Divider` with props:
  ```typescript
  interface DividerProps {
    color?: string;                       // default colors.ink.faded
    spacing?: keyof typeof spacingTokens;  // vertical margin, default 'md'
    variant?: 'dashed' | 'solid' | 'double'; // default 'dashed'
    testID?: string;
  }
  ```
  (Named `variant`, not `style`, to avoid clashing with RN's `style` and the plan's semantic-prop rule.)

- [ ] **Step 1: Write the failing test**

Create `src/components/atoms/__tests__/Divider.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import { Divider } from '@/components/atoms';

const flatten = (s: unknown) =>
  Array.isArray(s) ? Object.assign({}, ...(s as unknown[]).flat().filter(Boolean)) : (s as Record<string, unknown>);

describe('Divider', () => {
  it('defaults to a dashed line', () => {
    render(<Divider testID="d" />);
    expect(flatten(screen.getByTestId('d').props.style).borderStyle).toBe('dashed');
  });

  it('supports a solid variant', () => {
    render(<Divider testID="d" variant="solid" />);
    expect(flatten(screen.getByTestId('d').props.style).borderStyle).toBe('solid');
  });

  it('renders two lines for the double variant', () => {
    render(<Divider testID="d" variant="double" />);
    expect(screen.getByTestId('d-line-2')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- Divider` → FAIL (no export `Divider`).

- [ ] **Step 3: Implement Divider**

Create `src/components/atoms/Divider.tsx`:
```tsx
import React from 'react';
import { View } from 'react-native';
import { colors, spacing as spacingTokens } from '@/theme';

export interface DividerProps {
  color?: string;
  spacing?: keyof typeof spacingTokens;
  variant?: 'dashed' | 'solid' | 'double';
  testID?: string;
}

export function Divider({
  color = colors.ink.faded,
  spacing = 'md',
  variant = 'dashed',
  testID,
}: DividerProps) {
  const line = {
    borderBottomWidth: 1,
    borderColor: color,
    borderStyle: (variant === 'double' ? 'solid' : variant) as 'dashed' | 'solid',
  };
  const margin = { marginVertical: spacingTokens[spacing] };

  if (variant === 'double') {
    return (
      <View testID={testID} style={[margin, line]}>
        <View testID={`${testID}-line-2`} style={[{ marginTop: 3 }, line]} />
      </View>
    );
  }
  return <View testID={testID} style={[margin, line]} />;
}

export default Divider;
```
Add to `src/components/atoms/index.ts`:
```typescript
export { Divider, default as DividerDefault } from './Divider';
export type { DividerProps } from './Divider';
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- Divider` → PASS (3 tests).

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc --noEmit && git add -A && git commit -m "feat(atoms): add Divider

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Stamp atom

The rotated "SIGHTING CONFIRMED" / "REDACTED" label with an optional dramatic scale-in. (COMPONENT_LIBRARY.md 1.3)

**Files:**
- Create: `src/components/atoms/Stamp.tsx`
- Modify: `src/components/atoms/index.ts`
- Test: `src/components/atoms/__tests__/Stamp.test.tsx`

**Interfaces:**
- Consumes: `@/theme` (`colors`, `typography`, `spacing`, `radius`), `react-native-reanimated`.
- Produces: `Stamp` with props:
  ```typescript
  interface StampProps {
    text: string;
    color?: 'red' | 'candle' | 'ink';   // default 'red'
    rotation?: number;                    // degrees, default -4
    size?: 'sm' | 'md' | 'lg';            // default 'md'
    animateIn?: boolean;                  // scale-in spring on mount
    testID?: string;
  }
  ```

- [ ] **Step 1: Write the failing test**

Create `src/components/atoms/__tests__/Stamp.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import { Stamp } from '@/components/atoms';

describe('Stamp', () => {
  it('renders its text uppercased-in-style and readable', () => {
    render(<Stamp text="Sighting Confirmed" testID="stamp" />);
    expect(screen.getByText('Sighting Confirmed')).toBeTruthy();
    expect(screen.getByTestId('stamp')).toBeTruthy();
  });

  it('uses the oxblood stamp red border by default', () => {
    render(<Stamp text="Redacted" testID="stamp" />);
    const style = screen.getByTestId('stamp').props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style.flat().filter(Boolean)) : style;
    expect(flat.borderColor).toBe('#9B3B2E');
  });

  it('renders with animateIn without crashing', () => {
    render(<Stamp text="Unlocked" testID="stamp" animateIn />);
    expect(screen.getByTestId('stamp')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- Stamp` → FAIL.

- [ ] **Step 3: Implement Stamp**

Create `src/components/atoms/Stamp.tsx`:
```tsx
import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors, typography, spacing, radius } from '@/theme';

export interface StampProps {
  text: string;
  color?: 'red' | 'candle' | 'ink';
  rotation?: number;
  size?: 'sm' | 'md' | 'lg';
  animateIn?: boolean;
  testID?: string;
}

const COLOR: Record<NonNullable<StampProps['color']>, string> = {
  red: colors.accent.stampRed,
  candle: colors.accent.candleGlow,
  ink: colors.ink.primary,
};

const FONT_SIZE: Record<NonNullable<StampProps['size']>, number> = {
  sm: typography.size.md,
  md: typography.size.lg,
  lg: typography.size['2xl'],
};

export function Stamp({
  text,
  color = 'red',
  rotation = -4,
  size = 'md',
  animateIn = false,
  testID,
}: StampProps) {
  const c = COLOR[color];
  const scale = useSharedValue(animateIn ? 3 : 1);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (animateIn && !reduced) {
      scale.value = withSequence(
        withTiming(0.9, { duration: 300 }),
        withTiming(1, { duration: 300 }),
      );
    } else {
      scale.value = 1;
    }
  }, [animateIn, reduced, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation}deg` }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      testID={testID}
      style={[styles.box, { borderColor: c }, animStyle]}
    >
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: typography.fontFamily.display,
          fontSize: FONT_SIZE[size],
          letterSpacing: typography.letterSpacing.widest,
          color: c,
          textTransform: 'uppercase',
        }}
      >
        {text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: 'flex-start',
    borderWidth: 2.5,
    borderRadius: radius.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});

export default Stamp;
```
Add to `src/components/atoms/index.ts`:
```typescript
export { Stamp, default as StampDefault } from './Stamp';
export type { StampProps } from './Stamp';
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- Stamp` → PASS (3 tests).

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc --noEmit && git add -A && git commit -m "feat(atoms): add Stamp

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Button atom

Primary tappable action with label, three variants, press-scale, haptics, loading + disabled states. (COMPONENT_LIBRARY.md 1.1)

**Files:**
- Create: `src/components/atoms/Button.tsx`
- Modify: `src/components/atoms/index.ts`
- Test: `src/components/atoms/__tests__/Button.test.tsx`

**Interfaces:**
- Consumes: `@/theme`, `react-native-reanimated`, `expo-haptics`.
- Produces: `Button` with props:
  ```typescript
  interface ButtonProps {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger'; // default 'primary'
    size?: 'sm' | 'md' | 'lg';                     // default 'md'
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    accessibilityLabel?: string;                    // defaults to label
    accessibilityHint?: string;
    testID?: string;
  }
  ```

- [ ] **Step 1: Write the failing test**

Create `src/components/atoms/__tests__/Button.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/atoms';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('Button', () => {
  it('renders its label', () => {
    render(<Button label="Add to Guide" onPress={() => {}} />);
    expect(screen.getByText('Add to Guide')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<Button label="Go" onPress={onPress} testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button label="Go" onPress={onPress} disabled testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a spinner and hides the label while loading', () => {
    render(<Button label="Saving" onPress={() => {}} loading testID="btn" />);
    expect(screen.queryByText('Saving')).toBeNull();
    expect(screen.getByTestId('btn-spinner')).toBeTruthy();
  });

  it('exposes an accessible button role and defaults the label', () => {
    render(<Button label="Restore" onPress={() => {}} testID="btn" />);
    const node = screen.getByTestId('btn');
    expect(node.props.accessibilityRole).toBe('button');
    expect(node.props.accessibilityLabel).toBe('Restore');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- Button` → FAIL.

- [ ] **Step 3: Implement Button**

Create `src/components/atoms/Button.tsx`:
```tsx
import React from 'react';
import { Text, Pressable, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, motion } from '@/theme';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const HEIGHT: Record<NonNullable<ButtonProps['size']>, number> = { sm: 32, md: 44, lg: 56 };

function palette(variant: NonNullable<ButtonProps['variant']>): {
  bg: string; border: string; text: string;
} {
  switch (variant) {
    case 'secondary':
      return { bg: 'transparent', border: colors.ink.primary, text: colors.ink.primary };
    case 'danger':
      return { bg: 'transparent', border: colors.accent.stampRed, text: colors.accent.stampRed };
    case 'primary':
    default:
      return { bg: colors.ink.primary, border: colors.ink.primary, text: colors.paper.cream };
  }
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const p = palette(variant);
  const scale = useSharedValue(1);
  const reduced = useReducedMotion();
  const inactive = disabled || loading;

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const press = () => {
    if (inactive) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const container: ViewStyle = {
    minHeight: Math.max(HEIGHT[size], 44), // never below the 44pt touch target
    backgroundColor: p.bg,
    borderColor: p.border,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.4 : 1,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
  };
  const text: TextStyle = {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.size.md,
    letterSpacing: typography.letterSpacing.wider,
    color: p.text,
    textTransform: 'uppercase',
  };

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPressIn={() => {
        if (!inactive && !reduced) scale.value = withTiming(0.97, { duration: motion.duration.instant });
      }}
      onPressOut={() => {
        if (!reduced) scale.value = withTiming(1, { duration: motion.duration.instant });
      }}
      onPress={press}
      style={[container, animStyle]}
    >
      {loading ? (
        <ActivityIndicator testID={`${testID}-spinner`} color={p.text} />
      ) : (
        <Text allowFontScaling style={text}>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}

export default Button;
```
Add to `src/components/atoms/index.ts`:
```typescript
export { Button, default as ButtonDefault } from './Button';
export type { ButtonProps } from './Button';
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- Button` → PASS (5 tests).

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc --noEmit && git add -A && git commit -m "feat(atoms): add Button

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: IconButton atom

Icon-only tappable control (back arrows, settings gear, tool selection). Requires an accessibility label. (COMPONENT_LIBRARY.md 1.2)

**Files:**
- Create: `src/components/atoms/icons.ts` (IconName type + placeholder glyph map)
- Create: `src/components/atoms/IconButton.tsx`
- Modify: `src/components/atoms/index.ts`
- Test: `src/components/atoms/__tests__/IconButton.test.tsx`

**Interfaces:**
- Consumes: `@/theme`, `@expo/vector-icons` (Feather), `expo-haptics`.
- Produces:
  - `icons.ts`: `export type IconName = 'back' | 'settings' | 'close' | 'menu' | 'undo' | 'redo' | 'hint' | 'pause' | 'fill' | 'mark' | 'check' | 'pin' | 'book' | 'polaroid' | 'lantern' | 'lock' | 'unlock' | 'star';` and `export const ICON_GLYPH: Record<IconName, keyof typeof Feather.glyphMap>` mapping each to a Feather placeholder glyph.
  - `IconButton` with props:
    ```typescript
    interface IconButtonProps {
      icon: IconName;
      onPress: () => void;
      variant?: 'default' | 'active' | 'ghost';  // default 'default'
      size?: number;                               // icon px, default 24
      disabled?: boolean;
      accessibilityLabel: string;                  // REQUIRED
      accessibilityHint?: string;
      testID?: string;
    }
    ```

- [ ] **Step 1: Write the failing test**

Create `src/components/atoms/__tests__/IconButton.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { IconButton } from '@/components/atoms';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('IconButton', () => {
  it('renders with its required accessibility label and button role', () => {
    render(<IconButton icon="settings" onPress={() => {}} accessibilityLabel="Settings" testID="ib" />);
    const node = screen.getByTestId('ib');
    expect(node.props.accessibilityRole).toBe('button');
    expect(node.props.accessibilityLabel).toBe('Settings');
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<IconButton icon="back" onPress={onPress} accessibilityLabel="Back" testID="ib" />);
    fireEvent.press(screen.getByTestId('ib'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<IconButton icon="close" onPress={onPress} disabled accessibilityLabel="Close" testID="ib" />);
    fireEvent.press(screen.getByTestId('ib'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('meets the 44pt minimum touch target', () => {
    render(<IconButton icon="hint" onPress={() => {}} accessibilityLabel="Hint" testID="ib" />);
    const style = screen.getByTestId('ib').props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style.flat().filter(Boolean)) : style;
    expect(flat.width).toBeGreaterThanOrEqual(44);
    expect(flat.height).toBeGreaterThanOrEqual(44);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- IconButton` → FAIL.

- [ ] **Step 3: Implement the icon map and IconButton**

Create `src/components/atoms/icons.ts`:
```typescript
import { Feather } from '@expo/vector-icons';

export type IconName =
  | 'back' | 'settings' | 'close' | 'menu'
  | 'undo' | 'redo' | 'hint' | 'pause'
  | 'fill' | 'mark' | 'check'
  | 'pin' | 'book' | 'polaroid' | 'lantern'
  | 'lock' | 'unlock' | 'star';

// PLACEHOLDER glyphs from Feather until paper-drawn illustration assets exist.
// The IconName vocabulary is the stable contract; swap the glyph source later.
export const ICON_GLYPH: Record<IconName, keyof typeof Feather.glyphMap> = {
  back: 'chevron-left',
  settings: 'settings',
  close: 'x',
  menu: 'menu',
  undo: 'rotate-ccw',
  redo: 'rotate-cw',
  hint: 'help-circle',
  pause: 'pause',
  fill: 'square',
  mark: 'x-square',
  check: 'check',
  pin: 'map-pin',
  book: 'book',
  polaroid: 'image',
  lantern: 'sun',
  lock: 'lock',
  unlock: 'unlock',
  star: 'star',
};
```

Create `src/components/atoms/IconButton.tsx`:
```tsx
import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius, layout } from '@/theme';
import { IconName, ICON_GLYPH } from './icons';

export interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  variant?: 'default' | 'active' | 'ghost';
  size?: number;
  disabled?: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
  testID?: string;
}

function palette(variant: NonNullable<IconButtonProps['variant']>): { bg: string; tint: string } {
  switch (variant) {
    case 'active':
      return { bg: colors.ink.primary, tint: colors.paper.cream };
    case 'ghost':
      return { bg: 'transparent', tint: colors.ink.soft };
    case 'default':
    default:
      return { bg: colors.paper.aged, tint: colors.ink.primary };
  }
}

export function IconButton({
  icon,
  onPress,
  variant = 'default',
  size = 24,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: IconButtonProps) {
  const p = palette(variant);
  const container: ViewStyle = {
    width: layout.touchTarget,
    height: layout.touchTarget,
    borderRadius: radius.full,
    backgroundColor: p.bg,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.4 : 1,
  };
  const press = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={press}
      style={container}
    >
      <Feather name={ICON_GLYPH[icon]} size={size} color={p.tint} />
    </Pressable>
  );
}

export default IconButton;
```
Add to `src/components/atoms/index.ts`:
```typescript
export { IconButton, default as IconButtonDefault } from './IconButton';
export type { IconButtonProps } from './IconButton';
export type { IconName } from './icons';
export { ICON_GLYPH } from './icons';
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- IconButton` → PASS (4 tests).

- [ ] **Step 5: Full suite, typecheck, commit**

```bash
npm test && npx tsc --noEmit && git add -A && git commit -m "feat(atoms): add IconButton + icon map

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
Expected: entire suite green (PaperSurface, Divider, Stamp, Button, IconButton, plus the scaffold's original tests), tsc exit 0.

---

## Notes for the executor

- **Icons are placeholders.** `@expo/vector-icons` (Feather) stands in for the paper-drawn illustration set the specs describe. The `IconName` vocabulary is the stable contract; only `ICON_GLYPH` changes when real art arrives.
- **PaperSurface grain** is a 2-stop gradient for now; the `paper-noise.png` overlay (DESIGN_TOKENS §6) is a later asset task and does not block these components.
- **Reduced motion** uses Reanimated's `useReducedMotion()` (system setting). When the `settingsStore` lands, components should OR the app-level flag in — out of scope here.
- **Style-introspection tests** read `props.style` and flatten it; if a RN/RNTL version renders style differently, assert via `toHaveStyle` from `@testing-library/react-native` instead — keep the assertion's intent (the specific token value), not the mechanism.
- This plan builds atoms only. Molecules (PuzzleCell, TierBadge, Polaroid, cards…) and organisms (PuzzleGrid, WorldMap…) need the domain types (`Grid`, `Tier`, `Puzzle`, `FieldEntry`) and stores/engine — separate plans.
