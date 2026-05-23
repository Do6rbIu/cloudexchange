import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { useTheme } from '../store/theme';
import { mailApi } from '../api/mail';
import { Icon } from './shared/Icon';
import { initialsOf, colorFor } from './shared/format';
import type { MailboxSummary } from '../types/api';

const NAV_ITEMS: Array<{ to: string; label: string; icon: string; matchPrefix?: string; adminOnly?: boolean }> = [
  { to: '/inbox', label: 'Входящие', icon: 'inbox', matchPrefix: '/inbox' },
  { to: '/compose', label: 'Написать', icon: 'send' },
  { to: '/calendar', label: 'Календарь', icon: 'calendar' },
  { to: '/contacts', label: 'Контакты', icon: 'contacts' },
  { to: '/admin', label: 'Админка', icon: 'shield', adminOnly: true },
  { to: '/settings', label: 'Настройки', icon: 'settings' },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const { theme: t, dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [inboxUnread, setInboxUnread] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      mailApi
        .folders()
        .then((folders: MailboxSummary[]) => {
          if (cancelled) return;
          const inbox = folders.find((f) => f.path === 'INBOX');
          setInboxUnread(inbox?.unread ?? 0);
        })
        .catch(() => undefined);
    };
    refresh();
    const id = window.setInterval(refresh, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  async function onLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'grid',
        gridTemplateColumns: '232px 1fr',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px 18px' }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: `linear-gradient(135deg, ${t.accent}, #7A4FE0)`,
              color: '#FFF',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon name="logo" size={16} color="#FFF" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.3 }}>Cloud24</div>
            <div style={{ fontSize: 10, color: t.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Exchange
            </div>
          </div>
        </div>

        {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin').map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={!item.matchPrefix}
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
              transition: 'background 0.12s',
            })}
          >
            <Icon name={item.icon} size={16} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.to === '/inbox' && inboxUnread !== null && inboxUnread > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: t.accent,
                  color: '#FFF',
                  padding: '1px 7px',
                  borderRadius: 999,
                  minWidth: 18,
                  textAlign: 'center',
                }}
              >
                {inboxUnread}
              </span>
            )}
          </NavLink>
        ))}

        <div style={{ flex: 1 }} />

        <button
          type="button"
          onClick={toggle}
          style={{
            background: 'transparent',
            border: `1px solid ${t.border}`,
            color: t.textMuted,
            padding: '8px 10px',
            borderRadius: 8,
            fontSize: 12,
            cursor: 'pointer',
            marginBottom: 8,
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {dark ? '☀' : '☾'} {dark ? 'Светлая' : 'Тёмная'}
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
                flexShrink: 0,
              }}
            >
              {initialsOf(user.displayName || user.email)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
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
                  fontFamily: 'inherit',
                }}
              >
                Выйти
              </button>
            </div>
          </div>
        )}
      </aside>

      <main style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
}
