import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAll = vi.hoisted(() => vi.fn());
const mockOrderBy = vi.hoisted(() => vi.fn(() => ({ all: mockAll })));
const mockLimit = vi.hoisted(() => vi.fn(() => ({ all: mockAll })));
const mockWhere = vi.hoisted(() => vi.fn(() => ({ orderBy: mockOrderBy, limit: mockLimit })));
const mockFrom = vi.hoisted(() => vi.fn(() => ({ where: mockWhere })));
const mockSelect = vi.hoisted(() => vi.fn(() => ({ from: mockFrom })));

const mockGetSession = vi.hoisted(() => vi.fn());

vi.mock('../../auth/auth', () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock('@repo/database', () => {
  return { db: { select: mockSelect }, profiles: { id: 'profiles' }, tickets: { id: 'tickets' }, messages: { ticketId: 'messages.ticketId', createdAt: 'messages.createdAt' }, schema: {} };
});

import { TicketsGateway } from '../tickets.gateway';

function makeClient(mockOverrides: Record<string, any> = {}) {
  const client = {
    handshake: {
      auth: {},
      query: {},
    },
    disconnect: vi.fn(),
    join: vi.fn(),
    ...mockOverrides,
  };
  return client as any;
}

describe('TicketsGateway', () => {
  let gateway: TicketsGateway;

  beforeEach(() => {
    gateway = new TicketsGateway();
    vi.clearAllMocks();
  });

  describe('afterInit', () => {
    it('logs initialization', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      gateway.afterInit();
      expect(spy).toHaveBeenCalledWith('WebSocket gateway initialized');
    });
  });

  describe('handleConnection', () => {
    it('disconnects when no token is provided', async () => {
      const client = makeClient();
      await gateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalledTimes(1);
    });

    it('disconnects when auth is null token is undefined', async () => {
      const client = makeClient({
        handshake: { auth: undefined, query: {} },
      });
      await gateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalledTimes(1);
    });

    it('uses token from query when auth token is missing', async () => {
      mockGetSession.mockResolvedValue(null);
      const client = makeClient({
        handshake: { auth: {}, query: { token: 'query-token' } },
      });
      await gateway.handleConnection(client);
      expect(mockGetSession).toHaveBeenCalledWith({
        headers: new Headers({ authorization: 'Bearer query-token' }),
      });
      expect(client.disconnect).toHaveBeenCalledTimes(1);
    });

    it('uses token from query when auth is undefined', async () => {
      mockGetSession.mockResolvedValue(null);
      const client = makeClient({
        handshake: { auth: undefined, query: { token: 'q-token' } },
      });
      await gateway.handleConnection(client);
      expect(mockGetSession).toHaveBeenCalledWith({
        headers: new Headers({ authorization: 'Bearer q-token' }),
      });
    });

    it('disconnects when session is invalid', async () => {
      mockGetSession.mockResolvedValue(null);
      const client = makeClient({
        handshake: { auth: { token: 'bad-token' }, query: {} },
      });
      await gateway.handleConnection(client);
      expect(mockGetSession).toHaveBeenCalledWith({
        headers: new Headers({ authorization: 'Bearer bad-token' }),
      });
      expect(client.disconnect).toHaveBeenCalledTimes(1);
    });

    it('sets userId and role for customer', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'cust-1' },
        session: { id: 's1' },
      } as any);
      mockAll.mockReturnValue([{ id: 'cust-1', role: 'customer' }]);
      const client = makeClient({
        handshake: { auth: { token: 'valid-token' }, query: {} },
      });
      await gateway.handleConnection(client);
      expect((client as any).userId).toBe('cust-1');
      expect((client as any).role).toBe('customer');
      expect(client.join).toHaveBeenCalledWith('user:cust-1');
    });

    it('joins agents room for agent role', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'agent-1' },
        session: { id: 's1' },
      } as any);
      mockAll.mockReturnValue([{ id: 'agent-1', role: 'agent' }]);
      const client = makeClient({
        handshake: { auth: { token: 'agent-token' }, query: {} },
      });
      await gateway.handleConnection(client);
      expect((client as any).userId).toBe('agent-1');
      expect((client as any).role).toBe('agent');
      expect(client.join).toHaveBeenCalledWith('agents');
    });

    it('defaults to customer when profile not found', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'unknown' },
        session: { id: 's1' },
      } as any);
      mockAll.mockReturnValue([]);
      const client = makeClient({
        handshake: { auth: { token: 't' }, query: {} },
      });
      await gateway.handleConnection(client);
      expect((client as any).role).toBe('customer');
    });

    it('disconnects on error', async () => {
      mockGetSession.mockRejectedValue(new Error('boom'));
      const client = makeClient({
        handshake: { auth: { token: 't' }, query: {} },
      });
      await gateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('ticketCreated', () => {
    it('emits ticket:new to agents room', () => {
      const server = { to: vi.fn(() => ({ emit: vi.fn() })) };
      gateway.server = server as any;
      gateway.ticketCreated({ id: 1 });
      expect(server.to).toHaveBeenCalledWith('agents');
    });
  });

  describe('ticketAccepted', () => {
    it('emits ticket:accepted to agents room', () => {
      const server = { to: vi.fn(() => ({ emit: vi.fn() })) };
      gateway.server = server as any;
      gateway.ticketAccepted(1);
      expect(server.to).toHaveBeenCalledWith('agents');
    });
  });

  describe('ticketResolved', () => {
    it('emits ticket:resolved to agents room', () => {
      const server = { to: vi.fn(() => ({ emit: vi.fn() })) };
      gateway.server = server as any;
      gateway.ticketResolved(1);
      expect(server.to).toHaveBeenCalledWith('agents');
    });
  });

  describe('ticketCancelled', () => {
    it('emits ticket:cancelled to agents room', () => {
      const server = { to: vi.fn(() => ({ emit: vi.fn() })) };
      gateway.server = server as any;
      gateway.ticketCancelled(1);
      expect(server.to).toHaveBeenCalledWith('agents');
    });
  });

  describe('handleDisconnect', () => {
    it('does not throw', () => {
      const client = makeClient();
      gateway.handleDisconnect(client);
    });
  });

  describe('reconnect:sync', () => {
    it('emits missed messages since timestamp', () => {
      mockAll.mockReturnValueOnce([
        { id: 1, customerId: 'cust-1', agentId: null, status: 'open' },
      ]);
      mockAll.mockReturnValueOnce([
        { id: 2, ticketId: 1, authorId: 'agent-1', body: 'Missed message', createdAt: 2000 },
      ]);

      const client = makeClient();
      (client as any).userId = 'cust-1';
      (client as any).role = 'customer';
      client.emit = vi.fn();

      const gw = new TicketsGateway();
      gw.server = { to: vi.fn(() => ({ emit: vi.fn() })) } as any;

      gw.handleReconnectSync(client, { ticketId: 1, lastMessageTimestamp: 1000 });

      expect(client.emit).toHaveBeenCalledWith('reconnect:sync', {
        messages: [{ id: 2, ticketId: 1, authorId: 'agent-1', body: 'Missed message', createdAt: 2000 }],
      });
    });

    it('does nothing for non-participant user', () => {
      mockAll.mockReturnValueOnce([
        { id: 1, customerId: 'other-cust', agentId: null, status: 'open' },
      ]);

      const client = makeClient();
      (client as any).userId = 'cust-1';
      (client as any).role = 'customer';
      client.emit = vi.fn();

      const gw = new TicketsGateway();
      gw.handleReconnectSync(client, { ticketId: 1, lastMessageTimestamp: 1000 });

      expect(client.emit).not.toHaveBeenCalled();
    });
  })

  describe('broadcast methods with null server', () => {
    it('ticketCreated handles null server gracefully', () => {
      gateway.server = undefined as any;
      gateway.ticketCreated({ id: 1 });
    });

    it('ticketAccepted handles null server gracefully', () => {
      gateway.server = undefined as any;
      gateway.ticketAccepted(1);
    });

    it('ticketResolved handles null server gracefully', () => {
      gateway.server = undefined as any;
      gateway.ticketResolved(1);
    });

    it('ticketCancelled handles null server gracefully', () => {
      gateway.server = undefined as any;
      gateway.ticketCancelled(1);
    });
  });
});
