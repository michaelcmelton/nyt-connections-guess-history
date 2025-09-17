import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import GuessHistory from './GuessHistory.svelte';
import type { GuessHistoryEntry } from './types';
import { mockGuessHistory, createMockGuessHistoryEntry } from '../test/utils';

describe('GuessHistory Component', () => {
    const defaultProps = {
        guessHistory: [] as GuessHistoryEntry[]
    };

    describe('Empty State', () => {
        it('should display empty state message when no history', () => {
            render(GuessHistory, { props: defaultProps });
            
            expect(screen.getByText('No guess history found. Play some games to see your history here!')).toBeInTheDocument();
        });
    });

    describe('With History Data', () => {
        beforeEach(() => {
            render(GuessHistory, { 
                props: { 
                    guessHistory: mockGuessHistory 
                } 
            });
        });

        it('should render all history entries', () => {
            const entries = screen.getAllByTestId('history-entry');
            expect(entries).toHaveLength(mockGuessHistory.length);
        });

        it('should display timestamps correctly', () => {
            const firstEntry = mockGuessHistory[0];
            const expectedTimestamp = new Date(firstEntry.timestamp).toLocaleString();
            expect(screen.getByText(expectedTimestamp)).toBeInTheDocument();
        });

        it('should display game states correctly', () => {
            expect(screen.getByText('completed')).toBeInTheDocument();
            expect(screen.getByText('in_progress')).toBeInTheDocument();
        });

        it('should display all guesses for each entry', () => {
            mockGuessHistory.forEach(entry => {
                entry.guesses.forEach(guess => {
                    expect(screen.getByText(guess)).toBeInTheDocument();
                });
            });
        });

        it('should have proper CSS classes', () => {
            const entries = screen.getAllByTestId('history-entry');
            entries.forEach(entry => {
                expect(entry).toHaveClass('history-entry');
            });

            const guesses = screen.getAllByTestId('guess');
            guesses.forEach(guess => {
                expect(guess).toHaveClass('guess');
            });
        });
    });

    describe('Dynamic Updates', () => {
        it('should update when guessHistory prop changes', () => {
            const { component } = render(GuessHistory, { props: defaultProps });
            
            // Initially empty
            expect(screen.getByText('No guess history found. Play some games to see your history here!')).toBeInTheDocument();
            
            // Update with data
            component.$set({ guessHistory: mockGuessHistory });
            
            expect(screen.queryByText('No guess history found. Play some games to see your history here!')).not.toBeInTheDocument();
            expect(screen.getAllByTestId('history-entry')).toHaveLength(mockGuessHistory.length);
        });
    });

    describe('Edge Cases', () => {
        it('should handle entry with no guesses', () => {
            const entryWithNoGuesses = createMockGuessHistoryEntry({ guesses: [] });
            render(GuessHistory, { 
                props: { 
                    guessHistory: [entryWithNoGuesses] 
                } 
            });
            
            expect(screen.getByTestId('history-entry')).toBeInTheDocument();
            expect(screen.getByTestId('guesses')).toBeEmptyDOMElement();
        });

        it('should handle very long guess lists', () => {
            const longGuesses = Array.from({ length: 20 }, (_, i) => `guess-${i}`);
            const entryWithManyGuesses = createMockGuessHistoryEntry({ guesses: longGuesses });
            
            render(GuessHistory, { 
                props: { 
                    guessHistory: [entryWithManyGuesses] 
                } 
            });
            
            longGuesses.forEach(guess => {
                expect(screen.getByText(guess)).toBeInTheDocument();
            });
        });
    });
});
