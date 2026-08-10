import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useReducedMotion,
  runOnJS,
} from 'react-native-reanimated';
import { colors, typography, spacing, radius, layout, motion } from '@/theme';
import { Grid } from '@/engine';

export interface PolaroidProps {
  grid: Grid;
  caption: string;
  animateIn?: boolean;
  onAnimationComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  testID?: string;
}

const PIXEL: Record<NonNullable<PolaroidProps['size']>, number> = { sm: 6, md: 10, lg: 14 };

export function Polaroid({
  grid,
  caption,
  animateIn = true,
  onAnimationComplete,
  size = 'md',
  testID,
}: PolaroidProps) {
  const pixel = PIXEL[size];
  const reduced = useReducedMotion();
  const active = animateIn && !reduced;

  const translateY = useSharedValue(active ? -300 : 0);
  const rotate = useSharedValue(active ? -15 : -2);
  const scale = useSharedValue(active ? 1.4 : 1);
  const opacity = useSharedValue(active ? 0 : 1);

  useEffect(() => {
    if (active) {
      opacity.value = withTiming(1, { duration: motion.duration.fast });
      translateY.value = withSpring(0, motion.spring.polaroid);
      rotate.value = withSpring(-2, motion.spring.polaroid);
      scale.value = withSpring(1, motion.spring.polaroid, (finished) => {
        if (finished && onAnimationComplete) runOnJS(onAnimationComplete)();
      });
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      testID={testID}
      style={[
        {
          backgroundColor: colors.paper.highlight,
          padding: spacing.sm,
          paddingBottom: layout.polaroidBorderBottom,
          borderRadius: radius.xs,
          alignSelf: 'center',
        },
        animStyle,
      ]}
    >
      <View testID={`${testID}-art`} style={{ backgroundColor: colors.paper.cream, padding: spacing.xs }}>
        {grid.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row' }}>
            {row.map((cell, c) => (
              <View
                key={c}
                style={{ width: pixel, height: pixel, backgroundColor: cell === 1 ? colors.ink.primary : 'transparent' }}
              />
            ))}
          </View>
        ))}
      </View>
      <Text
        style={{
          fontFamily: typography.fontFamily.bodyItalic,
          fontStyle: 'italic',
          fontSize: typography.size.sm,
          color: colors.ink.soft,
          textAlign: 'center',
          marginTop: spacing.sm,
        }}
      >
        {caption}
      </Text>
    </Animated.View>
  );
}

export default Polaroid;
