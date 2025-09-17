export interface GuessHistoryEntry {
    id: string;
    timestamp: string;
    guesses: string[];
    gameState: string;
}

export interface ChromeMessage {
    action: string;
    data?: any;
}
