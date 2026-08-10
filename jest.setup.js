// Reanimated 4 delegates its native layer to react-native-worklets. Jest has no
// native runtime, so worklets must load its official mock before reanimated is
// required — otherwise reanimated's module-scope native init crashes on import.
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/lib/module/mock')
);

// Reanimated's official jest mock — makes animated components render in tests.
require('react-native-reanimated').setUpTests?.();
