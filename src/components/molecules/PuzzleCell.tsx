import React, { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography } from '@/theme';
import { PlayCell } from '@/engine';

export interface PuzzleCellProps {
  state: PlayCell;
  isWrong?: boolean;
  size: number;
  onPress: () => void;
  boldRight?: boolean;
  boldBottom?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function fillFor(state: PlayCell): string {
  if (state === 1) return colors.cell.filled;
  if (state === 2) return colors.cell.marked;
  return colors.cell.empty; // 0 and 3 (wrong) sit on the empty surface; 3 shows a red ×
}

function PuzzleCellBase({
  state,
  isWrong = false,
  size,
  onPress,
  boldRight = false,
  boldBottom = false,
  accessibilityLabel,
  testID,
}: PuzzleCellProps) {
  const scale = useSharedValue(1);
  const shake = useSharedValue(0);
  const reduced = useReducedMotion();

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: shake.value }],
  }));

  useEffect(() => {
    if (isWrong && !reduced) {
      shake.value = withSequence(
        withTiming(-3, { duration: 40 }),
        withTiming(3, { duration: 40 }),
        withTiming(0, { duration: 40 }),
      );
    }
  }, [isWrong, reduced, shake]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!reduced) {
      scale.value = withSequence(withTiming(0.9, { duration: 50 }), withTiming(1, { duration: 50 }));
    }
    onPress();
  };

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={handlePress}
      style={[
        {
          width: size,
          height: size,
          backgroundColor: fillFor(state),
          borderWidth: 1,
          borderColor: colors.cell.emptyBorder,
          borderRightWidth: boldRight ? 2 : 1,
          borderBottomWidth: boldBottom ? 2 : 1,
          borderRightColor: boldRight ? colors.ink.faded : colors.cell.emptyBorder,
          borderBottomColor: boldBottom ? colors.ink.faded : colors.cell.emptyBorder,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animStyle,
      ]}
    >
      {state === 2 || state === 3 ? (
        <Text
          allowFontScaling={false}
          style={{ color: state === 3 ? colors.cell.wrong : colors.cell.markGlyph, fontFamily: typography.fontFamily.display, fontSize: size * 0.6 }}
        >
          ×
        </Text>
      ) : null}
    </AnimatedPressable>
  );
}

// Memoized — a 25x25 grid renders 625 of these and re-renders on every tap.
export const PuzzleCell = React.memo(PuzzleCellBase);

export default PuzzleCell;
