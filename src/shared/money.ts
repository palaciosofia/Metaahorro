import { z } from 'zod';

export const MAX_AMOUNT = 1_000_000_000_000;

export const amountSchema = z
  .number({ required_error: 'El monto es obligatorio', invalid_type_error: 'El monto debe ser un número' })
  .int('El monto debe ser un número entero (sin decimales)')
  .positive('El monto debe ser mayor que cero')
  .max(MAX_AMOUNT, 'El monto supera el máximo permitido');
