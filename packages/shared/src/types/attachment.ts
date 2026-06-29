import type { z } from 'zod';

import type { AttachmentSchema } from '../validations/attachment-validation';

export type Attachment = z.infer<typeof AttachmentSchema>;
