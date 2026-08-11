import { render, screen, fireEvent } from '@testing-library/react-native';
import { PaywallScreen } from '@/components/screens';
import { getSampleRegion } from '@/content/sampleRegions';
import type { Region } from '@/engine';

const REGION = getSampleRegion('appalachia') as Region;

const baseProps = {
  region: REGION,
  regionPrice: '$2.99',
  bundlePrice: '$6.99',
  onPurchaseRegion: jest.fn(),
  onPurchaseBundle: jest.fn(),
  onRestore: jest.fn(),
  onClose: jest.fn(),
};

describe('PaywallScreen', () => {
  it('renders the region name and both prices', () => {
    render(<PaywallScreen {...baseProps} testID="paywall" />);
    // "Appalachia" appears as both the polaroid caption and the title.
    expect(screen.getAllByText(/Appalachia/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/\$2\.99/)).toBeTruthy();
    expect(screen.getByText(/\$6\.99/)).toBeTruthy();
    expect(screen.getByText(/Best Value/i)).toBeTruthy();
  });

  it('calls onPurchaseRegion when the region option is tapped', () => {
    const onPurchaseRegion = jest.fn();
    render(<PaywallScreen {...baseProps} onPurchaseRegion={onPurchaseRegion} testID="paywall" />);
    fireEvent.press(screen.getByTestId('paywall-region'));
    expect(onPurchaseRegion).toHaveBeenCalledTimes(1);
  });

  it('calls onPurchaseBundle when the bundle option is tapped', () => {
    const onPurchaseBundle = jest.fn();
    render(<PaywallScreen {...baseProps} onPurchaseBundle={onPurchaseBundle} testID="paywall" />);
    fireEvent.press(screen.getByTestId('paywall-bundle'));
    expect(onPurchaseBundle).toHaveBeenCalledTimes(1);
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
});
