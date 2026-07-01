import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchNotifications, fetchUnreadCount, markNotificationRead, markAllNotificationsRead, markNotificationsReadByTicket, type NotificationData } from '@/lib/api/notifications';

export function useNotifications() {
  return useQuery<NotificationData[]>({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });
}

export function useUnreadCount() {
  return useQuery<{ count: number }>({
    queryKey: ['unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}

export function useMarkNotificationsReadByTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationsReadByTicket,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}
