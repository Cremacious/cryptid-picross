import { render, screen, fireEvent } from '@testing-library/react-native';
import { PaywallScreen } from '@/components/screens';
import { getSampleRegion } from '@/content/sampleRegions';
import type { Region } from '@/engine';

const REGION = getSampleRegion('greatlakes') as Region;

const baseProps = {
  region: REGION,
  unlockPrice: '$4.99',
  onPurchaseUnlock: jest.fn(),
  onRestore: jest.fn(),
  onClose: jest.fn(),
};

describe('PaywallScreen', () => {
  it('renders the region name and the single unlock price', () => {
    render(<PaywallScreen {...baseProps} testID="paywall" />);
    // "The Great Lakes" appears as both the polaroid caption and the title.
    expect(screen.getAllByText(/Great Lakes/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/\$4\.99/)).toBeTruthy();
    expect(screen.getByText(/Unlock Everything/i)).toBeTruthy();
    expect(screen.getByText(/removes ads/i)).toBeTruthy();
  });

  it('calls onPurchaseUnlock when the unlock option is tapped', () => {
    const onPurchaseUnlock = jest.fn();
    render(<PaywallScreen {...baseProps} onPurchaseUnlock={onPurchaseUnlock} testID="paywall" />);
    fireEvent.press(screen.getByTestId('paywall-unlock'));
    expect(onPurchaseUnlock).toHaveBeenCalledTimes(1);
  });

  it('calls onRestore and onClose from their controls', () => {
    const onRestore = jest.fn();
    const onClose = jest.fn();
    render(<PaywallScreen {...baseProps} onRestore={onRestore} onClose={onClose} testID="paywall" />);
    fireEvent.press(screen.getByTestId('paywall-restore'));
    fireEvent.press(screen.getByTestId('paywall-close'));
    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows an error message when one is provided', () => {
    render(<PaywallScreen {...baseProps} errorText="No previous purchases found." testID="paywall" />);
    expect(screen.getByTestId('paywall-error')).toBeTruthy();
    expect(screen.getByText('No previous purchases found.')).toBeTruthy();
  });

  it('does not fire the purchase handler while busy', () => {
    const onPurchaseUnlock = jest.fn();
    render(<PaywallScreen {...baseProps} busy onPurchaseUnlock={onPurchaseUnlock} testID="paywall" />);
    fireEvent.press(screen.getByTestId('paywall-unlock'));
    expect(onPurchaseUnlock).not.toHaveBeenCalled();
  });
});
