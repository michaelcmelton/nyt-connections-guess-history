# Connections Guess History

This Chrome Extension keeps a record of the user's guess history in the NYT's daily game Connections.

Built with **Svelte** for the front-end and **Vite** for build tooling.

## Development

### Prerequisites
- Node v22.3.0

### Setup
1. Install dependencies: `npm install`
2. Build the extension: `npm run build`
3. Load the extension in Chrome from the `dist` folder

### Development Mode
- Watch mode: `npm run dev` (Vite dev server with hot reload)
- Type checking: `npm run type-check`

## Testing

This project includes both unit tests and integration tests:

### Unit Tests (Jest)
- **Run all tests**: `npm test`
- **Watch mode**: `npm run test:watch`
- **Coverage report**: `npm run test:coverage`

Tests are co-located with source files and use the `.test.ts` naming convention.

### Integration Tests (Playwright)
- **Run all tests**: `npm run test:e2e`
- **Interactive mode**: `npm run test:e2e:ui`
- **Headed mode**: `npm run test:e2e:headed`

Integration tests simulate real browser interactions with the built extension.

### Test Structure
- Unit tests: `src/**/*.test.ts`
- Integration tests: `src/**/*.spec.ts`
- Test utilities: `src/__tests__/utils.ts`
- Test setup: `src/setup.ts`

## Project Structure
```
src/
├── popup/            # Svelte popup components
│   ├── App.svelte    # Main popup component
│   ├── main.ts       # Popup entry point
│   └── popup.html    # Popup HTML template
├── background/       # Background script
│   └── service-worker.ts
├── content/          # Content scripts
│   └── content.ts
├── lib/              # Shared utilities and types
├── popup.test.ts     # Popup unit tests
├── popup.spec.ts     # Popup integration tests
├── setup.ts          # Jest test setup
└── __tests__/
    └── utils.ts      # Test utilities
```