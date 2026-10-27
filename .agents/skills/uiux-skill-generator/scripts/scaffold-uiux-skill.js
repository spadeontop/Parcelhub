#!/usr/bin/env node

/**
 * scaffold-uiux-skill.js
 * Non-interactive CLI generator that produces a fully compliant, self-contained,
 * descriptive procedural UI/UX skill conforming to the agentskills.io specification.
 */

const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');

function showHelp() {
  console.log(`
Usage: node scaffold-uiux-skill.js [options]

Options:
  --name <slug>         Descriptive skill name (e.g. monochrome-saas-modern-design-skill) [Required]
  --archetype <name>    Design archetype: "Monochrome SaaS Modern", "Ultra-Minimal Clean",
                        "Cyber Dark", "Warm Editorial", "Enterprise Portal" [Default: Monochrome SaaS Modern]
  --brand-color <hex>   Primary brand/accent hex color [Default: archetype default]
  --target-dir <path>   Output directory path [Default: .agents/skills/<name>]
  --framework <name>    Styling framework: tailwind-v4 or vanilla-css [Default: tailwind-v4]
  --json                Output results as JSON
  --help                Show this help message
`);
}

const ARCHETYPES = {
  'Monochrome SaaS Modern': {
    slug: 'monochrome-saas',
    fontPrimary: 'Inter',
    fontMono: 'Geist Mono',
    bgLight: '#ffffff',
    bgDark: '#09090b',
    surfaceLight: '#f4f4f5',
    surfaceDark: '#121215',
    surfaceElevatedLight: '#e4e4e7',
    surfaceElevatedDark: '#18181b',
    textLight: '#09090b',
    textDark: '#fafafa',
    textMutedLight: '#71717a',
    textMutedDark: '#a1a1aa',
    borderLight: '#e4e4e7',
    borderDark: '#27272a',
    borderSubtleLight: '#f4f4f5',
    borderSubtleDark: '#1f1f23',
    primaryLight: '#18181b',
    primaryDark: '#fafafa',
    primaryFgLight: '#fafafa',
    primaryFgDark: '#09090b',
    mutedLight: '#f4f4f5',
    mutedDark: '#1c1c20',
  },
  'Ultra-Minimal Clean': {
    slug: 'ultra-minimal',
    fontPrimary: 'Inter',
    fontMono: 'JetBrains Mono',
    bgLight: '#fafafa',
    bgDark: '#0a0a0a',
    surfaceLight: '#ffffff',
    surfaceDark: '#141414',
    surfaceElevatedLight: '#f0f0f0',
    surfaceElevatedDark: '#1f1f1f',
    textLight: '#171717',
    textDark: '#ededed',
    textMutedLight: '#737373',
    textMutedDark: '#a3a3a3',
    borderLight: '#e5e5e5',
    borderDark: '#262626',
    borderSubtleLight: '#f0f0f0',
    borderSubtleDark: '#1c1c1c',
    primaryLight: '#0369a1',
    primaryDark: '#38bdf8',
    primaryFgLight: '#ffffff',
    primaryFgDark: '#082f49',
    mutedLight: '#f5f5f5',
    mutedDark: '#1a1a1a',
  },
  'Cyber Dark': {
    slug: 'cyber-dark',
    fontPrimary: 'Geist Sans',
    fontMono: 'Geist Mono',
    bgLight: '#f8fafc',
    bgDark: '#08090a',
    surfaceLight: '#ffffff',
    surfaceDark: '#0f1012',
    surfaceElevatedLight: '#f1f5f9',
    surfaceElevatedDark: '#17181c',
    textLight: '#0f172a',
    textDark: '#f1f5f9',
    textMutedLight: '#64748b',
    textMutedDark: '#8b949e',
    borderLight: '#cbd5e1',
    borderDark: '#22242a',
    borderSubtleLight: '#f1f5f9',
    borderSubtleDark: '#16181e',
    primaryLight: '#5e6ad2',
    primaryDark: '#707ee6',
    primaryFgLight: '#ffffff',
    primaryFgDark: '#08090a',
    mutedLight: '#f1f5f9',
    mutedDark: '#15171d',
  },
  'Warm Editorial': {
    slug: 'warm-editorial',
    fontPrimary: 'Plus Jakarta Sans',
    fontMono: 'IBM Plex Mono',
    bgLight: '#fbf9f5',
    bgDark: '#1c1917',
    surfaceLight: '#f5f0ea',
    surfaceDark: '#292524',
    surfaceElevatedLight: '#ede4d8',
    surfaceElevatedDark: '#35302d',
    textLight: '#292524',
    textDark: '#fafaf9',
    textMutedLight: '#78716c',
    textMutedDark: '#a8a29e',
    borderLight: '#e7e0d6',
    borderDark: '#44403c',
    borderSubtleLight: '#f0e9df',
    borderSubtleDark: '#2f2b28',
    primaryLight: '#c2410c',
    primaryDark: '#c2410c',
    primaryFgLight: '#ffffff',
    primaryFgDark: '#ffffff',
    mutedLight: '#ede5da',
    mutedDark: '#2d2825',
  },
  'Enterprise Portal': {
    slug: 'enterprise-portal',
    fontPrimary: 'Inter',
    fontMono: 'Roboto Mono',
    bgLight: '#f8fafc',
    bgDark: '#0f172a',
    surfaceLight: '#ffffff',
    surfaceDark: '#1e293b',
    surfaceElevatedLight: '#f1f5f9',
    surfaceElevatedDark: '#243046',
    textLight: '#0f172a',
    textDark: '#f8fafc',
    textMutedLight: '#64748b',
    textMutedDark: '#94a3b8',
    borderLight: '#cbd5e1',
    borderDark: '#334155',
    borderSubtleLight: '#e2e8f0',
    borderSubtleDark: '#1e293b',
    primaryLight: '#2563eb',
    primaryDark: '#2563eb',
    primaryFgLight: '#ffffff',
    primaryFgDark: '#ffffff',
    mutedLight: '#f1f5f9',
    mutedDark: '#1e293b',
  }
};

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const isJson = args.includes('--json');
  const nameIdx = args.indexOf('--name');
  if (nameIdx === -1) {
    console.error('Error: Missing required argument --name <slug>.');
    process.exit(1);
  }

  const skillName = args[nameIdx + 1];
  const nameRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  if (!nameRegex.test(skillName)) {
    console.error(`Error: Invalid skill name "${skillName}". Must be lowercase alphanumeric with hyphens.`);
    process.exit(1);
  }

  const archIdx = args.indexOf('--archetype');
  const archetypeInput = archIdx !== -1 ? args[archIdx + 1] : 'Monochrome SaaS Modern';
  const archetypeKey = Object.keys(ARCHETYPES).find(k => k.toLowerCase() === archetypeInput.toLowerCase()) || 'Monochrome SaaS Modern';
  const arch = ARCHETYPES[archetypeKey];

function parseHex(hex) {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  const num = parseInt(clean, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function sRGBtoLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function getLuminance(rgb) {
  return 0.2126 * sRGBtoLinear(rgb.r) + 0.7152 * sRGBtoLinear(rgb.g) + 0.0722 * sRGBtoLinear(rgb.b);
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(parseHex(hex1));
  const lum2 = getLuminance(parseHex(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function getBestForeground(hex) {
  const whiteContrast = getContrastRatio(hex, '#ffffff');
  const darkContrast = getContrastRatio(hex, '#09090b');
  return darkContrast >= whiteContrast ? '#09090b' : '#fafafa';
}

  const brandIdx = args.indexOf('--brand-color');
  if (brandIdx !== -1) {
    const brand = args[brandIdx + 1];
    arch.primaryLight = brand;
    arch.primaryDark = brand;
    arch.primaryFgLight = getBestForeground(brand);
    arch.primaryFgDark = getBestForeground(brand);
  }

  const frameworkIdx = args.indexOf('--framework');
  const framework = frameworkIdx !== -1 ? args[frameworkIdx + 1] : 'tailwind-v4';

  const targetIdx = args.indexOf('--target-dir');
  const targetDir = targetIdx !== -1 
    ? path.resolve(args[targetIdx + 1]) 
    : path.resolve(process.cwd(), '.agents/skills', skillName);

  const templatesDir = path.resolve(__dirname, '../assets/templates');
  if (!fs.existsSync(templatesDir)) {
    console.error(`Error: Templates directory not found at: ${templatesDir}`);
    process.exit(1);
  }

  // Tokens to replace
  const replacements = {
    '{{SKILL_NAME}}': skillName,
    '{{ARCHETYPE}}': archetypeKey,
    '{{FRAMEWORK}}': framework,
    '{{FONT_PRIMARY}}': arch.fontPrimary,
    '{{FONT_MONO}}': arch.fontMono,
    '{{COLOR_BG_LIGHT}}': arch.bgLight,
    '{{COLOR_BG_DARK}}': arch.bgDark,
    '{{COLOR_SURFACE_LIGHT}}': arch.surfaceLight,
    '{{COLOR_SURFACE_DARK}}': arch.surfaceDark,
    '{{COLOR_SURFACE_ELEVATED_LIGHT}}': arch.surfaceElevatedLight,
    '{{COLOR_SURFACE_ELEVATED_DARK}}': arch.surfaceElevatedDark,
    '{{COLOR_TEXT_LIGHT}}': arch.textLight,
    '{{COLOR_TEXT_DARK}}': arch.textDark,
    '{{COLOR_TEXT_MUTED_LIGHT}}': arch.textMutedLight,
    '{{COLOR_TEXT_MUTED_DARK}}': arch.textMutedDark,
    '{{COLOR_BORDER_LIGHT}}': arch.borderLight,
    '{{COLOR_BORDER_DARK}}': arch.borderDark,
    '{{COLOR_BORDER_SUBTLE_LIGHT}}': arch.borderSubtleLight,
    '{{COLOR_BORDER_SUBTLE_DARK}}': arch.borderSubtleDark,
    '{{COLOR_PRIMARY_LIGHT}}': arch.primaryLight,
    '{{COLOR_PRIMARY_DARK}}': arch.primaryDark,
    '{{COLOR_PRIMARY_FG_LIGHT}}': arch.primaryFgLight,
    '{{COLOR_PRIMARY_FG_DARK}}': arch.primaryFgDark,
    '{{COLOR_MUTED_LIGHT}}': arch.mutedLight,
    '{{COLOR_MUTED_DARK}}': arch.mutedDark,
  };

  function applyReplacements(content) {
    let result = content;
    for (const [k, v] of Object.entries(replacements)) {
      result = result.replaceAll(k, v);
    }
    return result;
  }

  // Create target directories
  const targetRefs = path.join(targetDir, 'references');
  const targetScripts = path.join(targetDir, 'scripts');
  fs.mkdirSync(targetRefs, { recursive: true });
  fs.mkdirSync(targetScripts, { recursive: true });

  // 1. Process SKILL.md
  const skillTpl = fs.readFileSync(path.join(templatesDir, 'SKILL.template.md'), 'utf8');
  fs.writeFileSync(path.join(targetDir, 'SKILL.md'), applyReplacements(skillTpl), 'utf8');

  // 2. Process references/
  const tplRefsDir = path.join(templatesDir, 'references');
  const refFiles = fs.readdirSync(tplRefsDir);
  for (const f of refFiles) {
    const raw = fs.readFileSync(path.join(tplRefsDir, f), 'utf8');
    fs.writeFileSync(path.join(targetRefs, f), applyReplacements(raw), 'utf8');
  }

  // 3. Process scripts/
  const tplScriptsDir = path.join(templatesDir, 'scripts');
  const scriptFiles = fs.readdirSync(tplScriptsDir);
  for (const s of scriptFiles) {
    const raw = fs.readFileSync(path.join(tplScriptsDir, s), 'utf8');
    fs.writeFileSync(path.join(targetScripts, s), applyReplacements(raw), 'utf8');
  }

  const generatedFiles = [
    'SKILL.md',
    ...refFiles.map(f => `references/${f}`),
    ...scriptFiles.map(s => `scripts/${s}`)
  ];

  if (isJson) {
    console.log(JSON.stringify({
      skillName,
      archetype: archetypeKey,
      targetDir,
      framework,
      generatedFilesCount: generatedFiles.length,
      generatedFiles
    }, null, 2));
  } else {
    console.log(`\n✓ Successfully scaffolded procedural UI/UX skill: ${skillName}`);
    console.log(`  Archetype:  ${archetypeKey}`);
    console.log(`  Target Dir: ${targetDir}`);
    console.log(`  Files:      ${generatedFiles.length} files created in skill package.\n`);
    console.log('Next Steps:');
    console.log(`  1. Validate spec: node ${path.relative(process.cwd(), path.join(__dirname, 'validate-skill-spec.js'))} ${targetDir}`);
    console.log(`  2. Test recipes:  node ${path.relative(process.cwd(), path.join(targetScripts, 'scaffold-component.js'))} --list`);
    console.log(`  3. Audit tokens:  node ${path.relative(process.cwd(), path.join(targetScripts, 'check-contrast.js'))}\n`);
  }
}

main();
