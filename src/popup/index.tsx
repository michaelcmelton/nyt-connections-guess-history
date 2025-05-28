import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { GameState } from '../shared/types';
import GuessItem from './components/GuessItem';
import './styles.css';

const Popup: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({ guesses: [], currentGameId: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Request current game state from background script
    chrome.runtime.sendMessage({ type: 'GUESS_HISTORY' }, (response: GameState) => {
      if (chrome.runtime.lastError) {
        console.error('Error fetching game state:', chrome.runtime.lastError);
        setError('Failed to load guess history');
        setLoading(false);
        return;
      }
      console.log('Received game state:', response);
      setGameState(response);
      setLoading(false);
    });
  }, []);

  return (
    <div className="popup-container">
      <h1>Connections Guess History</h1>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : gameState.guesses.length === 0 ? (
        <div className="no-guesses">No guesses recorded yet</div>
      ) : (
        <div className="guess-history">
          {gameState.guesses.map((guess, index) => (
            <GuessItem key={index} guess={guess} />
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