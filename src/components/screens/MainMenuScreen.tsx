import React from 'react';
import { View, Text } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { Button } from '@/components/atoms';

export interface MainMenuScreenProps {
  onBegin: () => void;
  onContinue: () => void;
  onSettings: () => void;
  showContinue: boolean;
  testID?: string;
}

export function MainMenuScreen({ onBegin, onContinue, onSettings, showContinue, testID }: MainMenuScreenProps) {
  return (
    <View
      testID={testID}
      style={{ flex: 1, backgroundColor: colors.paper.cream, padding: spacing.lg, alignItems: 'center', justifyContent: 'space-between' }}
    >
      <View style={{ alignItems: 'center', marginTop: spacing['3xl'], gap: spacing.xs }}>
        <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.sm, letterSpacing: typography.letterSpacing.wider, color: colors.accent.candleGlow, textTransform: 'uppercase' }}>
          Field Guide
        </Text>
        <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size['2xl'], letterSpacing: typography.letterSpacing.wide, color: colors.ink.primary, textAlign: 'center', textTransform: 'uppercase' }}>
          {`Picross${'\n'}Cryptozoology`}
        </Text>
        <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.sm, color: colors.ink.faded, marginTop: spacing.xs }}>
          Est. 1974 · Vol. I
        </Text>
      </View>

      <View style={{ width: '100%', gap: spacing.md, marginBottom: spacing['2xl'] }}>
        {showContinue ? (
          <Button label="Continue" variant="primary" fullWidth onPress={onContinue} testID="menu-continue" />
        ) : null}
        <Button
          label="Begin Investigation"
          variant={showContinue ? 'secondary' : 'primary'}
          fullWidth
          onPress={onBegin}
          testID="menu-begin"
        />
        <Button label="Settings" variant="secondary" fullWidth onPress={onSettings} testID="menu-settings" />
      </View>
    </View>
  );
}

export default MainMenuScreen;
