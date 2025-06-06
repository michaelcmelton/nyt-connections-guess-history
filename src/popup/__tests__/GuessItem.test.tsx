import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GuessItem from '../components/GuessItem';
import { Guess } from '../../shared/types';

describe('GuessItem Component', () => {
  const mockChoices = ['Apple', 'Banana', 'Orange', 'Grape'];

  it('renders a correct guess properly', () => {
    const guess: Guess = {
      cards: [
        { position: 0, level: 1 },
        { position: 1, level: 1 },
        { position: 2, level: 1 },
        { position: 3, level: 1 }
      ],
      correct: true
    };

    render(<GuessItem guess={guess} choices={mockChoices} />);
    
    // Check if all words are rendered
    mockChoices.forEach(choice => {
      expect(screen.getByText(choice)).toBeInTheDocument();
    });

    // Check if the container has the correct class
    const container = screen.getByRole('listitem');
    expect(container).toHaveClass('guess-item', 'correct');
    
    // Ensure one-away badge is not present
    expect(screen.queryByText('1 away')).not.toBeInTheDocument();
  });

  it('renders a one-away guess properly', () => {
    const guess: Guess = {
      cards: [
        { position: 0, level: 1 },
        { position: 1, level: 1 },
        { position: 2, level: 1 },
        { position: 3, level: 2 } // Different level makes it one-away
      ],
      correct: false
    };

    render(<GuessItem guess={guess} choices={mockChoices} />);
    
    // Check if all words are rendered
    mockChoices.forEach(choice => {
      expect(screen.getByText(choice)).toBeInTheDocument();
    });

    // Check if the container has the one-away class
    const container = screen.getByRole('listitem');
    expect(container).toHaveClass('guess-item', 'one-away');
    
    // Check if one-away badge is present
    expect(screen.getByText('1 away')).toBeInTheDocument();
  });

  it('renders an incorrect guess properly', () => {
    const guess: Guess = {
      cards: [
        { position: 0, level: 1 },
        { position: 1, level: 2 },
        { position: 2, level: 3 },
        { position: 3, level: 4 }
      ],
      correct: false
    };

    render(<GuessItem guess={guess} choices={mockChoices} />);
    
    // Check if all words are rendered
    mockChoices.forEach(choice => {
      expect(screen.getByText(choice)).toBeInTheDocument();
    });

    // Check if the container has only the base class
    const container = screen.getByRole('listitem');
    expect(container).toHaveClass('guess-item');
    expect(container).not.toHaveClass('correct', 'one-away');
    
    // Ensure one-away badge is not present
    expect(screen.queryByText('1 away')).not.toBeInTheDocument();
  });

  it('handles missing choice gracefully', () => {
    const guess: Guess = {
      cards: [
        { position: 0, level: 1 },
        { position: 1, level: 1 },
        { position: 2, level: 1 },
        { position: 10, level: 1 } // Position that doesn't exist in choices
      ],
      correct: true
    };

    render(<GuessItem guess={guess} choices={mockChoices} />);
    
    // Check if Unknown is rendered for missing choice
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('capitalizes first letter of each word', () => {
    const lowercaseChoices = ['apple', 'banana', 'orange', 'grape'];
    const guess: Guess = {
      cards: [
        { position: 0, level: 1 },
        { position: 1, level: 1 },
        { position: 2, level: 1 },
        { position: 3, level: 1 }
      ],
      correct: true
    };

    render(<GuessItem guess={guess} choices={lowercaseChoices} />);
    
    // Check if words are properly capitalized
    ['Apple', 'Banana', 'Orange', 'Grape'].forEach(choice => {
      expect(screen.getByText(choice)).toBeInTheDocument();
    });
  });
}); 