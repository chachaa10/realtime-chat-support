import { AppError } from './app-error';

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors?: Record<string, string[]>) {
    super('VALIDATION_ERROR', message, 400, errors);
  }
}
