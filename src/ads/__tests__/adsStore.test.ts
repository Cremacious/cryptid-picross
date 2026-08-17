import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAdsStore, loadAdsCadence, ADS_CADENCE_KEY } from '@/ads/adsStore';

beforeEach(async () => {
  useAdsStore.getState().hydrate({ completionsSinceShown: 0, lastShownAt: null });
  await AsyncStorage.clear();
});

describe('ads cadence store', () => {
  it('recordCompletion increments the counter and persists', async () => {
    useAdsStore.getState().recordCompletion();
    useAdsStore.getState().recordCompletion();
    expect(useAdsStore.getState().completionsSinceShown).toBe(2);
    const raw = await AsyncStorage.getItem(ADS_CADENCE_KEY);
    expect(JSON.parse(raw as string).completionsSinceShown).toBe(2);
  });

  it('recordShown resets the counter and stamps the time', () => {
    useAdsStore.getState().recordCompletion();
    useAdsStore.getState().recordShown(5_000);
    expect(useAdsStore.getState()).toMatchObject({ completionsSinceShown: 0, lastShownAt: 5_000 });
  });

  it('loadAdsCadence hydrates from storage', async () => {
    await AsyncStorage.setItem(ADS_CADENCE_KEY, JSON.stringify({ completionsSinceShown: 2, lastShownAt: 123 }));
    await loadAdsCadence();
    expect(useAdsStore.getState()).toMatchObject({ completionsSinceShown: 2, lastShownAt: 123 });
  });

  it('loadAdsCadence tolerates missing/garbage data', async () => {
    await loadAdsCadence(); // nothing stored
    expect(useAdsStore.getState().completionsSinceShown).toBe(0);
    await AsyncStorage.setItem(ADS_CADENCE_KEY, 'not json');
    await loadAdsCadence();
    expect(useAdsStore.getState().completionsSinceShown).toBe(0);
  });
});
