import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useData } from '../lib/DataContext';
import { addMonths, formatMoney, monthLabel } from '../lib/format';
import { IconMore, IconNext, IconPrev } from './Icons';

const LINKS = [
  { to: '/resumen', label: 'Resumen' },
  { to: '/movimientos', label: 'Movimientos' },
  { to: '/metas', label: 'Metas' },
  { to: '/crecimiento', label: 'Crecimiento' },
];

function AccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div className="who" ref={ref}>
      <span className="who-name">{user?.name}</span>
      <button type="button" className="bt" aria-label="Opciones de la cuenta" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <IconMore />
      </button>
      {open && (
        <div className="menu">
          <p style={{ margin: 0, fontWeight: 600 }}>{user?.name}</p>
          <p className="mu2" style={{ margin: '0 0 12px', fontSize: 13 }}>{user?.email}</p>
          <button type="button" className="btn o block" onClick={logout}>Cerrar sesión</button>
        </div>
      )}
    </div>
  );
}

export function Layout() {
  const { month, setMonth, currentMonth, firstMonth, totalBalance, loading } = useData();

  return (
    <>
      <header className="mast">
        <div className="wrap mast-in">
          <Link className="brand" to="/resumen">MetaAhorro</Link>
          <nav className="nav" aria-label="Principal">
            {LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
          </nav>
          <AccountMenu />
        </div>
      </header>
      <div className="dl">
        <div className="wrap dl-in">
          <div className="dl-r">
            <button type="button" className="bt" aria-label="Mes anterior" disabled={month <= firstMonth} onClick={() => setMonth(addMonths(month, -1))}>
              <IconPrev />
            </button>
            <span style={{ fontWeight: 600, minWidth: 140, textAlign: 'center' }} aria-live="polite">{monthLabel(month)}</span>
            <button type="button" className="bt" aria-label="Mes siguiente" disabled={month >= currentMonth} onClick={() => setMonth(addMonths(month, 1))}>
              <IconNext />
            </button>
          </div>
          <div className="dl-r">
            <span className="k dl-total-label" style={{ marginRight: 8 }}>Ahorro total hoy</span>
            <span className="serif num" style={{ fontSize: 18, fontWeight: 600 }}>{loading ? '—' : formatMoney(totalBalance)}</span>
          </div>
        </div>
      </div>
      <Outlet />
      <nav className="bottom-nav" aria-label="Principal">
        {LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
      </nav>
    </>
  );
}
