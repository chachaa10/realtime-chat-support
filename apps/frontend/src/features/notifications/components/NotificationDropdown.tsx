import { useNavigate } from '@tanstack/react-router';

import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../hooks/useNotifications';

interface NotificationDropdownProps {
  onClose: () => void;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const navigate = useNavigate();

  const unread = notifications?.filter((n) => n.isRead === 0) ?? [];
  const all = notifications ?? [];

  function handleClick(n: { id: number; ticketId: number; isRead: number }) {
    if (!n.isRead) {
      markRead.mutate(n.id);
    }
    navigate({ to: `/tickets/${n.ticketId}` });
    onClose();
  }

  return (
    <div className="border-border bg-surface absolute top-full right-0 z-50 mt-1 w-80 rounded-lg border shadow-lg">
      <div className="border-border flex items-center justify-between border-b px-3 py-2">
        <span className="text-ink text-[0.8125rem] font-semibold">Notifications</span>
        {unread.length > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="text-brand text-[0.6875rem] font-medium hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {all.length === 0 ? (
          <div className="text-ink-muted flex items-center justify-center py-8 text-[0.8125rem]">
            No notifications
          </div>
        ) : (
          all.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`border-border hover:bg-surface-hover w-full border-b px-3 py-2.5 text-left transition-colors last:border-b-0 ${
                !n.isRead ? 'bg-surface-sunken' : ''
              }`}
            >
              <p
                className={`text-ink text-[0.8125rem] leading-snug ${!n.isRead ? 'font-medium' : ''}`}
              >
                {n.message}
              </p>
              <p className="text-ink-dim mt-0.5 text-[0.6875rem]">{formatTime(n.createdAt)}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
