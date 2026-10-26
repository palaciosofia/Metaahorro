import { getServices } from '../../container';
import { authHandler } from '../../shared/auth';
import { json } from '../../shared/http';
import { parseBody, parseIdParam } from '../../shared/validation';
import { createGoalSchema, updateGoalSchema } from './goal.schemas';

export const listGoals = authHandler(async ({ userId }) => {
  const goals = await getServices().goals.list(userId);
  return json(200, { goals });
});

export const createGoal = authHandler(async ({ event, userId }) => {
  const goal = await getServices().goals.create(userId, parseBody(createGoalSchema, event));
  return json(201, { goal });
});

export const getGoal = authHandler(async ({ event, userId }) => {
  const goal = await getServices().goals.get(userId, parseIdParam(event));
  return json(200, { goal });
});

export const updateGoal = authHandler(async ({ event, userId }) => {
  const goal = await getServices().goals.update(userId, parseIdParam(event), parseBody(updateGoalSchema, event));
  return json(200, { goal });
});

export const deleteGoal = authHandler(async ({ event, userId }) => {
  await getServices().goals.remove(userId, parseIdParam(event));
  return json(204);
});
