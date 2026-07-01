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

export interface PaginationMeta {
  cursor: number | null;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export function fetchTickets(params?: {
  tab?: string;
  status?: string;
  label?: string;
  sort?: string;
  cursor?: number;
  limit?: number;
}): Promise<PaginatedResponse<TicketData>> {
  const search = new URLSearchParams();
  if (params?.tab) search.set('tab', params.tab);
  if (params?.status) search.set('status', params.status);
  if (params?.label) search.set('label', params.label);
  if (params?.sort) search.set('sort', params.sort);
  if (params?.cursor != null) search.set('cursor', params.cursor.toString());
  if (params?.limit != null) search.set('limit', params.limit.toString());
  const qs = search.toString();
  return get<PaginatedResponse<TicketData>>(`/tickets${qs ? '?' + qs : ''}`);
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

export function returnTicketToQueue(id: number): Promise<TicketData> {
  return patch<TicketData>(`/tickets/${id}/return-to-queue`);
}

export interface EventData {
  id: number;
  ticketId: number;
  fromStatus: string | null;
  toStatus: string;
  actorId: string;
  createdAt: number;
}

export function fetchTicketEvents(id: number): Promise<EventData[]> {
  return get<EventData[]>(`/tickets/${id}/events`);
}

export interface CapacityStatus {
  inProgressCount: number;
  maxCapacity: number;
  atCapacity: boolean;
}

export function fetchCapacityStatus(): Promise<CapacityStatus> {
  return get<CapacityStatus>('/tickets/capacity-status');
}

export function fetchLabels(): Promise<LabelData[]> {
  return get<LabelData[]>('/labels');
}
