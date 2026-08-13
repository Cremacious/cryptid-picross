import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PaperSurface } from '@/components/atoms';
import { colors, typography, spacing, layout } from '@/theme';
import { Tier } from '@/engine';
import { formatTime } from '@/utils/formatTime';
import { TierBadge } from './TierBadge';

export interface PuzzleCardProps {
  puzzleNumber: number;
  puzzleName: string;
  size: string;
  tier: Tier;
  isSolved: boolean;
  bestTime?: number;
  bestMistakes?: number;
  onPress: () => void;
  testID?: string;
}

const pad3 = (n: number) => String(n).padStart(3, '0');

export function PuzzleCard({
  puzzleNumber,
  puzzleName,
  size,
  tier,
  isSolved,
  bestTime,
  bestMistakes,
  onPress,
  testID,
}: PuzzleCardProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`Sighting ${pad3(puzzleNumber)}${isSolved ? `, ${puzzleName}, solved` : ', unsolved'}`}
      onPress={onPress}
      style={{ marginVertical: spacing.xs }}
    >
      <PaperSurface variant={isSolved ? 'cream' : 'aged'} padding="md" regionTint={isSolved ? colors.region.pnw : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: layout.touchTarget + spacing.lg }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.xs, letterSpacing: typography.letterSpacing.wider, color: colors.ink.faded }}>
              {`SIGHTING ${pad3(puzzleNumber)}`}
            </Text>
            <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.md, color: colors.ink.primary, marginTop: spacing.xxs }}>
              {isSolved ? puzzleName : '???'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
              <Text style={{ fontFamily: typography.fontFamily.body, fontSize: typography.size.sm, color: colors.ink.soft }}>{size}</Text>
              <TierBadge tier={tier} size="sm" />
            </View>
            {isSolved && bestTime !== undefined ? (
              <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.sm, color: colors.ink.faded, marginTop: spacing.xs }}>
                {`best ${formatTime(bestTime)}${bestMistakes !== undefined ? ` · ${bestMistakes} mistakes` : ''}`}
              </Text>
            ) : null}
          </View>
          {isSolved ? <Feather testID={`${testID}-check`} name="check" size={22} color={colors.region.pnw} /> : null}
        </View>
      </PaperSurface>
    </Pressable>
  );
}

export default PuzzleCard;
