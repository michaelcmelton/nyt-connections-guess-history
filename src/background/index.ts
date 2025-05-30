/** Background script for the extension 
 * 
 * This script is responsible for:
 * - Listening for messages from the content script
 * - Forwarding game state updates to the popup
 * - Facilitating communication between content script and popup
*/

import { PuzzleState } from '../shared/types';

interface RequestGameStateMessage {
  type: 'REQUEST_CURRENT_GAME_STATE';
}

interface RequestChoicesMessage {
  type: 'REQUEST_CHOICES';
}

type Message = RequestGameStateMessage | RequestChoicesMessage;

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

// Query content script for choices
async function getChoices(): Promise<{ choices: string[] }> {
  try {
    // Get active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    if (!activeTab?.id || !activeTab.url) {
      console.log('No active tab found');
      return { choices: [] };
    }

    // Check if we're on the Connections game page
    if (!activeTab.url.includes('nytimes.com/games/connections')) {
      console.log('Not on Connections game page:', activeTab.url);
      return { choices: [] };
    }

    try {
      // Request choices from content script
      const response = await chrome.tabs.sendMessage(activeTab.id, { type: 'REQUEST_CHOICES' });
      return { choices: response?.choices || [] };
    } catch (error) {
      console.log('Error communicating with content script:', error);
      return { choices: [] };
    }
  } catch (error) {
    console.log('Error in getChoices:', error);
    return { choices: [] };
  }
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