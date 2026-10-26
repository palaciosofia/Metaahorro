export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalProgress {
  percentage: number;
  remaining: number;
  completed: boolean;
}

export type GoalWithProgress = Goal & { progress: GoalProgress };

export interface GoalRepository {
  listByUser(userId: string): Promise<Goal[]>;
  findById(id: string, userId: string): Promise<Goal | null>;
  findByIdForUpdate(id: string, userId: string): Promise<Goal | null>;
  create(data: { userId: string; name: string; targetAmount: number }): Promise<Goal>;
  update(id: string, userId: string, changes: { name?: string; targetAmount?: number }): Promise<Goal | null>;
  updateBalance(id: string, balance: number): Promise<void>;
  deleteIfEmpty(id: string, userId: string): Promise<boolean>;
}
