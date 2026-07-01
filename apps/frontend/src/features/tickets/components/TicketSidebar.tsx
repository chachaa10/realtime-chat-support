import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { useState } from 'react';

import { SkeletonListItem, Spinner, EmptyState } from '@/components/ui';
import { ThemeToggle } from '@/design-system/ThemeToggle';
import { useAuth } from '@/features/auth/context';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import type { TicketSearch } from '@/routes/tickets/index';

import { useLabels } from '../hooks/useLabels';
import { useTickets } from '../hooks/useTickets';
import { TicketListItem } from './TicketListItem';

interface TicketSidebarProps {
  activeTicketId?: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function TicketSidebar({ activeTicketId, mobileOpen, onMobileClose }: TicketSidebarProps) {
  const { user, logout, updateUserStatus } = useAuth();
  const navigate = useNavigate();
  const isAgent = user?.role === 'agent';
  const search = useSearch({ from: undefined as any }) as TicketSearch;
  const [query, setQuery] = useState('');

  const tab = search.tab ?? (isAgent ? 'my' : 'my');
  const label = search.label;

  const {
    data: tickets,
    isLoading,
    isRefetching,
  } = useTickets({
    tab: isAgent ? tab : undefined,
    label,
    sort: search.sort,
  });
  const { data: labels } = useLabels();

  const filtered = query.trim()
    ? (tickets ?? []).filter(
        (t) =>
          t.subject.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase()),
      )
    : tickets;

  function switchTab(t: 'my' | 'queue') {
    navigate({ to: '/tickets', search: { tab: t, sort: search.sort } as any, replace: true });
  }

  function setLabel(labelName: string | undefined) {
    const s: Record<string, string> = { tab, sort: search.sort ?? 'newest' };
    if (labelName) s.label = labelName;
    navigate({ to: '/tickets', search: s as any, replace: true });
  }

  return (
    <div className="bg-surface-sunken border-border flex h-full w-[300px] shrink-0 flex-col border-r">
      <div className="border-border flex items-center gap-2.5 border-b px-4 py-3">
        <div className="bg-brand flex h-7 w-7 items-center justify-center rounded-lg text-[0.75rem] leading-none font-bold text-white">
          CS
        </div>
        <span className="text-ink text-[0.9375rem] font-semibold">Chat Support</span>
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="text-ink-muted hover:text-ink ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors md:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="border-border border-b px-3 py-2.5">
        <div className="relative">
          <svg
            className="text-ink-dim pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickets..."
            className="bg-surface placeholder:text-ink-dim text-ink ring-border focus:ring-brand w-full rounded-lg border-none py-1.5 pr-3 pl-8 text-[0.8125rem] ring-1 transition-colors outline-none focus:ring-2"
          />
        </div>
      </div>

      <div className="border-border flex items-center justify-between border-b px-4 py-2">
        <span className="text-ink-muted inline-flex items-center gap-2 text-[0.75rem] font-medium">
          {isAgent ? (tab === 'my' ? 'My Tickets' : 'Queue') : 'Tickets'}
          {isRefetching && !isLoading && <Spinner size="sm" />}
        </span>
        <div className="flex items-center gap-2">
          {isAgent && (
            <select
              value={search.sort ?? 'newest'}
              onChange={(e) => {
                navigate({
                  to: '/tickets',
                  search: { tab, label, sort: e.target.value } as any,
                  replace: true,
                });
              }}
              className="text-ink-muted cursor-pointer border-none bg-transparent text-[0.6875rem] outline-none"
              aria-label="Sort tickets"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="status">Status</option>
            </select>
          )}
          {!isAgent && (
            <Link
              to="/tickets/new"
              className="text-ink-muted hover:text-brand inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              aria-label="New ticket"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonListItem key={i} />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="py-1">
            {filtered.map((ticket) => (
              <TicketListItem
                key={ticket.id}
                ticket={ticket}
                isActive={ticket.id === activeTicketId}
              />
            ))}
          </div>
        ) : (
          <EmptyState title={query ? 'No tickets match your search' : 'No tickets yet'} />
        )}
      </div>

      {isAgent && (
        <div className="border-border flex items-center border-t p-1">
          <button
            onClick={() => switchTab('my')}
            className={`flex h-8 flex-1 items-center justify-center rounded-md text-[0.75rem] font-medium transition-colors ${
              tab === 'my' ? 'bg-surface text-ink' : 'text-ink-muted hover:text-ink'
            }`}
          >
            My
          </button>
          <button
            onClick={() => switchTab('queue')}
            className={`flex h-8 flex-1 items-center justify-center rounded-md text-[0.75rem] font-medium transition-colors ${
              tab === 'queue' ? 'bg-surface text-ink' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Queue
          </button>
        </div>
      )}

      {isAgent && tab === 'queue' && labels && labels.length > 0 && (
        <div className="border-border flex items-center gap-1 overflow-x-auto border-t px-3 py-1.5">
          <button
            onClick={() => setLabel(undefined)}
            className={`inline-flex h-6 shrink-0 items-center rounded-full px-2 text-[0.625rem] font-medium transition-colors ${
              !label ? 'bg-ink/10 text-ink' : 'text-ink-muted hover:text-ink'
            }`}
          >
            All
          </button>
          {labels.map((l) => (
            <button
              key={l.id}
              onClick={() => setLabel(label === l.name ? undefined : l.name)}
              className={`inline-flex h-6 shrink-0 items-center rounded-full px-2 text-[0.625rem] font-medium transition-colors ${
                label === l.name ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                backgroundColor: l.color + '18',
                color: l.color,
              }}
            >
              {l.name}
            </button>
          ))}
        </div>
      )}

      <div className="border-border flex items-center justify-between border-t px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="bg-brand/20 text-brand flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-ink truncate text-[0.8125rem] font-medium">{user?.name}</p>
            <p className="text-ink-dim text-[0.6875rem] capitalize">{user?.role}</p>
            {isAgent && (
              <button
                onClick={() => updateUserStatus(user?.status === 'away' ? 'online' : 'away')}
                className="text-ink-dim hover:text-ink mt-0.5 inline-flex items-center gap-1 text-[0.625rem] transition-colors"
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${user?.status === 'away' ? 'bg-ink-dim' : 'bg-success'}`}
                />
                {user?.status === 'away' ? 'Away' : 'Online'}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
          <button
            onClick={() => {
              logout();
              navigate({ to: '/login' });
            }}
            className="text-ink-muted hover:text-danger hover:bg-danger/10 flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150"
            aria-label="Logout"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
