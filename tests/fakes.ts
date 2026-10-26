import { randomUUID } from 'node:crypto';
import type { Goal, GoalRepository } from '../src/modules/goals/goal.types';
import type {
  Movement,
  MovementRepository,
  NewMovement,
  TransactionRunner,
} from '../src/modules/movements/movement.types';
import type { PasswordHasher, TokenService, User, UserRepository } from '../src/modules/users/user.types';

export class InMemoryUserRepository implements UserRepository {
  readonly users: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async create(data: { email: string; name: string; passwordHash: string }): Promise<User> {
    const user = { id: randomUUID(), createdAt: new Date(), ...data };
    this.users.push(user);
    return user;
  }
}

export class InMemoryGoalRepository implements GoalRepository {
  readonly goals: Goal[] = [];

  async listByUser(userId: string): Promise<Goal[]> {
    return this.goals.filter((goal) => goal.userId === userId);
  }

  async findById(id: string, userId: string): Promise<Goal | null> {
    return this.goals.find((goal) => goal.id === id && goal.userId === userId) ?? null;
  }

  findByIdForUpdate(id: string, userId: string): Promise<Goal | null> {
    return this.findById(id, userId);
  }

  async create(data: { userId: string; name: string; targetAmount: number }): Promise<Goal> {
    const now = new Date();
    const goal: Goal = { id: randomUUID(), balance: 0, createdAt: now, updatedAt: now, ...data };
    this.goals.push(goal);
    return goal;
  }

  async update(id: string, userId: string, changes: { name?: string; targetAmount?: number }): Promise<Goal | null> {
    const goal = await this.findById(id, userId);
    if (!goal) return null;
    Object.assign(goal, changes, { updatedAt: new Date() });
    return goal;
  }

  async updateBalance(id: string, balance: number): Promise<void> {
    const goal = this.goals.find((g) => g.id === id);
    if (goal) goal.balance = balance;
  }

  async deleteIfEmpty(id: string, userId: string): Promise<boolean> {
    const index = this.goals.findIndex((g) => g.id === id && g.userId === userId && g.balance === 0);
    if (index === -1) return false;
    this.goals.splice(index, 1);
    return true;
  }
}

export class InMemoryMovementRepository implements MovementRepository {
  readonly movements: Array<Movement & { userId: string }> = [];

  async listByGoal(goalId: string, limit: number): Promise<Movement[]> {
    return this.movements.filter((m) => m.goalId === goalId).slice(0, limit);
  }

  async findByIdempotencyKey(userId: string, idempotencyKey: string): Promise<Movement | null> {
    return this.movements.find((m) => m.userId === userId && m.idempotencyKey === idempotencyKey) ?? null;
  }

  async create(data: NewMovement): Promise<Movement> {
    const movement = { id: randomUUID(), createdAt: new Date(), ...data };
    this.movements.push(movement);
    return movement;
  }
}

export function fakeTransactionRunner(goals: GoalRepository, movements: MovementRepository): TransactionRunner {
  return (work) => work({ goals, movements });
}

export const fakeHasher: PasswordHasher = {
  hash: async (plain) => `hashed:${plain}`,
  compare: async (plain, hash) => hash === `hashed:${plain}`,
};

export const fakeTokens: TokenService = {
  issue: (userId) => `token-for-${userId}`,
  verify: (token) => token.replace('token-for-', ''),
};
