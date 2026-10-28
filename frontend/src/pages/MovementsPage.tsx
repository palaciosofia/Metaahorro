import { Link, useSearchParams } from 'react-router-dom';
import { DepositWithdrawalBars } from '../components/Charts';
import { Empty, ErrorState, Loading } from '../components/States';
import { useData } from '../lib/DataContext';
import { formatDayMonth, formatNumber, formatSigned, formatTime, monthLabelLower, monthName, monthShort } from '../lib/format';
import { monthlySeries, movementsInMonth, totalsFor } from '../lib/stats';

export function MovementsPage() {
  const { goals, movements, loading, error, reload, month, firstMonth, totalBalance } = useData();
  const [params, setParams] = useSearchParams();
  const goalId = params.get('meta') ?? '';

  if (loading) return <main className="wrap page"><Loading /></main>;
  if (error) return <main className="wrap page"><ErrorState message={error} onRetry={reload} /></main>;

  const selectedGoal = goals.find((g) => g.id === goalId);
  const scoped = selectedGoal ? movements.filter((m) => m.goalId === selectedGoal.id) : movements;
  const rows = movementsInMonth(scoped, month);
  const totals = totalsFor(rows);
  const series = monthlySeries(totalBalance, scoped, month, 6).filter((p) => p.key >= firstMonth);

  return (
    <main className="wrap page">
      <div className="page-head">
        <div>
          <p className="k">Libro de movimientos · {monthLabelLower(month)}</p>
          <h1 className="t">Movimientos</h1>
        </div>
        {goals.length > 0 && (
          <div className="field" style={{ minWidth: 240 }}>
            <label className="lab" htmlFor="goal-filter">Meta</label>
            <select
              id="goal-filter"
              className="in"
              value={selectedGoal?.id ?? ''}
              onChange={(e) => setParams(e.target.value ? { meta: e.target.value } : {})}
            >
              <option value="">Todas las metas</option>
              {goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {goals.length === 0 ? (
        <Empty title="Aún no hay movimientos" action={<Link className="btn" to="/metas?nueva=1">Crear una meta</Link>}>
          Los depósitos y retiros se registran dentro de cada meta.
        </Empty>
      ) : rows.length === 0 ? (
        <Empty title={`Sin movimientos en ${monthLabelLower(month)}`} action={<Link className="btn o" to={selectedGoal ? `/metas/${selectedGoal.id}` : '/metas'}>Ir a metas</Link>}>
          {selectedGoal ? `${selectedGoal.name} no tuvo depósitos ni retiros este mes.` : 'No registraste depósitos ni retiros este mes.'} Usa las flechas de arriba para ver otros meses.
        </Empty>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '24px 0 14px' }}>
            <p className="mu2" style={{ margin: 0 }}>
              <strong style={{ color: 'var(--ink)' }}>{rows.length} {rows.length === 1 ? 'movimiento' : 'movimientos'}</strong> · {monthLabelLower(month)} · {selectedGoal ? selectedGoal.name : 'todas las metas'}
            </p>
            <div className="legend num" style={{ fontSize: 13 }}>
              <span><svg width="10" height="10" aria-hidden="true"><rect width="10" height="10" fill="#D6F27F" stroke="#1C1B19" /></svg>Depósitos <strong>{formatNumber(totals.deposits)}</strong></span>
              <span><svg width="10" height="10" aria-hidden="true"><rect width="10" height="10" fill="#CBBEF8" stroke="#1C1B19" /></svg>Retiros <strong>{formatNumber(totals.withdrawals)}</strong></span>
            </div>
          </div>
          <ul className="mlist only-sm" aria-label={`Movimientos de ${monthLabelLower(month)}`}>
            {rows.map((m) => (
              <li key={m.id}>
                <span className="mark" aria-hidden="true" style={{ background: m.type === 'DEPOSIT' ? 'var(--lime)' : 'var(--lav)' }} />
                <div className="main">
                  <div className="row">
                    <Link to={`/metas/${m.goalId}`} className="lk" style={{ textDecoration: 'none', fontWeight: 600 }}>{m.goalName}</Link>
                    <span className={`num nowrap${m.type === 'DEPOSIT' ? ' pos' : ''}`} style={{ fontWeight: 600 }}>
                      {m.type === 'DEPOSIT' ? '+' : '−'} {formatNumber(m.amount)}
                    </span>
                  </div>
                  <div className="row mu2" style={{ fontSize: 12, marginTop: 2 }}>
                    <span className="num">{formatDayMonth(m.createdAt)} · {formatTime(m.createdAt)}</span>
                    <span>{m.type === 'DEPOSIT' ? 'Depósito' : 'Retiro'}</span>
                  </div>
                </div>
              </li>
            ))}
            <li style={{ fontWeight: 600, borderBottom: '3px double var(--ink)' }}>
              <div className="main row"><span>Neto del mes</span><span className="num">{formatSigned(totals.net)}</span></div>
            </li>
          </ul>
          <section className="tw only-lg" aria-label={`Movimientos de ${monthLabelLower(month)}`}>
            <table className="l">
              <thead>
                <tr><th>Fecha</th><th>Tipo</th><th>Meta</th><th className="r">Depósito</th><th className="r">Retiro</th></tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td className="num nowrap">{formatDayMonth(m.createdAt)} <span className="mu" style={{ fontSize: 12 }}>{formatTime(m.createdAt)}</span></td>
                    <td>{m.type === 'DEPOSIT' ? <span className="chip ok">Depósito</span> : <span className="chip run">Retiro</span>}</td>
                    <td style={{ fontWeight: 500 }}><Link to={`/metas/${m.goalId}`} className="lk" style={{ textDecoration: 'none' }}>{m.goalName}</Link></td>
                    <td className="r num pos" style={{ fontWeight: 600 }}>{m.type === 'DEPOSIT' ? `+ ${formatNumber(m.amount)}` : <span className="mu" style={{ fontWeight: 400 }}>—</span>}</td>
                    <td className="r num" style={{ fontWeight: 600 }}>{m.type === 'WITHDRAWAL' ? `− ${formatNumber(m.amount)}` : <span className="mu" style={{ fontWeight: 400 }}>—</span>}</td>
                  </tr>
                ))}
                <tr className="tot"><td colSpan={3}>Totales del mes</td><td className="r num">{formatNumber(totals.deposits)}</td><td className="r num">{formatNumber(totals.withdrawals)}</td></tr>
                <tr className="sub"><td colSpan={3}>Neto del mes</td><td colSpan={2} className="r"><span className="serif num" style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>{formatSigned(totals.net)}</span></td></tr>
              </tbody>
            </table>
          </section>
        </>
      )}

      {series.length > 0 && scoped.length > 0 && (
        <div className="g12" style={{ marginTop: 48 }}>
          <section className="span-8" aria-labelledby="h-dyr">
            <div className="sh">
              <div>
                <p className="k">{monthShort(series[0].key)} – {monthLabelLower(month)} · en miles de pesos</p>
                <h2 className="s" id="h-dyr" style={{ marginTop: 4 }}>Depósitos y retiros por mes</h2>
              </div>
            </div>
            <div className="legend" style={{ padding: '14px 0 6px', color: 'var(--ink-2)' }}>
              <span><svg width="12" height="12" aria-hidden="true"><rect x=".5" y=".5" width="11" height="11" fill="#D6F27F" stroke="#1C1B19" /></svg>Depósitos</span>
              <span><svg width="12" height="12" aria-hidden="true"><rect x=".5" y=".5" width="11" height="11" fill="#CBBEF8" stroke="#1C1B19" /></svg>Retiros</span>
            </div>
            <DepositWithdrawalBars
              title="Depósitos y retiros por mes. El detalle está en la tabla Por mes."
              groups={series.map((p) => ({ label: monthShort(p.key), deposits: p.deposits, withdrawals: p.withdrawals }))}
            />
          </section>
          <section className="span-4" aria-labelledby="h-pm">
            <div className="sh"><h2 className="s" id="h-pm">Por mes</h2></div>
            <table className="l">
              <thead><tr><th style={{ paddingTop: 14 }}>Mes</th><th className="r" style={{ paddingTop: 14 }}>Dep.</th><th className="r" style={{ paddingTop: 14 }}>Ret.</th><th className="r" style={{ paddingTop: 14 }}>Neto</th></tr></thead>
              <tbody>
                {series.map((p) => (
                  <tr key={p.key} style={p.key === month ? { fontWeight: 600 } : undefined}>
                    <td>{monthName(p.key)}</td>
                    <td className="r num">{formatNumber(p.deposits)}</td>
                    <td className="r num">{formatNumber(p.withdrawals)}</td>
                    <td className="r num">{formatSigned(p.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </main>
  );
}
