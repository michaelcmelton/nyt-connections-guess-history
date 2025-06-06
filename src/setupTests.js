// Import and assign jest-chrome to global
Object.assign(global, require('jest-chrome'));

// Mock chrome.runtime.sendMessage to return a Promise
chrome.runtime.sendMessage.mockImplementation(() => Promise.resolve());

// Mock chrome.tabs API
chrome.tabs.query.mockImplementation(() => Promise.resolve([]));
chrome.tabs.sendMessage.mockImplementation(() => Promise.resolve());

// Mock chrome.runtime.getManifest
chrome.runtime.getManifest.mockReturnValue({ version: '1.0.0' });

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://www.nytimes.com/games/connections'
  },
  writable: true
});

// Mock MutationObserver
const mockObserverInstance = {
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn()
};

global.MutationObserver = jest.fn((callback) => {
  mockObserverInstance.trigger = (mutations) => callback(mutations, mockObserverInstance);
  return mockObserverInstance;
});

// Increase default timeout for all tests
jest.setTimeout(30000);

// Mock querySelector for game container
document.querySelector = jest.fn((selector) => {
  if (selector === '[class*="cardsContainer"]') {
    return {
      className: 'cardsContainer'
    };
  }
  return null;
});
