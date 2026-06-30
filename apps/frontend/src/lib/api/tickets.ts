import { get, post, patch } from './client';

export interface TicketData {
  id: number;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'cancelled';
  customerId: string;
  agentId: string | null;
  createdAt: number;
  updatedAt: number;
  resolvedAt: number | null;
  cancelledAt: number | null;
  customer?: { id: string };
  agent?: { id: string };
  labels: { id: number; name: string; color: string }[];
}

export interface LabelData {
  id: number;
  name: string;
  color: string;
}

export function fetchTickets(params?: {
  tab?: string;
  status?: string;
  label?: string;
}): Promise<TicketData[]> {
  const search = new URLSearchParams();
  if (params?.tab) search.set('tab', params.tab);
  if (params?.status) search.set('status', params.status);
  if (params?.label) search.set('label', params.label);
  const qs = search.toString();
  return get<TicketData[]>(`/tickets${qs ? '?' + qs : ''}`);
}

export function fetchTicket(id: number): Promise<TicketData> {
  return get<TicketData>(`/tickets/${id}`);
}

export function createTicket(data: {
  subject: string;
  description: string;
  labelIds?: number[];
}): Promise<TicketData> {
  return post<TicketData>('/tickets', data);
}

export function acceptTicket(id: number): Promise<TicketData> {
  return patch<TicketData>(`/tickets/${id}/accept`);
}

export function resolveTicket(id: number): Promise<TicketData> {
  return patch<TicketData>(`/tickets/${id}/resolve`);
}

export function cancelTicket(id: number): Promise<TicketData> {
  return patch<TicketData>(`/tickets/${id}/cancel`);
}

export function fetchLabels(): Promise<LabelData[]> {
  return get<LabelData[]>('/labels');
}
