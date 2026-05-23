import http from 'node:http';

// Talks to the Docker engine via its UNIX socket to execute provisioning
// commands inside the mailserver container. This is the deliberate
// compromise of Phase 2.5: until docker-mailserver grows native SQL
// account provisioning, the BFF bridges the gap by `exec`-ing the
// `setup email add/del` helpers.

const DOCKER_SOCK = process.env.DOCKER_HOST?.replace(/^unix:\/\//, '') ?? '/var/run/docker.sock';
const MAIL_CONTAINER = process.env.MAIL_CONTAINER_NAME ?? 'cx-mail';

function dockerRequest(method: string, path: string, body?: unknown): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = body !== undefined ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        socketPath: DOCKER_SOCK,
        path,
        method,
        headers: payload
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
          : {},
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () =>
          resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8') }),
        );
      },
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function execInMailserver(cmd: string[]): Promise<{ ok: boolean; output: string }> {
  // POST /containers/{id}/exec → {Id}
  const create = await dockerRequest('POST', `/containers/${MAIL_CONTAINER}/exec`, {
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
    Cmd: cmd,
  });
  if (create.status >= 300) {
    return { ok: false, output: `exec create failed: ${create.status} ${create.body}` };
  }
  const { Id } = JSON.parse(create.body);
  const start = await dockerRequest('POST', `/exec/${Id}/start`, { Detach: false, Tty: false });
  // Inspect to get exit code.
  const inspect = await dockerRequest('GET', `/exec/${Id}/json`);
  let exitCode = 0;
  try {
    exitCode = JSON.parse(inspect.body).ExitCode ?? 0;
  } catch {
    exitCode = 1;
  }
  // Demultiplex Docker stream framing: strip 8-byte headers per chunk.
  let output = '';
  let buf = Buffer.from(start.body, 'binary');
  while (buf.length >= 8) {
    const size = buf.readUInt32BE(4);
    const chunk = buf.subarray(8, 8 + size);
    output += chunk.toString('utf8');
    buf = buf.subarray(8 + size);
  }
  if (!output) output = start.body;
  return { ok: exitCode === 0, output };
}

export async function provisionMailAccount(email: string, password: string): Promise<void> {
  const res = await execInMailserver(['setup', 'email', 'add', email, password]);
  if (!res.ok && !/already exists/i.test(res.output)) {
    throw new Error(`mailserver provisioning failed: ${res.output.trim()}`);
  }
}

export async function setMailAccountPassword(email: string, password: string): Promise<void> {
  const res = await execInMailserver(['setup', 'email', 'update', email, password]);
  if (!res.ok) {
    throw new Error(`mailserver password update failed: ${res.output.trim()}`);
  }
}

export async function removeMailAccount(email: string): Promise<void> {
  const res = await execInMailserver(['setup', 'email', 'del', '-y', email]);
  if (!res.ok && !/no such account|does not exist/i.test(res.output)) {
    throw new Error(`mailserver removal failed: ${res.output.trim()}`);
  }
}

export async function setMailAccountQuota(email: string, quota: string): Promise<void> {
  const res = await execInMailserver(['setup', 'quota', 'set', email, quota]);
  if (!res.ok && !/already/i.test(res.output)) {
    throw new Error(`mailserver quota set failed: ${res.output.trim()}`);
  }
}
