import { Controller, Get, UseGuards, Inject } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles.decorator';
import { TicketsService } from './tickets.service';

@Controller('labels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabelsController {
  constructor(@Inject(TicketsService) private readonly ticketsService: TicketsService) {}

  @Get()
  @Roles('customer', 'agent')
  async findAll() {
    const labels = await this.ticketsService.listLabels();
    return { data: labels };
  }
}
