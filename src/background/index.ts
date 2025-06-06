/** Background script for the extension 
 * 
 * This script is responsible for:
 * - Listening for messages from the content script
 * - Forwarding game state updates to the popup
 * - Facilitating communication between content script and popup
 * - Maintaining the initial set of choices for the current game
*/

import { PuzzleState } from '@/shared/types';
import { Message, MessageResponse, MessageType } from '../shared/messages';

let initialChoices: string[] = [];

function resetChoices() {
  console.debug('[DEBUG -- background] resetting choices');
  initialChoices = [];
}

function updateChoices(choices: string[]) {
  console.debug(`[DEBUG -- background] updating original choices (${JSON.stringify(initialChoices)}) with: ${JSON.stringify(choices)}`);
  initialChoices = choices;
}

async function getChoices() {
  if (initialChoices.length > 0) {
    console.debug('[DEBUG -- background] returning cached choices: ', JSON.stringify(initialChoices));
    return initialChoices;
  }

  console.debug('[DEBUG -- background] fetching choices from content script');

  const tabs = await chrome.tabs.query({active: true});
  if (tabs[0].id) {
    const response = await chrome.tabs.sendMessage(tabs[0].id, {
      type: MessageType.REQUEST_CHOICES,
    });

    console.debug('[DEBUG -- background] choices received from content script: ', JSON.stringify(response));
    updateChoices(response.choices || []);
  }

  console.debug('[DEBUG -- background] returning choices: ', JSON.stringify(initialChoices));
  return initialChoices;
}

async function getGameState() {
  console.debug('[DEBUG -- background] fetching game state from content script');
  let gameState: PuzzleState | null = null;

  const tabs = await chrome.tabs.query({active: true});
  
  if (tabs[0].id) {
    const response = await chrome.tabs.sendMessage(tabs[0].id, {
      type: MessageType.REQUEST_CURRENT_GAME_STATE,
    });

    gameState = response.state || null;
  }
  console.debug('[DEBUG -- background] returning game state: ', JSON.stringify(gameState));
  return gameState;
}

const messageListener = (message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response?: MessageResponse) => void) => {
  switch (message.type) {
    case MessageType.UPDATE_CHOICES:
      console.debug('[DEBUG -- background] received update choices message, retrieving new choices');
      getChoices().then(choices => {
        console.debug('[DEBUG -- background] sending choices back to popup: ', JSON.stringify(choices));
        sendResponse({ type: MessageType.CHOICES_UPDATED, status: 'ok', choices: choices });
      });
      return true;
    case MessageType.UPDATE_GAME_STATE:
      console.debug('[DEBUG -- background] received update game state message, retrieving new game state');
      getGameState().then(gameState => {
        console.debug('[DEBUG -- background] sending game state back to popup: ', JSON.stringify(gameState));
        sendResponse({ type: MessageType.GAME_STATE_UPDATED, status: 'ok', state: gameState });
      });
      return true;
    case MessageType.CONTENT_SCRIPT_READY:
      console.info('[INFO -- background] content script ready');
      sendResponse({ status: 'ok' });
      return true;
    default:
      console.debug('[DEBUG -- background] unknown message type: ', message.type);
      sendResponse({ status: 'error', error: `Unknown message type: ${message.type}` });
      return true;  
  }
}

chrome.runtime.onMessage.addListener(messageListener);

// Reset choices when extension starts up
chrome.runtime.onStartup.addListener(() => {
  console.debug('[DEBUG -- background] Extension starting up');
  resetChoices();
});

// Reset choices when installed/updated
chrome.runtime.onInstalled.addListener(() => {
  console.debug('[DEBUG -- background] Extension installed/updated');
  resetChoices();
});
