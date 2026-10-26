import { env } from './config/env';
import { getPool } from './db/pool';
import { withTransaction } from './db/transaction';
import { GoalService } from './modules/goals/goal.service';
import { PgGoalRepository } from './modules/goals/goal.repository';
import { MovementService } from './modules/movements/movement.service';
import { PgMovementRepository } from './modules/movements/movement.repository';
import type { TransactionRunner } from './modules/movements/movement.types';
import { AuthService } from './modules/users/auth.service';
import { BcryptPasswordHasher, JwtTokenService } from './modules/users/security';
import { PgUserRepository } from './modules/users/user.repository';
import type { TokenService } from './modules/users/user.types';

export interface Services {
  auth: AuthService;
  tokens: TokenService;
  goals: GoalService;
  movements: MovementService;
}

let services: Services | undefined;

export function getServices(): Services {
  if (!services) {
    const pool = getPool();
    const tokens = new JwtTokenService(env.jwtSecret, env.jwtExpiresInSeconds);
    const runInTransaction: TransactionRunner = (work) =>
      withTransaction(pool, (client) =>
        work({ goals: new PgGoalRepository(client), movements: new PgMovementRepository(client) }),
      );

    services = {
      auth: new AuthService(new PgUserRepository(pool), new BcryptPasswordHasher(), tokens),
      tokens,
      goals: new GoalService(new PgGoalRepository(pool)),
      movements: new MovementService(new PgGoalRepository(pool), new PgMovementRepository(pool), runInTransaction),
    };
  }
  return services;
}
