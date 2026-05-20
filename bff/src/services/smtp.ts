import nodemailer from 'nodemailer';
import { config } from '../config.js';
import type { SessionUser } from '../types/session.js';

export interface OutgoingMessage {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  inReplyTo?: string;
  references?: string[];
}

export async function sendMessage(user: SessionUser, message: OutgoingMessage): Promise<string> {
  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: user.email, pass: user.password },
    tls: { rejectUnauthorized: false },
  });

  const info = await transporter.sendMail({
    from: { name: user.displayName, address: user.email },
    to: message.to,
    cc: message.cc,
    bcc: message.bcc,
    subject: message.subject,
    text: message.text,
    html: message.html,
    inReplyTo: message.inReplyTo,
    references: message.references,
  });

  return info.messageId;
}
