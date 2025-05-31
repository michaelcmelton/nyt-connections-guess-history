import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { PuzzleState } from '../shared/types';
import GuessItem from './components/GuessItem';
import './styles.css';

interface PopupState {
  gameState: PuzzleState | null;
  choices: string[];
}

const Popup: React.FC = () => {
  const [state, setState] = useState<PopupState>({
    gameState: null,
    choices: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extensionVersion, setExtensionVersion] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    // Get extension version
    const manifest = chrome.runtime.getManifest();
    setExtensionVersion(manifest.version);

    const init = async () => {
      try {
        // First get the choices - we only need these once
        const choicesResponse = await chrome.runtime.sendMessage({ type: 'REQUEST_CHOICES' });
        if (!mounted) return;

        if (chrome.runtime.lastError) {
          console.error('Error fetching choices:', chrome.runtime.lastError);
          setError('Failed to load choices');
          setLoading(false);
          return;
        }
        
        if (choicesResponse?.choices) {
          setState(prev => ({ ...prev, choices: choicesResponse.choices }));
        }

        // Then get the game state
        const gameStateResponse = await chrome.runtime.sendMessage({ type: 'REQUEST_CURRENT_GAME_STATE' });
        if (!mounted) return;

        if (chrome.runtime.lastError) {
          console.error('Error fetching game state:', chrome.runtime.lastError);
          setError('Failed to load game state');
          setLoading(false);
          return;
        }

        if (gameStateResponse?.state) {
          setState(prev => ({ ...prev, gameState: gameStateResponse.state }));
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Error initializing popup:', error);
        setError('Failed to initialize');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    // Listen for updates from background script - only for game state updates
    const listener = (message: { type: string; payload: { state: PuzzleState } }) => {
      if (message.type === 'GAME_STATE_UPDATED' && mounted) {
        console.log('Received state update:', message.payload);
        setState(prev => ({ ...prev, gameState: message.payload.state }));
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    
    return () => {
      mounted = false;
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  return (
    <div className="popup-container">
      <div className="header">
        <h1>Connections Guess History</h1>
        <span className="version">v{extensionVersion}</span>
      </div>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : !state.gameState ? (
        <div className="no-guesses">No active game found</div>
      ) : state.gameState.puzzleComplete && !state.gameState.puzzleWon ? (
        <div className="no-guesses">Sorry for the loss! Come back tomorrow to play again!</div>
      ) : state.gameState.puzzleComplete && state.gameState.puzzleWon ? (
        <div className="no-guesses">Congratulations! You won! Come back tomorrow to play again!</div>
      ) : state.gameState.data.guesses.length === 0 ? (
        <div className="no-guesses">No guesses recorded yet</div>
      ) : (
        <div className="guess-history">
          {state.gameState.data.guesses.map((guess, index) => (
            <GuessItem 
              key={`${index}-${guess.cards.map(c => c.position).join('-')}`}
              guess={guess} 
              choices={state.choices}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
); 