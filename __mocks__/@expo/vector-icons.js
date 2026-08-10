// Mock for @expo/vector-icons
import React from 'react';

export const Feather = function MockFeather({ name, size, color, testID, accessibilityLabel, ...rest }) {
  return React.createElement('View', { testID, accessibilityLabel, ...rest });
};

Feather.glyphMap = {
  'chevron-left': 'chevron-left',
  settings: 'settings',
  x: 'x',
  menu: 'menu',
  'rotate-ccw': 'rotate-ccw',
  'rotate-cw': 'rotate-cw',
  'help-circle': 'help-circle',
  pause: 'pause',
  square: 'square',
  'x-square': 'x-square',
  check: 'check',
  'map-pin': 'map-pin',
  book: 'book',
  image: 'image',
  sun: 'sun',
  lock: 'lock',
  unlock: 'unlock',
  star: 'star',
};

// Default export for backwards compatibility
export default { Feather };
