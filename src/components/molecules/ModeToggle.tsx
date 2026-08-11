import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { colors, typography, spacing, radius, border } from '@/theme';

export interface ModeToggleProps {
  mode: 'cozy' | 'classic';
  onChange: (mode: 'cozy' | 'classic') => void;
  testID?: string;
}

const OPTIONS: { key: 'cozy' | 'classic'; name: string; desc: string }[] = [
  { key: 'cozy', name: 'Cozy', desc: 'Wrong cells turn red as you go.' },
  { key: 'classic', name: 'Classic', desc: 'No hints — check your work yourself.' },
];

export function ModeToggle({ mode, onChange, testID }: ModeToggleProps) {
  return (
    <View testID={testID} style={{ flexDirection: 'row', gap: spacing.sm }}>
      {OPTIONS.map((opt) => {
        const active = mode === opt.key;
        return (
          <Pressable
            key={opt.key}
            testID={`${testID}-${opt.key}`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.key)}
            style={{
              flex: 1,
              padding: spacing.md,
              borderRadius: radius.md,
              borderWidth: border.thick,
              borderColor: colors.ink.primary,
              backgroundColor: active ? colors.ink.primary : 'transparent',
            }}
          >
            <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.md, letterSpacing: typography.letterSpacing.wide, textTransform: 'uppercase', color: active ? colors.paper.cream : colors.ink.primary }}>
              {opt.name}
            </Text>
            <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.xs, color: active ? colors.paper.stained : colors.ink.faded, marginTop: spacing.xxs }}>
              {opt.desc}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default ModeToggle;
