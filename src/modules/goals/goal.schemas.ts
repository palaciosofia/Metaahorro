import { z } from 'zod';
import { amountSchema } from '../../shared/money';

const nameSchema = z.string().trim().min(1, 'El nombre es obligatorio').max(100);

export const createGoalSchema = z.object({
  name: nameSchema,
  targetAmount: amountSchema,
});

export const updateGoalSchema = z
  .object({
    name: nameSchema.optional(),
    targetAmount: amountSchema.optional(),
  })
  .strict()
  .refine((data) => data.name !== undefined || data.targetAmount !== undefined, {
    message: 'Envía al menos un campo para actualizar: name o targetAmount',
  });

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
