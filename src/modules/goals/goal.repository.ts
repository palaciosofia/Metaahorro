import type { Queryable } from '../../db/types';
import type { Goal, GoalRepository } from './goal.types';

interface GoalRow {
  id: string;
  user_id: string;
  name: string;
  target_amount: string;
  balance: string;
  created_at: Date;
  updated_at: Date;
}

const COLUMNS = 'id, user_id, name, target_amount, balance, created_at, updated_at';

const toGoal = (row: GoalRow): Goal => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  targetAmount: Number(row.target_amount),
  balance: Number(row.balance),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class PgGoalRepository implements GoalRepository {
  constructor(private readonly db: Queryable) {}

  async listByUser(userId: string): Promise<Goal[]> {
    const { rows } = await this.db.query<GoalRow>(
      `SELECT ${COLUMNS} FROM goals WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return rows.map(toGoal);
  }

  findById(id: string, userId: string): Promise<Goal | null> {
    return this.findOne(`SELECT ${COLUMNS} FROM goals WHERE id = $1 AND user_id = $2`, [id, userId]);
  }

  findByIdForUpdate(id: string, userId: string): Promise<Goal | null> {
    return this.findOne(`SELECT ${COLUMNS} FROM goals WHERE id = $1 AND user_id = $2 FOR UPDATE`, [id, userId]);
  }

  async create(data: { userId: string; name: string; targetAmount: number }): Promise<Goal> {
    const { rows } = await this.db.query<GoalRow>(
      `INSERT INTO goals (user_id, name, target_amount) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
      [data.userId, data.name, data.targetAmount],
    );
    return toGoal(rows[0]);
  }

  update(id: string, userId: string, changes: { name?: string; targetAmount?: number }): Promise<Goal | null> {
    return this.findOne(
      `UPDATE goals
          SET name = COALESCE($3, name),
              target_amount = COALESCE($4, target_amount),
              updated_at = now()
        WHERE id = $1 AND user_id = $2
        RETURNING ${COLUMNS}`,
      [id, userId, changes.name ?? null, changes.targetAmount ?? null],
    );
  }

  async updateBalance(id: string, balance: number): Promise<void> {
    await this.db.query('UPDATE goals SET balance = $2, updated_at = now() WHERE id = $1', [id, balance]);
  }

  async deleteIfEmpty(id: string, userId: string): Promise<boolean> {
    const { rowCount } = await this.db.query('DELETE FROM goals WHERE id = $1 AND user_id = $2 AND balance = 0', [
      id,
      userId,
    ]);
    return (rowCount ?? 0) > 0;
  }

  private async findOne(sql: string, values: unknown[]): Promise<Goal | null> {
    const { rows } = await this.db.query<GoalRow>(sql, values);
    return rows[0] ? toGoal(rows[0]) : null;
  }
}
