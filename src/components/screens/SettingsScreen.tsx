import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { useSettingsStore, useProgressStore } from '@/state';
import { IconButton, Button, Divider, PaperSurface } from '@/components/atoms';
import { ModeToggle, ToggleRow } from '@/components/molecules';

export interface SettingsScreenProps {
  onBack: () => void;
  testID?: string;
}

const APP_VERSION = '1.0.0';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.sm, letterSpacing: typography.letterSpacing.wider, color: colors.ink.faded, textTransform: 'uppercase', marginBottom: spacing.sm }}>
      {children}
    </Text>
  );
}

export function SettingsScreen({ onBack, testID }: SettingsScreenProps) {
  const mode = useSettingsStore((s) => s.mode);
  const setMode = useSettingsStore((s) => s.setMode);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const setReduceMotion = useSettingsStore((s) => s.setReduceMotion);
  const solvedCount = useProgressStore((s) => Object.keys(s.solved).length);
  const clearAll = useProgressStore((s) => s.clearAll);

  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearAll();
    setConfirmClear(false);
  };

  const onRestore = () => {
    // MOCK: no real receipts to restore yet. Must NOT wipe purchaseStore.
    // Real restore-purchases wiring lands with RevenueCat.
  };

  return (
    <ScrollView testID={testID} style={{ flex: 1, backgroundColor: colors.paper.cream }} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton icon="back" variant="ghost" accessibilityLabel="Back" onPress={onBack} testID="settings-back" />
        <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.xl, letterSpacing: typography.letterSpacing.wider, color: colors.ink.primary, textTransform: 'uppercase', marginLeft: spacing.sm }}>
          Settings
        </Text>
      </View>

      <PaperSurface variant="aged" padding="md">
        <SectionLabel>Investigation Style</SectionLabel>
        <ModeToggle mode={mode} onChange={setMode} testID="settings-mode" />
      </PaperSurface>

      <PaperSurface variant="aged" padding="md">
        <SectionLabel>Sound &amp; Haptics</SectionLabel>
        <ToggleRow label="Sound" description="Ambient and effects" value={soundEnabled} onValueChange={setSoundEnabled} testID="settings-sound" />
        <Divider />
        <ToggleRow label="Haptics" description="Vibration feedback" value={hapticsEnabled} onValueChange={setHapticsEnabled} testID="settings-haptics" />
      </PaperSurface>

      <PaperSurface variant="aged" padding="md">
        <SectionLabel>Accessibility</SectionLabel>
        <ToggleRow label="Reduce Motion" description="Calmer animations" value={reduceMotion} onValueChange={setReduceMotion} testID="settings-reduce-motion" />
      </PaperSurface>

      <PaperSurface variant="aged" padding="md">
        <SectionLabel>Field Data</SectionLabel>
        <Text style={{ fontFamily: typography.fontFamily.body, fontSize: typography.size.md, color: colors.ink.soft, marginBottom: spacing.sm }}>
          {`${solvedCount} sighting${solvedCount === 1 ? '' : 's'} confirmed`}
        </Text>
        <Button
          label={confirmClear ? 'Tap again to confirm' : 'Clear All Data'}
          variant="danger"
          fullWidth
          onPress={handleClear}
          testID="settings-clear"
        />
      </PaperSurface>

      <PaperSurface variant="aged" padding="md">
        <SectionLabel>Purchases</SectionLabel>
        <Button label="Restore Purchases" variant="secondary" fullWidth onPress={onRestore} testID="settings-restore" />
      </PaperSurface>

      <Text style={{ fontFamily: typography.fontFamily.body, fontSize: typography.size.xs, color: colors.ink.faded, textAlign: 'center', marginTop: spacing.sm }}>
        {`Picross: Cryptozoology · v${APP_VERSION}`}
      </Text>
    </ScrollView>
  );
}

export default SettingsScreen;
