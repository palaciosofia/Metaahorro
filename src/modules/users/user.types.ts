export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
}

export type PublicUser = Omit<User, 'passwordHash'>;

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(data: { email: string; name: string; passwordHash: string }): Promise<User>;
}

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

export interface TokenService {
  issue(userId: string): string;
  verify(token: string): string;
}

export function toPublicUser({ passwordHash: _passwordHash, ...user }: User): PublicUser {
  return user;
}
