// HTTP-level helpers for Radicale collection bootstrap.
//
// tsdav's `fetchAddressBooks/fetchCalendars` only return collections that
// already exist. Radicale lazily creates the user's principal directory
// the first time the user authenticates, but it doesn't auto-create the
// inner CalDAV calendar / CardDAV address book — clients must do that
// themselves with MKCALENDAR / MKCOL. Otherwise the very first PUT
// returns 404.

interface EnsureCfg {
  baseUrl: string;
  email: string;
  password: string;
}

function authHeader(email: string, password: string): string {
  return 'Basic ' + Buffer.from(`${email}:${password}`).toString('base64');
}

async function request(method: string, url: string, cfg: EnsureCfg, body?: string, headers?: Record<string, string>): Promise<Response> {
  return await fetch(url, {
    method,
    headers: {
      Authorization: authHeader(cfg.email, cfg.password),
      ...(headers ?? {}),
    },
    body,
  });
}

function trimSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

async function exists(url: string, cfg: EnsureCfg): Promise<boolean> {
  const res = await request('PROPFIND', url, cfg, undefined, { Depth: '0' });
  return res.status >= 200 && res.status < 300;
}

export async function ensurePrincipal(cfg: EnsureCfg): Promise<string> {
  const base = trimSlash(cfg.baseUrl);
  const principal = `${base}/${encodeURIComponent(cfg.email)}/`;
  // Triggering any authenticated request causes Radicale to create the
  // user's home collection on disk if missing.
  await request('PROPFIND', principal, cfg, undefined, { Depth: '0' });
  return principal;
}

export async function ensureCalendar(cfg: EnsureCfg, displayName: string): Promise<string> {
  const principal = await ensurePrincipal(cfg);
  const url = `${principal}calendar/`;
  if (await exists(url, cfg)) return url;
  const body = `<?xml version="1.0" encoding="utf-8" ?>
<C:mkcalendar xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:set>
    <D:prop>
      <D:displayname>${displayName}</D:displayname>
      <C:supported-calendar-component-set>
        <C:comp name="VEVENT" />
      </C:supported-calendar-component-set>
    </D:prop>
  </D:set>
</C:mkcalendar>`;
  const res = await request('MKCALENDAR', url, cfg, body, { 'Content-Type': 'application/xml; charset=utf-8' });
  if (res.status >= 200 && res.status < 300) return url;
  if (res.status === 405) return url; // Already exists.
  throw new Error(`MKCALENDAR ${url} -> ${res.status} ${await res.text()}`);
}

export async function ensureAddressBook(cfg: EnsureCfg, displayName: string): Promise<string> {
  const principal = await ensurePrincipal(cfg);
  const url = `${principal}contacts/`;
  if (await exists(url, cfg)) return url;
  const body = `<?xml version="1.0" encoding="utf-8" ?>
<D:mkcol xmlns:D="DAV:" xmlns:CR="urn:ietf:params:xml:ns:carddav">
  <D:set>
    <D:prop>
      <D:resourcetype>
        <D:collection />
        <CR:addressbook />
      </D:resourcetype>
      <D:displayname>${displayName}</D:displayname>
    </D:prop>
  </D:set>
</D:mkcol>`;
  const res = await request('MKCOL', url, cfg, body, { 'Content-Type': 'application/xml; charset=utf-8' });
  if (res.status >= 200 && res.status < 300) return url;
  if (res.status === 405) return url;
  throw new Error(`MKCOL ${url} -> ${res.status} ${await res.text()}`);
}

export async function putResource(url: string, body: string, contentType: string, cfg: EnsureCfg): Promise<void> {
  const res = await request('PUT', url, cfg, body, { 'Content-Type': contentType });
  if (res.status >= 200 && res.status < 300) return;
  throw new Error(`PUT ${url} -> ${res.status} ${await res.text()}`);
}
