import type { z } from 'zod';

import type { NotificationSchema } from '../validations/notification-validation';

export type Notification = z.infer<typeof NotificationSchema>;
