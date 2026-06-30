import { Link } from '@tanstack/react-router';

export function QueueTabs() {
  const params = new URLSearchParams(window.location.search);
  const activeTab = params.get('tab') ?? 'my';

  return (
    <div className="border-border mb-4 flex border-b">
      <Link
        to="/tickets"
        search={{ tab: 'my' }}
        className={`-mb-px inline-flex h-9 items-center border-b-2 px-4 text-[0.8125rem] font-medium transition-colors ${
          activeTab === 'my'
            ? 'border-ink text-ink'
            : 'text-ink-muted hover:text-ink border-transparent'
        }`}
      >
        My Tickets
      </Link>
      <Link
        to="/tickets"
        search={{ tab: 'queue' }}
        className={`-mb-px inline-flex h-9 items-center border-b-2 px-4 text-[0.8125rem] font-medium transition-colors ${
          activeTab === 'queue'
            ? 'border-ink text-ink'
            : 'text-ink-muted hover:text-ink border-transparent'
        }`}
      >
        Queue
      </Link>
    </div>
  );
}
