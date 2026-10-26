import type { Queryable } from '../../db/types';
import type { Movement, MovementRepository, MovementType, NewMovement } from './movement.types';

interface MovementRow {
  id: string;
  goal_id: string;
  type: MovementType;
  amount: string;
  idempotency_key: string;
  created_at: Date;
}

const COLUMNS = 'id, goal_id, type, amount, idempotency_key, created_at';

const toMovement = (row: MovementRow): Movement => ({
  id: row.id,
  goalId: row.goal_id,
  type: row.type,
  amount: Number(row.amount),
  idempotencyKey: row.idempotency_key,
  createdAt: row.created_at,
});

export class PgMovementRepository implements MovementRepository {
  constructor(private readonly db: Queryable) {}

  async listByGoal(goalId: string, limit: number): Promise<Movement[]> {
    const { rows } = await this.db.query<MovementRow>(
      `SELECT ${COLUMNS} FROM movements WHERE goal_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [goalId, limit],
    );
    return rows.map(toMovement);
  }

  async findByIdempotencyKey(userId: string, idempotencyKey: string): Promise<Movement | null> {
    const { rows } = await this.db.query<MovementRow>(
      `SELECT ${COLUMNS} FROM movements WHERE user_id = $1 AND idempotency_key = $2`,
      [userId, idempotencyKey],
    );
    return rows[0] ? toMovement(rows[0]) : null;
  }

  async create(data: NewMovement): Promise<Movement> {
    const { rows } = await this.db.query<MovementRow>(
      `INSERT INTO movements (goal_id, user_id, type, amount, idempotency_key)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${COLUMNS}`,
      [data.goalId, data.userId, data.type, data.amount, data.idempotencyKey],
    );
    return toMovement(rows[0]);
  }
}
