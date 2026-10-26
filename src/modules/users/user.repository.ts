import type { Queryable } from '../../db/types';
import type { User, UserRepository } from './user.types';

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: Date;
}

const COLUMNS = 'id, email, name, password_hash, created_at';

const toUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  passwordHash: row.password_hash,
  createdAt: row.created_at,
});

export class PgUserRepository implements UserRepository {
  constructor(private readonly db: Queryable) {}

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.db.query<UserRow>(`SELECT ${COLUMNS} FROM users WHERE email = $1`, [email]);
    return rows[0] ? toUser(rows[0]) : null;
  }

  async create(data: { email: string; name: string; passwordHash: string }): Promise<User> {
    const { rows } = await this.db.query<UserRow>(
      `INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
      [data.email, data.name, data.passwordHash],
    );
    return toUser(rows[0]);
  }
}
