import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up after E2E tests...');
  // Add any cleanup logic here if needed
  console.log('✅ Cleanup complete');
}

export default globalTeardown;
