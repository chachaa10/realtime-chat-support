import { Module } from '@nestjs/common';

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
  ],
  exports: [TicketsService, TicketsGateway],
})
export class TicketsModule {}
