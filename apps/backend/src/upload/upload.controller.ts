import {
  Controller,
  Post,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Inject,
  Res,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { db, attachments, tickets } from '@repo/database'
import { eq } from 'drizzle-orm'
import type { Response } from 'express'
import { createReadStream, existsSync } from 'node:fs'
import { join } from 'node:path'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../common/roles.decorator'
import { NotFoundError, ForbiddenError, ValidationError } from '../common/errors'
import { FILE_STORAGE, type FileStorage } from './file-storage'
import { detectMimeType, isAllowedMimeType, MAX_UPLOAD_SIZE } from './mime-validator'

interface MulterFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  buffer: Buffer
  size: number
}

interface AttachmentRow {
  id: number
  messageId: number | null
  ticketId: number
  uploaderId: string
  fileName: string
  fileSize: number
  mimeType: string
  filePath: string
  createdAt: number
}

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  constructor(@Inject(FILE_STORAGE) private readonly fileStorage: FileStorage) {}

  @Post()
  @Roles('customer', 'agent')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_SIZE } }),
  )
  async upload(
    @UploadedFile() file: MulterFile | undefined,
    @Body('ticketId') ticketIdStr: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new ValidationError('File is required')
    }

    const ticketId = Number(ticketIdStr)
    if (!ticketId || Number.isNaN(ticketId)) {
      throw new ValidationError('ticketId is required and must be a number')
    }

    const mimeType = detectMimeType(file.buffer)
    if (!mimeType || !isAllowedMimeType(mimeType)) {
      throw new ValidationError('File type is not allowed')
    }

    const now = Date.now()

    const filePath = this.fileStorage.save(file.originalname, file.buffer)

    const rows = db
      .insert(attachments)
      .values({
        messageId: null,
        ticketId,
        uploaderId: user.id,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType,
        filePath,
        createdAt: now,
      })
      .returning()
      .all() as AttachmentRow[]

    const attachment = rows[0]

    return {
      data: {
        id: attachment.id,
        messageId: attachment.messageId,
        ticketId: attachment.ticketId,
        uploaderId: attachment.uploaderId,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        filePath: attachment.filePath,
        createdAt: attachment.createdAt,
      },
    }
  }

  @Get(':id')
  @Roles('customer', 'agent')
  async serve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const rows = db
      .select()
      .from(attachments)
      .where(eq(attachments.id, id))
      .limit(1)
      .all() as AttachmentRow[]

    if (rows.length === 0) throw new NotFoundError('Attachment not found')

    const attachment = rows[0]

    // Verify user is participant of the ticket
    const ticketRows = db
      .select()
      .from(tickets)
      .where(eq(tickets.id, attachment.ticketId))
      .limit(1)
      .all() as { id: number; customerId: string; agentId: string | null }[]

    const ticket = ticketRows[0]
    if (!ticket) throw new NotFoundError('Ticket not found')

    const isCustomer = ticket.customerId === user.id
    const isAgent = ticket.agentId === user.id
    if (!isCustomer && !isAgent && user.role !== 'agent') {
      throw new ForbiddenError('You do not have access to this attachment')
    }

    const fullPath = join(process.cwd(), 'uploads', attachment.filePath)
    if (!existsSync(fullPath)) throw new NotFoundError('File not found on disk')

    res.setHeader('Content-Type', attachment.mimeType)
    res.setHeader('Content-Length', attachment.fileSize.toString())
    res.setHeader('Content-Disposition', `inline; filename="${attachment.fileName}"`)

    const stream = createReadStream(fullPath)
    stream.pipe(res)
  }
}
