#!/usr/bin/env node

/**
 * verify-ui-compliance.js
 * Deterministic linter enforcing semantic token adherence, WCAG 2.1 accessibility,
 * interactive states, and heading hierarchy.
 */

const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');

function showHelp() {
  console.log(`
Usage: node verify-ui-compliance.js <target-file-or-dir> [options]

Options:
  --strict            Treat warnings (e.g. non-semantic gray palettes) as hard errors
  --json              Output diagnostics in machine-readable JSON format
  --help              Show this help message

Rules Enforced:
  1. NO_ARBITRARY_HEX     Detects inline hex codes like bg-[#121212] or text-[#fff]
  2. RAW_COLOR_PALETTES   Flags hardcoded Tailwind colors (e.g. bg-blue-600, text-zinc-400)
  3. INTERACTIVE_STATES   Ensures buttons have hover: and focus-visible:ring states
  4. ACCESSIBLE_NAMES     Ensures buttons have text or aria-label; images have alt attributes
  5. FORM_LABEL_LINK      Ensures inputs have associated label[for] or aria-label
  6. HEADING_HIERARCHY    Detects skipped heading levels (e.g. h1 directly to h3)
`);
}

function lintContent(content, filePath, strict = false) {
  const lines = content.split('\n');
  const diagnostics = [];

  // 1. Line-by-line checks
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    // NO_ARBITRARY_HEX: match bg-[#...], text-[#...], border-[#...]
    const arbitraryHexMatch = line.match(/(bg|text|border|ring|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]/g);
    if (arbitraryHexMatch) {
      for (const match of arbitraryHexMatch) {
        diagnostics.push({
          file: filePath,
          line: lineNum,
          level: 'error',
          rule: 'NO_ARBITRARY_HEX',
          message: `Found arbitrary hex token "${match}".`,
          remediation: `Replace "${match}" with a semantic token (e.g. bg-primary, bg-surface, text-foreground, border-border).`
        });
      }
    }

    // RAW_COLOR_PALETTES: flags non-semantic color classes
    const rawColorMatch = line.match(/(bg|text|border|ring)-(slate|zinc|neutral|stone|gray|red|orange|amber|yellow|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/g);
    if (rawColorMatch) {
      for (const match of rawColorMatch) {
        diagnostics.push({
          file: filePath,
          line: lineNum,
          level: strict ? 'error' : 'warning',
          rule: 'RAW_COLOR_PALETTES',
          message: `Found unmapped raw palette class "${match}".`,
          remediation: `Use semantic tokens instead: bg-surface, bg-muted, text-foreground, text-muted-foreground, bg-destructive, etc.`
        });
      }
    }

    // ACCESSIBLE_NAMES: Img missing alt
    const imgMatch = line.match(/<img\b([^>]*?)>/g);
    if (imgMatch) {
      for (const tag of imgMatch) {
        if (!tag.includes('alt=')) {
          diagnostics.push({
            file: filePath,
            line: lineNum,
            level: 'error',
            rule: 'ACCESSIBLE_NAMES',
            message: 'Image tag <img> missing "alt" attribute.',
            remediation: 'Add alt="Descriptive caption" or alt="" if decorative.'
          });
        }
      }
    }
  }

  // 2. Tag-level block checks using Regex
  // Check buttons
  const buttonRegex = /<button\b([^>]*?)>([\s\S]*?)<\/button>/gi;
  let btnMatch;
  while ((btnMatch = buttonRegex.exec(content)) !== null) {
    const attrs = btnMatch[1];
    const innerHtml = btnMatch[2].replace(/<[^>]+>/g, '').trim();
    const hasAriaLabel = /aria-label\s*=\s*["'][^"']+["']/i.test(attrs);
    const lineNum = content.substring(0, btnMatch.index).split('\n').length;

    // Accessible name
    if (innerHtml.length === 0 && !hasAriaLabel) {
      diagnostics.push({
        file: filePath,
        line: lineNum,
        level: 'error',
        rule: 'ACCESSIBLE_NAMES',
        message: 'Interactive <button> has no visible text and is missing an "aria-label".',
        remediation: 'Add aria-label="Action description" to icon-only buttons.'
      });
    }

    // Interactive states
    const classMatch = attrs.match(/class\s*=\s*["']([^"']+)["']/i);
    if (classMatch) {
      const classes = classMatch[1];
      const hasHover = classes.includes('hover:');
      const hasFocus = classes.includes('focus-visible:') || classes.includes('focus:');

      if (!hasHover) {
        diagnostics.push({
          file: filePath,
          line: lineNum,
          level: 'warning',
          rule: 'INTERACTIVE_STATES',
          message: '<button> is missing a hover state ("hover:bg-primary/90" or "hover:bg-muted").',
          remediation: 'Add appropriate hover: utility classes.'
        });
      }

      if (!hasFocus) {
        diagnostics.push({
          file: filePath,
          line: lineNum,
          level: 'error',
          rule: 'INTERACTIVE_STATES',
          message: '<button> is missing focus-visible outline rings.',
          remediation: 'Add "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring".'
        });
      }
    }
  }

  // Check inputs for label associations
  const inputRegex = /<input\b([^>]*?)>/gi;
  let inMatch;
  while ((inMatch = inputRegex.exec(content)) !== null) {
    const attrs = inMatch[1];
    const typeMatch = attrs.match(/type\s*=\s*["']([^"']+)["']/i);
    const inputType = typeMatch ? typeMatch[1].toLowerCase() : 'text';
    const lineNum = content.substring(0, inMatch.index).split('\n').length;

    if (inputType !== 'hidden' && inputType !== 'submit' && inputType !== 'button') {
      const idMatch = attrs.match(/id\s*=\s*["']([^"']+)["']/i);
      const hasAriaLabel = /aria-label\s*=\s*["'][^"']+["']/i.test(attrs);

      if (!idMatch && !hasAriaLabel) {
        diagnostics.push({
          file: filePath,
          line: lineNum,
          level: 'error',
          rule: 'FORM_LABEL_LINK',
          message: `<input type="${inputType}"> has neither an id nor an aria-label.`,
          remediation: 'Provide an id with a corresponding <label for="id"> or add an aria-label.'
        });
      } else if (idMatch) {
        const inputId = idMatch[1];
        const labelRegex = new RegExp(`<label[^>]*?\\bfor\\s*=\\s*["']${inputId}["']`, 'i');
        if (!labelRegex.test(content) && !hasAriaLabel) {
          diagnostics.push({
            file: filePath,
            line: lineNum,
            level: 'error',
            rule: 'FORM_LABEL_LINK',
            message: `<input id="${inputId}"> does not have a matching <label for="${inputId}">.`,
            remediation: `Add <label for="${inputId}">Label text</label> or add aria-label.`
          });
        }
      }
    }
  }

  // Check heading hierarchy
  const headingRegex = /<h([1-6])\b[^>]*>/gi;
  let hMatch;
  let lastHeadingLevel = 0;
  while ((hMatch = headingRegex.exec(content)) !== null) {
    const currentLevel = parseInt(hMatch[1], 10);
    const lineNum = content.substring(0, hMatch.index).split('\n').length;

    if (lastHeadingLevel > 0 && currentLevel > lastHeadingLevel + 1) {
      diagnostics.push({
        file: filePath,
        line: lineNum,
        level: 'warning',
        rule: 'HEADING_HIERARCHY',
        message: `Heading hierarchy skipped from <h${lastHeadingLevel}> to <h${currentLevel}>.`,
        remediation: `Use intermediate <h${lastHeadingLevel + 1}> or adjust heading level.`
      });
    }
    lastHeadingLevel = currentLevel;
  }

  return diagnostics;
}

function processTarget(targetPath, strict) {
  const stat = fs.statSync(targetPath);
  let files = [];

  if (stat.isDirectory()) {
    const entries = fs.readdirSync(targetPath, { recursive: true });
    for (const entry of entries) {
      const ext = path.extname(entry).toLowerCase();
      if (['.html', '.jsx', '.tsx', '.vue', '.svelte'].includes(ext)) {
        files.push(path.join(targetPath, entry));
      }
    }
  } else {
    files.push(targetPath);
  }

  let allDiagnostics = [];

  for (const f of files) {
    try {
      const content = fs.readFileSync(f, 'utf8');
      const diags = lintContent(content, f, strict);
      allDiagnostics = allDiagnostics.concat(diags);
    } catch (err) {
      allDiagnostics.push({
        file: f,
        line: 0,
        level: 'error',
        rule: 'FILE_READ_ERROR',
        message: err.message,
        remediation: 'Check file path and read permissions.'
      });
    }
  }

  return allDiagnostics;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const isJson = args.includes('--json');
  const strict = args.includes('--strict');
  const targetPath = args.find(a => !a.startsWith('--'));

  if (!targetPath) {
    console.error('Error: Missing target file or directory.');
    process.exit(1);
  }

  const resolved = path.resolve(targetPath);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: Target not found at: ${resolved}`);
    process.exit(1);
  }

  const diagnostics = processTarget(resolved, strict);
  const errors = diagnostics.filter(d => d.level === 'error');
  const warnings = diagnostics.filter(d => d.level === 'warning');

  if (isJson) {
    console.log(JSON.stringify({
      target: resolved,
      totalIssues: diagnostics.length,
      errorsCount: errors.length,
      warningsCount: warnings.length,
      passed: errors.length === 0,
      diagnostics
    }, null, 2));
  } else {
    console.log(`UI/UX Compliance Linter Report: ${resolved}\n`);
    if (diagnostics.length === 0) {
      console.log('✓ [PASS] Zero compliance issues detected. UI adheres strictly to design tokens and accessibility guidelines.');
      process.exit(0);
    }

    for (const d of diagnostics) {
      const tag = d.level === 'error' ? '✖ [ERROR]' : '▲ [WARN]';
      console.log(`${tag} ${d.file}:${d.line}`);
      console.log(`  Rule: ${d.rule}`);
      console.log(`  Issue: ${d.message}`);
      console.log(`  Fix:   ${d.remediation}\n`);
    }

    console.log(`Summary: ${errors.length} error(s), ${warnings.length} warning(s).`);
    if (errors.length > 0) {
      console.error('\nResult: FAILED. Remediation required.');
      process.exit(1);
    } else {
      console.log('\nResult: PASSED with warnings.');
      process.exit(0);
    }
  }
}

main();
