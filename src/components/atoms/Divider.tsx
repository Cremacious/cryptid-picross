import React from 'react';
import { View } from 'react-native';
import { colors, spacing as spacingTokens } from '@/theme';

export interface DividerProps {
  color?: string;
  spacing?: keyof typeof spacingTokens;
  variant?: 'dashed' | 'solid' | 'double';
  testID?: string;
}

export function Divider({
  color = colors.ink.faded,
  spacing = 'md',
  variant = 'dashed',
  testID,
}: DividerProps) {
  const line = {
    borderBottomWidth: 1,
    borderColor: color,
    borderStyle: (variant === 'double' ? 'solid' : variant) as 'dashed' | 'solid',
  };
  const margin = { marginVertical: spacingTokens[spacing] };

  if (variant === 'double') {
    return (
      <View testID={testID} style={[margin, line]}>
        <View testID={`${testID}-line-2`} style={[{ marginTop: 3 }, line]} />
      </View>
    );
  }
  return <View testID={testID} style={[margin, line]} />;
}

export default Divider;
