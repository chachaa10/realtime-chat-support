import { Controller, Get, UseGuards } from '@nestjs/common';
import { Public } from '@thallesp/nestjs-better-auth';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles.decorator';
import { TicketsService } from './tickets.service';

@Controller('labels')
@Public()
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabelsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @Roles('customer', 'agent')
  async findAll() {
    const labels = await this.ticketsService.listLabels();
    return { data: labels };
  }
}
