import { BusinessRuleError, NotFoundError } from '../../shared/errors';
import { withProgress } from './goal.progress';
import type { CreateGoalInput, UpdateGoalInput } from './goal.schemas';
import type { Goal, GoalRepository, GoalWithProgress } from './goal.types';

export class GoalService {
  constructor(private readonly goals: GoalRepository) {}

  async list(userId: string): Promise<GoalWithProgress[]> {
    const goals = await this.goals.listByUser(userId);
    return goals.map(withProgress);
  }

  async get(userId: string, goalId: string): Promise<GoalWithProgress> {
    return withProgress(await this.requireGoal(userId, goalId));
  }

  async create(userId: string, input: CreateGoalInput): Promise<GoalWithProgress> {
    return withProgress(await this.goals.create({ userId, ...input }));
  }

  async update(userId: string, goalId: string, changes: UpdateGoalInput): Promise<GoalWithProgress> {
    const goal = await this.goals.update(goalId, userId, changes);
    if (!goal) throw new NotFoundError('Meta');
    return withProgress(goal);
  }

  async remove(userId: string, goalId: string): Promise<void> {
    if (await this.goals.deleteIfEmpty(goalId, userId)) return;

    await this.requireGoal(userId, goalId);
    throw new BusinessRuleError('La meta todavía tiene saldo. Retíralo antes de eliminarla');
  }

  private async requireGoal(userId: string, goalId: string): Promise<Goal> {
    const goal = await this.goals.findById(goalId, userId);
    if (!goal) throw new NotFoundError('Meta');
    return goal;
  }
}
