export interface TicketBroadcaster {
  ticketCreated(ticket: any): void;
  ticketAccepted(ticketId: number): void;
  ticketResolved(ticketId: number): void;
  ticketCancelled(ticketId: number): void;
}

export const TICKET_BROADCASTER = 'TICKET_BROADCASTER';
