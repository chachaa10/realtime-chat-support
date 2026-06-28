import { Catch, type ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

import { AppError } from './errors';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof AppError) {
      const errorPayload = {
        code: exception.code,
        message: exception.message,
        ...(exception.errors ? { errors: exception.errors } : {}),
      };
      const client = host.switchToWs().getClient();
      client.emit('error', errorPayload);
      return;
    }

    this.logger.error(
      'Unhandled WS exception',
      exception instanceof Error ? exception.stack : undefined,
    );
    super.catch(exception, host);
  }
}
