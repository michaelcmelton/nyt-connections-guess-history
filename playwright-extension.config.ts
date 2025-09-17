import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Playwright configuration specifically for Chrome extension testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for Chrome extension testing */
  projects: [
    {
      name: 'chrome-extension',
      use: {
        ...devices['Desktop Chrome'],
        // Load the extension
        launchOptions: {
          args: [
            `--load-extension=${path.resolve(__dirname, 'dist')}`,
            '--disable-extensions-except=' + path.resolve(__dirname, 'dist'),
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ],
        },
        // Set up context for extension testing
        contextOptions: {
          permissions: ['storage', 'activeTab'],
        },
      },
    },
  ],

  /* Global setup and teardown */
  // globalSetup: path.resolve(__dirname, 'tests/e2e/global-setup.ts'),
  // globalTeardown: path.resolve(__dirname, 'tests/e2e/global-teardown.ts'),

  /* Timeout settings */
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
});
