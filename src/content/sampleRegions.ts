import { Region } from '@/engine';
import { colors } from '@/theme';
import { buildPuzzle } from './buildPuzzle';
import { samplePuzzles } from './samplePuzzles';

// A second region's puzzle (locked/paid) to exercise lock + purchase flows.
const appalachiaPuzzles = [
  buildPuzzle({
    id: 'appalachia-001',
    name: 'The Hollow',
    subtitle: 'Unidentified · Field Test',
    grid: [
      [0, 1, 1, 1, 0],
      [1, 1, 0, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 0, 1, 1],
      [0, 1, 1, 1, 0],
    ],
    entry: {
      title: 'THE HOLLOW · Case 101',
      body: 'Something circled the hollow three times and did not come back a fourth. The dogs would not follow.',
      voiceStyle: 'firstPerson',
      yearReported: 1991,
      witnessCredibility: 'medium',
    },
    metadata: { regionId: 'appalachia', order: 1, isCapstone: false },
  }),
];

export const sampleRegions: Region[] = [
  {
    id: 'pnw',
    name: 'The Pacific Northwest',
    tagline: 'Where the trees watch',
    tint: colors.region.pnw,
    puzzles: samplePuzzles,
    totalPuzzles: samplePuzzles.length,
    isFree: true,
  },
  {
    id: 'appalachia',
    name: 'Appalachia',
    tagline: 'The old roads remember',
    tint: colors.region.appalachia,
    puzzles: appalachiaPuzzles,
    totalPuzzles: appalachiaPuzzles.length,
    isFree: false,
    iapProductId: 'region.appalachia',
  },
];

export function getSampleRegion(id: string): Region | undefined {
  return sampleRegions.find((r) => r.id === id);
}
