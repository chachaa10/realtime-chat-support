import { get, patch } from './client';

export interface NotificationData {
  id: number;
  userId: string;
  type: string;
  ticketId: number;
  message: string;
  isRead: number;
  createdAt: number;
}

export function fetchNotifications(): Promise<NotificationData[]> {
  return get<NotificationData[]>('/notifications');
}

export function fetchUnreadCount(): Promise<{ count: number }> {
  return get<{ count: number }>('/notifications/unread-count');
}

export function markNotificationRead(id: number): Promise<{ success: boolean }> {
  return patch<{ success: boolean }>(`/notifications/${id}/read`);
}

export function markAllNotificationsRead(): Promise<{ success: boolean }> {
  return patch<{ success: boolean }>('/notifications/read-all');
}

export function markNotificationsReadByTicket(ticketId: number): Promise<{ success: boolean }> {
  return patch<{ success: boolean }>(`/notifications/read-by-ticket/${ticketId}`);
}
