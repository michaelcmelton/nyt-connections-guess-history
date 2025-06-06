import { chrome } from 'jest-chrome';
import { PuzzleState } from '../shared/types';

// Create mock game state
const mockGameState: PuzzleState = {
  puzzleId: 'test-puzzle',
  schemaVersion: '0.36.0',
  data: {
    puzzleComplete: false,
    puzzleWon: false,
    mistakes: 0,
    guesses: [
      {
        cards: [
          { position: 0, level: 1 },
          { position: 1, level: 1 },
          { position: 2, level: 1 },
          { position: 3, level: 1 }
        ],
        correct: true
      }
    ],
    solvedCategories: [],
    isPlayingArchive: false
  },
  puzzleComplete: false,
  puzzleWon: false,
  timestamp: Date.now(),
  printDate: new Date().toISOString()
};

describe('Content Script', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Clear localStorage
    localStorage.clear();
    
    // Reset chrome.runtime.lastError
    Object.defineProperty(chrome.runtime, 'lastError', { value: undefined });

    // Reset chrome.runtime.sendMessage mock to resolve successfully
    chrome.runtime.sendMessage.mockImplementation(() => Promise.resolve());

    // Reset document.querySelector mock
    (document.querySelector as jest.Mock).mockReturnValue({
      className: 'cardsContainer'
    });

    // Ensure window.location is set before any imports
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://www.nytimes.com/games/connections'
      },
      writable: true,
      configurable: true
    });

    // Reset jest modules to ensure clean content script import
    jest.resetModules();
  });

  describe('Game State Management', () => {
    it('finds a game state in localStorage', async () => {
      // Set up mock game state in localStorage with the correct key
      localStorage.setItem(
        'game-state-connections/0987654321',
        JSON.stringify({ states: [mockGameState] })
      );

      // Import content script to set up listeners
      await import('../content');

      // Trigger the message listener with a state request
      const sendResponse = jest.fn();
      chrome.runtime.onMessage.callListeners(
        { type: 'REQUEST_CURRENT_GAME_STATE' },
        { id: 'test-sender' },
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({ state: mockGameState });
    });

    it('returns null when no game state is found', async () => {
      // Import content script to set up listeners
      await import('../content');

      const sendResponse = jest.fn();
      chrome.runtime.onMessage.callListeners(
        { type: 'REQUEST_CURRENT_GAME_STATE' },
        { id: 'test-sender' },
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({ state: null });
    });

    it('returns null when game state is invalid', async () => {
      // Set up invalid game state in localStorage
      localStorage.setItem(
        'game-state-connections/0987654321',
        JSON.stringify({ invalid: 'state' })
      );

      // Import content script to set up listeners
      await import('../content');

      const sendResponse = jest.fn();
      chrome.runtime.onMessage.callListeners(
        { type: 'REQUEST_CURRENT_GAME_STATE' },
        { id: 'test-sender' },
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({ state: null });
    });

    it('sets up and triggers MutationObserver correctly', async () => {
      // Set up initial state
      localStorage.setItem(
        'game-state-connections/0987654321',
        JSON.stringify({ states: [mockGameState] })
      );

      // Import content script
      await import('../content');
      
      // Wait for ready notification
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear previous messages
      chrome.runtime.sendMessage.mockClear();
      
      // Get observer and trigger
      const observer = (MutationObserver as jest.Mock).mock.results[0].value;
      
      // Create mock mutation records
      const mockMutationRecords = [{
        type: 'childList',
        target: document.querySelector('[class*="cardsContainer"]'),
        addedNodes: [document.createElement('div')],
        removedNodes: [],
        previousSibling: null,
        nextSibling: null,
        attributeName: null,
        attributeNamespace: null,
        oldValue: null
      }];
      
      // Trigger the mutation callback
      observer.trigger(mockMutationRecords);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'GAME_STATE_UPDATED',
        payload: { state: mockGameState }
      });
    });

    it('throws error when not on NYT Connections page', async () => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://www.nytimes.com/different-page'
        },
        writable: true
      });
      
      await expect(import('../content')).rejects.toThrow('Not on Connections page');
    });
  });

  describe('Message Handling', () => {
    it('responds to ping messages', async () => {
      // Import content script to set up listeners
      await import('../content');

      const sendResponse = jest.fn();
      chrome.runtime.onMessage.callListeners(
        { type: 'PING' },
        { id: 'test-sender' },
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({ status: 'ok' });
    });

    it('handles unknown message types', async () => {
      // Import content script to set up listeners
      await import('../content');

      const sendResponse = jest.fn();
      chrome.runtime.onMessage.callListeners(
        { type: 'UNKNOWN_TYPE' },
        { id: 'test-sender' },
        sendResponse
      );

      expect(sendResponse).not.toHaveBeenCalled();
    });

    it('notifies background script of state changes', async () => {
      // Set up mock game state in localStorage
      localStorage.setItem(
        'game-state-connections/0987654321',
        JSON.stringify({ states: [mockGameState] })
      );

      // Import content script to set up listeners
      await import('../content');

      // Reset the sendMessage mock to ensure we're starting fresh
      chrome.runtime.sendMessage.mockClear();
      
      // Create and dispatch a storage event
      const storageEvent = new StorageEvent('storage', {
        key: 'game-state-connections/0987654321',
        newValue: JSON.stringify({ states: [mockGameState] }),
        oldValue: null,
        storageArea: localStorage
      });

      // Dispatch the event
      window.dispatchEvent(storageEvent);

      // Wait for any async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify the message was sent
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'GAME_STATE_UPDATED',
        payload: { state: mockGameState }
      });
    });

    it('handles ready notification', async () => {
      // Reset the sendMessage mock
      chrome.runtime.sendMessage.mockClear();

      // Import content script to trigger ready notification
      await import('../content');

      // Wait for any async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify the ready message was sent
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'CONTENT_SCRIPT_READY',
        url: window.location.href
      });
    });

    it('handles REQUEST_CHOICES messages', async () => {
      await import('../content');
      const sendResponse = jest.fn();
      
      chrome.runtime.onMessage.callListeners(
        { type: 'REQUEST_CHOICES' },
        { id: 'test-sender' },
        sendResponse
      );
      
      expect(sendResponse).toHaveBeenCalledWith({ choices: expect.any(Array) });
    });

    it('removes existing listeners before adding new ones', async () => {
      const removeListenerSpy = jest.spyOn(chrome.runtime.onMessage, 'removeListener');
      
      await import('../content');
      await import('../content'); // Import twice to trigger listener cleanup
      
      expect(removeListenerSpy).toHaveBeenCalled();
    });
  });
}); 