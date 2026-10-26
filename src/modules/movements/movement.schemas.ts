import { z } from 'zod';
import { amountSchema } from '../../shared/money';

export const createMovementSchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL'], {
    errorMap: () => ({ message: 'El tipo debe ser DEPOSIT o WITHDRAWAL' }),
  }),
  amount: amountSchema,
});

export type CreateMovementInput = z.infer<typeof createMovementSchema>;
