/**
 * Background service worker for Connections Guess History Chrome Extension
 * Handles storage and communication between content script and popup
 */

interface GuessHistory {
    id: string;
    timestamp: string;
    guesses: string[];
    gameState: string;
}

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'saveGuessHistory') {
        saveGuessHistory(message.data);
        sendResponse({ success: true });
    } else if (message.action === 'getGuessHistory') {
        getGuessHistory().then(data => {
            sendResponse({ success: true, data });
        });
        return true; // Keep message channel open for async response
    }
});

/**
 * Save guess history to Chrome storage
 */
async function saveGuessHistory(data: GuessHistory): Promise<void> {
    try {
        const result = await chrome.storage.local.get(['guessHistory']);
        const existingHistory: GuessHistory[] = result.guessHistory || [];
        
        // Add new entry
        existingHistory.unshift(data);
        
        // Keep only last 50 entries to prevent storage bloat
        const limitedHistory = existingHistory.slice(0, 50);
        
        await chrome.storage.local.set({ guessHistory: limitedHistory });
        console.log('Guess history saved successfully');
    } catch (error) {
        console.error('Failed to save guess history:', error);
    }
}

/**
 * Get guess history from Chrome storage
 */
async function getGuessHistory(): Promise<GuessHistory[]> {
    try {
        const result = await chrome.storage.local.get(['guessHistory']);
        return result.guessHistory || [];
    } catch (error) {
        console.error('Failed to get guess history:', error);
        return [];
    }
}

// Initialize background script
console.log('Connections Guess History background script loaded');
