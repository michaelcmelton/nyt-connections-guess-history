/// <reference types="chrome"/>
import { Message, MessageResponse, MessageType } from '../shared/messages';
import { GameState, PuzzleState, isValidGameState } from '../shared/types';

// Function to find game state in localStorage. There can be multiple game states in localStorage, 
// one as ANON, and one as a user. If the user key exists, we should prefer that one. 
// Otherwise, we should use the ANON key.
function findGameState(): PuzzleState | null {
  let state: GameState | null = null;
  const keys = Object.keys(localStorage);
  const gameStateKeys = keys.filter(key => key.includes('games-state-connections'));
  console.debug('[DEBUG -- content] game state keys: ', JSON.stringify(gameStateKeys));
  
  if (!gameStateKeys.length) {
    chrome.runtime.sendMessage({
      type: MessageType.NO_GAME_FOUND,
    });
    return state;
  }

  try {
    for (const key of gameStateKeys) {
      const gameState = JSON.parse(localStorage.getItem(key) || '');
      if (isValidGameState(gameState)) {
        state = gameState as unknown as GameState;
      }

      if (!key.includes('ANON')) {
        break;
      }
    }
    if (state) {
      return state.states[0];
    }
    return null;
  } catch (error) {
    console.error('[ERROR -- content] error parsing game state: ', error);
    chrome.runtime.sendMessage({
      type: MessageType.NO_GAME_FOUND,
    });
    return null;
  }
}

// Function to scrape choices from the DOM
function scrapeChoices(): string[] {
  const choices: string[] = [];
  const cards = document.querySelectorAll('[data-flip-id]');
  
  cards.forEach(card => {
    const text = card.textContent?.trim();
    if (text) {
      choices.push(text.slice(0, 1).toUpperCase() + text.slice(1).toLowerCase());
    }
  });

  return choices;
}

// Set up message listener
const messageListener = (message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response?: MessageResponse) => void) => {
  switch (message.type) {
    case MessageType.REQUEST_CURRENT_GAME_STATE:
      const gameState = findGameState();
      sendResponse({ state: gameState });
      return true;
    case MessageType.REQUEST_CHOICES:
      const choices = scrapeChoices();
      sendResponse({ choices: choices });
      return true;
    default:
      sendResponse({ status: 'error', error: `Unknown message type: ${message.type}` });
      return true;
  }
};

// Add our message listener
chrome.runtime.onMessage.addListener(messageListener);

// Function to notify that we're ready
function notifyReady() {
  chrome.runtime.sendMessage({ 
    type: MessageType.CONTENT_SCRIPT_READY,
    url: window.location.href 
  }).catch(error => {
    console.error('Failed to send ready message:', error);
  });
}

// Notify that we're ready
notifyReady();
