import { BusinessRuleError } from '../../shared/errors';
import type { CreateMovementInput } from './movement.schemas';
import type { Movement } from './movement.types';

export function applyMovement(balance: number, { type, amount }: CreateMovementInput): number {
  if (type === 'DEPOSIT') return balance + amount;
  if (amount > balance) {
    throw new BusinessRuleError(`Saldo insuficiente: la meta tiene ${balance} y se intentó retirar ${amount}`);
  }
  return balance - amount;
}

export function isSameOperation(movement: Movement, goalId: string, input: CreateMovementInput): boolean {
  return movement.goalId === goalId && movement.type === input.type && movement.amount === input.amount;
}
