import { z } from 'zod';
import { ValidationError } from './errors';
import { getHeader, getRawBody, type HttpEvent } from './http';

export function parseBody<T extends z.ZodTypeAny>(schema: T, event: HttpEvent): z.infer<T> {
  const raw = getRawBody(event);
  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new ValidationError([{ field: 'body', message: 'El cuerpo debe ser un JSON válido' }]);
  }
  return validate(schema, data);
}

const uuidSchema = z.string().uuid('Debe ser un UUID válido');

export function parseIdParam(event: HttpEvent): string {
  return validate(z.object({ id: uuidSchema }), event.pathParameters ?? {}).id;
}

const idempotencyKeySchema = z
  .string({ required_error: 'La cabecera Idempotency-Key es obligatoria' })
  .trim()
  .min(8, 'La Idempotency-Key debe tener al menos 8 caracteres')
  .max(100, 'La Idempotency-Key no puede superar 100 caracteres');

export function parseIdempotencyKey(event: HttpEvent): string {
  return validate(z.object({ key: idempotencyKeySchema }), { key: getHeader(event, 'idempotency-key') }).key;
}

function validate<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map((issue) => ({ field: issue.path.join('.') || 'body', message: issue.message })),
    );
  }
  return result.data;
}
