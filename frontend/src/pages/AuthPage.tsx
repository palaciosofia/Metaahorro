import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, register, expired } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  const isLogin = mode === 'login';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isLogin) await login(email, password);
      else await register(name, email, password);
      navigate('/resumen', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, 'ERROR', 'Algo salió mal. Intenta de nuevo.'));
      setBusy(false);
    }
  }

  const fieldError = (field: string) => error?.fieldError(field);
  const general = error && !error.details.length ? error.message : null;

  return (
    <div className="auth">
      <div className="auth-side">
        <Link className="brand" to="/" style={{ padding: 0, color: 'var(--night-text)' }}>MetaAhorro</Link>
        <p className="serif hide-sm" style={{ margin: 0, fontSize: 42, lineHeight: 1.1, fontWeight: 600, letterSpacing: '-0.02em', maxWidth: 440 }}>
          Ponle cifra a lo que quieres lograr.
        </p>
        <Link to="/" className="lk hide-sm" style={{ fontSize: 13, color: 'var(--night-text)' }}>← Volver al inicio</Link>
      </div>
      <div className="auth-main">
        <form className="auth-form" onSubmit={submit} noValidate>
          <div>
            <p className="k">{isLogin ? 'Acceso' : 'Cuenta nueva'}</p>
            <h1 className="t" style={{ fontSize: 34 }}>{isLogin ? 'Inicia sesión' : 'Crea tu cuenta'}</h1>
            <p className="mu2" style={{ margin: '8px 0 0' }}>
              {isLogin ? 'Usa el correo con el que te registraste.' : 'Solo necesitas tu nombre, un correo y una contraseña.'}
            </p>
          </div>
          {expired && isLogin && <p className="callout" role="status" style={{ margin: 0 }}>Tu sesión expiró. Vuelve a iniciar sesión.</p>}
          <div style={{ borderTop: '1px solid var(--ink)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!isLogin && (
              <div className="field">
                <label className="lab" htmlFor="name">Nombre</label>
                <input id="name" className="in" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!fieldError('name') || undefined} />
                {fieldError('name') && <span className="field-error">{fieldError('name')}</span>}
              </div>
            )}
            <div className="field">
              <label className="lab" htmlFor="email">Correo electrónico</label>
              <input id="email" className="in" type="email" autoComplete="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!fieldError('email') || undefined} />
              {fieldError('email') && <span className="field-error">{fieldError('email')}</span>}
            </div>
            <div className="field">
              <label className="lab" htmlFor="password">Contraseña</label>
              <input
                id="password"
                className="in"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder={isLogin ? '' : 'Mínimo 8 caracteres'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!fieldError('password') || undefined}
              />
              {fieldError('password') && <span className="field-error">{fieldError('password')}</span>}
            </div>
          </div>
          {general && <p className="form-error" role="alert">{general}</p>}
          <button type="submit" className="btn block" style={{ height: 44 }} disabled={busy}>
            {busy ? 'Un momento…' : isLogin ? 'Entrar' : 'Crear cuenta'}
          </button>
          <p className="mu2" style={{ margin: 0, paddingTop: 16, borderTop: '1px solid var(--rule-2)' }}>
            {isLogin ? (
              <>¿No tienes cuenta? <Link to="/registro" className="lk" style={{ fontWeight: 600 }}>Regístrate</Link></>
            ) : (
              <>¿Ya tienes cuenta? <Link to="/entrar" className="lk" style={{ fontWeight: 600 }}>Inicia sesión</Link></>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
