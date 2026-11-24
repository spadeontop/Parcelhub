import { renderEmailLayout, renderInfoCallout } from "./components";
import { EMAIL_FONT_STACK, EMAIL_THEME, escapeHtml, type RenderedEmailTemplate } from "./theme";

export interface SecurityAlertEmailTemplateParams {
  firstName?: string | null;
  credentialChanged: "password" | "MPIN";
}

export function renderSecurityAlertEmailTemplate(
  params: SecurityAlertEmailTemplateParams
): RenderedEmailTemplate {
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
    <p style="margin: 0 0 24px; font-family: ${EMAIL_FONT_STACK}; font-size: 15px; line-height: 1.65; color: ${EMAIL_THEME.textSecondary};">Hi ${escapeHtml(greetingName)}, your ParcelHub account <span style="color: ${EMAIL_THEME.textPrimary}; font-weight: 600;">${escapeHtml(label)}</span> was just reset. All previous sessions have been signed out for your security.</p>
    ${renderInfoCallout("Wasn't you? Contact ParcelHub support immediately to secure your account.")}
  `.trim();

  const html = renderEmailLayout({
    preheader: `Your ParcelHub account ${label} was changed.`,
    heading: `Your ${label} was changed`,
    bodyHtml,
    footerNote: "Sent because a security credential on your ParcelHub account was updated.",
  });

  return {
    subject,
    text,
    html,
  };
}
