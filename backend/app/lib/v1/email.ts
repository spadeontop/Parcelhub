import nodemailer from "nodemailer";
import type { EmailVerificationPurpose } from "@/app/types/v1/api";

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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

function getOtpTemplateMeta(purpose: EmailVerificationPurpose): {
  subject: string;
  heading: string;
  instruction: string;
} {
  switch (purpose) {
    case "VERIFY_EMAIL":
      return {
        subject: "Verify your ParcelHub email",
        heading: "Verify your email address",
        instruction: "Use the 6-digit verification code below to finish setting up your ParcelHub account.",
      };
    case "FORGOT_PASSWORD":
      return {
        subject: "ParcelHub password reset code",
        heading: "Reset your password",
        instruction: "Use the 6-digit verification code below to reset your ParcelHub password.",
      };
    case "FORGOT_MPIN":
      return {
        subject: "ParcelHub MPIN reset code",
        heading: "Reset your 4-digit MPIN",
        instruction: "Use the 6-digit verification code below to reset your ParcelHub MPIN.",
      };
    case "CHANGE_PASSWORD":
      return {
        subject: "ParcelHub password change code",
        heading: "Confirm password change",
        instruction: "Use the 6-digit verification code below to confirm your password change.",
      };
    case "CHANGE_EMAIL":
      return {
        subject: "ParcelHub email change code",
        heading: "Confirm email change",
        instruction: "Use the 6-digit verification code below to verify your new email address.",
      };
  }
}

export async function sendOtpEmail(params: {
  to: string;
  purpose: EmailVerificationPurpose;
  code: string;
  firstName?: string | null;
  ttlMinutes: number;
}): Promise<void> {
  const meta = getOtpTemplateMeta(params.purpose);
  const greetingName = params.firstName?.trim() || "there";

  const text = [
    `Hi ${greetingName},`,
    "",
    meta.instruction,
    "",
    `Your verification code: ${params.code}`,
    `This code expires in ${params.ttlMinutes} minutes.`,
    "",
    "If you did not request this, you can safely ignore this email.",
    "",
    "— ParcelHub",
  ].join("\n");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111827;">
      <h2 style="margin: 0 0 12px; font-size: 20px; color: #111827;">${escapeHtml(meta.heading)}</h2>
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.5;">Hi ${escapeHtml(greetingName)},</p>
      <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.5;">${escapeHtml(meta.instruction)}</p>
      <div style="background: #F3F4F6; border-radius: 8px; padding: 16px; text-align: center; margin: 0 0 20px;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111827;">${escapeHtml(params.code)}</span>
      </div>
      <p style="margin: 0 0 8px; font-size: 13px; color: #4B5563;">This code expires in ${params.ttlMinutes} minutes.</p>
      <p style="margin: 0; font-size: 12px; color: #6B7280;">If you did not request this, you can safely ignore this email.</p>
    </div>
  `.trim();

  await sendEmail({
    to: params.to,
    subject: meta.subject,
    text,
    html,
  });
}

export async function sendSecurityAlertEmail(params: {
  to: string;
  firstName?: string | null;
  credentialChanged: "password" | "MPIN";
}): Promise<void> {
  const greetingName = params.firstName?.trim() || "there";
  const label = params.credentialChanged;
  const subject = `Your ParcelHub ${label} was changed`;
  const text = [
    `Hi ${greetingName},`,
    "",
    `Your ParcelHub account ${label} was just reset. All previous sessions have been signed out.`,
    "If you did not make this change, please contact ParcelHub support immediately.",
    "",
    "— ParcelHub",
  ].join("\n");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111827;">
      <h2 style="margin: 0 0 12px; font-size: 20px;">Security alert</h2>
      <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.5;">Hi ${escapeHtml(greetingName)},</p>
      <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.5;">Your ParcelHub account ${escapeHtml(label)} was just reset. All previous sessions have been signed out.</p>
      <p style="margin: 0; font-size: 13px; color: #6B7280;">If you did not make this change, please contact ParcelHub support immediately.</p>
    </div>
  `.trim();

  await sendEmail({
    to: params.to,
    subject,
    text,
    html,
  });
}
