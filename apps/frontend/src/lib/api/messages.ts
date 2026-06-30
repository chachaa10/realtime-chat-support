import type { Attachment } from '@repo/shared'
import type { Message } from '@repo/shared'

import { get, post } from './client'

export interface MessageWithAttachments extends Message {
  attachments: Attachment[]
}

export function fetchMessages(ticketId: number): Promise<MessageWithAttachments[]> {
  return get<MessageWithAttachments[]>(`/tickets/${ticketId}/messages`)
}

export function sendMessage(ticketId: number, body: string, attachmentIds?: number[]): Promise<MessageWithAttachments> {
  return post<MessageWithAttachments>(`/tickets/${ticketId}/messages`, { ticketId, body, attachmentIds })
}
