import { ConflictError, NotFoundError } from '../../shared/errors';
import { withProgress } from '../goals/goal.progress';
import type { GoalRepository, GoalWithProgress } from '../goals/goal.types';
import { applyMovement, isSameOperation } from './movement.rules';
import type { CreateMovementInput } from './movement.schemas';
import type { Movement, MovementRepository, TransactionRunner } from './movement.types';

const HISTORY_LIMIT = 100;

export interface MovementResult {
  movement: Movement;
  goal: GoalWithProgress;
  replayed: boolean;
}

export class MovementService {
  constructor(
    private readonly goals: GoalRepository,
    private readonly movements: MovementRepository,
    private readonly runInTransaction: TransactionRunner,
  ) {}

  register(
    userId: string,
    goalId: string,
    input: CreateMovementInput,
    idempotencyKey: string,
  ): Promise<MovementResult> {
    return this.runInTransaction(async ({ goals, movements }) => {
      // FOR UPDATE: dos retiros a la vez no pueden dejar el saldo negativo
      const goal = await goals.findByIdForUpdate(goalId, userId);
      if (!goal) throw new NotFoundError('Meta');

      const previous = await movements.findByIdempotencyKey(userId, idempotencyKey);
      if (previous) {
        if (!isSameOperation(previous, goalId, input)) {
          throw new ConflictError('Esta Idempotency-Key ya se usó para una operación diferente');
        }
        return { movement: previous, goal: withProgress(goal), replayed: true };
      }

      const newBalance = applyMovement(goal.balance, input);
      const movement = await movements.create({ goalId, userId, idempotencyKey, ...input });
      await goals.updateBalance(goalId, newBalance);

      return { movement, goal: withProgress({ ...goal, balance: newBalance }), replayed: false };
    });
  }

  async history(userId: string, goalId: string): Promise<Movement[]> {
    if (!(await this.goals.findById(goalId, userId))) throw new NotFoundError('Meta');
    return this.movements.listByGoal(goalId, HISTORY_LIMIT);
  }
}
