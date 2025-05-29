/** Background script for the extension 
 * 
 * This script is responsible for:
 * - Listening for messages from the content script
 * - Forwarding game state updates to the popup
 * - Facilitating communication between content script and popup
*/

import { PuzzleState } from '../shared/types';

interface UpdateGameStateMessage {
  type: 'UPDATE_GAME_STATE';
  payload: {
    state: PuzzleState;
    choices: string[];
  };
}

interface GetGameStateMessage {
  type: 'GET_GAME_STATE';
}

interface RequestCurrentStateMessage {
  type: 'REQUEST_CURRENT_STATE';
}

type Message = UpdateGameStateMessage | GetGameStateMessage | RequestCurrentStateMessage;

// Keep latest state in memory
let currentState: PuzzleState | null = null;
let currentChoices: string[] = [];

// Query content script for current state
async function getCurrentState(): Promise<{ gameState: PuzzleState | null; choices: string[] }> {
  try {
    // Get active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    if (!activeTab?.id || !activeTab.url) {
      console.log('No active tab found');
      return { gameState: currentState, choices: currentChoices };
    }

    // Check if we're on the Connections game page
    if (!activeTab.url.includes('nytimes.com/games/connections')) {
      console.log('Not on Connections game page:', activeTab.url);
      return { gameState: null, choices: [] };
    }

    try {
      // Request current state from content script
      const response = await chrome.tabs.sendMessage(activeTab.id, { type: 'REQUEST_CURRENT_STATE' });
      if (response) {
        currentState = response.state;
        currentChoices = response.choices;
        return { gameState: currentState, choices: currentChoices };
      }
    } catch (error) {
      console.log('Error communicating with content script:', error);
      // If we can't communicate with the content script but we're on the right page,
      // return the last known state
      return { gameState: currentState, choices: currentChoices };
    }
  } catch (error) {
    console.log('Error in getCurrentState:', error);
  }
  
  return { gameState: currentState, choices: currentChoices };
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  switch (message.type) {
    case 'UPDATE_GAME_STATE':
      console.log('Updating game state with:', {
        guessCount: message.payload.state?.data?.guesses?.length || 0,
        payload: message.payload
      });
      
      // Update our in-memory state
      currentState = message.payload.state;
      currentChoices = message.payload.choices;

      // Notify any open popups about the change
      chrome.runtime.sendMessage({
        type: 'GAME_STATE_UPDATED',
        payload: {
          gameState: currentState,
          choices: currentChoices
        }
      });
      break;
      
    case 'GET_GAME_STATE':
      console.log('Getting current state from content script');
      getCurrentState().then(state => {
        console.log('Sending state to popup:', {
          guessCount: state.gameState?.data?.guesses?.length || 0,
          state
        });
        sendResponse(state);
      });
      return true; // Required for async response
  }
});