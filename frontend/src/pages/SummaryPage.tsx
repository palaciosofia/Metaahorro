import { Link } from 'react-router-dom';
import { BalanceLine } from '../components/Charts';
import { Empty, ErrorState, GoalStatus, Loading, Progress } from '../components/States';
import { useData } from '../lib/DataContext';
import {
  addMonths, formatMoney, formatNumber, formatPercent, formatSigned, formatSignedMoney,
  lastDayOfMonth, monthLabelLower, monthNameLower, monthShort,
} from '../lib/format';
import { balanceAtEndOf, monthlySeries, movementsInMonth, totalsFor } from '../lib/stats';

export function SummaryPage() {
  const { goals, movements, totalBalance, loading, error, reload, month, currentMonth, firstMonth, truncated } = useData();

  if (loading) return <main className="wrap page"><Loading /></main>;
  if (error) return <main className="wrap page"><ErrorState message={error} onRetry={reload} /></main>;
  if (goals.length === 0) {
    return (
      <main className="wrap page">
        <Empty title="Todavía no tienes metas" action={<Link className="btn" to="/metas?nueva=1">Crear mi primera meta</Link>}>
          Crea una meta con el monto que quieres ahorrar y empieza a registrar tus depósitos.
        </Empty>
      </main>
    );
  }

  const isCurrent = month === currentMonth;
  const totals = totalsFor(movementsInMonth(movements, month));
  const closing = balanceAtEndOf(totalBalance, movements, month);
  const opening = closing - totals.net;
  const previous = addMonths(month, -1);
  const series = monthlySeries(totalBalance, movements, month, 6).filter((p) => p.key >= firstMonth);
  const first = series[0];
  const growth = closing - first.closing;
  const growthPct = first.closing > 0 ? (growth / first.closing) * 100 : null;
  const closingLabel = isCurrent ? 'hoy' : `al ${lastDayOfMonth(month)} de ${monthNameLower(month)}`;
  const sortedGoals = [...goals].sort((a, b) => Number(a.progress.completed) - Number(b.progress.completed) || b.progress.percentage - a.progress.percentage);

  return (
    <main className="wrap page">
      <div className="g12">
        <section className="span-5" aria-labelledby="h-res">
          <p className="k">Informe mensual · {monthLabelLower(month)}</p>
          <h1 className="t" id="h-res">Resumen de tu ahorro</h1>
          <p className="k" style={{ marginTop: 28 }}>Ahorro total {closingLabel}</p>
          <p className="big" style={{ fontSize: 'clamp(44px, 6vw, 68px)', marginTop: 6 }}>{formatMoney(closing)}</p>
          <p className="num" style={{ margin: '12px 0 0', fontSize: 15, color: 'var(--ink-2)' }}>
            <strong className={totals.net >= 0 ? 'pos' : undefined}>{formatSignedMoney(totals.net)}</strong>{' '}
            frente al cierre de {monthNameLower(previous)} ({formatMoney(opening)}).
          </p>
        </section>

        <section className="span-7" style={{ alignSelf: 'end' }} aria-label="Movimientos del mes">
          <div className="blks">
            <div className="blk lime">
              <span className="k">Depósitos del mes</span>
              <span className="blk-v">{formatMoney(totals.deposits)}</span>
              <span style={{ fontSize: 13 }}>{totals.depositCount} {totals.depositCount === 1 ? 'movimiento' : 'movimientos'}</span>
            </div>
            <div className="blk lav">
              <span className="k">Retiros del mes</span>
              <span className="blk-v">{formatMoney(totals.withdrawals)}</span>
              <span style={{ fontSize: 13 }}>{totals.withdrawalCount} {totals.withdrawalCount === 1 ? 'movimiento' : 'movimientos'}</span>
            </div>
            <div className="blk dark">
              <span className="k">Neto del mes</span>
              <span className="blk-v" style={{ color: totals.net >= 0 ? 'var(--lime)' : 'var(--amber)' }}>{formatSignedMoney(totals.net)}</span>
              <span style={{ fontSize: 13, color: '#D8D4CB' }}>Depósitos menos retiros</span>
            </div>
          </div>
          <table className="l" style={{ marginTop: 22 }}>
            <tbody>
              <tr><td className="mu2">Saldo al cierre de {monthLabelLower(previous)}</td><td className="r num">{formatNumber(opening)}</td></tr>
              <tr><td>Depósitos <span className="mu">− retiros</span></td><td className="r num">{formatSigned(totals.net)}</td></tr>
              <tr className="tot"><td>Saldo {closingLabel}</td><td className="r num serif" style={{ fontSize: 17 }}>{formatNumber(closing)}</td></tr>
            </tbody>
          </table>
        </section>

        <section className="panel span-8" aria-labelledby="h-evo">
          <p className="k">{monthShort(first.key)} – {monthLabelLower(month)}</p>
          <h2 className="s" id="h-evo" style={{ marginTop: 4 }}>Evolución del ahorro</h2>
          {series.length > 1 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '6px 28px', marginTop: 18, paddingBottom: 14, borderBottom: '1px solid var(--night-rule)' }}>
              <span>
                <span className="big" style={{ fontSize: 30, color: growth >= 0 ? 'var(--lime)' : 'var(--amber)' }}>{formatSignedMoney(growth)}</span>{' '}
                <span className="mu" style={{ fontSize: 13 }}>en {series.length - 1} {series.length - 1 === 1 ? 'mes' : 'meses'}</span>
              </span>
              {growthPct !== null && (
                <span>
                  <span className="big" style={{ fontSize: 30 }}>{growthPct >= 0 ? '+' : '−'}{formatPercent(Math.abs(growthPct))}</span>{' '}
                  <span className="mu" style={{ fontSize: 13 }}>desde el cierre de {monthNameLower(first.key)}</span>
                </span>
              )}
            </div>
          ) : (
            <p className="mu" style={{ margin: '12px 0 0' }}>Cuando tengas más de un mes de movimientos verás aquí cómo crece tu ahorro.</p>
          )}
          <div style={{ marginTop: 12 }}>
            <BalanceLine
              title={`Saldo total al cierre de cada mes: ${series.map((p) => `${monthShort(p.key)} ${formatMoney(p.closing)}`).join(', ')}`}
              points={series.map((p) => ({ label: monthShort(p.key), value: p.closing }))}
            />
          </div>
          <p className="mu" style={{ margin: '6px 0 0', fontSize: 12 }}>
            Cada punto es tu saldo total al último día del mes{isCurrent ? '; el último es el saldo de hoy' : ''}.
            {truncated && ' Se calculan con los últimos 100 movimientos de cada meta.'}
          </p>
        </section>

        <section className="span-4" aria-labelledby="h-met">
          <div className="sh"><h2 className="s" id="h-met">Metas</h2><Link to="/metas" className="lk" style={{ fontSize: 13 }}>Ver todas</Link></div>
          {sortedGoals.slice(0, 4).map((g) => (
            <div key={g.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--rule)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <Link to={`/metas/${g.id}`} className="lk" style={{ textDecoration: 'none', fontWeight: 600 }}>{g.name}</Link>
                <GoalStatus completed={g.progress.completed} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <div style={{ flex: 1 }}><Progress percentage={g.progress.percentage} completed={g.progress.completed} /></div>
                <span className="num nowrap" style={{ fontSize: 13, fontWeight: 600 }}>{formatPercent(g.progress.percentage)}</span>
              </div>
              <div className="num mu2" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, marginTop: 6 }}>
                <span>{formatMoney(g.balance)} de {formatMoney(g.targetAmount)}</span>
                {!g.progress.completed && <span>faltan {formatMoney(g.progress.remaining)}</span>}
              </div>
            </div>
          ))}
          {goals.length > 4 && <p className="mu2" style={{ fontSize: 13 }}>y {goals.length - 4} más</p>}
        </section>
      </div>
    </main>
  );
}
