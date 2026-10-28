# Curated Design Archetypes & Skill Naming

This reference catalogues standard design archetypes used by `uiux-skill-generator` to scaffold descriptive, domain-specific procedural skills. Each archetype provides predefined color contracts, typography pairings, and semantic token defaults.

> [!IMPORTANT]
> **Reference Scope Restriction**: This generator and its archetypes are strictly bound to reference **ONLY** `web/` (`web/index.html`, `web/style.css`, `web/app.js`, `web/assets/`). Do not check or inspect other folders.

---

## 1. Naming Convention for Generated Skills

All generated UI/UX skills must be named descriptively following the pattern:
```text
<archetype-slug>-<domain>-skill
```
*Examples*:
- `parcelhub-mobile-web-skill` (Default for `web/`)
- `monochrome-saas-modern-design-skill`
- `cyber-dark-fintech-analytics-skill`

---

## 2. Archetype Catalog

### 1. ParcelHub Mobile Web (Primary Default)
- **Default Skill Name**: `parcelhub-mobile-web-skill`
- **Reference Target**: Sourced 1:1 from `web/` (`web/style.css`, `web/index.html`, `web/app.js`).
- **Vibe**: High-trust mobile fintech, delivery hub operations, zero-credit escrow security, tactile device ergonomics.
- **Dominant (60%)**: Background `#ffffff` (Mobile canvas) / `#0f172a` (Studio backdrop), Surface `#f8f8f8`, Dark Card `#1e1e1e`.
- **Secondary (30%)**: Surface Elevated `#163b86` (Navy), Borders `#e5e7eb` (Light) / `#374151` (Dark frame), Muted Text `#6b7280`.
- **Accent (10%)**: Primary Blue `#215cd4` (Hover `#194cb5`), Pill Green `#93eb99`, Emerald `#10b780`, Warning Gold `#c58b12`, Danger Red `#ef4444`.
- **Typography**: Google Sans Flex / Plus Jakarta Sans for UI headers/body, JetBrains Mono for monetary amounts, order IDs, and timestamps.
- **Corner Radii & Framing**: Phone bezel `rounded-[48px]`, dynamic island `rounded-[20px]`, floating nav `rounded-full`, cards `rounded-2xl` to `rounded-3xl`.

### 2. Monochrome SaaS Modern
- **Default Skill Name**: `monochrome-saas-modern-design-skill`
- **Vibe**: High-contrast, clean, confident, minimalist product engineering (Vercel / Raycast aesthetic).
- **Dominant (60%)**: Background `#09090b` (Dark) / `#ffffff` (Light), Surface `#121215` (Dark) / `#f4f4f5` (Light).
- **Secondary (30%)**: Surface Elevated `#18181b` (Dark) / `#e4e4e7` (Light), Borders `#27272a` (Dark) / `#e4e4e7` (Light).
- **Accent (10%)**: Primary `#ffffff` (Dark text on white pill) / `#18181b` (White text on black pill).
- **Typography**: Inter or Geist Sans. Tight tracking (`tracking-tight`), crisp contrast, clear hierarchy.
- **Corner Radii**: Standard `rounded-md` (6px) or `rounded-lg` (8px), sharp inputs.

### 2. Ultra-Minimal Clean
- **Default Skill Name**: `ultra-minimal-clean-docs-skill`
- **Vibe**: Pure readability, whitespace-driven, stark typographic structure (Stripe docs, Substack).
- **Dominant (60%)**: Background `#fafafa` (Light) / `#0a0a0a` (Dark), Surface `#ffffff` (Light) / `#141414` (Dark).
- **Secondary (30%)**: Borders `#e5e5e5` (Light) / `#262626` (Dark), Muted `#737373`.
- **Accent (10%)**: Crisp Blue `#0369a1` or Neutral Slate `#0f172a`.
- **Typography**: Inter + JetBrains Mono for code. Balanced leading (`leading-relaxed`).
- **Corner Radii**: Subdued `rounded-sm` (4px) to `rounded-md` (6px).

### 3. Cyber Dark / High-Density Linear
- **Default Skill Name**: `cyber-dark-fintech-analytics-skill`
- **Vibe**: Deep space canvas, subtle glow accents, intense data density (Linear, Datadog).
- **Dominant (60%)**: Canvas `#08090a`, Surface `#0f1012`.
- **Secondary (30%)**: Surface Elevated `#17181c`, Borders `#cbd5e1` (Light) / `#22242a` (Dark), Muted Text `#8b949e`.
- **Accent (10%)**: Electric Indigo `#5e6ad2` or Cyan `#00e5ff`.
- **Typography**: Geist Sans or Outfit. Monospace numerals for metric cards.
- **Corner Radii**: Precision `rounded-md` (6px), micro borders (`border border-border/60`).

### 4. Warm Editorial
- **Default Skill Name**: `warm-editorial-content-skill`
- **Vibe**: Sophisticated, human-centric, publishing and media-rich layouts.
- **Dominant (60%)**: Background `#fbf9f5` (Warm Cream) / `#1c1917` (Dark Stone).
- **Secondary (30%)**: Surface `#f5f0ea`, Borders `#e7e0d6`, Muted `#78716c`.
- **Accent (10%)**: Deep Terracotta `#c2410c` or Forest `#15803d`.
- **Typography**: Serif Headings (Fraunces or Playfair Display) paired with Sans Body (Plus Jakarta Sans).
- **Corner Radii**: Soft `rounded-xl` (12px), tactile button depths.

### 5. Enterprise Data-Dense Portal
- **Default Skill Name**: `enterprise-data-dense-portal-skill`
- **Vibe**: High data throughput, compact tables, minimal padding, high reliability.
- **Dominant (60%)**: Background `#f8fafc` (Light) / `#0f172a` (Dark).
- **Secondary (30%)**: Surface `#ffffff` (Light) / `#1e293b` (Dark), Grid Borders `#cbd5e1`.
- **Accent (10%)**: Royal Corporate Blue `#2563eb`.
- **Typography**: Roboto or Inter. Compact table typography (`text-xs font-mono`).
- **Corner Radii**: Standardized `rounded-none` or `rounded-sm` (3px).

---

## 3. Archetype Mapping Table

| Archetype Slug | Suggested Domain | Primary Accent | Base Font | Default Framework |
| :--- | :--- | :--- | :--- | :--- |
| `parcelhub-mobile-web` | Mobile Fintech, Delivery Hub (`web/`) | `#215cd4` | Google Sans / Plus Jakarta | Tailwind / CSS |
| `monochrome-saas` | SaaS, DevTools | `#18181b` / `#ffffff` | Inter / Geist | Tailwind v4 |
| `ultra-minimal` | Documentation, Blogs | `#0369a1` | Inter | Tailwind v4 / CSS |
| `cyber-dark` | Analytics, Crypto | `#5e6ad2` | Geist / Mono | Tailwind v4 |
| `warm-editorial` | Magazines, Portfolios| `#c2410c` | Serif + Sans | Tailwind v4 |
| `enterprise-portal`| Admin CRM, ERP | `#2563eb` | Inter | Tailwind v4 |
