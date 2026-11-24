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

function renderParcelHubLogo(): string {
  const configuredUrl = process.env.EMAIL_LOGO_URL?.trim();
  if (configuredUrl) {
    return `<img src="${escapeHtml(configuredUrl)}" alt="ParcelHub" width="32" height="32" style="display: block; width: 32px; height: 32px;" />`;
  }

  // Exact geometric ParcelHub logo (matching logo.svg) rendered with pure HTML table cells
  // so Gmail/Outlook display it inline with zero file attachments and no stripped <svg> tags.
  const c = (w: number, h: number, bg: string) =>
    `<td width="${w}" height="${h}" style="width: ${w}px; height: ${h}px; background-color: ${bg}; font-size: 0; line-height: 0; padding: 0;">&nbsp;</td>`;

  return `
<table role="presentation" width="32" height="32" cellspacing="0" cellpadding="0" border="0" style="width: 32px; height: 32px; background-color: #1E1E1E; border-radius: 9px; border-collapse: separate;">
  <tr>
    <td align="center" valign="middle" style="padding: 4px; font-size: 0; line-height: 0;">
      <table role="presentation" width="24" height="24" cellspacing="0" cellpadding="0" border="0" style="width: 24px; height: 24px; border-collapse: collapse;">
        <tr>${c(5, 5, "#FFFFFF")}${c(2, 5, "#FFFFFF")}${c(10, 5, "#FFFFFF")}${c(2, 5, "#1E1E1E")}${c(5, 5, "#FFFFFF")}</tr>
        <tr>${c(5, 2, "#FFFFFF")}${c(2, 2, "#1E1E1E")}${c(10, 2, "#1E1E1E")}${c(2, 2, "#1E1E1E")}${c(5, 2, "#FFFFFF")}</tr>
        <tr>${c(5, 10, "#FFFFFF")}${c(2, 10, "#1E1E1E")}${c(10, 10, "#2563EB")}${c(2, 10, "#1E1E1E")}${c(5, 10, "#FFFFFF")}</tr>
        <tr>${c(5, 2, "#FFFFFF")}${c(2, 2, "#1E1E1E")}${c(10, 2, "#1E1E1E")}${c(2, 2, "#1E1E1E")}${c(5, 2, "#FFFFFF")}</tr>
        <tr>${c(5, 5, "#FFFFFF")}${c(2, 5, "#1E1E1E")}${c(10, 5, "#FFFFFF")}${c(2, 5, "#FFFFFF")}${c(5, 5, "#FFFFFF")}</tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}

const EMAIL_FONT_STACK =
  "'Google Sans', 'Product Sans', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

function renderEmailLayout(params: {
  preheader: string;
  heading: string;
  bodyHtml: string;
  footerNote?: string;
}): string {
  const logoHtml = renderParcelHubLogo();

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <title>${escapeHtml(params.heading)}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #FFFFFF; font-family: ${EMAIL_FONT_STACK}; color: #111827; -webkit-font-smoothing: antialiased;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${escapeHtml(params.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFFFF;">
      <tr>
        <td align="center" style="padding: 44px 20px 56px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 440px; text-align: left;">
            <tr>
              <td style="padding-bottom: 36px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 10px;">${logoHtml}</td>
                    <td style="vertical-align: middle; font-family: ${EMAIL_FONT_STACK}; font-size: 18px; font-weight: 700; color: #111827; letter-spacing: -0.02em;">Parcel<span style="color: #2563EB;">Hub</span></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <h1 style="margin: 0; font-family: ${EMAIL_FONT_STACK}; font-size: 26px; font-weight: 700; color: #111827; letter-spacing: -0.025em; line-height: 1.24;">${escapeHtml(params.heading)}</h1>
              </td>
            </tr>
            <tr>
              <td>
                ${params.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding-top: 40px;">
                <p style="margin: 0 0 6px; font-family: ${EMAIL_FONT_STACK}; font-size: 12px; line-height: 1.6; color: #9CA3AF;">${escapeHtml(params.footerNote || "Didn't request this? You can safely ignore this email.")}</p>
                <p style="margin: 0; font-family: ${EMAIL_FONT_STACK}; font-size: 12px; color: #D1D5DB;">ParcelHub</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
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

  const bodyHtml = `
    <p style="margin: 0 0 28px; font-family: ${EMAIL_FONT_STACK}; font-size: 15px; line-height: 1.65; color: #4B5563;">Hi ${escapeHtml(greetingName)}, ${escapeHtml(meta.instruction.charAt(0).toLowerCase() + meta.instruction.slice(1))}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px;">
      <tr>
        <td align="center" style="background-color: #F4F7FF; border-radius: 14px; padding: 26px 20px;">
          <span style="display: inline-block; font-family: ${EMAIL_FONT_STACK}; font-size: 38px; font-weight: 700; letter-spacing: 10px; padding-left: 10px; color: #2563EB; line-height: 1.1; font-variant-numeric: tabular-nums;">${escapeHtml(params.code)}</span>
        </td>
      </tr>
    </table>
    <p style="margin: 0; font-family: ${EMAIL_FONT_STACK}; font-size: 13px; line-height: 1.6; color: #6B7280;">Expires in <span style="color: #111827; font-weight: 600;">${params.ttlMinutes} minutes</span>. Don't share this code with anyone.</p>
  `.trim();

  const html = renderEmailLayout({
    preheader: `Your ParcelHub code is ${params.code}. Expires in ${params.ttlMinutes} minutes.`,
    heading: meta.heading,
    bodyHtml,
  });

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

  const bodyHtml = `
    <p style="margin: 0 0 24px; font-family: ${EMAIL_FONT_STACK}; font-size: 15px; line-height: 1.65; color: #4B5563;">Hi ${escapeHtml(greetingName)}, your ParcelHub account <span style="color: #111827; font-weight: 600;">${escapeHtml(label)}</span> was just reset. All previous sessions have been signed out for your security.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0;">
      <tr>
        <td style="background-color: #F4F7FF; border-radius: 12px; padding: 16px 18px; font-family: ${EMAIL_FONT_STACK}; font-size: 13px; line-height: 1.6; color: #1D4ED8;">
          Wasn't you? Contact ParcelHub support immediately to secure your account.
        </td>
      </tr>
    </table>
  `.trim();

  const html = renderEmailLayout({
    preheader: `Your ParcelHub account ${label} was changed.`,
    heading: `Your ${label} was changed`,
    bodyHtml,
    footerNote: "Sent because a security credential on your ParcelHub account was updated.",
  });

  await sendEmail({
    to: params.to,
    subject,
    text,
    html,
  });
}
