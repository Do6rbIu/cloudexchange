import net from 'node:net';
import { config } from '../config.js';

interface PortProbeResult {
  host: string;
  port: number;
  open: boolean;
  responseMs: number | null;
}

async function probePort(host: string, port: number, timeoutMs = 2000): Promise<PortProbeResult> {
  const start = Date.now();
  return await new Promise((resolve) => {
    const sock = new net.Socket();
    let settled = false;
    const done = (open: boolean) => {
      if (settled) return;
      settled = true;
      sock.destroy();
      resolve({ host, port, open, responseMs: open ? Date.now() - start : null });
    };
    sock.setTimeout(timeoutMs);
    sock.once('connect', () => done(true));
    sock.once('timeout', () => done(false));
    sock.once('error', () => done(false));
    sock.connect(port, host);
  });
}

export interface MailStackStatus {
  imap: PortProbeResult;
  smtp: PortProbeResult;
  managesieve: PortProbeResult;
  // Rspamd worker controller (internal); only reachable if docker-mailserver
  // exposes it on the network (it doesn't by default). We still probe so
  // admins can spot a misconfiguration.
  rspamdController: PortProbeResult;
}

export async function checkMailStack(): Promise<MailStackStatus> {
  const host = config.imap.host;
  const [imap, smtp, managesieve, rspamdController] = await Promise.all([
    probePort(host, config.imap.port),
    probePort(host, config.smtp.port),
    probePort(host, 4190), // ManageSieve port
    probePort(host, 11334, 1000), // Rspamd web controller
  ]);
  return { imap, smtp, managesieve, rspamdController };
}
