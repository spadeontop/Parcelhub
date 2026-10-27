#!/usr/bin/env node

/**
 * check-contrast.js
 * Zero-dependency mathematical WCAG 2.1 contrast ratio calculator.
 * Standard: WCAG 2.1 AA requires 4.5:1 for normal text, 3.0:1 for large text and UI components.
 */

const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');

function parseHex(hex) {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function sRGBtoLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function getLuminance(rgb) {
  const r = sRGBtoLinear(rgb.r);
  const g = sRGBtoLinear(rgb.g);
  const b = sRGBtoLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(parseHex(hex1));
  const lum2 = getLuminance(parseHex(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function showHelp() {
  console.log(`
Usage: node check-contrast.js [options]

Options:
  --hex1 <color>     First hex color (e.g. #ffffff)
  --hex2 <color>     Second hex color (e.g. #09090b)
  --tokens <path>    Path to semantic-tokens.md to audit all default token pairings
  --json             Output results in JSON format
  --help             Show this help message
`);
}

function auditTokensFile(tokensFilePath) {
  if (!fs.existsSync(tokensFilePath)) {
    throw new Error(`Tokens file not found at: ${tokensFilePath}`);
  }
  const content = fs.readFileSync(tokensFilePath, 'utf8');
  
  // Extract CSS variables block
  const rootMatch = content.match(/:root\s*\{([^}]+)\}/s);
  const darkMatch = content.match(/\.dark\s*\{([^}]+)\}/s);

  function parseVars(block) {
    const vars = {};
    if (!block) return vars;
    const lines = block[1].split('\n');
    for (const line of lines) {
      const match = line.match(/--([\w-]+):\s*(#[0-9a-fA-F]{3,8})/);
      if (match) {
        vars[match[1]] = match[2];
      }
    }
    return vars;
  }

  const lightVars = parseVars(rootMatch);
  const darkVars = parseVars(darkMatch);

  const checks = [
    { mode: 'Light', fg: 'foreground', bg: 'background', target: 4.5, role: 'Normal Text' },
    { mode: 'Light', fg: 'foreground', bg: 'surface', target: 4.5, role: 'Surface Text' },
    { mode: 'Light', fg: 'muted-foreground', bg: 'background', target: 4.5, role: 'Muted Text' },
    { mode: 'Light', fg: 'primary-foreground', bg: 'primary', target: 4.5, role: 'Primary Button CTA' },
    { mode: 'Light', fg: 'border', bg: 'background', target: 1.2, role: 'Structural Border' },
    { mode: 'Dark', fg: 'foreground', bg: 'background', target: 4.5, role: 'Normal Text' },
    { mode: 'Dark', fg: 'foreground', bg: 'surface', target: 4.5, role: 'Surface Text' },
    { mode: 'Dark', fg: 'muted-foreground', bg: 'background', target: 4.5, role: 'Muted Text' },
    { mode: 'Dark', fg: 'primary-foreground', bg: 'primary', target: 4.5, role: 'Primary Button CTA' },
    { mode: 'Dark', fg: 'border', bg: 'background', target: 1.2, role: 'Structural Border' }
  ];

  const results = [];
  let failures = 0;

  for (const check of checks) {
    const vars = check.mode === 'Light' ? lightVars : darkVars;
    const fgColor = vars[check.fg];
    const bgColor = vars[check.bg];

    if (!fgColor || !bgColor) {
      continue;
    }

    const ratio = Math.round(getContrastRatio(fgColor, bgColor) * 100) / 100;
    const pass = ratio >= check.target;
    if (!pass) failures++;

    results.push({
      mode: check.mode,
      role: check.role,
      foreground: `${check.fg} (${fgColor})`,
      background: `${check.bg} (${bgColor})`,
      ratio: `${ratio}:1`,
      required: `${check.target}:1`,
      pass,
    });
  }

  return { results, failures };
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  const isJson = args.includes('--json');
  const hex1Idx = args.indexOf('--hex1');
  const hex2Idx = args.indexOf('--hex2');
  const tokensIdx = args.indexOf('--tokens');

  if (hex1Idx !== -1 && hex2Idx !== -1) {
    const hex1 = args[hex1Idx + 1];
    const hex2 = args[hex2Idx + 1];
    const ratio = Math.round(getContrastRatio(hex1, hex2) * 100) / 100;
    const passAA = ratio >= 4.5;
    const passAAA = ratio >= 7.0;
    const passUI = ratio >= 3.0;

    if (isJson) {
      console.log(JSON.stringify({ hex1, hex2, ratio, passAA, passAAA, passUI }, null, 2));
    } else {
      console.log(`Contrast between ${hex1} and ${hex2}:`);
      console.log(`  Ratio: ${ratio}:1`);
      console.log(`  WCAG AA (4.5:1):       ${passAA ? 'PASS' : 'FAIL'}`);
      console.log(`  WCAG AAA (7.0:1):      ${passAAA ? 'PASS' : 'FAIL'}`);
      console.log(`  UI Components (3.0:1): ${passUI ? 'PASS' : 'FAIL'}`);
    }
    process.exit(passAA ? 0 : 1);
  }

  const defaultTokensPath = path.resolve(__dirname, '../references/semantic-tokens.md');
  const tokensPath = tokensIdx !== -1 ? path.resolve(args[tokensIdx + 1]) : defaultTokensPath;

  try {
    const { results, failures } = auditTokensFile(tokensPath);
    if (isJson) {
      console.log(JSON.stringify({ tokensPath, results, failures, pass: failures === 0 }, null, 2));
    } else {
      console.log(`Auditing Semantic Tokens Contrast: ${tokensPath}\n`);
      console.table(results);
      if (failures > 0) {
        console.error(`\n[FAIL] Found ${failures} contrast violations below WCAG AA requirements.`);
        process.exit(1);
      } else {
        console.log(`\n[PASS] All evaluated token pairings meet or exceed WCAG requirements.`);
        process.exit(0);
      }
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
