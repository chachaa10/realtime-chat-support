import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Inject,
} from '@nestjs/common';
import { CreateTicketSchema } from '@repo/shared';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { TicketsService } from './tickets.service';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(@Inject(TicketsService) private readonly ticketsService: TicketsService) {}

  @Post()
  @Roles('customer')
  async create(
    @Body(new ZodValidationPipe(CreateTicketSchema))
    body: { subject: string; description: string; labelIds?: number[] },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const ticket = await this.ticketsService.create(user, body);
    return { data: ticket };
  }

  @Get()
  @Roles('customer', 'agent')
  async findAll(
    @Query('tab') tab?: string,
    @Query('status') status?: string,
    @Query('label') label?: string | string[],
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const tickets = await this.ticketsService.findAll(user!, { tab: tab as any, status, label });
    return { data: tickets };
  }

  @Get('my')
  @Roles('customer')
  async findMy(@CurrentUser() user: AuthenticatedUser) {
    const tickets = await this.ticketsService.findAll(user, { tab: 'my' });
    return { data: tickets };
  }

  @Get('queue')
  @Roles('agent')
  async findQueue(@CurrentUser() user: AuthenticatedUser) {
    const tickets = await this.ticketsService.findAll(user, { tab: 'queue' });
    return { data: tickets };
  }

  @Get(':id')
  @Roles('customer', 'agent')
  async findById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    const ticket = await this.ticketsService.findById(id, user);
    return { data: ticket };
  }

  @Patch(':id/accept')
  @Roles('agent')
  async accept(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    const ticket = await this.ticketsService.accept(id, user);
    return { data: ticket };
  }

  @Patch(':id/resolve')
  @Roles('agent')
  async resolve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    const ticket = await this.ticketsService.resolve(id, user);
    return { data: ticket };
  }

  @Patch(':id/cancel')
  @Roles('customer')
  async cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    const ticket = await this.ticketsService.cancel(id, user);
    return { data: ticket };
  }

  @Post(':id/labels')
  @Roles('agent')
  async addLabel(
    @Param('id', ParseIntPipe) id: number,
    @Body('labelId', ParseIntPipe) labelId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.ticketsService.addLabel(id, labelId, user);
    return { data: { success: true } };
  }

  @Delete(':id/labels/:labelId')
  async removeLabel(
    @Param('id', ParseIntPipe) id: number,
    @Param('labelId', ParseIntPipe) labelId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.ticketsService.removeLabel(id, labelId, user);
    return { data: { success: true } };
  }
}
