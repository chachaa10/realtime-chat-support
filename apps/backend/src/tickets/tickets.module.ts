import { Module } from '@nestjs/common';

import { MESSAGE_BROADCASTER } from '../messages/message-broadcaster';
import { LabelsController } from './labels.controller';
import { TICKET_BROADCASTER } from './ticket-broadcaster';
import { TicketsController } from './tickets.controller';
import { TicketsGateway } from './tickets.gateway';
import { TicketsService } from './tickets.service';

@Module({
  controllers: [TicketsController, LabelsController],
  providers: [
    TicketsService,
    TicketsGateway,
    { provide: TICKET_BROADCASTER, useExisting: TicketsGateway },
    { provide: MESSAGE_BROADCASTER, useExisting: TicketsGateway },
  ],
  exports: [TicketsService, TicketsGateway, MESSAGE_BROADCASTER, TICKET_BROADCASTER],
})
export class TicketsModule {}
