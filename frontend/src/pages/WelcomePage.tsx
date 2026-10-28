import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function WelcomePage() {
  const { user } = useAuth();

  return (
    <>
      <header className="mast">
        <div className="wrap mast-in" style={{ alignItems: 'center' }}>
          <Link className="brand" to="/" style={{ paddingBottom: 0 }}>MetaAhorro</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user ? (
              <Link to="/resumen" className="btn">Ir a mi resumen</Link>
            ) : (
              <>
                <Link to="/entrar" className="bt">Iniciar sesión</Link>
                <Link to="/registro" className="btn">Crear cuenta</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="wrap" style={{ paddingTop: 64, paddingBottom: 56 }}>
        <div className="g12" style={{ alignItems: 'center' }}>
          <div className="span-7">
            <p className="k">Ahorro personal en pesos colombianos</p>
            <h1 className="serif" style={{ margin: '14px 0 0', fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: 1.02, fontWeight: 600, letterSpacing: '-0.03em' }}>
              Ponle cifra a lo que quieres lograr.
            </h1>
            <p className="mu2" style={{ margin: '22px 0 0', fontSize: 18, lineHeight: 1.6, maxWidth: 520 }}>
              Crea metas de ahorro, registra tus depósitos y retiros, y mira mes a mes cuánto te falta.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 30 }}>
              <Link to="/registro" className="btn lg" style={{ boxShadow: '3px 3px 0 var(--accent)' }}>Crear cuenta</Link>
              <Link to="/entrar" className="btn o lg">Iniciar sesión</Link>
            </div>
          </div>
          <aside className="panel span-5" aria-label="Ejemplo de una meta">
            <p className="k">Ejemplo</p>
            <p className="serif" style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 600 }}>Viaje a Cartagena</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginTop: 18 }}>
              <span className="big" style={{ fontSize: 56, lineHeight: 0.9, color: 'var(--lime)' }}>25&nbsp;%</span>
              <span className="num" style={{ color: '#D8D4CB' }}><strong style={{ color: 'var(--night-text)' }}>$&nbsp;500.000</strong> de $&nbsp;2.000.000</span>
            </div>
            <div style={{ height: 8, background: 'var(--night-rule)', marginTop: 14 }}><div style={{ width: '25%', height: '100%', background: 'var(--lime)' }} /></div>
            <table className="l" style={{ marginTop: 18 }}>
              <tbody>
                <tr><td style={{ borderColor: 'var(--night-rule)', color: '#D8D4CB' }}>25 oct · Depósito</td><td className="r num" style={{ borderColor: 'var(--night-rule)', color: 'var(--lime)', fontWeight: 600 }}>+ 300.000</td></tr>
                <tr><td style={{ borderColor: 'var(--night-rule)', color: '#D8D4CB' }}>20 oct · Retiro</td><td className="r num" style={{ borderColor: 'var(--night-rule)', color: 'var(--lav)', fontWeight: 600 }}>− 100.000</td></tr>
                <tr><td style={{ borderBottom: 0, color: '#D8D4CB' }}>Falta por ahorrar</td><td className="r num" style={{ borderBottom: 0, fontWeight: 600 }}>1.500.000</td></tr>
              </tbody>
            </table>
          </aside>
        </div>
        <div className="notes" style={{ marginTop: 72 }}>
          <div style={{ paddingTop: 20 }}>
            <h2 className="s" style={{ fontSize: 18 }}>Metas con objetivo</h2>
            <p className="mu2" style={{ margin: '8px 0 0', maxWidth: 300 }}>Dices cuánto necesitas y ves en todo momento cuánto llevas y cuánto te falta.</p>
          </div>
          <div style={{ paddingTop: 20 }}>
            <h2 className="s" style={{ fontSize: 18 }}>Depósitos y retiros</h2>
            <p className="mu2" style={{ margin: '8px 0 0', maxWidth: 300 }}>Cada movimiento se registra una sola vez, aunque el botón se presione dos veces.</p>
          </div>
          <div style={{ paddingTop: 20 }}>
            <h2 className="s" style={{ fontSize: 18 }}>Tu progreso, mes a mes</h2>
            <p className="mu2" style={{ margin: '8px 0 0', maxWidth: 300 }}>Ves cuánto creció tu ahorro y en qué meses depositaste más.</p>
          </div>
        </div>
      </main>
    </>
  );
}
