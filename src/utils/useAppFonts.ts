import { useFonts } from 'expo-font';
import { SpecialElite_400Regular } from '@expo-google-fonts/special-elite';
import {
  CourierPrime_400Regular,
  CourierPrime_400Regular_Italic,
  CourierPrime_700Bold,
} from '@expo-google-fonts/courier-prime';

/**
 * Loads the two brand families. The keys registered here MUST match the names
 * used in src/theme/typography.ts (fontFamily.display / body / bodyItalic / bodyBold).
 * Note: the package exports the italic face as `CourierPrime_400Regular_Italic`;
 * it is registered here under the `CourierPrime_400Italic` key to match typography.ts.
 */
export function useAppFonts(): { fontsLoaded: boolean } {
  const [fontsLoaded] = useFonts({
    SpecialElite_400Regular,
    CourierPrime_400Regular,
    CourierPrime_400Italic: CourierPrime_400Regular_Italic,
    CourierPrime_700Bold,
  });
  return { fontsLoaded };
}
