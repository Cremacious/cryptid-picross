import React from 'react';
import { View, Text } from 'react-native';
import { PaperSurface } from '@/components/atoms';
import { colors, typography, spacing, border } from '@/theme';
import { FieldEntry, Grid } from '@/engine';

export interface FieldEntryCardProps {
  entry: FieldEntry;
  thumbnail?: Grid;
  variant?: 'reveal' | 'index';
  testID?: string;
}

const THUMB_PIXEL = 4;

export function FieldEntryCard({ entry, thumbnail, variant = 'reveal', testID }: FieldEntryCardProps) {
  const isFirstPerson = entry.voiceStyle === 'firstPerson';
  const isVictorian = entry.voiceStyle === 'victorian';
  const bodySize = variant === 'index' ? typography.size.sm : typography.size.md;

  return (
    <PaperSurface variant="aged" padding="md" testID={testID} style={{ position: 'relative' }}>
      {isVictorian ? (
        <Text
          testID={`${testID}-victorian`}
          style={{ position: 'absolute', top: spacing.sm, right: spacing.sm, fontFamily: typography.fontFamily.body, fontSize: typography.size.lg, color: colors.ink.faded }}
        >
          ℘
        </Text>
      ) : null}

      {thumbnail ? (
        <View testID={`${testID}-thumb`} style={{ alignSelf: 'flex-start', marginBottom: spacing.sm }}>
          {thumbnail.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row' }}>
              {row.map((cell, c) => (
                <View key={c} style={{ width: THUMB_PIXEL, height: THUMB_PIXEL, backgroundColor: cell === 1 ? colors.ink.primary : 'transparent' }} />
              ))}
            </View>
          ))}
        </View>
      ) : null}

      <View
        style={
          isFirstPerson
            ? { borderLeftWidth: border.thick, borderLeftColor: colors.paper.shadow, borderStyle: 'dashed', paddingLeft: spacing.sm }
            : undefined
        }
      >
        <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.md, letterSpacing: typography.letterSpacing.wide, color: colors.ink.primary, textTransform: 'uppercase' }}>
          {entry.title}
        </Text>
        <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: bodySize, lineHeight: bodySize * 1.5, color: colors.ink.soft, marginTop: spacing.xs }}>
          {entry.body}
        </Text>
      </View>
    </PaperSurface>
  );
}

export default FieldEntryCard;
