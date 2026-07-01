import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/context';
import type { MessageWithAttachments, MessageStatus } from '@/lib/api/messages';
import { fetchMessages } from '@/lib/api/messages';
import { connectSocket, getSocket } from '@/lib/socket';

export function useMessages(ticketId: number) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery<MessageWithAttachments[]>({
    queryKey: ['messages', ticketId],
    queryFn: () => fetchMessages(ticketId).then((r) => r.data),
    enabled: !!ticketId,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error(query.error instanceof Error ? query.error.message : 'Failed to load messages');
    }
  }, [query.isError, query.error]);

  const handleMessageSent = useCallback(
    (data: { message: MessageWithAttachments }) => {
      queryClient.setQueryData<MessageWithAttachments[]>(['messages', ticketId], (old) => {
        if (!old) return [data.message];
        if (old.some((m) => m.id === data.message.id)) return old;
        // Remove temp messages (negative ids) and add the real one
        return [...old.filter((m) => m.id > 0), data.message];
      });
      // Auto-mark as read for incoming messages while viewing
      if (data.message.authorId !== user?.id) {
        getSocket().emit('message:read', { ticketId });
      }
    },
    [ticketId, queryClient, user?.id],
  );

  const handleReconnectSync = useCallback(
    (data: { messages: MessageWithAttachments[] }) => {
      queryClient.setQueryData<MessageWithAttachments[]>(['messages', ticketId], (old) => {
        if (!old) return data.messages;
        const existingIds = new Set(old.map((m) => m.id));
        const newMsgs = data.messages.filter((m) => !existingIds.has(m.id));
        if (newMsgs.length === 0) return old;
        return [...old, ...newMsgs].toSorted((a, b) => a.createdAt - b.createdAt);
      });
    },
    [ticketId, queryClient],
  );

  const handleMessageStatus = useCallback(
    (data: { ticketId: number; messageId: number; status: MessageStatus }) => {
      queryClient.setQueryData<MessageWithAttachments[]>(['messages', ticketId], (old) => {
        if (!old) return old;
        return old.map((m) =>
          m.id === data.messageId ? { ...m, status: data.status as MessageStatus } : m,
        );
      });
    },
    [ticketId, queryClient],
  );

  const handleTicketStatusChange = useCallback(
    (_data: { ticketId: number }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    },
    [ticketId, queryClient],
  );

  useEffect(() => {
    if (!ticketId) return;

    const socket = connectSocket();

    socket.emit('join:ticket', { ticketId });
    socket.emit('message:read', { ticketId });

    socket.on('message:sent', handleMessageSent);
    socket.on('message:status', handleMessageStatus);
    socket.on('reconnect:sync', handleReconnectSync);
    socket.on('ticket:accepted', handleTicketStatusChange);
    socket.on('ticket:resolved', handleTicketStatusChange);
    socket.on('ticket:cancelled', handleTicketStatusChange);
    socket.on('ticket:returned', handleTicketStatusChange);

    socket.on('connect', () => {
      const cached = queryClient.getQueryData<MessageWithAttachments[]>(['messages', ticketId]);
      if (cached && cached.length > 0) {
        const lastTimestamp = cached[cached.length - 1].createdAt;
        socket.emit('reconnect:sync', { ticketId, lastMessageTimestamp: lastTimestamp });
      }
      socket.emit('message:read', { ticketId });
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return () => {
      socket.off('message:sent', handleMessageSent);
      socket.off('message:status', handleMessageStatus);
      socket.off('reconnect:sync', handleReconnectSync);
      socket.off('ticket:accepted', handleTicketStatusChange);
      socket.off('ticket:resolved', handleTicketStatusChange);
      socket.off('ticket:cancelled', handleTicketStatusChange);
      socket.off('ticket:returned', handleTicketStatusChange);
      socket.off('connect');
      socket.off('connect_error');
      socket.emit('leave:ticket', { ticketId });
    };
  }, [
    ticketId,
    handleMessageSent,
    handleMessageStatus,
    handleReconnectSync,
    handleTicketStatusChange,
    queryClient,
  ]);

  return query;
}
