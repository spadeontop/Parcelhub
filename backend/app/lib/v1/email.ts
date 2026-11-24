import nodemailer from "nodemailer";
import type { EmailVerificationPurpose } from "@/app/types/v1/api";
import {
  renderOtpEmailTemplate,
  renderSecurityAlertEmailTemplate,
} from "./email-templates";

export type EmailProvider = "smtp" | "brevo" | "resend";

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface CapturedTestEmail extends SendEmailInput {
  sentAt: string;
}

const capturedTestEmails: CapturedTestEmail[] = [];
const EMAIL_SEND_TIMEOUT_MS = 8000;

export function isEmailEnabled(): boolean {
  return process.env.EMAIL_ENABLED === "true";
}

export function getCapturedTestEmails(): readonly CapturedTestEmail[] {
  return capturedTestEmails;
}

export function clearCapturedTestEmails(): void {
  capturedTestEmails.length = 0;
}

function getEmailProvider(): EmailProvider {
  const raw = (process.env.EMAIL_PROVIDER || "smtp").trim().toLowerCase();
  if (raw === "brevo" || raw === "resend" || raw === "smtp") {
    return raw;
  }
  throw new Error(`Unsupported EMAIL_PROVIDER: ${raw}`);
}

function getEmailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || "ParcelHub <no-reply@parcelhub.local>";
}

function parseFromHeader(from: string): { name: string; email: string } {
  const match = from.match(/^(.*)<([^<>]+)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^["']|["']$/g, "") || "ParcelHub",
      email: match[2].trim(),
    };
  }
  return { name: "ParcelHub", email: from.trim() };
}

async function sendViaSmtp(from: string, input: SendEmailInput): Promise<void> {
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || "587");
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASS are required when EMAIL_PROVIDER=smtp");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: EMAIL_SEND_TIMEOUT_MS,
    greetingTimeout: EMAIL_SEND_TIMEOUT_MS,
    socketTimeout: EMAIL_SEND_TIMEOUT_MS,
  });

  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

async function sendViaBrevo(from: string, input: SendEmailInput): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is required when EMAIL_PROVIDER=brevo");
  }

  const sender = parseFromHeader(from);
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender,
      to: [{ email: input.to }],
      subject: input.subject,
      textContent: input.text,
      htmlContent: input.html,
    }),
    signal: AbortSignal.timeout(EMAIL_SEND_TIMEOUT_MS),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Brevo API error (${res.status}): ${errBody}`);
  }
}

async function sendViaResend(from: string, input: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
    signal: AbortSignal.timeout(EMAIL_SEND_TIMEOUT_MS),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Resend API error (${res.status}): ${errBody}`);
  }
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!isEmailEnabled()) {
    if (process.env.EMAIL_TEST_SINK === "true") {
      capturedTestEmails.push({
        ...input,
        sentAt: new Date().toISOString(),
      });
    } else {
      console.info(`[EMAIL_DISABLED] To: ${input.to} | Subject: ${input.subject}`);
    }
    return;
  }

  const from = getEmailFrom();
  const provider = getEmailProvider();

  if (provider === "smtp") {
    await sendViaSmtp(from, input);
    return;
  }
  if (provider === "brevo") {
    await sendViaBrevo(from, input);
    return;
  }
  await sendViaResend(from, input);
}

export async function sendOtpEmail(params: {
  to: string;
  purpose: EmailVerificationPurpose;
  code: string;
  firstName?: string | null;
  ttlMinutes: number;
}): Promise<void> {
  const rendered = renderOtpEmailTemplate({
    purpose: params.purpose,
    code: params.code,
    firstName: params.firstName,
    ttlMinutes: params.ttlMinutes,
  });

  await sendEmail({
    to: params.to,
    ...rendered,
  });
}

export async function sendSecurityAlertEmail(params: {
  to: string;
  firstName?: string | null;
  credentialChanged: "password" | "MPIN";
}): Promise<void> {
  const rendered = renderSecurityAlertEmailTemplate({
    firstName: params.firstName,
    credentialChanged: params.credentialChanged,
  });

  await sendEmail({
    to: params.to,
    ...rendered,
  });
}
