import { BusinessRuleError, NotFoundError } from '../src/shared/errors';
import { withProgress } from '../src/modules/goals/goal.progress';
import { GoalService } from '../src/modules/goals/goal.service';
import type { Goal } from '../src/modules/goals/goal.types';
import { InMemoryGoalRepository } from './fakes';

const OWNER = 'user-1';
const STRANGER = 'user-2';

describe('withProgress', () => {
  const goal = (balance: number, targetAmount: number): Goal => ({
    id: 'g1',
    userId: OWNER,
    name: 'Viaje',
    balance,
    targetAmount,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('calcula porcentaje y faltante', () => {
    expect(withProgress(goal(500_000, 2_000_000)).progress).toEqual({
      percentage: 25,
      remaining: 1_500_000,
      completed: false,
    });
  });

  it('redondea a dos decimales', () => {
    expect(withProgress(goal(1, 3)).progress.percentage).toBe(33.33);
  });

  it('no supera el 100 % si se ahorra de más', () => {
    expect(withProgress(goal(2_500_000, 2_000_000)).progress).toEqual({
      percentage: 100,
      remaining: 0,
      completed: true,
    });
  });
});

describe('GoalService', () => {
  let repo: InMemoryGoalRepository;
  let service: GoalService;

  beforeEach(() => {
    repo = new InMemoryGoalRepository();
    service = new GoalService(repo);
  });

  it('crea una meta con saldo 0 y progreso inicial', async () => {
    const goal = await service.create(OWNER, { name: 'Viaje a Cartagena', targetAmount: 2_000_000 });

    expect(goal).toMatchObject({ balance: 0, progress: { percentage: 0, remaining: 2_000_000, completed: false } });
  });

  it('no deja ver la meta de otro usuario', async () => {
    const goal = await service.create(OWNER, { name: 'Privada', targetAmount: 100 });
    await expect(service.get(STRANGER, goal.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('actualiza solo los campos enviados', async () => {
    const goal = await service.create(OWNER, { name: 'Viaje', targetAmount: 1_000 });
    const updated = await service.update(OWNER, goal.id, { targetAmount: 5_000 });

    expect(updated).toMatchObject({ name: 'Viaje', targetAmount: 5_000 });
  });

  it('elimina una meta sin saldo', async () => {
    const goal = await service.create(OWNER, { name: 'Viaje', targetAmount: 1_000 });
    await service.remove(OWNER, goal.id);

    expect(repo.goals).toHaveLength(0);
  });

  it('no elimina una meta que todavía tiene saldo', async () => {
    const goal = await service.create(OWNER, { name: 'Viaje', targetAmount: 1_000 });
    await repo.updateBalance(goal.id, 300);

    await expect(service.remove(OWNER, goal.id)).rejects.toBeInstanceOf(BusinessRuleError);
    expect(repo.goals).toHaveLength(1);
  });

  it('responde 404 al eliminar una meta inexistente', async () => {
    await expect(service.remove(OWNER, 'no-existe')).rejects.toBeInstanceOf(NotFoundError);
  });
});
