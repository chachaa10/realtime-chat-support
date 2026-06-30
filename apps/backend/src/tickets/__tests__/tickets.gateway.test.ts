import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAll = vi.hoisted(() => vi.fn());
const mockLimit = vi.hoisted(() => vi.fn(() => ({ all: mockAll })));
const mockWhere = vi.hoisted(() => vi.fn(() => ({ limit: mockLimit })));
const mockFrom = vi.hoisted(() => vi.fn(() => ({ where: mockWhere })));
const mockSelect = vi.hoisted(() => vi.fn(() => ({ from: mockFrom })));

vi.mock('../../auth/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@repo/database', () => {
  return { db: { select: mockSelect }, profiles: { id: 'profiles' } };
});

import { auth } from '../../auth/auth';
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
      vi.mocked(auth.api.getSession).mockResolvedValue(null);
      const client = makeClient({
        handshake: { auth: {}, query: { token: 'query-token' } },
      });
      await gateway.handleConnection(client);
      expect(auth.api.getSession).toHaveBeenCalledWith({
        headers: { authorization: 'Bearer query-token' },
      });
      expect(client.disconnect).toHaveBeenCalledTimes(1);
    });

    it('uses token from query when auth is undefined', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);
      const client = makeClient({
        handshake: { auth: undefined, query: { token: 'q-token' } },
      });
      await gateway.handleConnection(client);
      expect(auth.api.getSession).toHaveBeenCalledWith({
        headers: { authorization: 'Bearer q-token' },
      });
    });

    it('disconnects when session is invalid', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);
      const client = makeClient({
        handshake: { auth: { token: 'bad-token' }, query: {} },
      });
      await gateway.handleConnection(client);
      expect(auth.api.getSession).toHaveBeenCalledWith({
        headers: { authorization: 'Bearer bad-token' },
      });
      expect(client.disconnect).toHaveBeenCalledTimes(1);
    });

    it('sets userId and role for customer', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
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
      expect(client.join).not.toHaveBeenCalled();
    });

    it('joins agents room for agent role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
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
      vi.mocked(auth.api.getSession).mockResolvedValue({
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
      vi.mocked(auth.api.getSession).mockRejectedValue(new Error('boom'));
      const client = makeClient({
        handshake: { auth: { token: 't' }, query: {} },
      });
      await gateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('emitTicketNew', () => {
    it('emits ticket:new to agents room', () => {
      const server = { to: vi.fn(() => ({ emit: vi.fn() })) };
      gateway.server = server as any;
      gateway.emitTicketNew({ id: 1 });
      expect(server.to).toHaveBeenCalledWith('agents');
    });
  });

  describe('emitTicketAccepted', () => {
    it('emits ticket:accepted to agents room', () => {
      const server = { to: vi.fn(() => ({ emit: vi.fn() })) };
      gateway.server = server as any;
      gateway.emitTicketAccepted(1);
      expect(server.to).toHaveBeenCalledWith('agents');
    });
  });

  describe('emitTicketResolved', () => {
    it('emits ticket:resolved to agents room', () => {
      const server = { to: vi.fn(() => ({ emit: vi.fn() })) };
      gateway.server = server as any;
      gateway.emitTicketResolved(1);
      expect(server.to).toHaveBeenCalledWith('agents');
    });
  });

  describe('emitTicketCancelled', () => {
    it('emits ticket:cancelled to agents room', () => {
      const server = { to: vi.fn(() => ({ emit: vi.fn() })) };
      gateway.server = server as any;
      gateway.emitTicketCancelled(1);
      expect(server.to).toHaveBeenCalledWith('agents');
    });
  });

  describe('handleDisconnect', () => {
    it('does not throw', () => {
      const client = makeClient();
      gateway.handleDisconnect(client);
    });
  });

  describe('emit methods with null server', () => {
    it('emitTicketNew handles null server gracefully', () => {
      gateway.server = undefined as any;
      gateway.emitTicketNew({ id: 1 });
    });

    it('emitTicketAccepted handles null server gracefully', () => {
      gateway.server = undefined as any;
      gateway.emitTicketAccepted(1);
    });

    it('emitTicketResolved handles null server gracefully', () => {
      gateway.server = undefined as any;
      gateway.emitTicketResolved(1);
    });

    it('emitTicketCancelled handles null server gracefully', () => {
      gateway.server = undefined as any;
      gateway.emitTicketCancelled(1);
    });
  });
});
