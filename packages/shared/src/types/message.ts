import type { z } from 'zod';

import type { MessageSchema, SendMessageSchema } from '../validations/message-validation';

export type Message = z.infer<typeof MessageSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
