import { Puzzle } from '@/engine';
import { buildPuzzle } from './buildPuzzle';

// Small hand-authored dev puzzles (stand-in until the content pipeline lands).
export const samplePuzzles: Puzzle[] = [
  buildPuzzle({
    id: 'sample-plus',
    name: 'The Crossing',
    subtitle: 'Unidentified · Field Test',
    grid: [
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
    ],
    entry: {
      title: 'THE CROSSING · Case 001',
      body: 'A shape stood at the intersection of two logging roads at dusk. By the time the truck slowed, only the crossing remained. Recommend the file stay open.',
      voiceStyle: 'notebook',
      yearReported: 1974,
      witnessCredibility: 'medium',
    },
    metadata: { regionId: 'pnw', order: 1, isCapstone: false },
  }),
  buildPuzzle({
    id: 'sample-eye',
    name: 'The Watcher',
    subtitle: 'Unidentified · Field Test',
    grid: [
      [0, 1, 1, 1, 0],
      [1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1],
      [0, 1, 1, 1, 0],
    ],
    entry: {
      title: 'THE WATCHER · Case 002',
      body: 'Reported as a single reflective eye in the treeline that did not blink for eleven minutes. The witness blinked first.',
      voiceStyle: 'firstPerson',
      yearReported: 1988,
      witnessCredibility: 'low',
    },
    metadata: { regionId: 'pnw', order: 2, isCapstone: false },
  }),
];

export function getSamplePuzzle(id: string): Puzzle | undefined {
  return samplePuzzles.find((p) => p.id === id);
}
