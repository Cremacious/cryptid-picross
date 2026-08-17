import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary, setErrorReporter } from '@/components/organisms';

function Boom({ crash }: { crash: boolean }): React.ReactElement {
  if (crash) throw new Error('kaboom');
  return <Text>all good</Text>;
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <Text>hello</Text>
      </ErrorBoundary>,
    );
    expect(screen.getByText('hello')).toBeTruthy();
  });

  it('renders the fallback and reports when a child throws', () => {
    const report = jest.fn();
    setErrorReporter(report);
    // Silence React's error logging for this intentional throw.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom crash />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('error-boundary-fallback')).toBeTruthy();
    expect(screen.getByTestId('error-boundary-retry')).toBeTruthy();
    expect(report).toHaveBeenCalledTimes(1);
    expect(report.mock.calls[0][0]).toBeInstanceOf(Error);
    spy.mockRestore();
    setErrorReporter(() => {});
  });

  it('has a retry control that attempts to re-render', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom crash />
      </ErrorBoundary>,
    );
    // Retry is present and pressable (re-render still shows fallback since the child
    // still throws, but the control must exist and not itself crash).
    fireEvent.press(screen.getByTestId('error-boundary-retry'));
    expect(screen.getByTestId('error-boundary-fallback')).toBeTruthy();
    spy.mockRestore();
  });
});
