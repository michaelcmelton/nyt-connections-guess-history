import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { PuzzleState } from '../shared/types';
import GuessItem from './components/GuessItem';
import './styles.css';

interface PopupState {
  gameState: PuzzleState | null;
  choices: string[];
}

export const Popup: React.FC = () => {
  const [state, setState] = useState<PopupState>({
    gameState: null,
    choices: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extensionVersion, setExtensionVersion] = useState<string>('');

  // Debug logging for state changes
  useEffect(() => {
    console.log('[DEBUG] Popup state updated:', {
      hasGameState: !!state.gameState,
      guessCount: state.gameState?.data?.guesses?.length || 0,
      choicesCount: state.choices.length,
      loading,
      error
    });
  }, [state, loading, error]);

  useEffect(() => {
    let mounted = true;
    console.log('[DEBUG] Popup component mounted');

    // Get extension version
    const manifest = chrome.runtime.getManifest();
    setExtensionVersion(manifest.version);
    console.log('[DEBUG] Extension version:', manifest.version);

    const init = async () => {
      try {
        console.log('[DEBUG] Initializing popup - requesting choices');
        // First get the choices - we only need these once
        const choicesResponse = await chrome.runtime.sendMessage({ type: 'REQUEST_CHOICES' });
        if (!mounted) {
          console.log('[DEBUG] Component unmounted during choices request');
          return;
        }

        if (chrome.runtime.lastError) {
          console.error('[DEBUG] Error fetching choices:', chrome.runtime.lastError);
          setError('Failed to load choices');
          setLoading(false);
          return;
        }
        
        console.log('[DEBUG] Received choices response:', {
          hasChoices: !!choicesResponse?.choices,
          choicesCount: choicesResponse?.choices?.length || 0
        });
        
        if (choicesResponse?.choices) {
          setState(prev => ({ ...prev, choices: choicesResponse.choices }));
        }

        console.log('[DEBUG] Requesting game state');
        // Then get the game state
        const gameStateResponse = await chrome.runtime.sendMessage({ type: 'REQUEST_CURRENT_GAME_STATE' });
        if (!mounted) {
          console.log('[DEBUG] Component unmounted during game state request');
          return;
        }

        if (chrome.runtime.lastError) {
          console.error('[DEBUG] Error fetching game state:', chrome.runtime.lastError);
          setError('Failed to load game state');
          setLoading(false);
          return;
        }

        console.log('[DEBUG] Received game state response:', {
          hasState: !!gameStateResponse?.state,
          guessCount: gameStateResponse?.state?.data?.guesses?.length || 0
        });

        if (gameStateResponse?.state) {
          setState(prev => ({ ...prev, gameState: gameStateResponse.state }));
        }
      } catch (error) {
        if (!mounted) return;
        console.error('[DEBUG] Error initializing popup:', error);
        setError('Failed to initialize');
      } finally {
        if (mounted) {
          console.log('[DEBUG] Initialization complete, setting loading to false');
          setLoading(false);
        }
      }
    };

    init();

    // Listen for updates from background script - only for game state updates
    const listener = (message: { type: string; payload: { state: PuzzleState } }) => {
      if (message.type === 'GAME_STATE_UPDATED' && mounted) {
        console.log('[DEBUG] Received state update from background:', {
          guessCount: message.payload.state.data.guesses.length,
          isComplete: message.payload.state.data.puzzleComplete,
          isWon: message.payload.state.data.puzzleWon
        });
        setState(prev => ({ ...prev, gameState: message.payload.state }));
      }
    };

    console.log('[DEBUG] Setting up message listener');
    chrome.runtime.onMessage.addListener(listener);
    
    return () => {
      console.log('[DEBUG] Popup component unmounting');
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
      ) : state.gameState.data.puzzleComplete && !state.gameState.data.puzzleWon ? (
        <div className="no-guesses">Sorry for the loss! Come back tomorrow to play again!</div>
      ) : state.gameState.data.puzzleComplete && state.gameState.data.puzzleWon ? (
        <div className="no-guesses">Congratulations! You won! Come back tomorrow to play again!</div>
      ) : state.gameState.data.guesses.length === 0 ? (
        <div className="no-guesses">No guesses recorded yet</div>
      ) : (
        <div 
          className="guess-history"
          role="list"
          aria-label="guess history"
        >
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

// Only run this if we're in a browser environment
if (typeof document !== 'undefined') {
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <Popup />
      </React.StrictMode>
    );
  }
} 