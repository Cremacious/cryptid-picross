import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { Region } from '@/engine';
import { Button, IconButton, Stamp } from '@/components/atoms';
import { Polaroid } from '@/components/molecules';

export interface PaywallScreenProps {
  region: Region;
  regionPrice: string;
  bundlePrice: string;
  onPurchaseRegion: () => void;
  onPurchaseBundle: () => void;
  onRestore: () => void;
  onClose: () => void;
  testID?: string;
}

export function PaywallScreen({
  region,
  regionPrice,
  bundlePrice,
  onPurchaseRegion,
  onPurchaseBundle,
  onRestore,
  onClose,
  testID,
}: PaywallScreenProps) {
  const flagship = region.puzzles[0];
  return (
    <ScrollView
      testID={testID}
      style={{ flex: 1, backgroundColor: colors.paper.cream }}
      contentContainerStyle={{ flexGrow: 1, padding: spacing.lg, gap: spacing.md }}
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

      <Button label={`This Region — ${regionPrice}`} fullWidth onPress={onPurchaseRegion} testID="paywall-region" />

      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        <Button label={`Full Bundle — ${bundlePrice}`} variant="secondary" fullWidth onPress={onPurchaseBundle} testID="paywall-bundle" />
        <Stamp text="Best Value" color="candle" size="sm" />
      </View>

      <Text
        testID="paywall-restore"
        onPress={onRestore}
        accessibilityRole="button"
        style={{ fontFamily: typography.fontFamily.body, fontSize: typography.size.sm, color: colors.ink.faded, textAlign: 'center', marginTop: spacing.sm }}
      >
        Restore Purchases
      </Text>
    </ScrollView>
  );
}

export default PaywallScreen;
