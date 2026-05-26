import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './store/auth';
import { useTheme } from './store/theme';
import { LoginPage } from './pages/LoginPage';
import { AppShell } from './components/AppShell';
import { InboxPage } from './pages/InboxPage';
import { ComposerPage } from './pages/ComposerPage';
import { CalendarPage } from './pages/CalendarPage';
import { ContactsPage } from './pages/ContactsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { Icon } from './components/shared/Icon';

function LoadingScreen() {
  const { theme: t } = useTheme();
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        height: '100%',
        background: t.bg,
        color: t.textMuted,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${t.accent}, #7A4FE0)`,
            color: '#FFF',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name="logo" size={26} color="#FFF" />
        </div>
        <div style={{ fontSize: 13 }}>Загружаем сессию Cloud24 Exchange…</div>
      </div>
    </div>
  );
}

export function App() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if ((status === 'anonymous' || status === 'twofa') && location.pathname !== '/login') {
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
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/inbox" replace />} />
    </Routes>
  );
}
