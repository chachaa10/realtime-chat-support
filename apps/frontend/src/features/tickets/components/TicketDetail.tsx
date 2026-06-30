import { useAuth } from '@/features/auth/context';
import type { TicketData } from '@/lib/api/tickets';

import { useAcceptTicket, useResolveTicket, useCancelTicket } from '../hooks/useTicketMutations';
import { useMessages } from '../hooks/useMessages';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { TicketStatusBadge } from './TicketStatusBadge';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ConnectionStatus } from './ConnectionStatus';

function formatDate(ts: number) {
  return new Date(ts).toLocaleString();
}

export function TicketDetail({ ticket }: { ticket: TicketData }) {
  const { user } = useAuth();
  const acceptMutation = useAcceptTicket();
  const resolveMutation = useResolveTicket();
  const cancelMutation = useCancelTicket();

  const { data: messages, isLoading: messagesLoading, isError: messagesError } = useMessages(ticket.id);
  const typingIndicator = useTypingIndicator(ticket.id);

  const isCustomer = user?.role === 'customer';
  const isAgent = user?.role === 'agent';
  const isOwnTicket = isCustomer && ticket.customerId === user?.id;
  const isAssignedAgent = isAgent && ticket.agentId === user?.id;

  const canAccept = isAgent && ticket.status === 'open';
  const canResolve = isAssignedAgent && ticket.status === 'in_progress';
  const canCancel = isOwnTicket && ticket.status === 'open';

  const isResolvedOrCancelled = ticket.status === 'resolved' || ticket.status === 'cancelled';
  const inputDisabled = isCustomer && isResolvedOrCancelled;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-ink text-[1.25rem] font-semibold">{ticket.subject}</h1>
          <p className="text-ink-muted mt-0.5 text-[0.8125rem]">
            Created {formatDate(ticket.createdAt)}
            {ticket.resolvedAt && ` · Resolved ${formatDate(ticket.resolvedAt)}`}
            {ticket.cancelledAt && ` · Cancelled ${formatDate(ticket.cancelledAt)}`}
          </p>
        </div>
        <TicketStatusBadge status={ticket.status} />
      </div>

      {ticket.labels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ticket.labels.map((label) => (
            <span
              key={label.id}
              className="inline-flex h-6 items-center rounded-full px-3 text-[0.75rem] font-medium"
              style={{ backgroundColor: label.color + '20', color: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      <div className="border-border bg-surface-raised rounded-xl border p-5">
        <p className="text-ink text-[0.875rem] leading-relaxed whitespace-pre-wrap">
          {ticket.description}
        </p>
      </div>

      {ticket.agent && (
        <div className="text-ink-muted text-[0.8125rem]">Agent assigned to this ticket</div>
      )}

      <div className="flex flex-wrap gap-3">
        {canAccept && (
          <button
            onClick={() => acceptMutation.mutate(ticket.id)}
            disabled={acceptMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[0.875rem] font-medium transition-colors disabled:opacity-50"
          >
            {acceptMutation.isPending ? 'Accepting...' : 'Accept Ticket'}
          </button>
        )}
        {canResolve && (
          <button
            onClick={() => resolveMutation.mutate(ticket.id)}
            disabled={resolveMutation.isPending}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-green-600 px-4 text-[0.875rem] font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {resolveMutation.isPending ? 'Resolving...' : 'Mark Resolved'}
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => cancelMutation.mutate(ticket.id)}
            disabled={cancelMutation.isPending}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-4 text-[0.875rem] font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Ticket'}
          </button>
        )}
      </div>

      <div className="border-border bg-surface-raised flex h-96 flex-col rounded-xl border">
        <div className="border-border flex items-center justify-between px-4 py-2.5">
          <p className="text-ink text-[0.8125rem] font-medium">Conversation</p>
          <ConnectionStatus />
        </div>
        <MessageList
          messages={messages}
          isLoading={messagesLoading}
          isError={messagesError}
          typingIndicator={typingIndicator}
        />
        <MessageInput
          ticketId={ticket.id}
          disabled={inputDisabled}
          disabledReason={isResolvedOrCancelled ? 'This ticket is closed' : undefined}
        />
      </div>
    </div>
  );
}
