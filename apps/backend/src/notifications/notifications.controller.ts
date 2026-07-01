import { Controller, Get, Patch, Param, UseGuards, ParseIntPipe, Inject } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('customer', 'agent')
export class NotificationsController {
  constructor(
    @Inject(NotificationsService) private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const notifications = await this.notificationsService.findAll(user.id);
    return { data: notifications };
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { data: { count } };
  }

  @Patch(':id/read')
  async markRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    await this.notificationsService.markRead(id, user.id);
    return { data: { success: true } };
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser() user: AuthenticatedUser) {
    await this.notificationsService.markAllRead(user.id);
    return { data: { success: true } };
  }

  @Patch('read-by-ticket/:ticketId')
  async markReadByTicket(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.notificationsService.markReadByTicket(ticketId, user.id);
    return { data: { success: true } };
  }
}
