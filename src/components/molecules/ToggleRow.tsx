import React from 'react';
import { View, Text, Switch } from 'react-native';
import { colors, typography, spacing } from '@/theme';

export interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  testID?: string;
}

export function ToggleRow({ label, description, value, onValueChange, testID }: ToggleRowProps) {
  return (
    <View testID={testID} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs, gap: spacing.md }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: typography.fontFamily.body, fontSize: typography.size.md, color: colors.ink.primary }}>{label}</Text>
        {description ? (
          <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.xs, color: colors.ink.faded }}>{description}</Text>
        ) : null}
      </View>
      <Switch
        testID={`${testID}-switch`}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.region.pnw, false: colors.paper.shadow }}
        thumbColor={colors.paper.cream}
      />
    </View>
  );
}

export default ToggleRow;
