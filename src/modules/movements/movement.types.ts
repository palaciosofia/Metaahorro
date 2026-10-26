import type { GoalRepository } from '../goals/goal.types';

export type MovementType = 'DEPOSIT' | 'WITHDRAWAL';

export interface Movement {
  id: string;
  goalId: string;
  type: MovementType;
  amount: number;
  idempotencyKey: string;
  createdAt: Date;
}

export interface NewMovement {
  goalId: string;
  userId: string;
  type: MovementType;
  amount: number;
  idempotencyKey: string;
}

export interface MovementRepository {
  listByGoal(goalId: string, limit: number): Promise<Movement[]>;
  findByIdempotencyKey(userId: string, idempotencyKey: string): Promise<Movement | null>;
  create(data: NewMovement): Promise<Movement>;
}

export interface TransactionalRepositories {
  goals: GoalRepository;
  movements: MovementRepository;
}

export type TransactionRunner = <T>(work: (repos: TransactionalRepositories) => Promise<T>) => Promise<T>;
