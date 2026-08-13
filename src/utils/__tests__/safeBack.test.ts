import { safeBack } from '@/utils/safeBack';

describe('safeBack', () => {
  it('pops history when there is somewhere to go back to', () => {
    const router = { canGoBack: () => true, back: jest.fn(), replace: jest.fn() };
    safeBack(router, '/regions');
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('replaces with the fallback when there is no history to pop', () => {
    const router = { canGoBack: () => false, back: jest.fn(), replace: jest.fn() };
    safeBack(router, '/regions');
    expect(router.replace).toHaveBeenCalledWith('/regions');
    expect(router.back).not.toHaveBeenCalled();
  });
});
