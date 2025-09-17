# Connections Guess History Chrome Extension

This Chrome Extension keeps a record of the user's guess history in the NYT's daily game Connections.

## Development

To get started with development:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Type check:
   ```bash
   npm run build:check
   ```

## Project Structure

- `src/` - Source files
  - `background.ts` - Background service worker (Manifest V3)
  - `content.ts` - Content script for NYT Connections pages
  - `popup/` - Popup UI
    - `index.html` - Popup HTML with embedded styles
    - `popup.ts` - Popup TypeScript logic
  - `manifest.json` - Chrome extension manifest (V3)

## Features

- Tracks user guesses in NYT Connections game
- Stores guess history in Chrome storage
- Clean popup interface to view history
- Automatic data cleanup (keeps last 50 entries)
- Modern TypeScript implementation
- Follows Chrome Extension best practices

## Installation

1. Build the extension:
   ```bash
   npm run build
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode"

4. Click "Load unpacked" and select the `dist` folder

## Usage

1. Navigate to the NYT Connections game (https://www.nytimes.com/games/connections/)
2. The extension will automatically track your guesses
3. Click the extension icon to view your guess history
4. Use the "Clear History" button to reset your data

## Technical Details

- **Manifest Version**: V3 (latest)
- **Build Tool**: Vite with TypeScript
- **Architecture**: Service Worker + Content Script + Popup
- **Storage**: Chrome Storage API (local)
- **Permissions**: `storage`, `activeTab`
- **Security**: Content Security Policy compliant
- **Performance**: Optimized bundle sizes

## Development Notes

- The extension uses ESM modules
- All TypeScript files are properly typed
- Background script runs as a service worker
- Content script only runs on NYT Connections pages
- Popup communicates with background via Chrome messaging API

## Troubleshooting

If you encounter Node.js version warnings, the extension will still build and work correctly. For optimal performance, consider upgrading to Node.js 22.12+ or 20.19+.