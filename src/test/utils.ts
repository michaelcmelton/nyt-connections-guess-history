import { render, RenderOptions } from '@testing-library/svelte';
import { vi } from 'vitest';
import type { GuessHistoryEntry } from '../popup/types';

// Mock Chrome storage data
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
    }
];

// Mock Chrome storage functions
export const mockChromeStorage = {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn()
};

// Setup Chrome storage mocks
export function setupChromeStorageMocks() {
    // Reset all mocks first
    mockChromeStorage.get.mockReset();
    mockChromeStorage.set.mockReset();
    mockChromeStorage.remove.mockReset();
    mockChromeStorage.clear.mockReset();
    
    // Set up default return values
    mockChromeStorage.get.mockResolvedValue({ guessHistory: mockGuessHistory });
    mockChromeStorage.set.mockResolvedValue(undefined);
    mockChromeStorage.remove.mockResolvedValue(undefined);
    mockChromeStorage.clear.mockResolvedValue(undefined);
}

// Reset all mocks
export function resetMocks() {
    vi.clearAllMocks();
    setupChromeStorageMocks();
}

// Custom render function with providers
export function customRender(component: any, options?: RenderOptions) {
    return render(component, {
        ...options,
    });
}

// Helper to create mock guess history entry
export function createMockGuessHistoryEntry(overrides: Partial<GuessHistoryEntry> = {}): GuessHistoryEntry {
    return {
        id: 'test-id',
        timestamp: new Date().toISOString(),
        guesses: ['test-guess'],
        gameState: 'completed',
        ...overrides
    };
}

// Helper to wait for async operations
export function waitFor(ms: number = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
