import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import App from './App.svelte';
import { mockGuessHistory, setupChromeStorageMocks, resetMocks } from '../test/utils';

// Mock the store functions
vi.mock('./store', () => ({
    guessHistory: {
        subscribe: vi.fn((callback) => {
            callback(mockGuessHistory);
            return () => {};
        })
    },
    loadGuessHistory: vi.fn(),
    clearGuessHistory: vi.fn()
}));

describe('App Component', () => {
    beforeEach(() => {
        resetMocks();
        setupChromeStorageMocks();
    });

    it('should render the main heading', () => {
        render(App);
        expect(screen.getByText('Connections Guess History')).toBeInTheDocument();
    });

    it('should render the GuessHistory component', () => {
        render(App);
        expect(screen.getByTestId('guess-history-container')).toBeInTheDocument();
    });

    it('should render the clear history button', () => {
        render(App);
        const clearButton = screen.getByRole('button', { name: /clear history/i });
        expect(clearButton).toBeInTheDocument();
    });

    it('should disable clear button when no history', async () => {
        // Mock empty history
        vi.doMock('./store', () => ({
            guessHistory: {
                subscribe: vi.fn((callback) => {
                    callback([]);
                    return () => {};
                })
            },
            loadGuessHistory: vi.fn(),
            clearGuessHistory: vi.fn()
        }));

        render(App);
        
        const clearButton = screen.getByRole('button', { name: /clear history/i });
        expect(clearButton).toBeDisabled();
    });

    it('should enable clear button when history exists', () => {
        render(App);
        
        const clearButton = screen.getByRole('button', { name: /clear history/i });
        expect(clearButton).not.toBeDisabled();
    });

    it('should call clearGuessHistory when clear button is clicked', async () => {
        const user = userEvent.setup();
        const { clearGuessHistory } = await import('./store');
        
        render(App);
        
        const clearButton = screen.getByRole('button', { name: /clear history/i });
        await user.click(clearButton);
        
        expect(clearGuessHistory).toHaveBeenCalled();
    });

    it('should call loadGuessHistory on mount', async () => {
        const { loadGuessHistory } = await import('./store');
        
        render(App);
        
        await waitFor(() => {
            expect(loadGuessHistory).toHaveBeenCalled();
        });
    });

    it('should have proper CSS classes and structure', () => {
        render(App);
        
        const main = screen.getByRole('main');
        expect(main).toBeInTheDocument();
        
        const header = screen.getByRole('banner');
        expect(header).toBeInTheDocument();
        
        const footer = screen.getByRole('contentinfo');
        expect(footer).toBeInTheDocument();
    });

    it('should handle clearGuessHistory errors gracefully', async () => {
        const user = userEvent.setup();
        const { clearGuessHistory } = await import('./store');
        
        // Mock clearGuessHistory to throw an error
        vi.mocked(clearGuessHistory).mockRejectedValue(new Error('Clear failed'));
        
        // Mock console.error to avoid noise in test output
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        render(App);
        
        const clearButton = screen.getByRole('button', { name: /clear history/i });
        await user.click(clearButton);
        
        // Should not throw an error
        expect(clearGuessHistory).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
    });
});
