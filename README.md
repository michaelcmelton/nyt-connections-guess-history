# Connections Guess History Chrome Extension

A Chrome extension that enhances the New York Times Connections game by displaying your guess history and showing how close your guesses were to the correct answers.

## Features

- View your complete guess history for the current game
- See which guesses were "1 away" from being correct
- Clean, intuitive interface that integrates with the game
- Works with the official NYT Connections game interface
- Preserves your game state between sessions

## Technical Requirements

- Chrome Extension Manifest V3
- TypeScript for type safety
- React for the popup UI
- Webpack for bundling
- Jest for testing
- ESLint and Prettier for code quality

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` directory

## Project Structure

```
src/
  ├── background/     # Background script for extension
  ├── content/        # Content scripts that run on NYT Connections page
  ├── popup/          # React components for the popup UI
  ├── shared/         # Shared types and utilities
  └── manifest.json   # Extension configuration
```

## Building

```bash
npm run build
```

## Testing

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 