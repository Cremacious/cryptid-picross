import React from 'react';
import { View, Text } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { Button } from '@/components/atoms';

/**
 * Catches render/lifecycle crashes anywhere in the tree and shows a calm recovery screen
 * instead of a white screen of death. `onError` is a seam for a crash reporter (e.g.
 * Sentry) — wire it in `initErrorReporting` once a DSN exists (#13); it defaults to a
 * console log so nothing is swallowed silently.
 */
let reporter: (error: Error, info: { componentStack: string }) => void = (error) => {
  // eslint-disable-next-line no-console
  console.error('[ErrorBoundary]', error);
};

export function setErrorReporter(fn: (error: Error, info: { componentStack: string }) => void): void {
  reporter = fn;
}

interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    reporter(error, info);
  }

  private reset = () => this.setState({ error: null });

  render(): React.ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <View
        testID="error-boundary-fallback"
        style={{ flex: 1, backgroundColor: colors.paper.cream, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}
      >
        <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.xl, letterSpacing: typography.letterSpacing.wide, color: colors.ink.primary, textTransform: 'uppercase', textAlign: 'center' }}>
          The trail went cold
        </Text>
        <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.md, color: colors.ink.faded, textAlign: 'center' }}>
          Something went wrong. Your progress is safe — try again.
        </Text>
        <Button label="Try Again" onPress={this.reset} testID="error-boundary-retry" />
      </View>
    );
  }
}

export default ErrorBoundary;
