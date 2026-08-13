import { render, screen, fireEvent } from '@testing-library/react-native';
import { RegionsScreen } from '@/components/screens';
import { sampleRegions } from '@/content/sampleRegions';
import { useProgressStore, usePurchaseStore } from '@/state';

beforeEach(() => {
  useProgressStore.getState().hydrate({ solved: {}, onboardingCompleted: false, firstLaunchAt: 0 });
  usePurchaseStore.getState().hydrate({ ownedRegions: [], ownedPacks: [], lastRestoredAt: null, purchaseHistory: [] });
});

describe('RegionsScreen', () => {
  it('renders each region name', () => {
    render(<RegionsScreen regions={sampleRegions} onSelectRegion={() => {}} onBack={() => {}} testID="regions" />);
    expect(screen.getByText('The Pacific Northwest')).toBeTruthy();
    expect(screen.getByText('Appalachia')).toBeTruthy();
    expect(screen.getByText('The Great Lakes')).toBeTruthy();
  });

  it('locks a paid, unowned region and leaves free regions unlocked', () => {
    render(<RegionsScreen regions={sampleRegions} onSelectRegion={() => {}} onBack={() => {}} testID="regions" />);
    // pnw + appalachia are free -> chevron; greatlakes is paid+unowned -> lock
    expect(screen.getByTestId('region-greatlakes-lock')).toBeTruthy();
    expect(screen.getByTestId('region-pnw-chevron')).toBeTruthy();
    expect(screen.getByTestId('region-appalachia-chevron')).toBeTruthy();
  });

  it('unlocks a paid region once owned', () => {
    usePurchaseStore.getState().grantRegion('greatlakes');
    render(<RegionsScreen regions={sampleRegions} onSelectRegion={() => {}} onBack={() => {}} testID="regions" />);
    expect(screen.getByTestId('region-greatlakes-chevron')).toBeTruthy();
  });

  it('calls onSelectRegion when a region is tapped', () => {
    const onSelectRegion = jest.fn();
    render(<RegionsScreen regions={sampleRegions} onSelectRegion={onSelectRegion} onBack={() => {}} testID="regions" />);
    fireEvent.press(screen.getByTestId('region-pnw'));
    expect(onSelectRegion).toHaveBeenCalledWith('pnw');
  });

  it('calls onBack from the back control', () => {
    const onBack = jest.fn();
    render(<RegionsScreen regions={sampleRegions} onSelectRegion={() => {}} onBack={onBack} testID="regions" />);
    fireEvent.press(screen.getByTestId('regions-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
