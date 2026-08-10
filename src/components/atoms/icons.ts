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
