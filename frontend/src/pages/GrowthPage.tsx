import { VariationBars } from '../components/Charts';
import { Empty, ErrorState, Loading } from '../components/States';
import { useData } from '../lib/DataContext';
import { formatMoney, formatNumber, formatPercent, formatSigned, formatSignedMoney, monthLabelLower, monthName, monthNameLower, monthShort } from '../lib/format';
import { monthlySeries } from '../lib/stats';

export function GrowthPage() {
  const { movements, totalBalance, loading, error, reload, month, firstMonth, currentMonth, truncated } = useData();

  if (loading) return <main className="wrap page"><Loading /></main>;
  if (error) return <main className="wrap page"><ErrorState message={error} onRetry={reload} /></main>;

  const series = monthlySeries(totalBalance, movements, month, 6).filter((p) => p.key >= firstMonth);

  if (series.length < 2) {
    return (
      <main className="wrap page">
        <p className="k">Crecimiento</p>
        <h1 className="t">Crecimiento del ahorro</h1>
        <Empty title="Aún no hay suficiente historia">
          Para comparar necesitas al menos dos meses con datos. Vuelve el próximo mes o revisa un mes posterior con las flechas de arriba.
        </Empty>
      </main>
    );
  }

  const base = series[0];
  const end = series[series.length - 1];
  const months = series.slice(1);
  const growth = end.closing - base.closing;
  const pct = base.closing > 0 ? (growth / base.closing) * 100 : null;
  const best = months.reduce((a, b) => (b.net > a.net ? b : a));
  const worst = months.reduce((a, b) => (b.net < a.net ? b : a));
  const withWithdrawals = months.filter((p) => p.withdrawalCount > 0);
  const withdrawnTotal = months.reduce((s, p) => s + p.withdrawals, 0);
  const endLabel = end.key === currentMonth ? 'hoy' : `al cierre de ${monthLabelLower(end.key)}`;

  return (
    <main className="wrap page">
      <div className="g12">
        <section className="span-5" aria-labelledby="h-cre">
          <p className="k">Periodo · cierre de {monthLabelLower(base.key)} a {end.key === currentMonth ? 'hoy' : `cierre de ${monthLabelLower(end.key)}`}</p>
          <h1 className="t" id="h-cre">Crecimiento del ahorro</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '8px 20px', marginTop: 26 }}>
            {pct !== null && (
              <p className="big" style={{ fontSize: 'clamp(56px, 7vw, 84px)', lineHeight: 0.85, color: 'var(--accent)' }}>
                {pct >= 0 ? '+' : '−'}{formatPercent(Math.abs(pct))}
              </p>
            )}
            <p className={`big${growth >= 0 ? ' pos' : ''}`} style={{ fontSize: pct === null ? 56 : 26, marginBottom: 4 }}>{formatSignedMoney(growth)}</p>
          </div>
          <p style={{ margin: '16px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: 440 }}>
            Tu ahorro pasó de <strong className="num">{formatMoney(base.closing)}</strong> al cierre de {monthNameLower(base.key)} a{' '}
            <strong className="num">{formatMoney(end.closing)}</strong> {endLabel}.
          </p>
          <table className="l bare" style={{ marginTop: 22 }}>
            <tbody>
              <tr><td>Saldo {endLabel}</td><td className="r num">{formatNumber(end.closing)}</td></tr>
              <tr><td className="mu2">Saldo al cierre de {monthLabelLower(base.key)} (base)</td><td className="r num mu2">− {formatNumber(base.closing)}</td></tr>
              <tr className="tot"><td>Crecimiento en pesos</td><td className="r num serif" style={{ fontSize: 17 }}>{formatSigned(growth)}</td></tr>
              <tr>
                <td className="mu2">Crecimiento porcentual</td>
                <td className="r num nowrap">
                  {pct === null ? 'No aplica (la base es 0)' : <>{formatNumber(growth)} ÷ {formatNumber(base.closing)} = <strong>{formatPercent(pct, 1)}</strong></>}
                </td>
              </tr>
              <tr><td className="mu2">Promedio por mes</td><td className="r num">{formatSigned(Math.round(growth / months.length))}</td></tr>
            </tbody>
          </table>
        </section>

        <section className="panel span-7" style={{ alignSelf: 'start' }} aria-labelledby="h-var">
          <p className="k">{monthShort(months[0].key)} – {monthLabelLower(end.key)}</p>
          <h2 className="s" id="h-var" style={{ marginTop: 4 }}>¿Cuánto creciste cada mes?</h2>
          <div className="legend" style={{ margin: '16px 0 6px', color: '#D8D4CB' }}>
            <span><svg width="12" height="12" aria-hidden="true"><rect width="12" height="12" fill="#D6F27F" /></svg>Creció</span>
            <span><svg width="12" height="12" aria-hidden="true"><rect width="12" height="12" fill="#F2C14E" /></svg>Bajó</span>
          </div>
          <VariationBars
            title={`Variación del saldo por mes: ${months.map((p) => `${monthName(p.key)} ${formatSigned(p.net)}`).join(', ')}`}
            items={months.map((p) => ({ label: monthShort(p.key), value: p.net }))}
          />
          <p className="mu" style={{ margin: '6px 0 0', fontSize: 12 }}>
            Cada barra es el saldo al cierre del mes menos el del mes anterior.{truncated && ' Se calcula con los últimos 100 movimientos de cada meta.'}
          </p>
          <div className="notes" style={{ marginTop: 18 }}>
            <div>
              <p className="k">Mejor mes</p>
              <p className="serif" style={{ margin: '4px 0 0', fontSize: 19 }}>{monthName(best.key)}</p>
              <p className="num" style={{ margin: '2px 0 0', color: 'var(--lime)' }}>{formatSigned(best.net)}</p>
            </div>
            <div>
              <p className="k">Mes más bajo</p>
              <p className="serif" style={{ margin: '4px 0 0', fontSize: 19 }}>{monthName(worst.key)}</p>
              <p className="num" style={{ margin: '2px 0 0', color: worst.net < 0 ? 'var(--amber)' : '#D8D4CB' }}>{formatSigned(worst.net)}</p>
            </div>
            <div>
              <p className="k">Meses con retiros</p>
              <p className="serif" style={{ margin: '4px 0 0', fontSize: 19 }}>{withWithdrawals.length} de {months.length}</p>
              <p className="num" style={{ margin: '2px 0 0', color: '#D8D4CB' }}>{formatNumber(withdrawnTotal)} en total</p>
            </div>
          </div>
        </section>

        <section className="span-12" aria-labelledby="h-dm">
          <div className="sh"><div><p className="k">Pesos colombianos</p><h2 className="s" id="h-dm" style={{ marginTop: 4 }}>Detalle mensual</h2></div></div>
          <div className="tw">
            <table className="l">
              <thead>
                <tr>
                  <th style={{ paddingTop: 14 }}>Mes</th><th className="r" style={{ paddingTop: 14 }}>Saldo al cierre</th><th className="r" style={{ paddingTop: 14 }}>Variación</th>
                  <th className="r" style={{ paddingTop: 14 }}>Depósitos</th><th className="r" style={{ paddingTop: 14 }}>Retiros</th>
                </tr>
              </thead>
              <tbody>
                {series.map((p, i) => (
                  <tr key={p.key} style={p.key === end.key ? { fontWeight: 600 } : undefined}>
                    <td>{monthName(p.key)}{i === 0 && <span className="mu" style={{ fontWeight: 400 }}> · base</span>}</td>
                    <td className="r num">{formatNumber(p.closing)}</td>
                    <td className="r num">{i === 0 ? '—' : p.net < 0 ? <span className="chip warn num">{formatSigned(p.net)}</span> : formatSigned(p.net)}</td>
                    <td className="r num mu2">{formatNumber(p.deposits)}</td>
                    <td className="r num mu2">{formatNumber(p.withdrawals)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
