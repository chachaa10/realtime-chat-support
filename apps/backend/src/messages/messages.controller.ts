import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Inject,
} from '@nestjs/common';
import { SendMessageSchema } from '@repo/shared';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { MessagesService } from './messages.service';

@Controller('tickets/:id/messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(@Inject(MessagesService) private readonly messagesService: MessagesService) {}

  @Get()
  @Roles('customer', 'agent')
  async getMessages(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const msgs = await this.messagesService.getMessages(id, user)
    return { data: msgs }
  }

  @Post()
  @Roles('customer', 'agent')
  async sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(SendMessageSchema))
    body: { ticketId: number; body: string; attachmentIds?: number[] },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const msg = await this.messagesService.sendMessage(id, user, body.body, body.attachmentIds)
    return { data: msg }
  }
}
