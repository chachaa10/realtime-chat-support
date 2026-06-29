import type { z } from 'zod';

import type { ProfileSchema } from '../validations/profile-validation';

export type Profile = z.infer<typeof ProfileSchema>;
