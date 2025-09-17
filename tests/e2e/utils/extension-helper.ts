import { Browser, BrowserContext, Page } from '@playwright/test';

export class ExtensionHelper {
  private context: BrowserContext;
  private extensionId: string | null = null;

  constructor(context: BrowserContext) {
    this.context = context;
  }

  /**
   * Get the extension ID from the Chrome extensions page
   */
  async getExtensionId(): Promise<string> {
    if (this.extensionId) {
      return this.extensionId;
    }

    const page = await this.context.newPage();
    await page.goto('chrome://extensions/');
    
    // Enable developer mode
    await page.click('#devMode');
    
    // Wait for extensions to load
    await page.waitForSelector('extensions-item');
    
    // Find our extension by name
    const extensionElement = await page.locator('extensions-item').filter({
      hasText: 'Connections Guess History'
    }).first();
    
    const extensionId = await extensionElement.getAttribute('id');
    
    if (!extensionId) {
      throw new Error('Extension not found. Make sure it is loaded and enabled.');
    }
    
    this.extensionId = extensionId;
    await page.close();
    
    return extensionId;
  }

  /**
   * Open the extension popup
   */
  async openPopup(): Promise<Page> {
    const extensionId = await this.getExtensionId();
    const popupUrl = `chrome-extension://${extensionId}/index.html`;
    
    const popup = await this.context.newPage();
    await popup.goto(popupUrl);
    
    // Wait for the popup to load
    await popup.waitForLoadState('networkidle');
    
    return popup;
  }

  /**
   * Get the extension background page
   */
  async getBackgroundPage(): Promise<Page> {
    const extensionId = await this.getExtensionId();
    const backgroundUrl = `chrome-extension://${extensionId}/background.js`;
    
    // Background pages are not directly accessible, but we can test through storage
    const page = await this.context.newPage();
    return page;
  }

  /**
   * Simulate a guess history entry in Chrome storage
   */
  async setGuessHistory(history: any[]) {
    const page = await this.context.newPage();
    await page.goto('about:blank');
    
    // Inject script to set storage
    await page.evaluate((history) => {
      return new Promise((resolve) => {
        chrome.storage.local.set({ guessHistory: history }, () => {
          resolve(true);
        });
      });
    }, history);
    
    await page.close();
  }

  /**
   * Get guess history from Chrome storage
   */
  async getGuessHistory(): Promise<any[]> {
    const page = await this.context.newPage();
    await page.goto('about:blank');
    
    const history = await page.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.get(['guessHistory'], (result) => {
          resolve(result.guessHistory || []);
        });
      });
    });
    
    await page.close();
    return history as any[];
  }

  /**
   * Clear all guess history from storage
   */
  async clearGuessHistory() {
    const page = await this.context.newPage();
    await page.goto('about:blank');
    
    await page.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.remove(['guessHistory'], () => {
          resolve(true);
        });
      });
    });
    
    await page.close();
  }

  /**
   * Navigate to NYT Connections page
   */
  async navigateToConnections(): Promise<Page> {
    const page = await this.context.newPage();
    await page.goto('https://www.nytimes.com/games/connections/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    return page;
  }
}
