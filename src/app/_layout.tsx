import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '@/theme';
import { ErrorBoundary } from '@/components/organisms';
import { useAppFonts } from '@/utils/useAppFonts';
import { initSaveSystem } from '@/state';
import { configureIap } from '@/iap';
import { initAds } from '@/ads';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { fontsLoaded } = useAppFonts();
  // Load the saved game (progress, settings, purchases, onboarding) and wire the persist
  // handler BEFORE rendering — otherwise mutations never save and the app resets every
  // launch (onboarding reappears, progress/purchases lost).
  const [hydrated, setHydrated] = useState(false);
  const ready = fontsLoaded && hydrated;

  useEffect(() => {
    // Native only: screen.orientation.lock() rejects with NotSupportedError on web
    // (and some devices), so guard the platform and swallow any rejection.
    if (Platform.OS !== 'web') {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    }
    let alive = true;
    // Load + hydrate the stores and register the persist handler.
    void initSaveSystem().finally(() => {
      if (alive) setHydrated(true);
    });
    // No-op on web / when RevenueCat keys are unset; sets up the store SDK otherwise.
    void configureIap();
    // No-op on web; on native for non-paying players it runs consent + preloads an ad.
    void initAds();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.paper.cream },
            }}
          />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
