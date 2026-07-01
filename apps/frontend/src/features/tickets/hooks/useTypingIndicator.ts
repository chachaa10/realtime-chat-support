import { useState, useEffect, useCallback } from 'react';

import { useAuth } from '@/features/auth/context';
import { connectSocket } from '@/lib/socket';

export function useTypingIndicator(ticketId: number) {
  const { user } = useAuth();
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [typingUserName, setTypingUserName] = useState<string | null>(null);

  const handleTypingStart = useCallback(
    (data: { ticketId: number; userId: string; userName: string }) => {
      if (data.userId !== user?.id) {
        setTypingUserId(data.userId);
        setTypingUserName(data.userName);
      }
    },
    [user?.id],
  );

  const handleTypingStop = useCallback(
    (data: { ticketId: number; userId: string }) => {
      if (data.userId === typingUserId) {
        setTypingUserId(null);
        setTypingUserName(null);
      }
    },
    [typingUserId],
  );

  useEffect(() => {
    if (!ticketId) return;

    const socket = connectSocket();

    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [ticketId, handleTypingStart, handleTypingStop]);

  const indicatorText = typingUserName ? `${typingUserName} is typing...` : null;

  return indicatorText;
}
