import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { DataProvider } from './lib/DataContext';
import { AuthPage } from './pages/AuthPage';
import { GoalsPage } from './pages/GoalsPage';
import { GrowthPage } from './pages/GrowthPage';
import { MovementsPage } from './pages/MovementsPage';
import { SummaryPage } from './pages/SummaryPage';
import { WelcomePage } from './pages/WelcomePage';

function Private() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />;
  return (
    <DataProvider key={user.id}>
      <Layout />
    </DataProvider>
  );
}

function PublicOnly({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  return user ? <Navigate to="/resumen" replace /> : children;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/entrar" element={<PublicOnly><AuthPage mode="login" /></PublicOnly>} />
      <Route path="/registro" element={<PublicOnly><AuthPage mode="register" /></PublicOnly>} />
      <Route element={<Private />}>
        <Route path="/resumen" element={<SummaryPage />} />
        <Route path="/movimientos" element={<MovementsPage />} />
        <Route path="/metas" element={<GoalsPage />} />
        <Route path="/metas/:id" element={<GoalsPage />} />
        <Route path="/crecimiento" element={<GrowthPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
