import type { z } from 'zod';

import type { LabelSchema as LabelValidation } from '../validations/label-validation';

export type Label = z.infer<typeof LabelValidation>;
