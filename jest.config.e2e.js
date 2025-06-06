module.exports = {
  preset: 'jest-puppeteer',
  testEnvironment: 'node',
  testMatch: ['**/e2e/**/*.test.e2e.ts'],
  setupFilesAfterEnv: ['./jest.setup.e2e.js'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
}; 