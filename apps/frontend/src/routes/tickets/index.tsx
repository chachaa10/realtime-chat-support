import { Outlet, createRoute, useMatch } from '@tanstack/react-router';
import { PanelLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

import { useBreakpoint } from '@/lib/hooks/useBreakpoint';
import { TicketSidebar } from '@/features/tickets/components/TicketSidebar';

import { rootRoute } from '../__root';
import { ticketDetailRoute } from './$ticketId';

export interface TicketSearch {
  tab?: 'my' | 'queue';
  label?: string;
  sort?: string;
}

export const ticketsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tickets',
  component: TicketsLayout,
});

function TicketsLayout() {
  const detailMatch = useMatch({ from: ticketDetailRoute.id, shouldThrow: false });
  const activeTicketId = detailMatch ? Number(detailMatch.params.ticketId) : undefined;
  const isDesktop = useBreakpoint(768);
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);

  // Sync with breakpoint on resize
  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  // Close sidebar on custom event (e.g., ticket selected on mobile)
  useEffect(() => {
    function handleClose() {
      setSidebarOpen(false);
    }
    window.addEventListener('close-sidebar', handleClose);
    return () => window.removeEventListener('close-sidebar', handleClose);
  }, []);

  return (
    <div className="flex h-full">
      {/* Mobile overlay backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ease-in-out ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } md:hidden`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar - overlay on mobile, push on md+ */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50
          shrink-0 w-[300px] transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:inset-auto md:z-auto md:translate-x-0
          ${sidebarOpen ? '' : 'md:w-0 md:overflow-hidden'}
        `}
      >
        <TicketSidebar
          activeTicketId={activeTicketId}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header with sidebar toggle */}
        <div className="border-border flex items-center gap-2 border-b px-4 py-2">
          <button
            onClick={() => setSidebarOpen((p) => !p)}
            className="text-ink-muted hover:text-ink inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <PanelLeft size={18} />
          </button>
          <span className="text-ink text-sm font-semibold">Chat Support</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

export const ticketsIndexRoute = createRoute({
  getParentRoute: () => ticketsRoute,
  path: '/',
  component: TicketsIndexPage,
});

function TicketsIndexPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <div className="bg-surface-sunken flex h-14 w-14 items-center justify-center rounded-full">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-ink-muted"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h2 className="text-ink text-[1rem] font-semibold">Select a ticket</h2>
        <p className="text-ink-muted max-w-xs text-[0.8125rem]">
          Choose a ticket from the sidebar to view the conversation, or create a new ticket.
        </p>
      </div>
    </div>
  );
}
