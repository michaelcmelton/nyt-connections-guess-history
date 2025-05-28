import { Message, GameState } from '../shared/types';

// Initialize storage with empty game state
chrome.runtime.onInstalled.addListener(() => {
  console.log('Connections Guess History extension installed');
  chrome.storage.local.set({ gameState: { guesses: [], currentGameId: '' } });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  if (message.type === 'GAME_STATE') {
    console.log('Game state received:', message.data);
    // Store game state in chrome.storage
    chrome.storage.local.set({ gameState: message.data }, () => {
      sendResponse({ success: true });
    });
    return true; // Will respond asynchronously
  }
  
  if (message.type === 'GUESS_HISTORY') {
    console.log('Guess history request received');
    // Retrieve and send current game state
    chrome.storage.local.get(['gameState'], (result) => {
      console.log('Retrieved game state:', result.gameState);
      sendResponse(result.gameState || { guesses: [], currentGameId: '' });
    });
    return true; // Will respond asynchronously
  }
}); 