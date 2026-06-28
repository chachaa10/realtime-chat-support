import { PipeTransform, Injectable, type ArgumentMetadata } from '@nestjs/common';

import { ValidationError } from './errors';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private schema: any) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      }
      throw new ValidationError('Validation failed', errors);
    }
    return result.data;
  }
}
