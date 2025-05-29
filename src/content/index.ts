/// <reference types="chrome"/>
/** Content script for the extension 
 * 
 * This script is responsible for:
 * - Finding applicable game state in local storage denoted by partial key matches to games-state-connections.
 * - Sending the game state when requested.
*/

import { PuzzleState, isValidGameState } from '../shared/types';

const STORAGE_KEY_PATTERN = 'games-state-connections';

function findGameState(): PuzzleState | null {
  // Find all keys in localStorage that match our pattern
  const matchingKeys = Object.keys(localStorage).filter(key => key.includes(STORAGE_KEY_PATTERN));
  console.log('[DEBUG] Found matching storage keys:', matchingKeys);
  
  if (matchingKeys.length === 0) {
    console.log('[DEBUG] No matching storage keys found');
    return null;
  }

  try {
    if (matchingKeys.length === 1) {
      const rawState = JSON.parse(localStorage.getItem(matchingKeys[0]) || '');
      console.log('[DEBUG] Single key state found:', {
        key: matchingKeys[0],
        guessCount: rawState?.states?.[0]?.data?.guesses?.length || 0,
        state: rawState
      });
      return isValidGameState(rawState) ? rawState.states[0] : null;
    }

    // If we have multiple keys, prefer the non-anonymous one
    for (const key of matchingKeys) {
      if (!key.includes('ANON')) {
        const rawState = JSON.parse(localStorage.getItem(key) || '');
        console.log('[DEBUG] Found non-anonymous state:', {
          key,
          guessCount: rawState?.states?.[0]?.data?.guesses?.length || 0,
          state: rawState
        });
        if (isValidGameState(rawState)) {
          return rawState.states[0];
        }
      }
    }

    // If we don't find a valid game state, return null
    console.log('[DEBUG] No valid game state found in any storage key');
    return null;
  } catch (error) {
    console.error('[DEBUG] Error parsing game state:', error);
    return null;
  }
}

function scrapeChoices(): string[] | null {
  console.log('[DEBUG] Attempting to scrape choices from game board...');
  const choices = document.querySelectorAll('[data-flip-id]');
  if (choices.length === 0) {
    console.log('[DEBUG] No choices found on game board');
    return null;
  }

  const choiceArray = Array.from(choices).map(choice => (choice as HTMLElement).dataset.flipId || '');
  console.log('[DEBUG] Successfully scraped choices:', choiceArray);
  return choiceArray;
}

// Listen for state requests from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REQUEST_CURRENT_STATE') {
    console.log('[DEBUG] Received request for current state');
    const gameState = findGameState();
    const choices = scrapeChoices();
    
    console.log('[DEBUG] Sending current state:', {
      guessCount: gameState?.data?.guesses?.length || 0,
      state: gameState,
      choices
    });
    
    sendResponse({
      state: gameState,
      choices: choices || []
    });
  }
  return true; // Required for async response
});