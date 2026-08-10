# src/ layout

- `app/` — Expo Router file-based routes (screens).
- `theme/` — design tokens (colors, typography, spacing, motion, layout). Source of truth; see `design/DESIGN_TOKENS.md`.
- `components/{atoms,molecules,organisms}/` — UI per COMPONENT_LIBRARY.md. Atoms hold no state; organisms may talk to stores.
- `engine/` — pure puzzle logic (clue derivation, uniqueness, difficulty, win check) per DATA_AND_ENGINE.md.
- `content/` — region JSON + generated types.
- `state/` — Zustand stores (progress, settings, purchases, ui).
- `utils/` — cross-cutting helpers (sentry, storage, audio).

Import shared code via the `@/` alias, e.g. `import { colors } from '@/theme'`.
