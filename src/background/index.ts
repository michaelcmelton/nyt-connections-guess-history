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

interface ContentScriptReadyMessage {
  type: 'CONTENT_SCRIPT_READY';
  url: string;
}

type Message = RequestGameStateMessage | RequestChoicesMessage | UpdateChoicesMessage | ContentScriptReadyMessage;

// Keep initial choices in memory
let initialChoices: string[] = [];

// Keep track of content script status
let contentScriptReady = false;
let lastContentScriptUrl: string | null = null;

// Function to inject content script
async function injectContentScript(tabId: number): Promise<void> {
  try {
    console.log('[DEBUG] Injecting content script into tab:', tabId);
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
    console.log('[DEBUG] Content script injected successfully');
  } catch (error) {
    console.error('[DEBUG] Failed to inject content script:', error);
  }
}

// Function to ensure content script is ready
async function ensureContentScript(): Promise<boolean> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url?.includes('nytimes.com/games/connections')) {
      console.log('[DEBUG] Not on Connections page:', tab?.url);
      return false;
    }

    // Try to ping the content script
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
      console.log('[DEBUG] Content script responded to ping');
      return true;
    } catch (error) {
      console.log('[DEBUG] Content script not responding, injecting...');
      await injectContentScript(tab.id);
      
      // Wait for content script to initialize
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('[DEBUG] Content script initialization timed out');
          resolve(false);
        }, 2000);

        chrome.runtime.onMessage.addListener(function listener(message) {
          if (message.type === 'CONTENT_SCRIPT_READY') {
            clearTimeout(timeout);
            chrome.runtime.onMessage.removeListener(listener);
            console.log('[DEBUG] Content script initialized successfully');
            contentScriptReady = true;
            resolve(true);
          }
        });
      });
    }
  } catch (error) {
    console.error('[DEBUG] Error ensuring content script:', error);
    return false;
  }
}

// Query content script for current state
async function getCurrentState(): Promise<{ state: PuzzleState | null }> {
  try {
    if (!await ensureContentScript()) {
      console.log('[DEBUG] Could not ensure content script');
      return { state: null };
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      console.log('[DEBUG] No active tab found');
      return { state: null };
    }

    try {
      console.log('[DEBUG] Requesting current state from content script');
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'REQUEST_CURRENT_GAME_STATE' });
      console.log('[DEBUG] Received response from content script:', response);
      
      if (response?.state && response.state.data.guesses.length === 0) {
        console.log('[DEBUG] New game detected, requesting fresh choices');
        const choicesResponse = await chrome.tabs.sendMessage(tab.id, { type: 'REQUEST_CHOICES' });
        if (choicesResponse?.choices) {
          initialChoices = choicesResponse.choices;
          console.log('[DEBUG] Updated initial choices for new game:', initialChoices);
        }
      }
      
      return { state: response?.state || null };
    } catch (error) {
      console.log('[DEBUG] Error communicating with content script:', error);
      return { state: null };
    }
  } catch (error) {
    console.log('[DEBUG] Error in getCurrentState:', error);
    return { state: null };
  }
}

// Get choices - returns initial choices if we have them
async function getChoices(): Promise<{ choices: string[] }> {
  if (initialChoices.length > 0) {
    console.log('[DEBUG] Returning cached initial choices:', initialChoices);
    return { choices: initialChoices };
  }

  try {
    if (!await ensureContentScript()) {
      console.log('[DEBUG] Could not ensure content script');
      return { choices: [] };
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      console.log('[DEBUG] No active tab found');
      return { choices: [] };
    }

    try {
      console.log('[DEBUG] Requesting choices from content script');
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'REQUEST_CHOICES' });
      console.log('[DEBUG] Received choices response:', response);
      
      if (response?.choices) {
        initialChoices = response.choices;
        console.log('[DEBUG] Cached initial choices:', initialChoices);
      }
      return { choices: initialChoices };
    } catch (error) {
      console.log('[DEBUG] Error communicating with content script:', error);
      return { choices: [] };
    }
  } catch (error) {
    console.log('[DEBUG] Error in getChoices:', error);
    return { choices: [] };
  }
}

// Reset choices when a new game is detected
function resetChoices() {
  console.log('[DEBUG] Resetting choices cache');
  initialChoices = [];
  contentScriptReady = false;
  lastContentScriptUrl = null;
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  console.log('[DEBUG] Received message:', message.type, 'from:', sender.tab?.url);
  
  switch (message.type) {
    case 'CONTENT_SCRIPT_READY':
      console.log('[DEBUG] Content script ready on:', message.url);
      contentScriptReady = true;
      lastContentScriptUrl = message.url;
      break;
      
    case 'REQUEST_CURRENT_GAME_STATE':
      getCurrentState().then(response => {
        console.log('[DEBUG] Sending state to popup:', response);
        sendResponse(response);
      });
      return true;
      
    case 'REQUEST_CHOICES':
      getChoices().then(response => {
        console.log('[DEBUG] Sending choices to popup:', response);
        sendResponse(response);
      });
      return true;
  }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('nytimes.com/games/connections')) {
    console.log('[DEBUG] Connections page loaded, ensuring content script');
    ensureContentScript();
  }
});

// Reset choices when extension starts up
chrome.runtime.onStartup.addListener(resetChoices);

// Reset choices when installed/updated
chrome.runtime.onInstalled.addListener(resetChoices);