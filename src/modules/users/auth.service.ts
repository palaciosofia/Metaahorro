import { ConflictError, UnauthorizedError } from '../../shared/errors';
import type { LoginInput, RegisterInput } from './auth.schemas';
import { toPublicUser, type PasswordHasher, type PublicUser, type TokenService, type UserRepository } from './user.types';

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async register(input: RegisterInput): Promise<PublicUser> {
    if (await this.users.findByEmail(input.email)) {
      throw new ConflictError('Ya existe una cuenta con ese correo');
    }
    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.users.create({ email: input.email, name: input.name, passwordHash });
    return toPublicUser(user);
  }

  async login(input: LoginInput): Promise<{ token: string; user: PublicUser }> {
    const user = await this.users.findByEmail(input.email);
    const passwordMatches = user !== null && (await this.hasher.compare(input.password, user.passwordHash));

    // mismo mensaje para no revelar qué correos existen
    if (!user || !passwordMatches) {
      throw new UnauthorizedError('Correo o contraseña incorrectos');
    }
    return { token: this.tokens.issue(user.id), user: toPublicUser(user) };
  }
}
