import React from 'react';
import { Guess } from '../../shared/types';

interface GuessItemProps {
  guess: Guess;
}

const GuessItem: React.FC<GuessItemProps> = ({ guess }) => {
  return (
    <div className={`guess-item ${guess.isOneAway ? 'one-away' : ''}`}>
      <div className="guess-words">
        {guess.words.map((word, index) => (
          <span key={index} className="word">
            {word}
          </span>
        ))}
      </div>
      {guess.isOneAway && (
        <div className="one-away-badge">1 away</div>
      )}
      <div className="timestamp">
        {new Date(guess.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default GuessItem; 