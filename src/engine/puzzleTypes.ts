// ---- Primitives ----
export type Cell = 0 | 1; // 0 = empty, 1 = filled (source of truth)
export type Line = Cell[];
export type Grid = Line[]; // grid[row][col]
export type Clue = number[]; // run lengths; [0] = empty line
export type Clues = Clue[];
export type PlayCell = 0 | 1 | 2; // 0 empty, 1 filled by user, 2 marked with X
export type PlayGrid = PlayCell[][];

// ---- Difficulty ----
export type Tier = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface DifficultyScore {
  size: number; // 0-5, from grid area
  density: number; // 0-5, distance from 50% fill
  segmentLength: number; // 0-5, inverse of average run length
  asymmetry: number; // 0-5, mirror symmetry distance
  solveDepth: number; // 0-5, propagation rounds needed
  total: number; // sum, 0-25
  tier: Tier;
}

// ---- Field entry (content) ----
export type VoiceStyle = 'notebook' | 'firstPerson' | 'victorian' | 'deadpan';

export interface FieldEntry {
  title: string;
  body: string;
  voiceStyle: VoiceStyle;
  yearReported?: number;
  witnessCredibility?: 'low' | 'medium' | 'high';
}

// ---- Puzzle ----
export interface PuzzleMetadata {
  regionId: string;
  order: number;
  isCapstone: boolean;
  cryptidName?: string;
  culturalSource?: {
    tradition: string;
    creditText: string;
    furtherReading?: string;
  };
}

export interface Puzzle {
  id: string;
  name: string;
  subtitle: string;
  grid: Grid;
  rowClues: Clues;
  colClues: Clues;
  fillRatio: number;
  isUnique: boolean;
  requiresGuessing: boolean;
  difficulty: DifficultyScore;
  entry: FieldEntry;
  metadata: PuzzleMetadata;
}

// ---- Region ----
export interface Region {
  id: string;
  name: string;
  tagline: string;
  tint: string;
  puzzles: Puzzle[];
  totalPuzzles: number;
  isFree: boolean;
  iapProductId?: string;
}

// ---- Purchases ----
export interface PurchaseInfo {
  ownedRegions: string[];
  ownedPacks: string[];
  purchasedFullBundle: boolean;
  lastRestoredAt: number | null;
}
