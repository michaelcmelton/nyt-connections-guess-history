export interface Guess {
  words: string[];
  isOneAway: boolean;
  timestamp: number;
}

export interface GameState {
  guesses: Guess[];
  currentGameId: string;
}

export interface Message {
  type: 'GUESS_HISTORY' | 'GAME_STATE';
  data: GameState;
} 