# Connections Guess History

A Chrome extension that enhances the New York Times Connections game by tracking and displaying your guess history.

## Features
- View your complete guess history for the current game
- See which guesses were "one away" from being correct
- Clean, intuitive interface that matches the NYT Connections style
- Privacy-focused: all data stays in your browser

## Chrome Web Store Submission Checklist

1. Create a ZIP file of the `dist` directory:
```bash
cd dist
zip -r ../extension.zip *
```

2. Visit the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)

3. Required items for submission:
   - Extension ZIP file (`extension.zip`)
   - Privacy policy (privacy-policy.md)
   - Store listing:
     - Detailed description
     - Screenshots (at least 1, up to 5)
     - Icon (128x128)
     - Category: Games > Game Utilities

4. Suggested store listing description:
```
Connections Guess History enhances your NYT Connections experience by tracking and displaying your complete guess history.

Features:
• View all your guesses for the current game
• See which guesses were "one away" from being correct
• Clean, intuitive interface matching the NYT Connections style
• Privacy-focused: all data stays in your browser

This extension only works on the NYT Connections game page and requires no special permissions. It simply helps you track your progress and strategy as you play.

Perfect for:
• Strategy analysis
• Learning from your guesses
• Sharing your journey to the solution

Note: This is an unofficial extension and is not affiliated with the New York Times.
```

5. Screenshots needed (1280x800 or 640x400):
   - Main popup showing guess history
   - Popup showing "one away" guess
   - Full game context with popup open

## Development

To build the extension:
```bash
npm install
npm run build
```

The built extension will be in the `dist` directory.

## Privacy

See privacy-policy.md for our complete privacy policy. In short: all data stays in your browser, and we don't collect any personal information. 