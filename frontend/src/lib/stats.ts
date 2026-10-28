import type { Movement } from '../api/types';
import { addMonths, monthEnd, monthKeyOf, type MonthKey } from './format';

export interface LedgerMovement extends Movement {
  goalName: string;
}

export interface MonthTotals {
  deposits: number;
  withdrawals: number;
  net: number;
  depositCount: number;
  withdrawalCount: number;
}

export interface MonthPoint extends MonthTotals {
  key: MonthKey;
  closing: number;
}

const signed = (m: Movement) => (m.type === 'DEPOSIT' ? m.amount : -m.amount);

export function movementsInMonth<T extends Movement>(movements: T[], key: MonthKey): T[] {
  return movements.filter((m) => monthKeyOf(m.createdAt) === key);
}

export function totalsFor(movements: Movement[]): MonthTotals {
  const totals = { deposits: 0, withdrawals: 0, net: 0, depositCount: 0, withdrawalCount: 0 };
  for (const m of movements) {
    if (m.type === 'DEPOSIT') {
      totals.deposits += m.amount;
      totals.depositCount += 1;
    } else {
      totals.withdrawals += m.amount;
      totals.withdrawalCount += 1;
    }
  }
  totals.net = totals.deposits - totals.withdrawals;
  return totals;
}

export function balanceAtEndOf(currentTotal: number, movements: Movement[], key: MonthKey): number {
  const end = monthEnd(key).getTime();
  const after = movements.filter((m) => new Date(m.createdAt).getTime() >= end);
  return currentTotal - after.reduce((sum, m) => sum + signed(m), 0);
}

export function monthlySeries(currentTotal: number, movements: Movement[], lastKey: MonthKey, count: number): MonthPoint[] {
  const keys = Array.from({ length: count }, (_, i) => addMonths(lastKey, i - count + 1));
  return keys.map((key) => ({
    key,
    closing: balanceAtEndOf(currentTotal, movements, key),
    ...totalsFor(movementsInMonth(movements, key)),
  }));
}
