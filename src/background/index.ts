/** Background script for the extension 
 * 
 * This script is responsible for:
 * - Listening for messages from the content script
 * - Forwarding game state updates to the popup
 * - Facilitating communication between content script and popup
 * - Maintaining the initial set of choices for the current game
*/

import { PuzzleState } from '../shared/types';

interface RequestGameStateMessage {
  type: 'REQUEST_CURRENT_GAME_STATE';
}

interface RequestChoicesMessage {
  type: 'REQUEST_CHOICES';
}

interface UpdateChoicesMessage {
  type: 'UPDATE_CHOICES';
  payload: string[];
}

type Message = RequestGameStateMessage | RequestChoicesMessage | UpdateChoicesMessage;

// Keep initial choices in memory
let initialChoices: string[] = [];

// Query content script for current state
async function getCurrentState(): Promise<{ state: PuzzleState | null }> {
  try {
    // Get active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    if (!activeTab?.id || !activeTab.url) {
      console.log('No active tab found');
      return { state: null };
    }

    // Check if we're on the Connections game page
    if (!activeTab.url.includes('nytimes.com/games/connections')) {
      console.log('Not on Connections game page:', activeTab.url);
      return { state: null };
    }

    try {
      // Request current state from content script
      const response = await chrome.tabs.sendMessage(activeTab.id, { type: 'REQUEST_CURRENT_GAME_STATE' });
      
      // If we get a state with no guesses, this might be a new game
      // Request fresh choices from content script
      if (response?.state && response.state.data.guesses.length === 0) {
        console.log('New game detected, requesting fresh choices');
        const choicesResponse = await chrome.tabs.sendMessage(activeTab.id, { type: 'REQUEST_CHOICES' });
        if (choicesResponse?.choices) {
          initialChoices = choicesResponse.choices;
          console.log('Updated initial choices for new game:', initialChoices);
        }
      }
      
      return { state: response?.state || null };
    } catch (error) {
      console.log('Error communicating with content script:', error);
      return { state: null };
    }
  } catch (error) {
    console.log('Error in getCurrentState:', error);
    return { state: null };
  }
}

// Get choices - returns initial choices if we have them
async function getChoices(): Promise<{ choices: string[] }> {
  // If we already have initial choices, return them
  if (initialChoices.length > 0) {
    console.log('Returning cached initial choices:', initialChoices);
    return { choices: initialChoices };
  }

  try {
    // Get active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    if (!activeTab?.id || !activeTab.url) {
      console.log('No active tab found');
      return { choices: initialChoices };
    }

    // Check if we're on the Connections game page
    if (!activeTab.url.includes('nytimes.com/games/connections')) {
      console.log('Not on Connections game page:', activeTab.url);
      return { choices: initialChoices };
    }

    try {
      // Request choices from content script
      const response = await chrome.tabs.sendMessage(activeTab.id, { type: 'REQUEST_CHOICES' });
      if (response?.choices) {
        initialChoices = response.choices;
        console.log('Cached initial choices:', initialChoices);
      }
      return { choices: initialChoices };
    } catch (error) {
      console.log('Error communicating with content script:', error);
      return { choices: initialChoices };
    }
  } catch (error) {
    console.log('Error in getChoices:', error);
    return { choices: initialChoices };
  }
}

// Reset choices when a new game is detected
function resetChoices() {
  console.log('Resetting choices cache');
  initialChoices = [];
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  switch (message.type) {
    case 'REQUEST_CURRENT_GAME_STATE':
      getCurrentState().then(response => {
        console.log('Sending state to popup:', response);
        sendResponse(response);
      });
      return true; // Required for async response
      
    case 'REQUEST_CHOICES':
      getChoices().then(response => {
        console.log('Sending choices to popup:', response);
        sendResponse(response);
      });
      return true; // Required for async response
  }
});

// Reset choices when extension starts up
chrome.runtime.onStartup.addListener(resetChoices);

// Reset choices when installed/updated
chrome.runtime.onInstalled.addListener(resetChoices);