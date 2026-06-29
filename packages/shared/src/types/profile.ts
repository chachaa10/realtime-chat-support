import type { z } from 'zod';

import type { ProfileSchema } from '../validations/profile';

export type Profile = z.infer<typeof ProfileSchema>;
