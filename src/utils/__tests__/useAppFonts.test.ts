import { renderHook } from '@testing-library/react-native';
import { useAppFonts } from '@/utils/useAppFonts';

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));

describe('useAppFonts', () => {
  it('reports fonts loaded when expo-font resolves', async () => {
    const { result } = await renderHook(() => useAppFonts());
    expect(result.current.fontsLoaded).toBe(true);
  });
});
