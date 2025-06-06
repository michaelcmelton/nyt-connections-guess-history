// Import jest-chrome
const chrome = require('jest-chrome');

// Mock chrome.runtime.sendMessage to return a Promise
chrome.runtime.sendMessage.mockImplementation(() => Promise.resolve());

// Mock chrome.tabs API
chrome.tabs.query.mockImplementation(() => Promise.resolve([]));
chrome.tabs.sendMessage.mockImplementation(() => Promise.resolve());

// Mock chrome.runtime.getManifest
chrome.runtime.getManifest.mockReturnValue({ version: '1.0.0' });

// Assign chrome to global object
global.chrome = chrome;

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://www.nytimes.com/games/connections'
  },
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Increase default timeout for all tests
jest.setTimeout(10000); 