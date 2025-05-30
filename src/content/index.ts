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
  
  if (matchingKeys.length === 0) {
    return null;
  }

  try {
    if (matchingKeys.length === 1) {
      const rawState = JSON.parse(localStorage.getItem(matchingKeys[0]) || '');
      return isValidGameState(rawState) ? rawState.states[0] : null;
    }

    // If we have multiple keys, prefer the non-anonymous one
    for (const key of matchingKeys) {
      if (!key.includes('ANON')) {
        const rawState = JSON.parse(localStorage.getItem(key) || '');
        if (isValidGameState(rawState)) {
          return rawState.states[0];
        }
      }
    }

    // If we don't find a valid game state, return null
    return null;
  } catch (error) {
    console.error('[DEBUG] Error parsing game state:', error);
    return null;
  }
}

function scrapeChoices(): string[] {
  const choices = document.querySelectorAll('[data-flip-id]');
  if (choices.length === 0) {
    return [];
  }

  const choiceArray = Array.from(choices).map(choice => (choice as HTMLElement).dataset.flipId || '');
  return choiceArray;
}

// Listen for state requests from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REQUEST_CURRENT_GAME_STATE') {
    const gameState = findGameState();
    sendResponse({
      state: gameState,
    });
  }

  if (message.type === 'REQUEST_CHOICES') {
    sendResponse({choices: scrapeChoices()});
  }
  return true; // Required for async response
});