<script lang="ts">
    import type { GuessHistoryEntry } from './types.ts';

    export let guessHistory: GuessHistoryEntry[] = [];
</script>

<div class="guess-history-container" data-testid="guess-history-container">
    {#if guessHistory.length === 0}
        <div class="empty-state">
            <p>No guess history found. Play some games to see your history here!</p>
        </div>
    {:else}
        <div class="history-list">
            {#each guessHistory as entry (entry.id)}
                <div class="history-entry" data-testid="history-entry">
                    <div class="entry-header">
                        <span class="timestamp">
                            {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        <span class="game-state">
                            {entry.gameState}
                        </span>
                    </div>
                    <div class="guesses" data-testid="guesses">
                        {#each entry.guesses as guess}
                            <span class="guess" data-testid="guess">{guess}</span>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .guess-history-container {
        flex: 1;
        overflow-y: auto;
    }
    
    .empty-state {
        text-align: center;
        padding: 20px;
        color: #666;
    }
    
    .empty-state p {
        margin: 0;
        font-size: 14px;
    }
    
    .history-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .history-entry {
        background: white;
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        transition: box-shadow 0.2s;
    }
    
    .history-entry:hover {
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
    
    .entry-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 12px;
        color: #666;
    }
    
    .timestamp {
        font-weight: 500;
    }
    
    .game-state {
        text-transform: capitalize;
        padding: 2px 6px;
        border-radius: 3px;
        background: #f0f0f0;
    }
    
    .guesses {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
    }
    
    .guess {
        background: #e3f2fd;
        color: #1976d2;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
    }
</style>
