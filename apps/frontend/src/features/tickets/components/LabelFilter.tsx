import { useNavigate } from '@tanstack/react-router';

import { useLabels } from '../hooks/useLabels';

export function LabelFilter() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const currentLabel = params.get('label') ?? undefined;
  const currentTab = params.get('tab') ?? 'queue';
  const { data: labels } = useLabels();

  if (!labels?.length) return null;

  const setLabel = (label: string | undefined) => {
    const search: Record<string, string> = { tab: currentTab };
    if (label) search.label = label;
    navigate({ to: '/tickets', search, replace: true });
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-ink-muted text-[0.75rem] font-medium">Filter:</span>
      <button
        onClick={() => setLabel(undefined)}
        className={`inline-flex h-6 items-center rounded-full px-2.5 text-[0.6875rem] font-medium transition-colors ${
          !currentLabel ? 'bg-ink/10 text-ink' : 'text-ink-muted hover:bg-ink/5 hover:text-ink'
        }`}
      >
        All
      </button>
      {labels.map((label) => (
        <button
          key={label.id}
          onClick={() => setLabel(currentLabel === label.name ? undefined : label.name)}
          className={`inline-flex h-6 items-center rounded-full px-2.5 text-[0.6875rem] font-medium transition-colors ${
            currentLabel === label.name ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'
          }`}
          style={{
            backgroundColor: label.color + '20',
            color: label.color,
          }}
        >
          {label.name}
        </button>
      ))}
    </div>
  );
}
