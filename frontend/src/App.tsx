import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './store/auth';
import { LoginPage } from './pages/LoginPage';
import { AppShell } from './components/AppShell';
import { InboxPage } from './pages/InboxPage';
import { ComposerPage } from './pages/ComposerPage';
import { CalendarPage } from './pages/CalendarPage';
import { ContactsPage } from './pages/ContactsPage';
import { SettingsPage } from './pages/SettingsPage';

function LoadingScreen() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#6B6557' }}>
      Загружаем сессию…
    </div>
  );
}

export function App() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (status === 'anonymous' && location.pathname !== '/login') {
      navigate('/login', { replace: true, state: { from: location.pathname } });
    }
  }, [status, location.pathname, navigate]);

  if (status === 'loading') return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={status === 'authenticated' ? <AppShell /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="/inbox" replace />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="inbox/:uid" element={<InboxPage />} />
        <Route path="compose" element={<ComposerPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/inbox" replace />} />
    </Routes>
  );
}
