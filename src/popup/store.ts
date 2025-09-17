import { writable } from 'svelte/store';
import type { GuessHistoryEntry } from './types.ts';

export const guessHistory = writable<GuessHistoryEntry[]>([]);

export async function loadGuessHistory(): Promise<void> {
    try {
        const result = await chrome.storage.local.get(['guessHistory']);
        const history = result.guessHistory || [];
        guessHistory.set(history);
    } catch (error) {
        console.error('Failed to load guess history:', error);
        guessHistory.set([]);
    }
}

export async function clearGuessHistory(): Promise<void> {
    try {
        await chrome.storage.local.remove(['guessHistory']);
        guessHistory.set([]);
    } catch (error) {
        console.error('Failed to clear guess history:', error);
    }
}

export async function saveGuessHistory(entry: GuessHistoryEntry): Promise<void> {
    try {
        const result = await chrome.storage.local.get(['guessHistory']);
        const existingHistory: GuessHistoryEntry[] = result.guessHistory || [];
        
        // Add new entry at the beginning
        const updatedHistory = [entry, ...existingHistory].slice(0, 50);
        
        await chrome.storage.local.set({ guessHistory: updatedHistory });
        guessHistory.set(updatedHistory);
    } catch (error) {
        console.error('Failed to save guess history:', error);
    }
}
