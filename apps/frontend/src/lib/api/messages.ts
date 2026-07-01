import type { Attachment } from '@repo/shared';
import type { Message } from '@repo/shared';

import { get, post } from './client';
import type { PaginatedResponse } from './tickets';

export type MessageStatus = Message['status'] | 'sending' | 'error';

export interface MessageWithAttachments extends Omit<Message, 'status'> {
  status: MessageStatus;
  attachments: Attachment[];
}

export function fetchMessages(
  ticketId: number,
  params?: { cursor?: number; limit?: number },
): Promise<PaginatedResponse<MessageWithAttachments>> {
  const search = new URLSearchParams();
  if (params?.cursor != null) search.set('cursor', params.cursor.toString());
  if (params?.limit != null) search.set('limit', params.limit.toString());
  const qs = search.toString();
  return get<PaginatedResponse<MessageWithAttachments>>(
    `/tickets/${ticketId}/messages${qs ? '?' + qs : ''}`,
  );
}

export function sendMessage(
  ticketId: number,
  body: string,
  attachmentIds?: number[],
): Promise<MessageWithAttachments> {
  return post<MessageWithAttachments>(`/tickets/${ticketId}/messages`, {
    ticketId,
    body,
    attachmentIds,
  });
}
