import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { PuzzleState } from '../shared/types';
import GuessItem from './components/GuessItem';
import './styles.css';
import { MessageResponse, MessageType } from '@/shared/messages';

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
  const [isDebugVisible, setIsDebugVisible] = useState(false);
  const [isDevelopment, _] = useState<boolean>(process.env.NODE_ENV === "development");

  useEffect(() => {
    let mounted = true;

    chrome.tabs.query({ active: true }, (tabs) => {
      if (!tabs[0].url?.includes('nytimes.com/games/connections')) {
        setError('Please open the NYT Connections game to use this extension. If you are already on the game, refresh the page.');
        setLoading(false);
        return;
      }
    });
    
    // Get extension version
    const manifest = chrome.runtime.getManifest();
    setExtensionVersion(manifest.version);

    function initialize() {
      // First get the choices - we only need these once
      console.debug('[DEBUG -- popup] sent request for choices');
      chrome.runtime.sendMessage({ type: MessageType.UPDATE_CHOICES }).then((response: MessageResponse) => {
        console.debug('[DEBUG -- popup] received choices response: ', JSON.stringify(response));
        if (response.type === MessageType.CHOICES_UPDATED) {
          setState(prev => ({ ...prev, choices: response.choices || [] })); 
        } else {
          setError(`Failed to load choices: ${response.error}`);
          setLoading(false);
          return;
        }
      });
      
      if (chrome.runtime.lastError) {
        setError(`Failed to load choices: ${chrome.runtime.lastError}`);
        setLoading(false);
        return;
      }
        
      console.debug('[DEBUG -- popup] sent request for game state');
      // Then get the game state
      chrome.runtime.sendMessage({ type: MessageType.UPDATE_GAME_STATE }).then((response: MessageResponse) => {
        console.debug('[DEBUG -- popup] received game state response: ', JSON.stringify(response));
        if (response.type === MessageType.GAME_STATE_UPDATED) {
          setState(prev => ({ ...prev, gameState: response.state || null }));
        } else {
          setError(`Failed to load game state: ${response.error}`);
          setLoading(false);
          return;
        }
      });

      if (chrome.runtime.lastError) {
        setError(`Failed to load game state: ${chrome.runtime.lastError}`);
        setLoading(false);
        return;
      }
    }

    initialize();
    setLoading(false);

    return () => {
      mounted = false;
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
        <div className="no-guesses">No active game found. Please start a new game.</div>
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
      <div className="footer">
        <div className="debug-info">
          <h4 
            onClick={() => setIsDebugVisible(!isDebugVisible)} 
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            Debug Info {isDebugVisible ? '▼' : '▶'}
          </h4>
          {isDebugVisible && (
            <>
              <h5>Game State</h5>
              <ul>
                <li>Game Schema Version: {state.gameState?.schemaVersion}</li>
                <li>Game State: {JSON.stringify(state.gameState)}</li>
                <li>Number of Guesses Made: {state.gameState?.data.guesses.length || 0}</li>
                <li>Puzzle Complete: {state.gameState?.data.puzzleComplete ? 'Yes' : 'No'}</li>
                <li>Puzzle Won: {state.gameState?.data.puzzleWon ? 'Yes' : 'No'}</li>
              </ul>
              <h5>Choices</h5>
              <ul>
                <li>Number of Choices: {state.choices.length || 0}</li>
                <li>Choices: {JSON.stringify(state.choices)}</li>
              </ul>
            </>
            )}
          </div>
      </div>
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