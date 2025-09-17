export interface GuessHistoryEntry {
  id: string;
  timestamp: string;
  guesses: string[];
  gameState: string;
}

export const mockGuessHistory: GuessHistoryEntry[] = [
  {
    id: '1',
    timestamp: '2024-01-15T10:30:00Z',
    guesses: ['guess1', 'guess2'],
    gameState: 'completed'
  },
  {
    id: '2',
    timestamp: '2024-01-14T15:45:00Z',
    guesses: ['guess3', 'guess4', 'guess5'],
    gameState: 'in_progress'
  },
  {
    id: '3',
    timestamp: '2024-01-13T09:15:00Z',
    guesses: ['guess6'],
    gameState: 'failed'
  }
];

export const emptyGuessHistory: GuessHistoryEntry[] = [];

export const largeGuessHistory: GuessHistoryEntry[] = Array.from({ length: 60 }, (_, i) => ({
  id: `test-${i}`,
  timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  guesses: [`guess-${i}-1`, `guess-${i}-2`],
  gameState: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'in_progress' : 'failed'
}));

export function createMockGuessHistoryEntry(overrides: Partial<GuessHistoryEntry> = {}): GuessHistoryEntry {
  return {
    id: 'test-id',
    timestamp: new Date().toISOString(),
    guesses: ['test-guess'],
    gameState: 'completed',
    ...overrides
  };
}
