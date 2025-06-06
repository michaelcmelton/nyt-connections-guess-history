import { chrome } from 'jest-chrome';
import { PuzzleState } from '../shared/types';

// Mock window.location.href before importing content script
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://www.nytimes.com/games/connections'
  },
  writable: true
});

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
  });
}); 