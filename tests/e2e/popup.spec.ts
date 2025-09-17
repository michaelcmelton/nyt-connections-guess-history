import { test, expect } from '@playwright/test';
import { ExtensionHelper } from './utils/extension-helper';
import { mockGuessHistory, emptyGuessHistory, createMockGuessHistoryEntry } from './fixtures/test-data';

test.describe('Chrome Extension Popup', () => {
  let extensionHelper: ExtensionHelper;

  test.beforeEach(async ({ context }) => {
    extensionHelper = new ExtensionHelper(context);
  });

  test('should display empty state when no guess history', async ({ context }) => {
    // Clear any existing data
    await extensionHelper.clearGuessHistory();
    
    // Open the popup
    const popup = await extensionHelper.openPopup();
    
    // Check that empty state is displayed
    await expect(popup.getByText('No guess history found. Play some games to see your history here!')).toBeVisible();
    
    // Check that clear button is disabled
    const clearButton = popup.getByRole('button', { name: /clear history/i });
    await expect(clearButton).toBeDisabled();
    
    await popup.close();
  });

  test('should display guess history when data exists', async ({ context }) => {
    // Set up test data
    await extensionHelper.setGuessHistory(mockGuessHistory);
    
    // Open the popup
    const popup = await extensionHelper.openPopup();
    
    // Check that history entries are displayed
    const historyEntries = popup.locator('[data-testid="history-entry"]');
    await expect(historyEntries).toHaveCount(mockGuessHistory.length);
    
    // Check that timestamps are displayed
    for (const entry of mockGuessHistory) {
      const timestamp = new Date(entry.timestamp).toLocaleString();
      await expect(popup.getByText(timestamp)).toBeVisible();
    }
    
    // Check that game states are displayed
    await expect(popup.getByText('completed')).toBeVisible();
    await expect(popup.getByText('in_progress')).toBeVisible();
    
    // Check that guesses are displayed
    for (const entry of mockGuessHistory) {
      for (const guess of entry.guesses) {
        await expect(popup.getByText(guess)).toBeVisible();
      }
    }
    
    // Check that clear button is enabled
    const clearButton = popup.getByRole('button', { name: /clear history/i });
    await expect(clearButton).toBeEnabled();
    
    await popup.close();
  });

  test('should clear guess history when clear button is clicked', async ({ context }) => {
    // Set up test data
    await extensionHelper.setGuessHistory(mockGuessHistory);
    
    // Open the popup
    const popup = await extensionHelper.openPopup();
    
    // Verify history is displayed
    const historyEntries = popup.locator('[data-testid="history-entry"]');
    await expect(historyEntries).toHaveCount(mockGuessHistory.length);
    
    // Click clear button
    const clearButton = popup.getByRole('button', { name: /clear history/i });
    await clearButton.click();
    
    // Wait for the popup to update
    await popup.waitForTimeout(1000);
    
    // Check that empty state is now displayed
    await expect(popup.getByText('No guess history found. Play some games to see your history here!')).toBeVisible();
    
    // Check that clear button is now disabled
    await expect(clearButton).toBeDisabled();
    
    // Verify storage is actually cleared
    const history = await extensionHelper.getGuessHistory();
    expect(history).toEqual([]);
    
    await popup.close();
  });

  test('should handle popup interactions correctly', async ({ context }) => {
    // Set up test data
    await extensionHelper.setGuessHistory(mockGuessHistory);
    
    // Open the popup
    const popup = await extensionHelper.openPopup();
    
    // Check popup structure
    await expect(popup.getByRole('main')).toBeVisible();
    await expect(popup.getByRole('banner')).toBeVisible();
    await expect(popup.getByRole('contentinfo')).toBeVisible();
    
    // Check that the main heading is displayed
    await expect(popup.getByText('Connections Guess History')).toBeVisible();
    
    // Check that history container is present
    await expect(popup.locator('[data-testid="guess-history-container"]')).toBeVisible();
    
    await popup.close();
  });

  test('should handle large amounts of guess history', async ({ context }) => {
    // Set up large test data (more than 50 entries)
    const largeHistory = Array.from({ length: 60 }, (_, i) => 
      createMockGuessHistoryEntry({
        id: `test-${i}`,
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        guesses: [`guess-${i}-1`, `guess-${i}-2`],
        gameState: 'completed'
      })
    );
    
    await extensionHelper.setGuessHistory(largeHistory);
    
    // Open the popup
    const popup = await extensionHelper.openPopup();
    
    // Check that only 50 entries are displayed (due to limit in store)
    const historyEntries = popup.locator('[data-testid="history-entry"]');
    await expect(historyEntries).toHaveCount(50);
    
    // Check that the most recent entries are shown first
    const firstEntry = historyEntries.first();
    await expect(firstEntry).toContainText('test-0');
    
    await popup.close();
  });

  test('should maintain state across popup opens', async ({ context }) => {
    // Set up test data
    await extensionHelper.setGuessHistory(mockGuessHistory);
    
    // Open popup first time
    const popup1 = await extensionHelper.openPopup();
    await expect(popup1.locator('[data-testid="history-entry"]')).toHaveCount(mockGuessHistory.length);
    await popup1.close();
    
    // Open popup second time
    const popup2 = await extensionHelper.openPopup();
    await expect(popup2.locator('[data-testid="history-entry"]')).toHaveCount(mockGuessHistory.length);
    
    // Verify data is still there
    const history = await extensionHelper.getGuessHistory();
    expect(history).toEqual(mockGuessHistory);
    
    await popup2.close();
  });
});
