import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createTicket, acceptTicket, resolveTicket, cancelTicket } from '@/lib/api/tickets';

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to create ticket');
    },
  });
}

export function useAcceptTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: acceptTicket,
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['ticket', ticket.id] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to accept ticket');
    },
  });
}

export function useResolveTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resolveTicket,
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['ticket', ticket.id] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to resolve ticket');
    },
  });
}

export function useCancelTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelTicket,
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['ticket', ticket.id] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to cancel ticket');
    },
  });
}
