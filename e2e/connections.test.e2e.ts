import '@testing-library/jest-dom';
import puppeteer, { Browser, Page } from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

describe('NYT Connections Extension E2E Tests', () => {
  let browser: Browser;
  let page: Page;
  let extensionId: string;

  beforeAll(async () => {
    // Ensure the extension is built
    const distPath = path.join(__dirname, '../dist');
    if (!fs.existsSync(distPath)) {
      throw new Error('Extension dist folder not found. Please build the extension first.');
    }

    // Launch browser with the extension loaded
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
      executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
      args: [
        '--no-sandbox',
        '--disable-gpu',
        `--disable-extensions-except=${distPath}`,
        `--load-extension=${distPath}`,
      ],
    });

    // Wait a bit for the extension to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get the extension ID
    const targets = await browser.targets();

    console.log(JSON.stringify(targets, null, 2));

    const extensionTarget = targets.find(
      (target) => target.type() === 'service_worker' && target.url().includes('chrome-extension://')
    );
    
    if (!extensionTarget) {
      throw new Error('Could not find extension service worker. Make sure the extension is properly built.');
    }
    
    extensionId = new URL(extensionTarget.url()).hostname;
  });

  beforeEach(async () => {
    try {
      // Create a new page for each test
      page = await browser.newPage();
      // Navigate to NYT Connections
      await page.goto('https://www.nytimes.com/games/connections');
      // Wait for the game to load
      await page.waitForSelector('[data-testid="moment-btn-play"]', { timeout: 10000 });
    
    } catch (error) {
      console.error('Error in beforeEach:', error);
      throw error;
    }
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  // test('Extension popup opens and shows default state', async () => {
  //   // Open extension popup in a new tab (since we can't directly interact with popup)
  //   const popupPage = await browser.newPage();
  //   await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    
  //   // Wait for the popup content to load
  //   await popupPage.waitForSelector('.popup-container', { timeout: 5000 });
    
  //   // Verify the guess history container exists
  //   const guessHistoryExists = await popupPage.evaluate(() => {
  //     return document.querySelector('.popup-container')?.textContent;
  //   });
  //   expect(guessHistoryExists).not.toBeNull();
  //   expect(guessHistoryExists).toContain('No active game found');
    
  //   await popupPage.close();
  // });

  test('Extension popup opens and shows guess history after a guess is made', async () => {
    // wait for the game to load
    await page.waitForSelector('[data-testid="moment-btn-play"]', { timeout: 10000 });
    await page.click('[data-testid="moment-btn-play"]');
    await page.waitForSelector('[data-testid="submit-btn"]', { timeout: 10000 });

    // click 4 random cards in the game, submit a guess, then open the popup.
    const cards = await page.$$('[data-flip-id]');
    const randomCards = cards.sort(() => Math.random() - 0.5).slice(0, 4);
    for (const card of randomCards) {
      await card.click();
    }
    await page.click('[data-testid="submit-btn"]');

    // Open extension popup in a new tab (since we can't directly interact with popup)
    const popupPage = await browser.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Wait for the popup content to load
    await popupPage.waitForSelector('.popup-container', { timeout: 5000 });

    // Verify the guess history container exists
    const popupExists = await popupPage.evaluate(() => {
      return document.querySelector('.popup-container')?.textContent;
    });
    expect(popupExists).not.toBeNull();
    expect(popupExists).not.toContain('No active game found');

    const guessHistory = await popupPage.evaluate(() => {
      return document.querySelector('.guess-history');
    });
    expect(guessHistory).not.toBeUndefined();
    expect(guessHistory?.children.length).toEqual(1);

    const guessItem = guessHistory?.children[0];
    expect(guessItem).not.toBeUndefined();
    expect(guessItem?.children.length).toEqual(4);

    await popupPage.close();

  });
  // test('Extension records new guesses', async () => {
  //   // First, make a guess in the game
  //   await page.evaluate(() => {
  //     // Simulate selecting words and submitting a guess
  //     // Note: The actual implementation will depend on the game's DOM structure
  //     const gameState = {
  //       selectedWords: ['WORD1', 'WORD2', 'WORD3', 'WORD4'],
  //       timestamp: new Date().toISOString(),
  //       isCorrect: false,
  //       isOneAway: true
  //     };
      
  //     // Dispatch a custom event that our content script listens for
  //     window.dispatchEvent(
  //       new CustomEvent('connectionsGuessRecorded', { 
  //         detail: gameState 
  //       })
  //     );
  //   });

  //   // Wait for the guess to be recorded using waitForFunction instead of waitForTimeout
  //   await page.waitForFunction(() => {
  //     return new Promise((resolve) => setTimeout(resolve, 1000));
  //   });

  //   // Open popup to verify the guess was recorded
  //   const popupPage = await browser.newPage();
  //   await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    
  //   // Wait for guess history to load
  //   await popupPage.waitForSelector('.guess-entry');
    
  //   // Verify the new guess appears in history
  //   const guessEntries = await popupPage.$$('.guess-entry');
  //   expect(guessEntries.length).toBeGreaterThan(0);
    
  //   await popupPage.close();
  // });

  // test('Extension handles game completion', async () => {
  //   // Simulate completing the game
  //   await page.evaluate(() => {
  //     // Simulate game completion
  //     window.dispatchEvent(
  //       new CustomEvent('connectionsGameComplete', {
  //         detail: {
  //           timestamp: new Date().toISOString(),
  //           totalGuesses: 5,
  //           isWin: true
  //         }
  //       })
  //     );
  //   });

  //   // Wait for the completion to be recorded using waitForFunction instead of waitForTimeout
  //   await page.waitForFunction(() => {
  //     return new Promise((resolve) => setTimeout(resolve, 1000));
  //   });

  //   // Verify completion is recorded in extension storage
  //   const popupPage = await browser.newPage();
  //   await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    
  //   // Wait for completion status to load
  //   await popupPage.waitForSelector('.game-completion-status');
    
  //   // Verify completion status is shown
  //   const completionStatus = await popupPage.$('.game-completion-status');
  //   expect(completionStatus).not.toBeNull();
    
  //   await popupPage.close();
  // });
}); 