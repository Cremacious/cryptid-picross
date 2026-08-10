import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/theme';

export default function Home() {
  return (
    <View style={styles.screen} testID="home-screen">
      <Text style={styles.kicker}>FIELD GUIDE</Text>
      <Text style={styles.title}>PICROSS{'\n'}CRYPTOZOOLOGY</Text>
      <Text style={styles.prompt}>tap to begin your investigation</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
