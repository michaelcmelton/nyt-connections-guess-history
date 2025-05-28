import { Guess, GameState, Message } from '../shared/types';

// Function to get localStorage items by partial key match
function getLocalStorageItemsByPartialKey(partialKey: string): { [key: string]: any } {
  console.log('Searching localStorage for keys containing:', partialKey);
  const matches: { [key: string]: any } = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log('Checking key:', key);
    if (key && key.includes(partialKey)) {
      try {
        const value = localStorage.getItem(key);
        console.log('Found matching key:', key, 'with value:', value);
        matches[key] = JSON.parse(value || '{}');
      } catch (error) {
        console.error(`Error parsing localStorage item ${key}:`, error);
      }
    }
  }
  console.log('Total matches found:', Object.keys(matches).length);
  return matches;
}

// Function to send game state to background script
function sendGameState() {
  const gameStates = getLocalStorageItemsByPartialKey('games-state-connections');
  for (const [key, gameState] of Object.entries(gameStates)) {
    if (!key.includes('ANON')) {
      chrome.runtime.sendMessage({
        type: 'GAME_STATE',
        data: gameState
      } as Message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
        } else {
          console.log('Message sent successfully:', response);
        }
      });
      break;
    } else if (Object.entries(gameState).length == 1) { 
      chrome.runtime.sendMessage({
        type: 'GAME_STATE',
        data: gameState
      } as Message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
        } else {
          console.log('Message sent successfully:', response);
        }
      });
    }
  }
  chrome.runtime.sendMessage({
    type: 'GAME_STATE',
    data: gameStates
  } as Message, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError);
    } else {
      console.log('Message sent successfully:', response);
    }
  });
}

// Send initial state
sendGameState();