import { get, post } from './client'
import type { Message } from '@repo/shared'

export function fetchMessages(ticketId: number): Promise<Message[]> {
  return get<Message[]>(`/tickets/${ticketId}/messages`)
}

export function sendMessage(ticketId: number, body: string): Promise<Message> {
  return post<Message>(`/tickets/${ticketId}/messages`, { ticketId, body })
}
