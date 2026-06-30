const API_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:3001';

async function fetchApi<T = any>(path: string, options: RequestInit = {}): Promise<{ data: T }> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message ?? 'Request failed');
  }
  return res.json();
}

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

export async function fetchTickets(params?: {
  tab?: string;
  status?: string;
  label?: string;
}): Promise<TicketData[]> {
  const search = new URLSearchParams();
  if (params?.tab) search.set('tab', params.tab);
  if (params?.status) search.set('status', params.status);
  if (params?.label) search.set('label', params.label);
  const qs = search.toString();
  const res = await fetchApi<TicketData[]>(`/tickets${qs ? '?' + qs : ''}`);
  return res.data;
}

export async function fetchTicket(id: number): Promise<TicketData> {
  const res = await fetchApi<TicketData>(`/tickets/${id}`);
  return res.data;
}

export async function createTicket(data: {
  subject: string;
  description: string;
  labelIds?: number[];
}): Promise<TicketData> {
  const res = await fetchApi<TicketData>('/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function acceptTicket(id: number): Promise<TicketData> {
  const res = await fetchApi<TicketData>(`/tickets/${id}/accept`, { method: 'PATCH' });
  return res.data;
}

export async function resolveTicket(id: number): Promise<TicketData> {
  const res = await fetchApi<TicketData>(`/tickets/${id}/resolve`, { method: 'PATCH' });
  return res.data;
}

export async function cancelTicket(id: number): Promise<TicketData> {
  const res = await fetchApi<TicketData>(`/tickets/${id}/cancel`, { method: 'PATCH' });
  return res.data;
}

export async function fetchLabels(): Promise<LabelData[]> {
  const res = await fetchApi<LabelData[]>('/labels');
  return res.data;
}
