import type { Message } from '@repo/shared';

export interface MessageBroadcaster {
  messageSent(ticketId: number, message: Message): void;
  messageStatusUpdated(ticketId: number, messageId: number, status: string): void;
  typingStart(ticketId: number, userId: string, userName: string): void;
  typingStop(ticketId: number, userId: string): void;
}

export const MESSAGE_BROADCASTER = 'MESSAGE_BROADCASTER';
