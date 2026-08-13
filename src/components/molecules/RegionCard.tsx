import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PaperSurface } from '@/components/atoms';
import { colors, typography, spacing, radius, border, layout } from '@/theme';
import { Region } from '@/engine';

export interface RegionCardProps {
  region: Region;
  progress: { solved: number; total: number };
  isLocked: boolean;
  isComingSoon: boolean;
  onPress: () => void;
  testID?: string;
}

export function RegionCard({ region, progress, isLocked, isComingSoon, onPress, testID }: RegionCardProps) {
  const showLock = isLocked || isComingSoon;
  const subtitle = isComingSoon
    ? 'Coming soon'
    : isLocked
      ? 'Locked · tap to unlock'
      : `${progress.solved} / ${progress.total} sightings`;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${region.name}${isLocked ? ', locked' : ''}`}
      onPress={onPress}
      style={{ opacity: isLocked ? 0.45 : 1, marginVertical: spacing.xs }}
    >
      <PaperSurface
        variant="aged"
        padding="md"
        style={
          isComingSoon
            ? { borderWidth: border.thin, borderColor: colors.paper.shadow, borderStyle: 'dashed' }
            : undefined
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: layout.touchTarget + spacing.lg }}>
          <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: region.tint }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.md, color: colors.ink.primary, letterSpacing: typography.letterSpacing.wide }}>
              {region.name}
            </Text>
            <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.sm, color: colors.ink.faded, marginTop: spacing.xxs }}>
              {subtitle}
            </Text>
          </View>
          <Feather
            testID={showLock ? `${testID}-lock` : `${testID}-chevron`}
            name={showLock ? 'lock' : 'chevron-right'}
            size={20}
            color={colors.ink.soft}
          />
        </View>
      </PaperSurface>
    </Pressable>
  );
}

export default RegionCard;
