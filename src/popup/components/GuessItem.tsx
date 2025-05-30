import React from 'react';
import { Guess } from '../../shared/types';

interface GuessItemProps {
  guess: Guess;
  choices: string[];
}

const GuessItem: React.FC<GuessItemProps> = ({ guess, choices }) => {
  const guessWords = guess.cards.map(card => choices[card.position]);
  const isOneAway = !guess.correct && guess.cards.filter((card, idx) => 
    guess.cards.slice(0, idx).concat(guess.cards.slice(idx + 1))
      .some(otherCard => otherCard.level === card.level)
  ).length === 3;

  return (
    <div className={`guess-item ${guess.correct ? 'correct' : isOneAway ? 'one-away' : ''}`}>
      <div className="guess-words">
        {guessWords.map((word, index) => (
          <span key={index} className="word">
            {word.replace(/\w\S*/g, (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase())}
          </span>
        ))}
      </div>
      {isOneAway && (
        <div className="one-away-badge">1 away</div>
      )}
    </div>
  );
};

export default GuessItem; 