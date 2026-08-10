import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius } from '@/theme';

export interface PaperSurfaceProps {
  children?: React.ReactNode;
  variant?: 'cream' | 'aged' | 'stained';
  elevated?: boolean;
  padding?: keyof typeof spacing;
  regionTint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const BASE: Record<NonNullable<PaperSurfaceProps['variant']>, string> = {
  cream: colors.paper.cream,
  aged: colors.paper.aged,
  stained: colors.paper.stained,
};

// The single warm-shadow recipe (DESIGN_TOKENS §1.7). Never a cold gray shadow.
const ELEVATION: ViewStyle = {
  shadowColor: colors.shadow.color,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
  elevation: 3,
};

export function PaperSurface({
  children,
  variant = 'cream',
  elevated = false,
  padding = 'md',
  regionTint,
  style,
  testID,
}: PaperSurfaceProps) {
  const base = BASE[variant];
  return (
    <View
      testID={testID}
      style={[{ borderRadius: radius.md, overflow: 'hidden' }, elevated && ELEVATION, style]}
    >
      {/* 2-stop paper gradient: highlight → base (grain PNG is a later asset) */}
      <LinearGradient
        colors={[colors.paper.highlight, base]}
        style={{ padding: spacing[padding] }}
      >
        {regionTint ? (
          <View
            testID="tint-overlay"
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: regionTint,
              opacity: 0.1,
            }}
          />
        ) : null}
        {children}
      </LinearGradient>
    </View>
  );
}

export default PaperSurface;
