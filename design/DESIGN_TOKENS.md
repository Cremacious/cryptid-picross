# DESIGN_TOKENS.md
### Picross: Cryptozoology — The Design System

*The single source of truth for every color, font, size, space, radius, and motion value in the app. This is the human-readable companion to `/src/theme/*`. If the code and this document disagree, fix whichever is wrong — but they must agree. Never inline a raw value in a component; if a token is missing, add it here and in `/src/theme` first.*

**Aesthetic:** *aged notebook, quietly atmospheric.* A field investigator's case file — warm paper, typewritten reports, muted oxblood stamps, restrained motion. Cozy in soul, professional in execution: proper tonal ramps, warm shadows, small radii, generous whitespace, and color used with discipline.

---

## 1 — Color

### 1.1 Paper (backgrounds)

A five-stop warm ramp, light → dark. Backgrounds, cards, and borders all draw from here.

| Token | Hex | Use |
|---|---|---|
| `paper.highlight` | `#FBF4E2` | lifted surfaces, page edges, gradient tops |
| `paper.cream` | `#F1E8D3` | **app background** (the base note) |
| `paper.aged` | `#E4D7BA` | cards, secondary surfaces |
| `paper.stained` | `#D2C09B` | pressed / inset states, tea-stains |
| `paper.shadow` | `#B7A47C` | borders, dashed dividers, deep grain |

### 1.2 Ink (text + filled cells)

| Token | Hex | Contrast on `paper.cream` | Rating | Use |
|---|---|---|---|---|
| `ink.primary` | `#2B241B` | 11.2:1 | AAA | body text, filled puzzle cells |
| `ink.soft` | `#4A3D2C` | 7.4:1 | AAA | secondary text |
| `ink.faded` | `#7A6849` | 3.9:1 | AA (large only) | tertiary text, captions |

> **Rule:** `ink.faded` is only legal at ≥ 14pt bold or ≥ 18pt regular. Never smaller.

### 1.3 Accents (use sparingly — restraint = polish)

| Token | Hex | Use |
|---|---|---|
| `accent.stampRed` | `#9B3B2E` | stamps, Expert tier, destructive actions. Muted oxblood, **never** bright `#FF0000` |
| `accent.candleGlow` | `#C98A3C` | "new best", unlock glow, subtle highlights |

### 1.4 Region tints (the only saturated color)

Each region owns one tint. It appears as a low-opacity surface wash (`regionTint`, 8–15%), the region pin, and the tier mapping.

| Region | Token | Hex | Note |
|---|---|---|---|
| Pacific Northwest | `region.pnw` | `#5D6B4E` | moss |
| Appalachia | `region.appalachia` | `#9C5A3C` | rust |
| British Isles | `region.british` | `#586A78` | slate heather |
| Australian Outback | `region.outback` | `#B5793A` | red ochre |

### 1.5 Difficulty tiers

Color **and** always a text label (never color alone — accessibility).

| Tier | Color token |
|---|---|
| Easy | `region.pnw` (moss) |
| Medium | `paper.shadow` |
| Hard | `region.appalachia` (rust) |
| Expert | `accent.stampRed` |

### 1.6 Puzzle cell surfaces

| State | Fill | Detail |
|---|---|---|
| Empty | `paper.cream` | `paper.shadow` hairline border |
| Filled | `ink.primary` | — |
| Marked | `paper.aged` | small `×` in `accent.stampRed` |
| Wrong (Cozy) | `accent.stampRed` | **also** shakes + plays match-strike sound |

### 1.7 Warm shadow

One elevation recipe. Never a cold gray drop-shadow.

```
shadowColor:  #8A7443
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.15
shadowRadius:  6
```

---

## 2 — Typography

Two families. Both are free Google Fonts and subsettable (keeps the bundle small).

| Role | Family | Used for |
|---|---|---|
| **Display** | `Special Elite` | headers, stamps, buttons, labels, tier badges — all-caps + wide tracking |
| **Body** | `Courier Prime` | case-file prose, UI copy, captions (italic) — readable at paragraph length |

> Load via `expo-font`. Always provide a system-monospace fallback so text never vanishes during load (`'Courier New', monospace`).
> *Swap note:* if long case files ever feel too monospaced, `Lora` is a drop-in body replacement — change one token.

### 2.1 Scale (pt)

| Token | Size | Use |
|---|---|---|
| `xs` | 12 | captions, tertiary labels |
| `sm` | 14 | secondary text, metadata |
| `md` | 16 | **body default** |
| `lg` | 20 | section headers, card titles |
| `xl` | 26 | screen titles |
| `2xl` | 34 | hero moments (stamps, completion) |

### 2.2 Line-height (× size)

`tight 1.15` (display) · `snug 1.35` (titles) · `normal 1.5` (body prose)

### 2.3 Letter-spacing (pt)

`normal 0` · `wide 1.5` (buttons/labels) · `wider 2.5` (badges/small-caps) · `widest 4` (stamps)

### 2.4 Composed roles

Prefer these over assembling props by hand: `stamp`, `screenTitle`, `cardTitle`, `label`, `button`, `body`, `bodyItalic`, `caption`. Defined in `src/theme/typography.ts`.

---

## 3 — Spacing, Radius, Border

### 3.1 Spacing — 4-point scale

`none 0 · xxs 2 · xs 4 · sm 8 · md 16 · lg 24 · xl 32 · 2xl 48 · 3xl 64`

`md` (16) is the default gutter and screen edge padding.

### 3.2 Radius — deliberately small

`none 0 · xs 2 (badges/stamps) · sm 4 (cells/chips) · md 8 (cards/buttons) · lg 12 (rare) · full 999 (pills, pins)`

> Paper and card stock, not glass. Large rounded corners read as generic; 2–8pt reads as printed matter.

### 3.3 Border

`hairline 1 · thin 1.5 · thick 2`. **Dashed is the house default** — solid lines feel clinical (see `Divider`).

---

## 4 — Motion

Durations (ms): `instant 100 · fast 200 · normal 400 · slow 600 · epic 800`.
Easing: `easeOut cubic-bezier(0.22,1,0.36,1)` (default) · `springy cubic-bezier(0.34,1.56,0.64,1)` (playful).
Spring (Reanimated 3): polaroid `{ damping: 15, stiffness: 100 }`.

Choreography timelines (Reveal, region-unlock, home-book-tap) live in `src/theme/motion.ts` so animation code and specs can't drift.

**Reduce-motion (system OR app setting → true):** every duration collapses to instant; drops/scale-ins become cross-fades; no shake (color still shows). Non-negotiable.

---

## 5 — Layout

| Token | Value | Use |
|---|---|---|
| `screenPadding` | 16 | screen edge gutter |
| `touchTarget` | 44 | min tappable size (HIG + Material) |
| `gridCellMin` / `gridCellMax` | 14 / 40 | puzzle cell clamp; below min → ScrollView |
| `book` | 260 × 340 | home field guide |
| `polaroidBorderBottom` | 30 | reveal polaroid lip |
| `maxContentWidth` | 520 | tablet max, keeps notebook intimate |
| `toolbarHeight` | 72 | puzzle bottom bar |

---

## 6 — Texture & Depth

- **Paper grain:** tileable `paper-noise.png` (512×512) at low opacity over a subtle 2-stop gradient (`paper.highlight` → `paper.cream`). Every surface uses `PaperSurface`; nothing floats on transparent.
- **Elevation:** the single warm-shadow recipe in §1.7. Reserved for cards/menus that genuinely lift.
- **Dashed over solid:** dividers, coming-soon borders, and focus rings use dashes.
- **Rotation as personality:** stamps rotate ~-4°, polaroids rest at ~-2° — never a mechanical 0°.

---

## 7 — Usage Rules (enforced in review)

1. No inline colors, sizes, or durations — import from `@/theme`.
2. Props are semantic (`variant`, `size`, `tier`), never literal (`marginTop`, `backgroundColor`).
3. Every color signal has a non-color partner (shape, icon, text, motion, or sound).
4. Reduce-motion is honored everywhere animation exists.
5. Contrast: body text ≥ 4.5:1, large text ≥ 3:1. The palette above is pre-checked.

---

*End of DESIGN_TOKENS.md. This is the foundation the Component Library and Screen Specs build on. Any new token gets an entry here and a matching value in `/src/theme` before it's used.*
