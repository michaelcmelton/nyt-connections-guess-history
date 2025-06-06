import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { chrome } from 'jest-chrome';
import { Popup } from '../index';

interface ChromeMessage {
  type: string;
  [key: string]: any;
}

describe('Popup Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    chrome.runtime.getManifest.mockReturnValue({ version: '1.0.0' } as chrome.runtime.ManifestV3);
    render(<Popup />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state when choices request fails', async () => {
    // Using jest-chrome's mock implementation
    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(() => {
      throw new Error('Failed to load choices');
    });
    
    render(<Popup />);
    
    expect(await screen.findByText('Failed to initialize')).toBeInTheDocument();
  });

  it('shows no active game when game state is null', async () => {
    // Mock sequential responses
    (chrome.runtime.sendMessage as jest.Mock)
      .mockImplementationOnce((message: ChromeMessage) => {
        if (message.type === 'REQUEST_CHOICES') {
          return Promise.resolve({ choices: ['choice1', 'choice2'] });
        }
        return Promise.resolve({ choices: [] });
      })
      .mockImplementationOnce((message: ChromeMessage) => {
        if (message.type === 'REQUEST_CURRENT_GAME_STATE') {
          return Promise.resolve({ state: null });
        }
        return Promise.resolve({ state: null });
      });

    render(<Popup />);
    
    expect(await screen.findByText('No active game found')).toBeInTheDocument();
  });

  it('shows congratulations message when game is won', async () => {
    const mockGameState = {
      state: {
        data: {
          puzzleComplete: true,
          puzzleWon: true,
          guesses: []
        }
      }
    };

    (chrome.runtime.sendMessage as jest.Mock)
      .mockImplementationOnce((message: ChromeMessage) => {
        if (message.type === 'REQUEST_CHOICES') {
          return Promise.resolve({ choices: ['choice1', 'choice2'] });
        }
        return Promise.resolve({ choices: [] });
      })
      .mockImplementationOnce((message: ChromeMessage) => {
        if (message.type === 'REQUEST_CURRENT_GAME_STATE') {
          return Promise.resolve(mockGameState);
        }
        return Promise.resolve({ state: null });
      });

    render(<Popup />);
    
    expect(await screen.findByText(/Congratulations! You won!/)).toBeInTheDocument();
  });

  it('shows loss message when game is complete but not won', async () => {
    const mockGameState = {
      state: {
        data: {
          puzzleComplete: true,
          puzzleWon: false,
          guesses: []
        }
      }
    };

    (chrome.runtime.sendMessage as jest.Mock)
      .mockImplementationOnce((message: ChromeMessage) => {
        if (message.type === 'REQUEST_CHOICES') {
          return Promise.resolve({ choices: ['choice1', 'choice2'] });
        }
        return Promise.resolve({ choices: [] });
      })
      .mockImplementationOnce((message: ChromeMessage) => {
        if (message.type === 'REQUEST_CURRENT_GAME_STATE') {
          return Promise.resolve(mockGameState);
        }
        return Promise.resolve({ state: null });
      });

    render(<Popup />);
    
    expect(await screen.findByText(/Sorry for the loss!/)).toBeInTheDocument();
  });

  it('shows no guesses message when game is active but no guesses made', async () => {
    const mockGameState = {
      state: {
        data: {
          puzzleComplete: false,
          puzzleWon: false,
          guesses: []
        }
      }
    };

    (chrome.runtime.sendMessage as jest.Mock)
      .mockImplementationOnce((message: ChromeMessage) => {
        if (message.type === 'REQUEST_CHOICES') {
          return Promise.resolve({ choices: ['choice1', 'choice2'] });
        }
        return Promise.resolve({ choices: [] });
      })
      .mockImplementationOnce((message: ChromeMessage) => {
        if (message.type === 'REQUEST_CURRENT_GAME_STATE') {
          return Promise.resolve(mockGameState);
        }
        return Promise.resolve({ state: null });
      });

    render(<Popup />);
    
    expect(await screen.findByText('No guesses recorded yet')).toBeInTheDocument();
  });

  it('displays guesses when they exist', async () => {
    const mockGameState = {
      state: {
        data: {
          puzzleComplete: false,
          puzzleWon: false,
          guesses: [
            {
              cards: [
                { position: 0, value: 'choice1' },
                { position: 1, value: 'choice2' },
                { position: 2, value: 'choice3' },
                { position: 3, value: 'choice4' }
              ]
            }
          ]
        }
      }
    };

    (chrome.runtime.sendMessage as jest.Mock)
      .mockImplementationOnce((message: ChromeMessage) => {
        if (message.type === 'REQUEST_CHOICES') {
          return Promise.resolve({ choices: ['choice1', 'choice2', 'choice3', 'choice4'] });
        }
        return Promise.resolve({ choices: [] });
      })
      .mockImplementationOnce((message: ChromeMessage) => {
        if (message.type === 'REQUEST_CURRENT_GAME_STATE') {
          return Promise.resolve(mockGameState);
        }
        return Promise.resolve({ state: null });
      });

    render(<Popup />);
    
    // Wait for the guess history to be rendered
    const guessHistory = await screen.findByRole('list', { name: /guess history/i });
    expect(guessHistory).toBeInTheDocument();
  });

  it('updates state when receiving GAME_STATE_UPDATED message', async () => {
    const initialGameState = {
      state: {
        data: {
          puzzleComplete: false,
          puzzleWon: false,
          guesses: []
        }
      }
    };

    const updatedGameState = {
      state: {
        data: {
          puzzleComplete: true,
          puzzleWon: true,
          guesses: []
        }
      }
    };
    
    (chrome.runtime.sendMessage as jest.Mock)
    .mockImplementationOnce((message: ChromeMessage) => {
      if (message.type === 'REQUEST_CHOICES') {
        return Promise.resolve({ choices: ['choice1', 'choice2'] });
      }
      return Promise.resolve({ choices: [] });
    })
    .mockImplementationOnce((message: ChromeMessage) => {
      if (message.type === 'REQUEST_CURRENT_GAME_STATE') {
        return Promise.resolve(initialGameState);
      }
      return Promise.resolve({ state: null });
    });
    
    render(<Popup />);
    
    // Wait for initial render to complete
    await screen.findByText('No guesses recorded yet');
    
    // Mock the message listener
    const listenerSpy = jest.fn();
    const sendResponseSpy = jest.fn();

    chrome.runtime.onMessage.addListener(listenerSpy);
    
    expect(listenerSpy).not.toBeCalled()
    expect(chrome.runtime.onMessage.hasListeners()).toBe(true)

    chrome.runtime.onMessage.callListeners({
      type: 'GAME_STATE_UPDATED',
      payload: updatedGameState
    }, {}, sendResponseSpy);
    
    expect(listenerSpy).toHaveBeenCalledWith({
      type: 'GAME_STATE_UPDATED',
      payload: updatedGameState
    }, {}, sendResponseSpy);

    expect(sendResponseSpy).not.toHaveBeenCalled();
    
    expect(await screen.findByText(/Congratulations! You won!/)).toBeInTheDocument();
  });
}); 