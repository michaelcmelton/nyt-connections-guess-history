<script lang="ts">
    import { onMount } from 'svelte';
    import GuessHistory from './GuessHistory.svelte';
    import { guessHistory, loadGuessHistory, clearGuessHistory } from './store.ts';

    onMount(async () => {
        await loadGuessHistory();
    });

    async function handleClearHistory() {
        await clearGuessHistory();
    }
</script>

<main>
    <header role="banner">
        <h1>Connections Guess History</h1>
    </header>
    
    <GuessHistory {guessHistory} />
    
    <footer role="contentinfo">
        <button 
            class="clear-button" 
            on:click={handleClearHistory}
            disabled={guessHistory.length === 0}
        >
            Clear History
        </button>
    </footer>
</main>

<style>
    main {
        width: 400px;
        min-height: 300px;
        margin: 0;
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background-color: #f5f5f5;
        display: flex;
        flex-direction: column;
    }
    
    header h1 {
        margin: 0 0 16px 0;
        font-size: 18px;
        color: #333;
    }
    
    footer {
        margin-top: auto;
        padding-top: 16px;
    }
    
    .clear-button {
        background: #f44336;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 0.2s;
    }
    
    .clear-button:hover:not(:disabled) {
        background: #d32f2f;
    }
    
    .clear-button:disabled {
        background: #ccc;
        cursor: not-allowed;
    }
</style>
