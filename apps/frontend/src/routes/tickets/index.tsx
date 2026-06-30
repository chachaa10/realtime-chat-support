import { createRoute } from '@tanstack/react-router';

import { rootRoute } from '../__root';

export const ticketsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tickets',
  component: TicketsPage,
});

function TicketsPage() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-ink text-[1.25rem] font-semibold">Tickets</h1>
          <p className="text-ink-muted mt-0.5 text-[0.8125rem]">Customer support queue</p>
        </div>
      </div>
      <div className="border-border bg-surface-raised flex flex-col items-center justify-center rounded-xl border p-12 text-center">
        <div className="bg-surface-sunken mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-ink-muted"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        </div>
        <h2 className="text-ink mb-1 text-[1rem] font-semibold">No tickets yet</h2>
        <p className="text-ink-muted max-w-xs text-[0.8125rem]">
          Customer tickets will appear here once they&apos;re submitted.
        </p>
      </div>
    </div>
  );
}
