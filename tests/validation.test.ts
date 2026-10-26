import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ValidationError } from '../src/shared/errors';
import { httpHandler } from '../src/shared/http';
import { parseBody, parseIdempotencyKey, parseIdParam } from '../src/shared/validation';
import { createMovementSchema } from '../src/modules/movements/movement.schemas';
import { updateGoalSchema } from '../src/modules/goals/goal.schemas';

const event = (overrides: Partial<APIGatewayProxyEventV2>): APIGatewayProxyEventV2 =>
  ({ headers: {}, isBase64Encoded: false, ...overrides }) as APIGatewayProxyEventV2;

describe('Validación de entrada', () => {
  it('acepta un movimiento válido', () => {
    const body = JSON.stringify({ type: 'DEPOSIT', amount: 50_000 });
    expect(parseBody(createMovementSchema, event({ body }))).toEqual({ type: 'DEPOSIT', amount: 50_000 });
  });

  it.each([
    ['decimales', { type: 'DEPOSIT', amount: 10.5 }],
    ['monto negativo', { type: 'DEPOSIT', amount: -100 }],
    ['monto como texto', { type: 'DEPOSIT', amount: '100' }],
    ['tipo desconocido', { type: 'TRANSFER', amount: 100 }],
  ])('rechaza un movimiento con %s', (_case, payload) => {
    expect(() => parseBody(createMovementSchema, event({ body: JSON.stringify(payload) }))).toThrow(ValidationError);
  });

  it('rechaza un JSON mal formado', () => {
    expect(() => parseBody(createMovementSchema, event({ body: '{ no es json' }))).toThrow(ValidationError);
  });

  it('exige al menos un campo al actualizar una meta', () => {
    expect(() => parseBody(updateGoalSchema, event({ body: '{}' }))).toThrow(ValidationError);
  });

  it('rechaza un id que no es UUID', () => {
    expect(() => parseIdParam(event({ pathParameters: { id: '123' } }))).toThrow(ValidationError);
  });

  it('exige la cabecera Idempotency-Key', () => {
    expect(() => parseIdempotencyKey(event({}))).toThrow(ValidationError);
    expect(parseIdempotencyKey(event({ headers: { 'Idempotency-Key': 'abc-12345' } }))).toBe('abc-12345');
  });
});

describe('httpHandler', () => {
  it('convierte un error de dominio en una respuesta JSON con su código HTTP', async () => {
    const handler = httpHandler(async () => {
      throw new ValidationError([{ field: 'amount', message: 'inválido' }]);
    });
    const response = await handler(event({}));

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body as string).error.code).toBe('VALIDATION_ERROR');
  });

  it('oculta los detalles de errores inesperados', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const handler = httpHandler(async () => {
      throw new Error('detalle interno de la base de datos');
    });
    const response = await handler(event({}));

    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain('detalle interno');
  });
});
