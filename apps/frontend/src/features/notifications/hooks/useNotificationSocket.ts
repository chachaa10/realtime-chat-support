import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { connectSocket } from '@/lib/socket';

export function useNotificationSocket() {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = connectSocket();

    const handleNotification = (data: { notification: { message: string; type: string } }) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
      toast.info(data.notification.message);
    };

    socket.on('notification:new', handleNotification);

    return () => {
      socket.off('notification:new', handleNotification);
    };
  }, [qc]);
}
