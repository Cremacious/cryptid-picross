import React from 'react';
import { View, Text } from 'react-native';
import { colors, typography, spacing, radius } from '@/theme';
import { Tier } from '@/engine';

export interface TierBadgeProps {
  tier: Tier;
  size?: 'sm' | 'md';
  testID?: string;
}

const TIER_BG: Record<Tier, string> = {
  Easy: colors.region.pnw,
  Medium: colors.paper.shadow,
  Hard: colors.region.appalachia,
  Expert: colors.accent.stampRed,
};

// Medium's tint (paper.shadow) is light — cream text fails contrast there, so it
// gets ink text. The others are dark enough for cream. (WCAG AA governs over the
// spec's blanket "paper-cream".)
const TIER_TEXT: Record<Tier, string> = {
  Easy: colors.paper.cream,
  Medium: colors.ink.primary,
  Hard: colors.paper.cream,
  Expert: colors.paper.cream,
};

export function TierBadge({ tier, size = 'md', testID }: TierBadgeProps) {
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: TIER_BG[tier],
        borderRadius: radius.xs,
        paddingVertical: spacing.xxs,
        paddingHorizontal: spacing.sm,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: typography.fontFamily.display,
          fontSize: size === 'sm' ? typography.size.xs : typography.size.sm,
          letterSpacing: typography.letterSpacing.wider,
          color: TIER_TEXT[tier],
          textTransform: 'uppercase',
        }}
      >
        {tier}
      </Text>
    </View>
  );
}

export default TierBadge;
