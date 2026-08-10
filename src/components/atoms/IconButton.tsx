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
