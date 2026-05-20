import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { mailApi } from '../api/mail';
import { ApiError } from '../api/client';
import type { MailboxSummary, MessageDetail, MessageSummary } from '../types/api';
import { Icon } from '../components/shared/Icon';
import { lightTheme } from '../components/shared/theme';
import { colorFor, formatMessageTime, formatMessageTimeFull, initialsOf } from '../components/shared/format';

const SYSTEM_FOLDERS: Array<{ path: string; label: string; icon: string }> = [
  { path: 'INBOX', label: 'Входящие', icon: 'inbox' },
  { path: 'Sent', label: 'Отправленные', icon: 'send' },
  { path: 'Drafts', label: 'Черновики', icon: 'draft' },
  { path: 'Trash', label: 'Корзина', icon: 'trash' },
  { path: 'Junk', label: 'Спам', icon: 'spam' },
  { path: 'Archive', label: 'Архив', icon: 'archive' },
];

export function InboxPage() {
  const params = useParams<{ uid?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mailbox = searchParams.get('mailbox') ?? 'INBOX';

  const [folders, setFolders] = useState<MailboxSummary[]>([]);
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [detail, setDetail] = useState<MessageDetail | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = lightTheme;
  const selectedUid = params.uid ? Number(params.uid) : null;

  const refreshFolders = useCallback(async () => {
    try {
      const data = await mailApi.folders();
      setFolders(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    }
  }, []);

  const refreshList = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const data = await mailApi.messages(mailbox, 50);
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить письма');
    } finally {
      setLoadingList(false);
    }
  }, [mailbox]);

  useEffect(() => {
    void refreshFolders();
  }, [refreshFolders]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    let cancelled = false;
    if (selectedUid == null) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    mailApi
      .message(selectedUid, mailbox)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Письмо не найдено');
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedUid, mailbox]);

  const knownFolderPaths = useMemo(() => new Set(folders.map((f) => f.path)), [folders]);

  function openFolder(path: string) {
    setSearchParams({ mailbox: path });
    navigate(`/inbox?mailbox=${encodeURIComponent(path)}`);
  }

  async function onToggleFlag(uid: number, flagged: boolean) {
    try {
      await mailApi.setFlags(uid, ['\\Flagged'], !flagged, mailbox);
      setMessages((prev) => prev.map((m) => (m.uid === uid ? { ...m, flagged: !flagged } : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить флаг');
    }
  }

  async function onDelete(uid: number) {
    try {
      await mailApi.remove(uid, mailbox);
      setMessages((prev) => prev.filter((m) => m.uid !== uid));
      if (selectedUid === uid) navigate(`/inbox?mailbox=${encodeURIComponent(mailbox)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить письмо');
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '240px 360px 1fr',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Folders column */}
      <aside
        style={{
          borderRight: `1px solid ${t.border}`,
          background: t.surface,
          padding: '20px 14px',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 12 }}>
          Папки
        </div>
        {SYSTEM_FOLDERS.map((sys) => {
          const meta = folders.find((f) => f.path === sys.path);
          const active = mailbox === sys.path;
          if (!meta && !knownFolderPaths.size) return null;
          return (
            <button
              key={sys.path}
              type="button"
              onClick={() => openFolder(sys.path)}
              style={folderButtonStyle(active, t)}
            >
              <Icon name={sys.icon} size={15} />
              <span style={{ flex: 1, textAlign: 'left' }}>{sys.label}</span>
              {meta && meta.unread > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: active ? t.accent : t.surfaceAlt,
                    color: active ? '#FFF' : t.textMuted,
                    padding: '1px 8px',
                    borderRadius: 999,
                  }}
                >
                  {meta.unread}
                </span>
              )}
            </button>
          );
        })}

        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: t.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1.4,
            marginTop: 20,
            marginBottom: 8,
          }}
        >
          Другие
        </div>
        {folders
          .filter((f) => !SYSTEM_FOLDERS.some((s) => s.path === f.path))
          .map((f) => (
            <button key={f.path} type="button" onClick={() => openFolder(f.path)} style={folderButtonStyle(mailbox === f.path, t)}>
              <Icon name="archive" size={15} />
              <span style={{ flex: 1, textAlign: 'left' }}>{f.name}</span>
              {f.unread > 0 && (
                <span style={{ fontSize: 11, color: t.textMuted }}>{f.unread}</span>
              )}
            </button>
          ))}
      </aside>

      {/* Message list */}
      <section
        style={{
          borderRight: `1px solid ${t.border}`,
          background: t.bg,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${t.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {SYSTEM_FOLDERS.find((s) => s.path === mailbox)?.label ?? mailbox}
            </div>
            <div style={{ fontSize: 12, color: t.textMuted }}>
              {messages.length} {pluralRu(messages.length, ['письмо', 'письма', 'писем'])}
            </div>
          </div>
          <button type="button" onClick={refreshList} style={iconBtnStyle(t)}>
            Обновить
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingList && messages.length === 0 && (
            <div style={{ padding: 32, color: t.textMuted }}>Загружаем письма…</div>
          )}
          {!loadingList && messages.length === 0 && (
            <div style={{ padding: 32, color: t.textMuted }}>В этой папке пусто</div>
          )}
          {messages.map((m) => {
            const isActive = selectedUid === m.uid;
            return (
              <button
                key={m.uid}
                type="button"
                onClick={() => navigate(`/inbox/${m.uid}?mailbox=${encodeURIComponent(mailbox)}`)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  background: isActive ? t.accentSoft : 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${t.border}`,
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr auto',
                  gap: 10,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: t.text,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: colorFor(m.from?.address ?? m.from?.name),
                    color: '#FFF',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {initialsOf(m.from?.name || m.from?.address)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {m.unread && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: t.accent,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: m.unread ? 700 : 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                    >
                      {m.from?.name || m.from?.address || '—'}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: m.unread ? 600 : 500,
                      marginTop: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.subject}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: t.textMuted,
                      marginTop: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.preview || '(нет превью)'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontSize: 11, color: t.textMuted }}>
                    {formatMessageTime(m.date)}
                  </span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {m.hasAttachment && (
                      <span style={{ color: t.textDim }}>
                        <Icon name="paperclip" size={13} />
                      </span>
                    )}
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void onToggleFlag(m.uid, m.flagged);
                      }}
                      style={{ color: m.flagged ? '#B5773A' : t.textDim, cursor: 'pointer' }}
                    >
                      <Icon name="star" size={13} />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Reading pane */}
      <section style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: t.bg }}>
        {error && (
          <div
            style={{
              margin: 16,
              padding: '10px 14px',
              background: '#FBE8E5',
              color: t.danger,
              border: `1px solid ${t.danger}33`,
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
        {!detail && !loadingDetail && (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: t.textMuted, padding: 32 }}>
            Выберите письмо для чтения
          </div>
        )}
        {loadingDetail && (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: t.textMuted, padding: 32 }}>
            Открываем письмо…
          </div>
        )}
        {detail && (
          <article style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            <h1 style={{ fontSize: 22, lineHeight: 1.3, fontWeight: 600, margin: 0 }}>
              {detail.subject}
            </h1>
            <div
              style={{
                display: 'flex',
                gap: 14,
                marginTop: 16,
                paddingBottom: 16,
                borderBottom: `1px solid ${t.border}`,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: colorFor(detail.from?.address ?? detail.from?.name),
                  color: '#FFF',
                  fontWeight: 700,
                  fontSize: 14,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {initialsOf(detail.from?.name || detail.from?.address)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{detail.from?.name || detail.from?.address}</div>
                <div style={{ fontSize: 12, color: t.textMuted }}>{detail.from?.address}</div>
                <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>
                  Кому: {detail.to.map((a) => a.address).join(', ') || '—'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: t.textMuted }}>{formatMessageTimeFull(detail.date)}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/compose`, {
                        state: {
                          to: detail.from?.address,
                          subject: `Re: ${detail.subject}`,
                          inReplyTo: detail.messageId,
                          references: detail.messageId ? [detail.messageId] : undefined,
                          quote: detail.text,
                        },
                      })
                    }
                    style={iconBtnStyle(t)}
                  >
                    <Icon name="reply" size={14} /> Ответить
                  </button>
                  <button type="button" onClick={() => void onDelete(detail.uid)} style={iconBtnStyle(t)}>
                    <Icon name="trash" size={14} /> Удалить
                  </button>
                </div>
              </div>
            </div>

            <div style={{ fontSize: 14, lineHeight: 1.65, color: t.text, marginTop: 18 }}>
              {detail.html ? (
                <div
                  // The IMAP backend's mail body is the email we just received; we
                  // intentionally render the original HTML so users see formatting
                  // and inline images. In production, route through a sanitizer
                  // (e.g. DOMPurify) at this boundary.
                  dangerouslySetInnerHTML={{ __html: detail.html }}
                />
              ) : (
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                  {detail.text}
                </pre>
              )}
            </div>

            {detail.attachments.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1.4 }}>
                  Вложения ({detail.attachments.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                  {detail.attachments.map((a, i) => (
                    <div
                      key={`${a.filename}-${i}`}
                      style={{
                        padding: '8px 12px',
                        border: `1px solid ${t.border}`,
                        borderRadius: 8,
                        background: t.surface,
                        fontSize: 12,
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Icon name="paperclip" size={14} />
                      <span style={{ fontWeight: 500 }}>{a.filename}</span>
                      <span style={{ color: t.textMuted }}>{formatBytes(a.size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}
      </section>
    </div>
  );
}

function folderButtonStyle(active: boolean, t: typeof lightTheme): React.CSSProperties {
  return {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '7px 10px',
    background: active ? t.accentSoft : 'transparent',
    color: active ? t.accent : t.text,
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginBottom: 2,
  };
}

function iconBtnStyle(t: typeof lightTheme): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
    color: t.text,
    fontFamily: 'inherit',
  };
}

function pluralRu(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const tens = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (tens > 1 && tens < 5) return forms[1];
  if (tens === 1) return forms[0];
  return forms[2];
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 Б';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} КБ`;
  return `${(kb / 1024).toFixed(1)} МБ`;
}
