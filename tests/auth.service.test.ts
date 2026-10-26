import { ConflictError, UnauthorizedError } from '../src/shared/errors';
import { AuthService } from '../src/modules/users/auth.service';
import { fakeHasher, fakeTokens, InMemoryUserRepository } from './fakes';

describe('AuthService', () => {
  let users: InMemoryUserRepository;
  let auth: AuthService;
  const credentials = { email: 'sofia@uninorte.edu.co', name: 'Sofía', password: 'clave-segura-123' };

  beforeEach(() => {
    users = new InMemoryUserRepository();
    auth = new AuthService(users, fakeHasher, fakeTokens);
  });

  describe('register', () => {
    it('crea el usuario guardando solo el hash y sin devolverlo', async () => {
      const user = await auth.register(credentials);

      expect(user).toMatchObject({ email: credentials.email, name: credentials.name });
      expect(user).not.toHaveProperty('passwordHash');
      expect(users.users[0].passwordHash).toBe('hashed:clave-segura-123');
    });

    it('rechaza un correo ya registrado', async () => {
      await auth.register(credentials);
      await expect(auth.register(credentials)).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe('login', () => {
    beforeEach(() => auth.register(credentials));

    it('devuelve un token con credenciales correctas', async () => {
      const session = await auth.login({ email: credentials.email, password: credentials.password });

      expect(session.token).toBe(`token-for-${session.user.id}`);
      expect(session.user).not.toHaveProperty('passwordHash');
    });

    it('rechaza una contraseña incorrecta', async () => {
      await expect(auth.login({ email: credentials.email, password: 'otra-clave' })).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
    });

    it('da el mismo error para un correo inexistente (no revela qué correos existen)', async () => {
      const messageOf = (attempt: Promise<unknown>) => attempt.then(
        () => 'no lanzó error',
        (error: Error) => error.message,
      );

      const wrongPassword = await messageOf(auth.login({ email: credentials.email, password: 'otra-clave' }));
      const unknownEmail = await messageOf(auth.login({ email: 'nadie@x.com', password: 'otra-clave' }));

      expect(unknownEmail).toBe(wrongPassword);
    });
  });
});
