import { getServices } from '../../container';
import { authHandler } from '../../shared/auth';
import { json } from '../../shared/http';
import { parseBody, parseIdempotencyKey, parseIdParam } from '../../shared/validation';
import { createMovementSchema } from './movement.schemas';

export const createMovement = authHandler(async ({ event, userId }) => {
  const result = await getServices().movements.register(
    userId,
    parseIdParam(event),
    parseBody(createMovementSchema, event),
    parseIdempotencyKey(event),
  );
  return json(result.replayed ? 200 : 201, result);
});

export const listMovements = authHandler(async ({ event, userId }) => {
  const movements = await getServices().movements.history(userId, parseIdParam(event));
  return json(200, { movements });
});
