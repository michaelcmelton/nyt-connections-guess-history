export interface Card {
  position: number;
  level: number;
}

export interface Guess {
  cards: Card[];
  correct: boolean;
}

export interface SolvedCategory {
  cards: Card[];
  level: number;
  orderSolved: number;
}

export interface PuzzleData {
  puzzleComplete: boolean;
  puzzleWon: boolean;
  mistakes: number;
  guesses: Guess[];
  solvedCategories: SolvedCategory[];
  isPlayingArchive: boolean;
}

export interface PuzzleState {
  puzzleId: string;
  data: PuzzleData;
  puzzleWon: boolean;
  puzzleComplete: boolean;
  schemaVersion: string;
  timestamp: number;
  printDate: string;
}

export interface GameState {
  states: PuzzleState[];
}

export const CURRENT_SCHEMA_VERSION = "0.36.0";

export function isValidSchemaVersion(state: PuzzleState): boolean {
  return state.schemaVersion === CURRENT_SCHEMA_VERSION;
}

export function isValidGameState(gameState: unknown): gameState is GameState {
  if (!gameState || typeof gameState !== 'object') return false;
  
  const state = gameState as GameState;
  if (!Array.isArray(state.states)) return false;
  
  return state.states.every(puzzleState => 
    typeof puzzleState.puzzleId === 'string' &&
    typeof puzzleState.schemaVersion === 'string' &&
    isValidSchemaVersion(puzzleState)
  );
}
