import { BusinessRuleError, ConflictError, NotFoundError } from '../src/shared/errors';
import { MovementService } from '../src/modules/movements/movement.service';
import { fakeTransactionRunner, InMemoryGoalRepository, InMemoryMovementRepository } from './fakes';

const OWNER = 'user-1';

describe('MovementService', () => {
  let goals: InMemoryGoalRepository;
  let movements: InMemoryMovementRepository;
  let service: MovementService;
  let goalId: string;

  beforeEach(async () => {
    goals = new InMemoryGoalRepository();
    movements = new InMemoryMovementRepository();
    service = new MovementService(goals, movements, fakeTransactionRunner(goals, movements));
    goalId = (await goals.create({ userId: OWNER, name: 'Viaje', targetAmount: 1_000_000 })).id;
  });

  it('un depósito aumenta el saldo y actualiza el progreso', async () => {
    const result = await service.register(OWNER, goalId, { type: 'DEPOSIT', amount: 250_000 }, 'key-0001');

    expect(result.replayed).toBe(false);
    expect(result.goal.balance).toBe(250_000);
    expect(result.goal.progress.percentage).toBe(25);
  });

  it('un retiro disminuye el saldo', async () => {
    await service.register(OWNER, goalId, { type: 'DEPOSIT', amount: 300_000 }, 'key-0001');
    const result = await service.register(OWNER, goalId, { type: 'WITHDRAWAL', amount: 100_000 }, 'key-0002');

    expect(result.goal.balance).toBe(200_000);
  });

  it('rechaza retirar más de lo ahorrado sin registrar el movimiento', async () => {
    await service.register(OWNER, goalId, { type: 'DEPOSIT', amount: 50_000 }, 'key-0001');

    await expect(
      service.register(OWNER, goalId, { type: 'WITHDRAWAL', amount: 80_000 }, 'key-0002'),
    ).rejects.toBeInstanceOf(BusinessRuleError);
    expect(movements.movements).toHaveLength(1);
    expect((await goals.findById(goalId, OWNER))?.balance).toBe(50_000);
  });

  it('es idempotente: repetir la misma solicitud no duplica el depósito', async () => {
    const first = await service.register(OWNER, goalId, { type: 'DEPOSIT', amount: 100_000 }, 'key-repetida');
    const retry = await service.register(OWNER, goalId, { type: 'DEPOSIT', amount: 100_000 }, 'key-repetida');

    expect(retry.replayed).toBe(true);
    expect(retry.movement.id).toBe(first.movement.id);
    expect(retry.goal.balance).toBe(100_000);
    expect(movements.movements).toHaveLength(1);
  });

  it('rechaza reutilizar una Idempotency-Key con datos distintos', async () => {
    await service.register(OWNER, goalId, { type: 'DEPOSIT', amount: 100_000 }, 'key-repetida');

    await expect(
      service.register(OWNER, goalId, { type: 'DEPOSIT', amount: 999 }, 'key-repetida'),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('no permite mover dinero en la meta de otro usuario', async () => {
    await expect(
      service.register('otro-usuario', goalId, { type: 'DEPOSIT', amount: 1 }, 'key-0001'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('el historial exige que la meta sea del usuario', async () => {
    await service.register(OWNER, goalId, { type: 'DEPOSIT', amount: 1_000 }, 'key-0001');

    expect(await service.history(OWNER, goalId)).toHaveLength(1);
    await expect(service.history('otro-usuario', goalId)).rejects.toBeInstanceOf(NotFoundError);
  });
});
