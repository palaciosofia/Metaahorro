import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { api } from '../api/endpoints';
import type { Goal, MovementType } from '../api/types';
import { GoalDialog } from '../components/GoalDialog';
import { IconPlus } from '../components/Icons';
import { Modal } from '../components/Modal';
import { MovementDialog } from '../components/MovementDialog';
import { Empty, ErrorState, GoalStatus, Loading, Progress } from '../components/States';
import { useData } from '../lib/DataContext';
import { formatDate, formatDayMonth, formatMoney, formatNumber, formatPercent } from '../lib/format';

type Dialog = { kind: 'create' } | { kind: 'edit' } | { kind: 'delete' } | { kind: 'movement'; type: MovementType } | null;

function DeleteDialog({ goal, onClose, onDeleted }: { goal: Goal; onClose: () => void; onDeleted: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await api.deleteGoal(goal.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar la meta');
      setBusy(false);
    }
  }

  return (
    <Modal title="Eliminar meta" kicker={goal.name} onClose={onClose}>
      <p style={{ margin: 0 }}>
        Se eliminará <strong>{goal.name}</strong> con todo su historial de movimientos. Solo se pueden eliminar metas sin saldo.
      </p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn o" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn danger" onClick={confirm} disabled={busy}>{busy ? 'Eliminando…' : 'Eliminar'}</button>
      </div>
    </Modal>
  );
}

export function GoalsPage() {
  const { goals, movements, totalBalance, loading, error, reload } = useData();
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [dialog, setDialog] = useState<Dialog>(params.get('nueva') ? { kind: 'create' } : null);
  const [notice, setNotice] = useState<string | null>(null);

  if (loading) return <main className="wrap page"><Loading /></main>;
  if (error) return <main className="wrap page"><ErrorState message={error} onRetry={reload} /></main>;

  const selected = goals.find((g) => g.id === id) ?? goals[0];
  const inProgress = goals.filter((g) => !g.progress.completed);
  const completed = goals.length - inProgress.length;
  const savedInProgress = inProgress.reduce((s, g) => s + g.balance, 0);
  const targetInProgress = inProgress.reduce((s, g) => s + g.targetAmount, 0);
  const remaining = inProgress.reduce((s, g) => s + g.progress.remaining, 0);
  const recent = selected ? movements.filter((m) => m.goalId === selected.id).slice(0, 6) : [];

  const closeDialog = () => {
    setDialog(null);
    if (params.get('nueva')) setParams({});
  };

  const createButton = (
    <button type="button" className="btn" onClick={() => setDialog({ kind: 'create' })}><IconPlus /> Nueva meta</button>
  );

  return (
    <main className="wrap page">
      <div className="page-head">
        <div>
          <p className="k">{goals.length} {goals.length === 1 ? 'meta' : 'metas'} · {inProgress.length} en curso · {completed} {completed === 1 ? 'cumplida' : 'cumplidas'}</p>
          <h1 className="t">Metas</h1>
        </div>
        {goals.length > 0 && createButton}
      </div>

      {notice && <p className="callout" role="status" style={{ marginTop: 20 }}>{notice}</p>}

      {goals.length === 0 || !selected ? (
        <Empty title="Crea tu primera meta" action={createButton}>
          Ponle un nombre y el monto que quieres reunir. Después registras depósitos y retiros y ves cuánto te falta.
        </Empty>
      ) : (
        <>
          <div className="notes" style={{ marginTop: 24, borderBottom: '1px solid var(--rule)' }}>
            <div>
              <p className="k">Ahorrado en metas en curso</p>
              <p className="big" style={{ fontSize: 24, marginTop: 4 }}>{formatMoney(savedInProgress)}</p>
              <p className="mu2 num" style={{ margin: '4px 0 0', fontSize: 12 }}>
                {targetInProgress > 0 ? `${formatPercent((savedInProgress / targetInProgress) * 100)} de ${formatMoney(targetInProgress)}` : 'No hay metas en curso'}
              </p>
            </div>
            <div>
              <p className="k">Falta por ahorrar</p>
              <p className="big" style={{ fontSize: 24, marginTop: 4 }}>{formatMoney(remaining)}</p>
              <p className="mu2" style={{ margin: '4px 0 0', fontSize: 12 }}>entre {inProgress.length} {inProgress.length === 1 ? 'meta' : 'metas'}</p>
            </div>
            <div>
              <p className="k">Metas cumplidas</p>
              <p className="big" style={{ fontSize: 24, marginTop: 4 }}>{completed} de {goals.length}</p>
            </div>
            <div>
              <p className="k">Ahorro total</p>
              <p className="big" style={{ fontSize: 24, marginTop: 4 }}>{formatMoney(totalBalance)}</p>
            </div>
          </div>

          <div className="g12" style={{ marginTop: 32 }}>
            <section className="span-7" aria-labelledby="h-lm">
              <h2 id="h-lm" className="s" style={{ marginBottom: 12 }}>Todas las metas</h2>
              <ul className="mlist only-sm">
                {goals.map((g) => (
                  <li key={g.id} style={g.id === selected.id ? { background: 'var(--paper-2)', boxShadow: 'inset 4px 0 0 var(--accent)', paddingLeft: 14, paddingRight: 8 } : undefined}>
                    <div className="main">
                      <div className="row" style={{ alignItems: 'center' }}>
                        <Link to={`/metas/${g.id}`} className="lk" style={{ textDecoration: 'none', fontWeight: 600 }}>{g.name}</Link>
                        <GoalStatus completed={g.progress.completed} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                        <div style={{ flex: 1 }}><Progress percentage={g.progress.percentage} completed={g.progress.completed} /></div>
                        <span className="num nowrap" style={{ fontSize: 13, fontWeight: 600 }}>{formatPercent(g.progress.percentage)}</span>
                      </div>
                      <div className="num mu2" style={{ fontSize: 12, marginTop: 4 }}>{formatMoney(g.balance)} de {formatMoney(g.targetAmount)}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="tw only-lg">
                <table className="l">
                  <thead><tr><th className="first">Meta</th><th>Progreso · ahorrado de objetivo</th><th>Estado</th></tr></thead>
                  <tbody>
                    {goals.map((g) => {
                      const isSel = g.id === selected.id;
                      return (
                        <tr key={g.id} className={isSel ? 'sel' : undefined} onClick={() => navigate(`/metas/${g.id}`)} style={{ cursor: 'pointer' }}>
                          <td className="first nowrap">
                            <Link to={`/metas/${g.id}`} className="lk" style={{ textDecoration: 'none', fontWeight: 600 }} aria-current={isSel || undefined}>{g.name}</Link>
                            <div className="mu" style={{ fontSize: 12, marginTop: 2 }}>Creada el {formatDate(g.createdAt)}</div>
                          </td>
                          <td style={{ width: '46%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ flex: 1 }}><Progress percentage={g.progress.percentage} completed={g.progress.completed} /></div>
                              <span className="num nowrap" style={{ width: 52, textAlign: 'right', fontWeight: 600 }}>{formatPercent(g.progress.percentage)}</span>
                            </div>
                            <div className="num mu2" style={{ fontSize: 12, marginTop: 4 }}>
                              <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{formatNumber(g.balance)}</span> de {formatNumber(g.targetAmount)}
                            </div>
                          </td>
                          <td><GoalStatus completed={g.progress.completed} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="span-5 divided" aria-labelledby="h-det">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <p className="k">Meta seleccionada</p>
                <GoalStatus completed={selected.progress.completed} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 6 }}>
                <h2 id="h-det" className="serif" style={{ margin: 0, fontSize: 30, fontWeight: 600, letterSpacing: '-0.01em' }}>{selected.name}</h2>
                <div style={{ display: 'flex', gap: 2, marginRight: -10 }}>
                  <button type="button" className="bt lk" onClick={() => setDialog({ kind: 'edit' })}>Editar</button>
                  <button type="button" className="bt lk" style={{ color: 'var(--danger)' }} onClick={() => setDialog({ kind: 'delete' })}>Eliminar</button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginTop: 20 }}>
                <span className="big" style={{ fontSize: 64, lineHeight: 0.9, color: 'var(--accent)' }}>{formatPercent(selected.progress.percentage)}</span>
                <span className="num" style={{ textAlign: 'right' }}>
                  <span className="serif" style={{ display: 'block', fontSize: 22, fontWeight: 600 }}>{formatMoney(selected.balance)}</span>
                  <span className="mu2">de {formatMoney(selected.targetAmount)}</span>
                </span>
              </div>
              <div style={{ marginTop: 14 }}><Progress percentage={selected.progress.percentage} completed={selected.progress.completed} large /></div>
              <table className="l" style={{ marginTop: 20 }}>
                <tbody>
                  <tr><td className="mu2">Falta por ahorrar</td><td className="r num" style={{ fontWeight: 600 }}>{formatMoney(selected.progress.remaining)}</td></tr>
                  <tr><td className="mu2">Creada el</td><td className="r">{formatDate(selected.createdAt)}</td></tr>
                  <tr><td className="mu2">Última actualización</td><td className="r">{formatDate(selected.updatedAt)}</td></tr>
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setDialog({ kind: 'movement', type: 'DEPOSIT' })}><IconPlus /> Depositar</button>
                <button type="button" className="btn o" style={{ flex: 1 }} disabled={selected.balance === 0} onClick={() => setDialog({ kind: 'movement', type: 'WITHDRAWAL' })}>Retirar</button>
              </div>

              <div style={{ marginTop: 28 }}>
                <div className="sh">
                  <h3 className="s" style={{ fontSize: 17 }}>Últimos movimientos</h3>
                  <Link to={`/movimientos?meta=${selected.id}`} className="lk" style={{ fontSize: 13 }}>Ver en Movimientos</Link>
                </div>
                {recent.length === 0 ? (
                  <p className="mu2" style={{ margin: '12px 0 0' }}>Todavía no hay depósitos ni retiros en esta meta.</p>
                ) : (
                  <table className="l">
                    <tbody>
                      {recent.map((m) => (
                        <tr key={m.id}>
                          <td className="num mu2 nowrap" style={{ width: 80 }}>{formatDayMonth(m.createdAt)}</td>
                          <td>{m.type === 'DEPOSIT' ? 'Depósito' : 'Retiro'}</td>
                          <td className={`r num${m.type === 'DEPOSIT' ? ' pos' : ''}`} style={{ fontWeight: 600 }}>
                            {m.type === 'DEPOSIT' ? '+' : '−'} {formatNumber(m.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        </>
      )}

      {dialog?.kind === 'create' && (
        <GoalDialog
          onClose={closeDialog}
          onSaved={async (goal) => {
            closeDialog();
            await reload();
            setNotice(null);
            navigate(`/metas/${goal.id}`);
          }}
        />
      )}
      {dialog?.kind === 'edit' && selected && (
        <GoalDialog
          goal={selected}
          onClose={closeDialog}
          onSaved={async () => {
            closeDialog();
            await reload();
          }}
        />
      )}
      {dialog?.kind === 'delete' && selected && (
        <DeleteDialog
          goal={selected}
          onClose={closeDialog}
          onDeleted={async () => {
            closeDialog();
            setNotice(`Se eliminó la meta ${selected.name}.`);
            await reload();
            navigate('/metas');
          }}
        />
      )}
      {dialog?.kind === 'movement' && selected && (
        <MovementDialog
          goal={selected}
          type={dialog.type}
          onClose={closeDialog}
          onDone={async (result) => {
            closeDialog();
            setNotice(
              result.replayed
                ? 'Ese movimiento ya estaba registrado; no se duplicó.'
                : `${result.movement.type === 'DEPOSIT' ? 'Depósito' : 'Retiro'} de ${formatMoney(result.movement.amount)} registrado en ${selected.name}.`,
            );
            await reload();
          }}
        />
      )}
    </main>
  );
}
