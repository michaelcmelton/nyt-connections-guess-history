import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { 
    guessHistory, 
    loadGuessHistory, 
    clearGuessHistory, 
    saveGuessHistory 
} from './store';
import { 
    mockGuessHistory, 
    setupChromeStorageMocks, 
    resetMocks,
    createMockGuessHistoryEntry 
} from '../test/utils';

// Mock Chrome APIs globally
const mockChrome = {
    storage: {
        local: {
            get: vi.fn(),
            set: vi.fn(),
            remove: vi.fn()
        }
    }
};

Object.defineProperty(global, 'chrome', {
    value: mockChrome,
    writable: true
});

// Local setup function for our mock
const setupLocalChromeStorageMocks = () => {
    mockChrome.storage.local.get.mockResolvedValue({ guessHistory: mockGuessHistory });
    mockChrome.storage.local.set.mockResolvedValue(undefined);
    mockChrome.storage.local.remove.mockResolvedValue(undefined);
};

describe('Store Functions', () => {
    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();
        setupLocalChromeStorageMocks();
        // Reset store to initial state
        guessHistory.set([]);
    });

    describe('loadGuessHistory', () => {
        it('should load guess history from Chrome storage', async () => {
            setupLocalChromeStorageMocks();
            
            await loadGuessHistory();
            
            const currentHistory = get(guessHistory);
            expect(currentHistory).toEqual(mockGuessHistory);
        });

        it('should handle empty storage gracefully', async () => {
            mockChrome.storage.local.get.mockResolvedValue({});
            
            await loadGuessHistory();
            
            const currentHistory = get(guessHistory);
            expect(currentHistory).toEqual([]);
        });

        it('should handle storage errors gracefully', async () => {
            mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'));
            
            await loadGuessHistory();
            
            const currentHistory = get(guessHistory);
            expect(currentHistory).toEqual([]);
        });
    });

    describe('clearGuessHistory', () => {
        it('should clear guess history from storage and store', async () => {
            mockChrome.storage.local.remove.mockResolvedValue(undefined);
            
            // Set some initial data
            guessHistory.set(mockGuessHistory);
            
            await clearGuessHistory();
            
            expect(mockChrome.storage.local.remove).toHaveBeenCalledWith(['guessHistory']);
            expect(get(guessHistory)).toEqual([]);
        });

        it('should handle storage errors gracefully', async () => {
            mockChrome.storage.local.remove.mockRejectedValue(new Error('Storage error'));
            
            // Set some initial data
            guessHistory.set(mockGuessHistory);
            
            await clearGuessHistory();
            
            // Store should remain unchanged when storage fails
            expect(get(guessHistory)).toEqual(mockGuessHistory);
        });
    });

    describe('saveGuessHistory', () => {
        it('should save new guess history entry', async () => {
            mockChrome.storage.local.get.mockResolvedValue({ guessHistory: [] });
            mockChrome.storage.local.set.mockResolvedValue(undefined);
            
            const newEntry = createMockGuessHistoryEntry();
            
            await saveGuessHistory(newEntry);
            
            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                guessHistory: [newEntry]
            });
            expect(get(guessHistory)).toEqual([newEntry]);
        });

        it('should prepend new entry to existing history', async () => {
            mockChrome.storage.local.get.mockResolvedValue({ guessHistory: mockGuessHistory });
            mockChrome.storage.local.set.mockResolvedValue(undefined);
            
            const newEntry = createMockGuessHistoryEntry();
            
            await saveGuessHistory(newEntry);
            
            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                guessHistory: [newEntry, ...mockGuessHistory]
            });
            expect(get(guessHistory)).toEqual([newEntry, ...mockGuessHistory]);
        });

        it('should limit history to 50 entries', async () => {
            const largeHistory = Array.from({ length: 50 }, (_, i) => 
                createMockGuessHistoryEntry({ id: `existing-${i}` })
            );
            mockChrome.storage.local.get.mockResolvedValue({ guessHistory: largeHistory });
            mockChrome.storage.local.set.mockResolvedValue(undefined);
            
            const newEntry = createMockGuessHistoryEntry();
            
            await saveGuessHistory(newEntry);
            
            const savedHistory = mockChrome.storage.local.set.mock.calls[0][0].guessHistory;
            expect(savedHistory).toHaveLength(50);
            expect(savedHistory[0]).toEqual(newEntry);
        });

        it('should handle storage errors gracefully', async () => {
            mockChrome.storage.local.get.mockResolvedValue({ guessHistory: [] });
            mockChrome.storage.local.set.mockRejectedValue(new Error('Storage error'));
            
            const newEntry = createMockGuessHistoryEntry();
            
            await saveGuessHistory(newEntry);
            
            // Store should remain unchanged when storage fails
            expect(get(guessHistory)).toEqual([]);
        });
    });
});
