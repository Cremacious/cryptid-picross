import { render, screen, fireEvent } from '@testing-library/react-native';
import { OnboardingScreen } from '@/components/screens';

jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light' } }));

describe('OnboardingScreen', () => {
  it('starts on step 1 with all four step dots', () => {
    render(<OnboardingScreen onComplete={() => {}} testID="ob" />);
    expect(screen.getByText(/Every clue counts/i)).toBeTruthy();
    expect(screen.getByTestId('ob-dot-0')).toBeTruthy();
    expect(screen.getByTestId('ob-dot-3')).toBeTruthy();
  });

  it('gates the fill step until three cells are filled', () => {
    render(<OnboardingScreen onComplete={() => {}} testID="ob" />);
    fireEvent.press(screen.getByTestId('ob-next')); // step 1 -> 2 (fill)
    expect(screen.getByText(/Try it/i)).toBeTruthy();
    // Next is disabled: pressing does nothing
    fireEvent.press(screen.getByTestId('ob-next'));
    expect(screen.getByText(/Try it/i)).toBeTruthy();
    // fill three cells
    fireEvent.press(screen.getByTestId('ob-cell-0-0'));
    fireEvent.press(screen.getByTestId('ob-cell-0-1'));
    fireEvent.press(screen.getByTestId('ob-cell-0-2'));
    fireEvent.press(screen.getByTestId('ob-next')); // now advances -> step 3 (mark)
    expect(screen.getByText(/Mark what is empty/i)).toBeTruthy();
  });

  it('gates the mark step until one cell is marked, then reaches the final step', () => {
    render(<OnboardingScreen onComplete={() => {}} testID="ob" />);
    fireEvent.press(screen.getByTestId('ob-next')); // -> fill
    fireEvent.press(screen.getByTestId('ob-cell-0-0'));
    fireEvent.press(screen.getByTestId('ob-cell-0-1'));
    fireEvent.press(screen.getByTestId('ob-cell-0-2'));
    fireEvent.press(screen.getByTestId('ob-next')); // -> mark
    // disabled until a mark exists
    fireEvent.press(screen.getByTestId('ob-next'));
    expect(screen.getByText(/Mark what is empty/i)).toBeTruthy();
    fireEvent.press(screen.getByTestId('ob-cell-4-4')); // mark a cell
    fireEvent.press(screen.getByTestId('ob-next')); // -> final
    expect(screen.getByText(/The trail begins/i)).toBeTruthy();
  });

  it('calls onComplete from the final step', () => {
    const onComplete = jest.fn();
    render(<OnboardingScreen onComplete={onComplete} testID="ob" />);
    fireEvent.press(screen.getByTestId('ob-next')); // -> fill
    fireEvent.press(screen.getByTestId('ob-cell-0-0'));
    fireEvent.press(screen.getByTestId('ob-cell-0-1'));
    fireEvent.press(screen.getByTestId('ob-cell-0-2'));
    fireEvent.press(screen.getByTestId('ob-next')); // -> mark
    fireEvent.press(screen.getByTestId('ob-cell-4-4'));
    fireEvent.press(screen.getByTestId('ob-next')); // -> final
    fireEvent.press(screen.getByTestId('ob-next')); // Start investigating
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
