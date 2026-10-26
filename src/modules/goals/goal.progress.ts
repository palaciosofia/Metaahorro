import type { Goal, GoalWithProgress } from './goal.types';

export function withProgress(goal: Goal): GoalWithProgress {
  const ratio = goal.balance / goal.targetAmount;
  return {
    ...goal,
    progress: {
      percentage: Math.min(Math.round(ratio * 10_000) / 100, 100),
      remaining: Math.max(goal.targetAmount - goal.balance, 0),
      completed: goal.balance >= goal.targetAmount,
    },
  };
}
