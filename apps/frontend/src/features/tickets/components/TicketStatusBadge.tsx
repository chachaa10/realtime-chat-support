import { Badge } from '@/components/ui/badge';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
};

export function TicketStatusBadge({ status }: { status: string }) {
  return <Badge className={STATUS_COLORS[status] ?? ''}>{STATUS_LABELS[status] ?? status}</Badge>;
}
