/// <reference types="chrome"/>
/** Content script for the extension 
 * 
 * This script is responsible for:
 * - Finding applicable game state in local storage denoted by partial key matches to game-state-connections.
 * - Sending the game state when requested.
*/

import { PuzzleState, isValidGameState } from '../shared/types';

console.log('[DEBUG] Content script starting initialization');

// Debug logging for state changes
function logStateChange(action: string, data?: any) {
  console.log('[DEBUG] Content script state change:', {
    action,
    url: window.location.href,
    ...data
  });
}

// Ensure we're on the right page
if (!window.location.href.includes('nytimes.com/games/connections')) {
  console.log('[DEBUG] Not on Connections page, content script will not initialize');
  throw new Error('Not on Connections page');
}

// Function to find game state in localStorage
function findGameState(): PuzzleState | null {
  const keys = Object.keys(localStorage);
  const gameStateKey = keys.find(key => key.includes('game-state-connections'));
  
  if (!gameStateKey) {
    console.log('[DEBUG] No game state found in localStorage');
    return null;
  }

  try {
    const state = JSON.parse(localStorage.getItem(gameStateKey) || '');
    if (isValidGameState(state)) {
      logStateChange('found-game-state', {
        key: gameStateKey,
        guessCount: state.states[0].data.guesses.length,
        isComplete: state.states[0].puzzleComplete,
        isWon: state.states[0].puzzleWon
      });
      return state.states[0];
    }
    console.log('[DEBUG] Invalid game state found:', state);
    return null;
  } catch (error) {
    console.error('[DEBUG] Error parsing game state:', error);
    return null;
  }
}

// Function to scrape choices from the DOM
function scrapeChoices(): string[] {
  const choices: string[] = [];
  const cards = document.querySelectorAll('[class*="card"]');
  
  console.log('[DEBUG] Scraping choices from DOM:', {
    cardCount: cards.length
  });

  cards.forEach(card => {
    const text = card.textContent?.trim();
    if (text) {
      choices.push(text);
    }
  });

  logStateChange('scraped-choices', {
    choicesCount: choices.length
  });

  return choices;
}

// Function to notify background script of state changes
function notifyStateChange() {
  const gameState = findGameState();
  if (gameState) {
    logStateChange('notifying-state-change', {
      guessCount: gameState.data.guesses.length,
      isComplete: gameState.data.puzzleComplete,
      isWon: gameState.data.puzzleWon
    });
    chrome.runtime.sendMessage({ 
      type: 'GAME_STATE_UPDATED',
      payload: { state: gameState }
    }).catch(error => {
      console.log('[DEBUG] Failed to send state update:', error);
    });
  }
}

// Set up storage event listener
window.addEventListener('storage', (event) => {
  if (event.key?.includes('game-state-connections')) {
    console.log('[DEBUG] Storage event detected:', {
      key: event.key,
      newValue: event.newValue ? 'present' : 'null',
      oldValue: event.oldValue ? 'present' : 'null'
    });
    notifyStateChange();
  }
});

// Also observe DOM changes as a fallback
const observer = new MutationObserver((mutations) => {
  console.log('[DEBUG] DOM mutation detected:', {
    mutationCount: mutations.length,
    target: mutations[0]?.target instanceof Element ? mutations[0].target.className : 'unknown'
  });
  notifyStateChange();
});

// Start observing the game container
const gameContainer = document.querySelector('[class*="cardsContainer"]');
if (gameContainer) {
  console.log('[DEBUG] Found game container, setting up observer');
  observer.observe(gameContainer, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });
} else {
  console.log('[DEBUG] Game container not found');
}

// Remove any existing listeners to prevent duplicates
if (chrome.runtime.onMessage.hasListeners()) {
  console.log('[DEBUG] Removing existing message listeners');
  chrome.runtime.onMessage.removeListener(() => {});
}

// Set up message listener
const messageListener = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  console.log('[DEBUG] Content script received message:', {
    type: message.type,
    senderId: sender.id
  });

  switch (message.type) {
    case 'PING':
      console.log('[DEBUG] Received ping, responding');
      sendResponse({ status: 'ok' });
      return true;

    case 'REQUEST_CURRENT_GAME_STATE':
      console.log('[DEBUG] Processing game state request');
      const gameState = findGameState();
      logStateChange('sending-game-state', {
        hasState: !!gameState,
        guessCount: gameState?.data?.guesses?.length || 0
      });
      sendResponse({ state: gameState });
      return true;

    case 'REQUEST_CHOICES':
      console.log('[DEBUG] Processing choices request');
      const choices = scrapeChoices();
      logStateChange('sending-choices', {
        choicesCount: choices.length
      });
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

// Notify that we're ready
notifyReady();

console.log('[DEBUG] Content script initialization complete');