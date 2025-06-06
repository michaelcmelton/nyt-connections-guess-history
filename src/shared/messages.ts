import { GameState, PuzzleState } from "@/shared/types";

export enum MessageType {
  REQUEST_CURRENT_GAME_STATE = 'REQUEST_CURRENT_GAME_STATE', // request for current game state from background script to content script
  REQUEST_CHOICES = 'REQUEST_CHOICES', // request for choices from background script to content script
  UPDATE_CHOICES = 'UPDATE_CHOICES', // update choices in background script from content script
  CONTENT_SCRIPT_READY = 'CONTENT_SCRIPT_READY', // content script is ready to send messages to background script
  GAME_STATE_UPDATED = 'GAME_STATE_UPDATED',
  UPDATE_GAME_STATE = 'UPDATE_GAME_STATE',
  CHOICES_UPDATED = 'CHOICES_UPDATED',
  NO_GAME_FOUND = 'NO_GAME_FOUND',
  PING = 'PING'
} 

export type Message = {
  type: MessageType;
  payload?: any;
}

export type MessageResponse = {
  type?: MessageType;
  status?: 'ok' | 'error';
  payload?: any;
  error?: string;
  choices?: string[];
  state?: PuzzleState | null;
}