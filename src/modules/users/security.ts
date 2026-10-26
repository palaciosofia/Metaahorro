import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../shared/errors';
import type { PasswordHasher, TokenService } from './user.types';

const BCRYPT_COST = 10;

export class BcryptPasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_COST);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresInSeconds: number,
  ) {}

  issue(userId: string): string {
    return jwt.sign({}, this.secret, { subject: userId, expiresIn: this.expiresInSeconds, algorithm: 'HS256' });
  }

  verify(token: string): string {
    try {
      // solo HS256
      const payload = jwt.verify(token, this.secret, { algorithms: ['HS256'] });
      if (typeof payload === 'string' || !payload.sub) throw new Error('Token sin subject');
      return payload.sub;
    } catch {
      throw new UnauthorizedError('Token inválido o expirado');
    }
  }
}
