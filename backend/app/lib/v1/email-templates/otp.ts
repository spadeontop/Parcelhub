import type { EmailVerificationPurpose } from "@/app/types/v1/api";
import { renderEmailLayout, renderOtpCodeBlock } from "./components";
import { EMAIL_FONT_STACK, EMAIL_THEME, escapeHtml, type RenderedEmailTemplate } from "./theme";

export interface OtpEmailTemplateParams {
  purpose: EmailVerificationPurpose;
  code: string;
  firstName?: string | null;
  ttlMinutes: number;
}

export function getOtpTemplateMeta(purpose: EmailVerificationPurpose): {
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

export function renderOtpEmailTemplate(params: OtpEmailTemplateParams): RenderedEmailTemplate {
  const meta = getOtpTemplateMeta(params.purpose);
  const greetingName = params.firstName?.trim() || "there";
  const inlineInstruction = meta.instruction.charAt(0).toLowerCase() + meta.instruction.slice(1);

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
    <p style="margin: 0 0 28px; font-family: ${EMAIL_FONT_STACK}; font-size: 15px; line-height: 1.65; color: ${EMAIL_THEME.textSecondary};">Hi ${escapeHtml(greetingName)}, ${escapeHtml(inlineInstruction)}</p>
    ${renderOtpCodeBlock(params.code)}
    <p style="margin: 0; font-family: ${EMAIL_FONT_STACK}; font-size: 13px; line-height: 1.6; color: ${EMAIL_THEME.textMuted};">Expires in <span style="color: ${EMAIL_THEME.textPrimary}; font-weight: 600;">${params.ttlMinutes} minutes</span>. Don't share this code with anyone.</p>
  `.trim();

  const html = renderEmailLayout({
    preheader: `Your ParcelHub code is ${params.code}. Expires in ${params.ttlMinutes} minutes.`,
    heading: meta.heading,
    bodyHtml,
  });

  return {
    subject: meta.subject,
    text,
    html,
  };
}
