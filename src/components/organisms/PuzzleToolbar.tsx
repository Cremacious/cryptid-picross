import React from 'react';
import { View, Text } from 'react-native';
import { IconButton, Button } from '@/components/atoms';
import { colors, typography, spacing, radius, layout, border } from '@/theme';

export interface PuzzleToolbarProps {
  activeTool: 'fill' | 'mark';
  mode: 'cozy' | 'classic';
  onToolChange: (tool: 'fill' | 'mark') => void;
  onUndo: () => void;
  onHint: () => void;
  onCheckWork?: () => void;
  canUndo: boolean;
  hintCount: number;
  testID?: string;
}

export function PuzzleToolbar({
  activeTool,
  mode,
  onToolChange,
  onUndo,
  onHint,
  onCheckWork,
  canUndo,
  hintCount,
  testID,
}: PuzzleToolbarProps) {
  const noHints = hintCount <= 0;
  return (
    <View
      testID={testID}
      style={{
        borderTopWidth: border.thin,
        borderTopColor: colors.paper.shadow,
        borderStyle: 'dashed',
        paddingTop: spacing.sm,
        gap: spacing.sm,
      }}
    >
      {mode === 'classic' && onCheckWork ? (
        <Button label="Check My Work" variant="secondary" fullWidth onPress={onCheckWork} testID="tool-check" />
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', minHeight: layout.toolbarHeight }}>
        <IconButton
          icon="fill"
          variant={activeTool === 'fill' ? 'active' : 'default'}
          accessibilityLabel="Fill tool"
          onPress={() => onToolChange('fill')}
          testID="tool-fill"
        />
        <IconButton
          icon="mark"
          variant={activeTool === 'mark' ? 'active' : 'default'}
          accessibilityLabel="Mark tool"
          onPress={() => onToolChange('mark')}
          testID="tool-mark"
        />
        <IconButton
          icon="undo"
          variant="default"
          disabled={!canUndo}
          accessibilityLabel="Undo"
          onPress={onUndo}
          testID="tool-undo"
        />
        <View>
          <IconButton
            icon="hint"
            variant="default"
            disabled={noHints}
            accessibilityLabel={`Hint, ${hintCount} remaining`}
            onPress={onHint}
            testID="tool-hint"
          />
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              minWidth: 18,
              height: 18,
              borderRadius: radius.full,
              backgroundColor: colors.accent.candleGlow,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 2,
            }}
          >
            <Text allowFontScaling={false} style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.xs, color: colors.ink.primary }}>
              {hintCount}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default PuzzleToolbar;
