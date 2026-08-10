import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '@/theme';

export default function Home() {
  const router = useRouter();
  return (
    <View style={styles.screen} testID="home-screen">
      <Text style={styles.kicker}>FIELD GUIDE</Text>
      <Text style={styles.title}>PICROSS{'\n'}CRYPTOZOOLOGY</Text>
      <Text style={styles.prompt}>tap to begin your investigation</Text>
      <Pressable testID="home-play-sample" onPress={() => router.push('/puzzle/sample-plus')}>
        <Text style={styles.prompt}>tap to play a sample sighting</Text>
      </Pressable>
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
