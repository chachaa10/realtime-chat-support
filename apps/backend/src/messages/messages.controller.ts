import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Inject,
} from '@nestjs/common';
import { SendMessageSchema } from '@repo/shared';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiPaginated } from '../common/api-response';
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
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const result = await this.messagesService.getMessages(id, user!, {
      cursor: cursor ? parseInt(cursor, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return ApiPaginated(result.messages, result.cursor, result.hasMore);
  }

  @Post()
  @Roles('customer', 'agent')
  async sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(SendMessageSchema))
    body: { ticketId: number; body: string; attachmentIds?: number[] },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const msg = await this.messagesService.sendMessage(id, user, body.body, body.attachmentIds);
    return { data: msg };
  }
}
