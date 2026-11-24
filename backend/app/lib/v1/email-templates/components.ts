import { EMAIL_FONT_STACK, EMAIL_THEME, escapeHtml } from "./theme";

export function renderParcelHubLogo(): string {
  const configuredUrl = process.env.EMAIL_LOGO_URL?.trim();
  if (configuredUrl) {
    return `<img src="${escapeHtml(configuredUrl)}" alt="ParcelHub" width="32" height="32" style="display: block; width: 32px; height: 32px;" />`;
  }

  // Exact geometric ParcelHub logo (matching logo.svg) rendered with pure HTML table cells
  // so Gmail/Outlook display it inline with zero file attachments and no stripped <svg> tags.
  const cell = (w: number, h: number, bg: string) =>
    `<td width="${w}" height="${h}" style="width: ${w}px; height: ${h}px; background-color: ${bg}; font-size: 0; line-height: 0; padding: 0;">&nbsp;</td>`;

  const dark = EMAIL_THEME.logoDark;
  const blue = EMAIL_THEME.primary;
  const white = EMAIL_THEME.background;

  return `
<table role="presentation" width="32" height="32" cellspacing="0" cellpadding="0" border="0" style="width: 32px; height: 32px; background-color: ${dark}; border-radius: 9px; border-collapse: separate;">
  <tr>
    <td align="center" valign="middle" style="padding: 4px; font-size: 0; line-height: 0;">
      <table role="presentation" width="24" height="24" cellspacing="0" cellpadding="0" border="0" style="width: 24px; height: 24px; border-collapse: collapse;">
        <tr>${cell(5, 5, white)}${cell(2, 5, white)}${cell(10, 5, white)}${cell(2, 5, dark)}${cell(5, 5, white)}</tr>
        <tr>${cell(5, 2, white)}${cell(2, 2, dark)}${cell(10, 2, dark)}${cell(2, 2, dark)}${cell(5, 2, white)}</tr>
        <tr>${cell(5, 10, white)}${cell(2, 10, dark)}${cell(10, 10, blue)}${cell(2, 10, dark)}${cell(5, 10, white)}</tr>
        <tr>${cell(5, 2, white)}${cell(2, 2, dark)}${cell(10, 2, dark)}${cell(2, 2, dark)}${cell(5, 2, white)}</tr>
        <tr>${cell(5, 5, white)}${cell(2, 5, dark)}${cell(10, 5, white)}${cell(2, 5, white)}${cell(5, 5, white)}</tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}

export function renderBrandHeader(): string {
  const logoHtml = renderParcelHubLogo();

  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="vertical-align: middle; padding-right: 10px;">${logoHtml}</td>
    <td style="vertical-align: middle; font-family: ${EMAIL_FONT_STACK}; font-size: 18px; font-weight: 700; color: ${EMAIL_THEME.textPrimary}; letter-spacing: -0.02em;">Parcel<span style="color: ${EMAIL_THEME.primary};">Hub</span></td>
  </tr>
</table>`.trim();
}

export function renderOtpCodeBlock(code: string): string {
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px;">
  <tr>
    <td align="center" style="background-color: ${EMAIL_THEME.surfaceTint}; border-radius: 14px; padding: 26px 20px;">
      <span style="display: inline-block; font-family: ${EMAIL_FONT_STACK}; font-size: 38px; font-weight: 700; letter-spacing: 10px; padding-left: 10px; color: ${EMAIL_THEME.primary}; line-height: 1.1; font-variant-numeric: tabular-nums;">${escapeHtml(code)}</span>
    </td>
  </tr>
</table>`.trim();
}

export function renderInfoCallout(message: string): string {
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0;">
  <tr>
    <td style="background-color: ${EMAIL_THEME.surfaceTint}; border-radius: 12px; padding: 16px 18px; font-family: ${EMAIL_FONT_STACK}; font-size: 13px; line-height: 1.6; color: ${EMAIL_THEME.primaryDark};">
      ${escapeHtml(message)}
    </td>
  </tr>
</table>`.trim();
}

export function renderEmailLayout(params: {
  preheader: string;
  heading: string;
  bodyHtml: string;
  footerNote?: string;
}): string {
  const headerHtml = renderBrandHeader();
  const footerNote = params.footerNote || "Didn't request this? You can safely ignore this email.";

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <title>${escapeHtml(params.heading)}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${EMAIL_THEME.background}; font-family: ${EMAIL_FONT_STACK}; color: ${EMAIL_THEME.textPrimary}; -webkit-font-smoothing: antialiased;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${escapeHtml(params.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${EMAIL_THEME.background};">
      <tr>
        <td align="center" style="padding: 44px 20px 56px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: ${EMAIL_THEME.maxWidthPx}px; text-align: left;">
            <tr>
              <td style="padding-bottom: 36px;">
                ${headerHtml}
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <h1 style="margin: 0; font-family: ${EMAIL_FONT_STACK}; font-size: 26px; font-weight: 700; color: ${EMAIL_THEME.textPrimary}; letter-spacing: -0.025em; line-height: 1.24;">${escapeHtml(params.heading)}</h1>
              </td>
            </tr>
            <tr>
              <td>
                ${params.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding-top: 40px;">
                <p style="margin: 0 0 6px; font-family: ${EMAIL_FONT_STACK}; font-size: 12px; line-height: 1.6; color: ${EMAIL_THEME.textSubtle};">${escapeHtml(footerNote)}</p>
                <p style="margin: 0; font-family: ${EMAIL_FONT_STACK}; font-size: 12px; color: ${EMAIL_THEME.textFaint};">ParcelHub</p>
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
