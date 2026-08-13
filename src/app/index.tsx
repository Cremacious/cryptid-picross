import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { colors, typography, spacing } from '@/theme';
import { IconButton } from '@/components/atoms';
import { useProgressStore } from '@/state';

export default function Home() {
  const router = useRouter();
  const onboardingCompleted = useProgressStore((s) => s.onboardingCompleted);
  if (!onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }
  return (
    <View style={styles.screen} testID="home-screen">
      <View style={styles.gear}>
        <IconButton
          icon="settings"
          variant="ghost"
          accessibilityLabel="Settings"
          onPress={() => router.push('/settings')}
          testID="home-settings"
        />
      </View>
      <Text style={styles.kicker}>FIELD GUIDE</Text>
      <Text style={styles.title}>PICROSS{'\n'}CRYPTOZOOLOGY</Text>
      <Text style={styles.prompt}>tap to begin your investigation</Text>
      <Pressable testID="home-play-sample" onPress={() => router.push('/regions')}>
        <Text style={styles.prompt}>open the field guide</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  gear: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.md,
  },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper.cream,
    padding: spacing.lg,
    gap: spacing.md,
  },
  kicker: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.size.sm,
    letterSpacing: typography.letterSpacing.wider,
    color: colors.accent.candleGlow,
  },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.size['2xl'],
    letterSpacing: typography.letterSpacing.wide,
    textAlign: 'center',
    color: colors.ink.primary,
  },
  prompt: {
    fontFamily: typography.fontFamily.body,
    fontStyle: 'italic',
    fontSize: typography.size.md,
    color: colors.ink.faded,
  },
});
