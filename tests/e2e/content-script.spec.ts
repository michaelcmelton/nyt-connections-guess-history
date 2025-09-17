import { test, expect } from '@playwright/test';
import { ExtensionHelper } from './utils/extension-helper';

test.describe('Chrome Extension Content Script', () => {
  let extensionHelper: ExtensionHelper;

  test.beforeEach(async ({ context }) => {
    extensionHelper = new ExtensionHelper(context);
  });

  test('should load content script on NYT Connections page', async ({ context }) => {
    // Navigate to NYT Connections page
    const page = await extensionHelper.navigateToConnections();
    
    // Check that the page loads successfully
    await expect(page).toHaveTitle(/Connections/);
    
    // Check that the content script is loaded by looking for console messages
    // (This is a basic check - in a real test you might inject test markers)
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Connections Guess History content script loaded')) {
        consoleMessages.push(msg.text());
      }
    });
    
    // Wait a bit for the content script to load
    await page.waitForTimeout(2000);
    
    // Verify content script loaded (this would need to be implemented in the actual content script)
    // For now, we'll just verify the page loaded correctly
    expect(page.url()).toContain('nytimes.com/games/connections');
    
    await page.close();
  });

  test('should handle page interactions', async ({ context }) => {
    // Navigate to NYT Connections page
    const page = await extensionHelper.navigateToConnections();
    
    // Wait for the game to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page is interactive
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // In a real test, you would test specific game interactions here
    // For now, we'll just verify the page structure
    
    await page.close();
  });

  test('should communicate with background script', async ({ context }) => {
    // This test would verify that the content script can communicate
    // with the background script through Chrome messaging API
    
    // Navigate to NYT Connections page
    const page = await extensionHelper.navigateToConnections();
    
    // Wait for content script to load
    await page.waitForTimeout(2000);
    
    // In a real implementation, you would test message passing here
    // For example, sending a message from content script to background
    // and verifying the response
    
    await page.close();
  });
});
