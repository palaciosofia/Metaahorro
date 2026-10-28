export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface GoalProgress {
  percentage: number;
  remaining: number;
  completed: boolean;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
  progress: GoalProgress;
}

export type MovementType = 'DEPOSIT' | 'WITHDRAWAL';

export interface Movement {
  id: string;
  goalId: string;
  type: MovementType;
  amount: number;
  idempotencyKey: string;
  createdAt: string;
}

export interface MovementResult {
  movement: Movement;
  goal: Goal;
  replayed: boolean;
}
