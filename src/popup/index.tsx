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

  useEffect(() => {
    // Request current game state from background script
    chrome.runtime.sendMessage({ type: 'GET_GAME_STATE' }, (response: PopupState | null) => {
      if (chrome.runtime.lastError) {
        console.error('Error fetching game state:', chrome.runtime.lastError);
        setError('Failed to load guess history');
        setLoading(false);
        return;
      }
      console.log('Received game state:', response);
      if (response) {
        setState(response);
      }
      setLoading(false);
    });

    // Listen for updates from background script
    const listener = (message: { type: string; payload: PopupState }) => {
      if (message.type === 'GAME_STATE_UPDATED') {
        console.log('Received state update:', message.payload);
        setState(message.payload);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  return (
    <div className="popup-container">
      <h1>Connections Guess History</h1>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : !state.gameState ? (
        <div className="no-guesses">No active game found</div>
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