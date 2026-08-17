import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/theme';
import { Region } from '@/engine';
import { Button, IconButton } from '@/components/atoms';
import { Polaroid } from '@/components/molecules';

export interface PaywallScreenProps {
  region: Region;
  /** Localized price of the single all-access unlock. */
  unlockPrice: string;
  onPurchaseUnlock: () => void;
  onRestore: () => void;
  onClose: () => void;
  /** Disables the purchase/restore actions while a store request is in flight. */
  busy?: boolean;
  /** A store error or "nothing to restore" message to show above the actions. */
  errorText?: string | null;
  testID?: string;
}

export function PaywallScreen({
  region,
  unlockPrice,
  onPurchaseUnlock,
  onRestore,
  onClose,
  busy = false,
  errorText = null,
  testID,
}: PaywallScreenProps) {
  const insets = useSafeAreaInsets();
  const flagship = region.puzzles[0];
  return (
    <ScrollView
      testID={testID}
      style={{ flex: 1, backgroundColor: colors.paper.cream }}
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg, gap: spacing.md }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <IconButton icon="close" variant="ghost" accessibilityLabel="Close" onPress={onClose} testID="paywall-close" />
      </View>

      {flagship ? <Polaroid grid={flagship.grid} caption={region.name} animateIn={false} /> : null}

      <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.xl, letterSpacing: typography.letterSpacing.wide, color: colors.ink.primary, textAlign: 'center', textTransform: 'uppercase' }}>
        {region.name}
      </Text>
      <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.md, color: colors.ink.faded, textAlign: 'center' }}>
        {region.tagline}
      </Text>

      {errorText ? (
        <Text
          testID="paywall-error"
          style={{ fontFamily: typography.fontFamily.body, fontSize: typography.size.sm, color: colors.accent.stampRed, textAlign: 'center' }}
        >
          {errorText}
        </Text>
      ) : null}

      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        <Button label={`Unlock Everything — ${unlockPrice}`} fullWidth disabled={busy} onPress={onPurchaseUnlock} testID="paywall-unlock" />
        <Text style={{ fontFamily: typography.fontFamily.body, fontSize: typography.size.sm, color: colors.ink.faded, textAlign: 'center' }}>
          One-time purchase · unlocks all 5 regions and removes ads
        </Text>
      </View>

      <Text
        testID="paywall-restore"
        onPress={busy ? undefined : onRestore}
        accessibilityRole="button"
        style={{ fontFamily: typography.fontFamily.body, fontSize: typography.size.sm, color: colors.ink.faded, textAlign: 'center', marginTop: spacing.sm }}
      >
        Restore Purchases
      </Text>
    </ScrollView>
  );
}

export default PaywallScreen;
