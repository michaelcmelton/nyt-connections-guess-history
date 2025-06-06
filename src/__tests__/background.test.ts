import { chrome } from 'jest-chrome';

describe('Background Script', () => {
  const mockTab = {
    id: 123,
    url: 'https://www.nytimes.com/games/connections',
    index: 0,
    pinned: false,
    highlighted: false,
    active: true,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    windowId: 1,
    groupId: -1,
    title: 'Test Tab',
    status: 'complete'
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset chrome.runtime.lastError
    Object.defineProperty(chrome.runtime, 'lastError', { value: undefined });

    // Set up default mock implementations
    chrome.tabs.query.mockImplementation(() => Promise.resolve([mockTab]));
    chrome.tabs.sendMessage.mockImplementation(() => Promise.resolve({ status: 'ok' }));

    // Reset modules to ensure clean background script import
    jest.resetModules();
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      // Import background script before each test
      await import('../background');
    });

    it('handles CONTENT_SCRIPT_READY messages', async () => {
      const testUrl = 'https://www.nytimes.com/games/connections';
      
      chrome.runtime.onMessage.callListeners(
        { 
          type: 'CONTENT_SCRIPT_READY',
          url: testUrl
        },
        { id: 'test-sender' },
        () => {}
      );

      // No response expected, just verify the message was processed
      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('handles REQUEST_CURRENT_GAME_STATE messages', async () => {
      const mockResponse = { state: { data: { guesses: [] } } };
      chrome.tabs.sendMessage.mockImplementation(() => Promise.resolve(mockResponse));

      let responseCallback: (response?: any) => void;
      const responsePromise = new Promise(resolve => {
        responseCallback = resolve;
      });

      chrome.runtime.onMessage.callListeners(
        { type: 'REQUEST_CURRENT_GAME_STATE' },
        { id: 'test-sender' },
        responseCallback!
      );

      const response = await responsePromise;
      expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        mockTab.id,
        { type: 'REQUEST_CURRENT_GAME_STATE' }
      );
      expect(response).toEqual(mockResponse);
    });

    it('handles REQUEST_CHOICES messages', async () => {
      const mockResponse = { choices: ['word1', 'word2', 'word3', 'word4'] };
      chrome.tabs.sendMessage.mockImplementation(() => Promise.resolve(mockResponse));

      let responseCallback: (response?: any) => void;
      const responsePromise = new Promise(resolve => {
        responseCallback = resolve;
      });

      chrome.runtime.onMessage.callListeners(
        { type: 'REQUEST_CHOICES' },
        { id: 'test-sender' },
        responseCallback!
      );

      const response = await responsePromise;
      expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        mockTab.id,
        { type: 'REQUEST_CHOICES' }
      );
      expect(response).toEqual(mockResponse);
    });

    it('handles errors when no active tab is found', async () => {
      // Mock chrome.tabs.query to return no tabs
      chrome.tabs.query.mockImplementation(() => Promise.resolve([]));

      let responseCallback: (response?: any) => void;
      const responsePromise = new Promise(resolve => {
        responseCallback = resolve;
      });

      chrome.runtime.onMessage.callListeners(
        { type: 'REQUEST_CURRENT_GAME_STATE' },
        { id: 'test-sender' },
        responseCallback!
      );

      const response = await responsePromise;
      expect(response).toEqual({ state: null });
    });

    it('handles errors when tab communication fails', async () => {
      // Mock chrome.tabs.sendMessage to throw an error
      chrome.tabs.sendMessage.mockImplementation(() => Promise.reject(new Error('Communication failed')));

      let responseCallback: (response?: any) => void;
      const responsePromise = new Promise(resolve => {
        responseCallback = resolve;
      });

      chrome.runtime.onMessage.callListeners(
        { type: 'REQUEST_CURRENT_GAME_STATE' },
        { id: 'test-sender' },
        responseCallback!
      );

      const response = await responsePromise;
      expect(response).toEqual({ state: null });
    });
  });
}); 