import type { ReactNode } from 'react';

export function Loading({ label = 'Cargando tus datos' }: { label?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="sr">{label}…</span>
      <div className="skeleton" style={{ width: '40%', height: 12 }} />
      <div className="skeleton" style={{ width: '70%', height: 36, marginTop: 14 }} />
      <div className="skeleton" style={{ width: '90%', marginTop: 28 }} />
      <div className="skeleton" style={{ width: '85%', marginTop: 12 }} />
      <div className="skeleton" style={{ width: '60%', marginTop: 12 }} />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="state" role="alert">
      <h2>No pudimos cargar tus datos</h2>
      <p>{message}</p>
      <button type="button" className="btn" onClick={onRetry}>Intentar de nuevo</button>
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="state">
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}

export function GoalStatus({ completed }: { completed: boolean }) {
  return completed ? <span className="chip ok">Cumplida</span> : <span className="chip run">En curso</span>;
}

export function Progress({ percentage, completed, large }: { percentage: number; completed?: boolean; large?: boolean }) {
  return (
    <div
      className={`bar${completed ? ' done' : ''}${large ? ' lg' : ''}`}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progreso de la meta"
    >
      <i style={{ width: `${percentage}%` }} />
    </div>
  );
}
