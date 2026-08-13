import { render, screen, fireEvent } from '@testing-library/react-native';
import { OnboardingScreen } from '@/components/screens';

jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light' } }));

describe('OnboardingScreen', () => {
  it('starts on the rules explainer with all step dots and a Skip control', () => {
    render(<OnboardingScreen onComplete={() => {}} testID="ob" />);
    expect(screen.getByText(/What is a nonogram/i)).toBeTruthy();
    expect(screen.getByTestId('ob-dot-0')).toBeTruthy();
    expect(screen.getByTestId('ob-dot-5')).toBeTruthy();
    expect(screen.getByTestId('ob-skip')).toBeTruthy();
  });

  it('Skip completes onboarding immediately from the first step', () => {
    const onComplete = jest.fn();
    render(<OnboardingScreen onComplete={onComplete} testID="ob" />);
    fireEvent.press(screen.getByTestId('ob-skip'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('shows the annotated clue example on the reading-the-clues step', () => {
    render(<OnboardingScreen onComplete={() => {}} testID="ob" />);
    fireEvent.press(screen.getByTestId('ob-next')); // -> reading the clues
    expect(screen.getByText(/Reading the clues/i)).toBeTruthy();
    expect(screen.getByTestId('ob-example')).toBeTruthy();
    // the "3 1" example row renders 5 example cells
    expect(screen.getByTestId('ob-example-0')).toBeTruthy();
    expect(screen.getByTestId('ob-example-4')).toBeTruthy();
  });

  it('advances explainers freely, then gates fill, then mark, then completes', () => {
    const onComplete = jest.fn();
    render(<OnboardingScreen onComplete={onComplete} testID="ob" />);
    fireEvent.press(screen.getByTestId('ob-next')); // -> reading the clues
    fireEvent.press(screen.getByTestId('ob-next')); // -> marking empties
    fireEvent.press(screen.getByTestId('ob-next')); // -> Try it (fill)
    expect(screen.getByText(/Try it/i)).toBeTruthy();

    // gated until 3 fills
    fireEvent.press(screen.getByTestId('ob-next'));
    expect(screen.getByText(/Try it/i)).toBeTruthy();
    fireEvent.press(screen.getByTestId('ob-cell-0-0'));
    fireEvent.press(screen.getByTestId('ob-cell-0-1'));
    fireEvent.press(screen.getByTestId('ob-cell-0-2'));
    fireEvent.press(screen.getByTestId('ob-next')); // -> Mark
    expect(screen.getByText(/Mark what is empty/i)).toBeTruthy();

    // gated until 1 mark
    fireEvent.press(screen.getByTestId('ob-next'));
    expect(screen.getByText(/Mark what is empty/i)).toBeTruthy();
    fireEvent.press(screen.getByTestId('ob-cell-4-4'));
    fireEvent.press(screen.getByTestId('ob-next')); // -> The trail begins
    expect(screen.getByText(/The trail begins/i)).toBeTruthy();

    fireEvent.press(screen.getByTestId('ob-next')); // Start investigating
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
