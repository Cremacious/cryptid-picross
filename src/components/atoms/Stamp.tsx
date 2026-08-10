import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors, typography, spacing, radius, border, motion } from '@/theme';

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
  const reduced = useReducedMotion();
  const scale = useSharedValue(animateIn && !reduced ? 3 : 1);

  useEffect(() => {
    if (animateIn && !reduced) {
      const half = motion.duration.slow / 2;
      scale.value = withSequence(
        withTiming(0.9, { duration: half }),
        withTiming(1, { duration: half }),
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
    borderWidth: border.thick,
    borderRadius: radius.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});

export default Stamp;
