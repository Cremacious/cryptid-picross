import React from 'react';
import { Text, Pressable, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, motion, border, layout } from '@/theme';

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

// Button heights per COMPONENT_LIBRARY.md 1.1.
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
    minHeight: Math.max(HEIGHT[size], layout.touchTarget), // never below the touch target floor
    backgroundColor: p.bg,
    borderColor: p.border,
    borderWidth: border.thick,
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
