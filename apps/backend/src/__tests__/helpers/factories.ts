export function buildUser(
  overrides: Partial<{
    id: string;
    name: string;
    role: 'customer' | 'agent';
    createdAt: number;
  }> = {},
) {
  return {
    id: overrides.id ?? `user_${Math.random().toString(36).slice(2)}`,
    name: overrides.name ?? 'Test User',
    role: overrides.role ?? 'customer',
    createdAt: overrides.createdAt ?? Date.now(),
  };
}

export function buildCustomer(overrides = {}) {
  return buildUser({ ...overrides, role: 'customer' });
}

export function buildAgent(overrides = {}) {
  return buildUser({ ...overrides, role: 'agent' });
}

export function buildTicket(
  overrides: Partial<{
    id: number;
    subject: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved';
    customerId: string;
    agentId: string | null;
    createdAt: number;
    updatedAt: number;
    resolvedAt: number | null;
  }> = {},
) {
  return {
    id: overrides.id ?? 1,
    subject: overrides.subject ?? 'Test ticket',
    description: overrides.description ?? 'Test description',
    status: overrides.status ?? 'open',
    customerId: overrides.customerId ?? 'customer_1',
    agentId: overrides.agentId ?? null,
    createdAt: overrides.createdAt ?? Date.now(),
    updatedAt: overrides.updatedAt ?? Date.now(),
    resolvedAt: overrides.resolvedAt ?? null,
  };
}

export function buildMessage(
  overrides: Partial<{
    id: number;
    ticketId: number;
    authorId: string;
    body: string;
    createdAt: number;
  }> = {},
) {
  return {
    id: overrides.id ?? 1,
    ticketId: overrides.ticketId ?? 1,
    authorId: overrides.authorId ?? 'user_1',
    body: overrides.body ?? 'Test message',
    createdAt: overrides.createdAt ?? Date.now(),
  };
}
