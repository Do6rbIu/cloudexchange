import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { Icon } from './shared/Icon';
import { lightTheme, darkTheme } from './shared/theme';
import { initialsOf, colorFor } from './shared/format';

const NAV_ITEMS = [
  { to: '/inbox', label: 'Входящие', icon: 'inbox' },
  { to: '/compose', label: 'Написать', icon: 'send' },
  { to: '/calendar', label: 'Календарь', icon: 'calendar' },
  { to: '/contacts', label: 'Контакты', icon: 'contacts' },
  { to: '/settings', label: 'Настройки', icon: 'settings' },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  const t = dark ? darkTheme : lightTheme;

  async function onLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        background: t.bg,
        color: t.text,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <aside
        style={{
          background: t.surface,
          borderRight: `1px solid ${t.border}`,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 14px',
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px 20px' }}>
          <div style={{ color: t.accent }}>
            <Icon name="logo" size={22} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.4 }}>Cloud24</div>
        </div>

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              color: isActive ? t.accent : t.text,
              background: isActive ? t.accentSoft : 'transparent',
              textDecoration: 'none',
            })}
          >
            <Icon name={item.icon} size={16} />
            {item.label}
          </NavLink>
        ))}

        <div style={{ flex: 1 }} />

        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          style={{
            background: 'transparent',
            border: `1px solid ${t.border}`,
            color: t.textMuted,
            padding: '8px 10px',
            borderRadius: 8,
            fontSize: 12,
            cursor: 'pointer',
            marginBottom: 8,
          }}
        >
          {dark ? 'Светлая тема' : 'Тёмная тема'}
        </button>

        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 10,
              borderRadius: 8,
              background: t.surfaceAlt,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: colorFor(user.email),
                color: '#FFF',
                fontSize: 12,
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {initialsOf(user.displayName || user.email)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.displayName}
              </div>
              <button
                type="button"
                onClick={onLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  fontSize: 11,
                  color: t.textMuted,
                  cursor: 'pointer',
                }}
              >
                Выйти
              </button>
            </div>
          </div>
        )}
      </aside>

      <main style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet context={{ dark, theme: t }} />
      </main>
    </div>
  );
}
