import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError } from '../api/client';
import { api, MOVEMENTS_PAGE_LIMIT } from '../api/endpoints';
import type { Goal } from '../api/types';
import { monthKeyOf, type MonthKey } from './format';
import type { LedgerMovement } from './stats';

interface DataValue {
  goals: Goal[];
  movements: LedgerMovement[];
  totalBalance: number;
  loading: boolean;
  error: string | null;
  truncated: boolean;
  reload: () => Promise<void>;
  month: MonthKey;
  currentMonth: MonthKey;
  firstMonth: MonthKey;
  setMonth: (key: MonthKey) => void;
}

const DataContext = createContext<DataValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const currentMonth = monthKeyOf(new Date());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [movements, setMovements] = useState<LedgerMovement[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState<MonthKey>(currentMonth);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const nextGoals = await api.listGoals();
      const perGoal = await Promise.all(nextGoals.map((g) => api.listMovements(g.id)));
      const ledger = perGoal
        .flatMap((list, i) => list.map((m) => ({ ...m, goalName: nextGoals[i].name })))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setGoals(nextGoals);
      setMovements(ledger);
      setTruncated(perGoal.some((list) => list.length >= MOVEMENTS_PAGE_LIMIT));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setError(err instanceof Error ? err.message : 'No se pudieron cargar tus datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<DataValue>(() => {
    const dates = [...goals.map((g) => g.createdAt), ...movements.map((m) => m.createdAt)].sort();
    const firstMonth = dates.length ? monthKeyOf(dates[0]) : currentMonth;
    return {
      goals,
      movements,
      totalBalance: goals.reduce((sum, g) => sum + g.balance, 0),
      loading,
      error,
      truncated,
      reload,
      month,
      currentMonth,
      firstMonth,
      setMonth: (key) => setMonth(key > currentMonth ? currentMonth : key),
    };
  }, [goals, movements, loading, error, truncated, reload, month, currentMonth]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataValue {
  const value = useContext(DataContext);
  if (!value) throw new Error('useData debe usarse dentro de DataProvider');
  return value;
}
