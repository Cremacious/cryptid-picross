import { useProgressStore } from '@/state/progressStore';
import { notifyChange } from '@/state/saveBus';

jest.mock('@/state/saveBus', () => ({
  notifyChange: jest.fn(),
  setChangeHandler: jest.fn(),
}));

beforeEach(() => {
  (notifyChange as jest.Mock).mockClear();
  useProgressStore.getState().hydrate({ solved: {}, onboardingCompleted: false, firstLaunchAt: 0 });
});

describe('progressStore', () => {
  it('markSolved records time, mistakes, and playCount, and notifies', () => {
    useProgressStore.getState().markSolved('p1', { time: 100, mistakes: 2 });
    const e = useProgressStore.getState().getEntry('p1');
    expect(e?.time).toBe(100);
    expect(e?.mistakes).toBe(2);
    expect(e?.playCount).toBe(1);
    expect(notifyChange).toHaveBeenCalled();
  });

  it('preserves the best time and its mistakes across replays', () => {
    const p = useProgressStore.getState();
    p.markSolved('p1', { time: 100, mistakes: 5 });
    p.markSolved('p1', { time: 60, mistakes: 1 }); // new best
    p.markSolved('p1', { time: 80, mistakes: 0 }); // worse -> ignored for time/mistakes
    const e = useProgressStore.getState().getEntry('p1');
    expect(e?.time).toBe(60);
    expect(e?.mistakes).toBe(1);
    expect(e?.playCount).toBe(3);
  });

  it('isSolved reflects whether an id has an entry', () => {
    expect(useProgressStore.getState().isSolved('p1')).toBe(false);
    useProgressStore.getState().markSolved('p1', { time: 10, mistakes: 0 });
    expect(useProgressStore.getState().isSolved('p1')).toBe(true);
  });

  it('sets onboarding and clears all progress', () => {
    const p = useProgressStore.getState();
    p.setOnboardingCompleted(true);
    p.markSolved('p1', { time: 10, mistakes: 0 });
    p.clearAll();
    expect(useProgressStore.getState().isSolved('p1')).toBe(false);
    expect(useProgressStore.getState().onboardingCompleted).toBe(false);
  });
});
