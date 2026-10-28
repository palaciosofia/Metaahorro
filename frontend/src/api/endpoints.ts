import { request } from './client';
import type { Goal, Movement, MovementResult, MovementType, User } from './types';

export const api = {
  register: (input: { name: string; email: string; password: string }) =>
    request<{ user: User }>('/auth/register', { method: 'POST', body: input }),

  login: (input: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: input }),

  listGoals: () => request<{ goals: Goal[] }>('/goals').then((r) => r.goals),

  createGoal: (input: { name: string; targetAmount: number }) =>
    request<{ goal: Goal }>('/goals', { method: 'POST', body: input }).then((r) => r.goal),

  updateGoal: (id: string, changes: { name?: string; targetAmount?: number }) =>
    request<{ goal: Goal }>(`/goals/${id}`, { method: 'PATCH', body: changes }).then((r) => r.goal),

  deleteGoal: (id: string) => request<void>(`/goals/${id}`, { method: 'DELETE' }),

  listMovements: (goalId: string) =>
    request<{ movements: Movement[] }>(`/goals/${goalId}/movements`).then((r) => r.movements),

  createMovement: (goalId: string, input: { type: MovementType; amount: number }, idempotencyKey: string) =>
    request<MovementResult>(`/goals/${goalId}/movements`, {
      method: 'POST',
      body: input,
      headers: { 'Idempotency-Key': idempotencyKey },
    }),
};

export const MOVEMENTS_PAGE_LIMIT = 100;
