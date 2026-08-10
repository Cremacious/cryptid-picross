import { create } from 'zustand';
import { ProgressStateV1, SolvedEntry } from './saveTypes';
import { notifyChange } from './saveBus';

interface ProgressStore extends ProgressStateV1 {
  markSolved: (id: string, result: { time: number; mistakes: number }) => void;
  isSolved: (id: string) => boolean;
  getEntry: (id: string) => SolvedEntry | undefined;
  setOnboardingCompleted: (v: boolean) => void;
  clearAll: () => void;
  hydrate: (s: ProgressStateV1) => void;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  solved: {},
  onboardingCompleted: false,
  firstLaunchAt: Date.now(),
  markSolved: (id, result) => {
    const now = Date.now();
    const prev = get().solved[id];
    const isNewBest = !prev || result.time < prev.time;
    const entry: SolvedEntry = prev
      ? {
          time: Math.min(prev.time, result.time),
          mistakes: isNewBest ? result.mistakes : prev.mistakes,
          solvedAt: prev.solvedAt,
          lastPlayedAt: now,
          playCount: prev.playCount + 1,
        }
      : { time: result.time, mistakes: result.mistakes, solvedAt: now, lastPlayedAt: now, playCount: 1 };
    set({ solved: { ...get().solved, [id]: entry } });
    notifyChange();
  },
  isSolved: (id) => get().solved[id] !== undefined,
  getEntry: (id) => get().solved[id],
  setOnboardingCompleted: (onboardingCompleted) => { set({ onboardingCompleted }); notifyChange(); },
  clearAll: () => { set({ solved: {}, onboardingCompleted: false }); notifyChange(); },
  hydrate: (s) => set({ ...s }),
}));
