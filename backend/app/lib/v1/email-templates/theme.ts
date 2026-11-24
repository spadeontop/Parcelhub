export const EMAIL_FONT_STACK =
  "'Google Sans', 'Product Sans', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export const EMAIL_THEME = {
  background: "#FFFFFF",
  surfaceTint: "#F4F7FF",
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  logoDark: "#1E1E1E",
  textPrimary: "#111827",
  textSecondary: "#4B5563",
  textMuted: "#6B7280",
  textSubtle: "#9CA3AF",
  textFaint: "#D1D5DB",
  maxWidthPx: 440,
} as const;

export interface RenderedEmailTemplate {
  subject: string;
  text: string;
  html: string;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
