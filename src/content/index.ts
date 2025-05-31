/// <reference types="chrome"/>
/** Content script for the extension 
 * 
 * This script is responsible for:
 * - Finding applicable game state in local storage denoted by partial key matches to games-state-connections.
 * - Sending the game state when requested.
*/

import { PuzzleState, isValidGameState } from '../shared/types';

console.log('[DEBUG] Content script starting initialization');

const STORAGE_KEY_PATTERN = 'games-state-connections';

// Ensure we're on the right page
if (!window.location.href.includes('nytimes.com/games/connections')) {
  console.log('[DEBUG] Not on Connections page, content script will not initialize');
  throw new Error('Not on Connections page');
}

function findGameState(): PuzzleState | null {
  // Find all keys in localStorage that match our pattern
  const matchingKeys = Object.keys(localStorage).filter(key => key.includes(STORAGE_KEY_PATTERN));
  
  if (matchingKeys.length === 0) {
    console.log('[DEBUG] No matching keys found in localStorage');
    return null;
  }

  try {
    let gameState = null;
    
    // First try to find a non-anonymous game state
    for (const key of matchingKeys) {
      if (!key.includes('ANON')) {
        const rawData = localStorage.getItem(key);
        if (!rawData) continue;
        
        const parsedData = JSON.parse(rawData);
        console.log('[DEBUG] Parsed non-anonymous game state:', parsedData);
        
        if (isValidGameState(parsedData)) {
          gameState = parsedData.states[0];
          break;
        }
      }
    }

    // If no non-anonymous state found, try anonymous
    if (!gameState && matchingKeys.length > 0) {
      const rawData = localStorage.getItem(matchingKeys[0]);
      if (rawData) {
        const parsedData = JSON.parse(rawData);
        console.log('[DEBUG] Parsed anonymous game state:', parsedData);
        
        if (isValidGameState(parsedData)) {
          gameState = parsedData.states[0];
        }
      }
    }

    console.log('[DEBUG] Final game state:', gameState);
    return gameState;
  } catch (error) {
    console.error('[DEBUG] Error parsing game state:', error);
    return null;
  }
}

function scrapeChoices(): string[] {
  const choices = document.querySelectorAll('[data-flip-id]');
  if (choices.length === 0) {
    console.log('[DEBUG] No choices found in DOM');
    return [];
  }

  const choiceArray = Array.from(choices).map(choice => (choice as HTMLElement).dataset.flipId || '');
  console.log('[DEBUG] Scraped choices:', choiceArray);
  return choiceArray;
}

// Remove any existing listeners to prevent duplicates
if (chrome.runtime.onMessage.hasListeners()) {
  console.log('[DEBUG] Removing existing message listeners');
  chrome.runtime.onMessage.removeListener(() => {});
}

// Set up message listener
const messageListener = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  console.log('[DEBUG] Content script received message:', message);

  switch (message.type) {
    case 'PING':
      console.log('[DEBUG] Received ping, responding');
      sendResponse({ status: 'ok' });
      return true;

    case 'REQUEST_CURRENT_GAME_STATE':
      console.log('[DEBUG] Processing game state request');
      const gameState = findGameState();
      console.log('[DEBUG] Found current game state:', {
        guessCount: gameState?.data?.guesses?.length || 0,
        state: gameState
      });
      sendResponse({ state: gameState });
      return true;

    case 'REQUEST_CHOICES':
      console.log('[DEBUG] Processing choices request');
      const choices = scrapeChoices();
      console.log('[DEBUG] Sending choices response:', choices);
      sendResponse({ choices: choices });
      return true;

    default:
      console.log('[DEBUG] Unknown message type:', message.type);
      return true;
  }
};

// Add our message listener
chrome.runtime.onMessage.addListener(messageListener);

// Function to notify that we're ready
function notifyReady() {
  console.log('[DEBUG] Sending ready notification');
  chrome.runtime.sendMessage({ 
    type: 'CONTENT_SCRIPT_READY',
    url: window.location.href 
  }).catch(error => {
    console.log('[DEBUG] Failed to send ready message:', error);
  });
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', notifyReady);
} else {
  notifyReady();
}

console.log('[DEBUG] Content script initialization complete');