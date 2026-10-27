#!/usr/bin/env node

/**
 * extend-skill.js
 * Non-interactive CLI helper to programmatically iterate and extend the skill
 * following the strict iteration-protocol.md specification.
 */

const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');

function showHelp() {
  console.log(`
Usage: node extend-skill.js [options]

Add Component Recipe:
  --add-component <name>       Name of new component (e.g. accordion, badge, drawer)
  --description <text>         Brief functional description
  --markup <html-file-path>    Optional path to HTML file containing canonical snippet (alias: --file)
  --file <html-file-path>      Alias for --markup

Add Semantic Token:
  --add-token <name>           Name of token (e.g. warning-subtle, brand-glow)
  --value-light <hex>          Light mode hex value (e.g. #fef3c7)
  --value-dark <hex>           Dark mode hex value (e.g. #78350f)
  --role <text>                Functional role description

General:
  --help                       Show this help message
`);
}

function addComponent(name, description, markupPath) {
  const rootDir = path.resolve(__dirname, '..');
  const refDir = path.join(rootDir, 'references');
  const skillMdPath = path.join(rootDir, 'SKILL.md');
  const targetRefPath = path.join(refDir, `${name}.md`);

  if (fs.existsSync(targetRefPath)) {
    console.error(`Error: Component reference already exists at: ${targetRefPath}`);
    process.exit(1);
  }

  let canonicalSnippet = `<!-- Default ${name} snippet -->\n<div class="p-4 rounded-md bg-surface border border-border text-foreground">\n  <span>${name} component</span>\n</div>`;
  if (markupPath && fs.existsSync(markupPath)) {
    canonicalSnippet = fs.readFileSync(markupPath, 'utf8').trim();
  }

  const template = `# ${name.charAt(0).toUpperCase() + name.slice(1)} Recipe

This document defines the canonical specification for the **${name}** component.

---

## 1. Design Tokens & Constraints
- Surface: \`bg-surface\` / \`bg-surface-elevated\`
- Border: \`border border-border\`
- Interactive: \`hover:border-border-subtle focus-visible:ring-2 focus-visible:ring-ring\`
- Role: ${description || 'Custom interactive component'}

---

## 2. Accessibility Checklist (WCAG 2.1 AA)
- [ ] Appropriate ARIA attributes configured for state changes.
- [ ] Accessible via keyboard navigation (Tab / Space / Enter).
- [ ] Contrast ratio between text and surface >= 4.5:1.

---

## 3. Canonical Recipe (Copy-Paste Target)

### Default Variant
\`\`\`html
${canonicalSnippet}
\`\`\`

---

## 4. Variants
- Default state
`;

  fs.writeFileSync(targetRefPath, template, 'utf8');
  console.log(`✓ Created component reference: references/${name}.md`);

  // Register in SKILL.md
  if (fs.existsSync(skillMdPath)) {
    let skillContent = fs.readFileSync(skillMdPath, 'utf8');
    const tableHeader = '| Component | Reference File | Primary Recipe |';
    if (skillContent.includes(tableHeader) && !skillContent.includes(`references/${name}.md`)) {
      const newRow = `| **${name.charAt(0).toUpperCase() + name.slice(1)}** | [${name}.md](./references/${name}.md) | Standard container |`;
      skillContent = skillContent.replace(tableHeader, `${tableHeader}\n${newRow}`);
      fs.writeFileSync(skillMdPath, skillContent, 'utf8');
      console.log(`✓ Registered in SKILL.md component index.`);
    }
  }

  console.log(`✓ Component "${name}" successfully registered into skill.`);
}

function addToken(tokenName, lightVal, darkVal, role) {
  const rootDir = path.resolve(__dirname, '..');
  const tokensPath = path.join(rootDir, 'references/semantic-tokens.md');

  if (!fs.existsSync(tokensPath)) {
    console.error(`Error: semantic-tokens.md not found at ${tokensPath}`);
    process.exit(1);
  }

  let content = fs.readFileSync(tokensPath, 'utf8');

  // Insert into CSS theme block
  const themeVarLine = `  --color-${tokenName}: var(--${tokenName});`;
  const rootVarLine = `  --${tokenName}: ${lightVal};`;
  const darkVarLine = `  --${tokenName}: ${darkVal};`;

  if (content.includes(`--color-${tokenName}`)) {
    console.warn(`Warning: Token "${tokenName}" is already defined in semantic-tokens.md.`);
    return;
  }

  content = content.replace(/(@theme\s*\{[\s\S]*?)(\n\})/, `$1\n${themeVarLine}$2`);
  content = content.replace(/(:root\s*\{[\s\S]*?)(\n\})/, `$1\n${rootVarLine}$2`);
  content = content.replace(/(\.dark\s*\{[\s\S]*?)(\n\})/, `$1\n${darkVarLine}$2`);

  // Also document in markdown list
  const docEntry = `- \`bg-${tokenName}\` / \`text-${tokenName}\`: Light: \`${lightVal}\`, Dark: \`${darkVal}\`. (${role || 'Custom semantic token'})`;
  content = content.replace(/(### 30% Secondary[^\n]*\n)/, `$1${docEntry}\n`);

  fs.writeFileSync(tokensPath, content, 'utf8');
  console.log(`✓ Registered semantic token "${tokenName}" in references/semantic-tokens.md.`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const compIdx = args.indexOf('--add-component');
  const descIdx = args.indexOf('--description');
  const markupIdx = args.indexOf('--markup');
  const fileIdx = args.indexOf('--file');

  const tokenIdx = args.indexOf('--add-token');
  const lightIdx = args.indexOf('--value-light');
  const darkIdx = args.indexOf('--value-dark');
  const roleIdx = args.indexOf('--role');

  if (compIdx !== -1) {
    const name = args[compIdx + 1];
    const desc = descIdx !== -1 ? args[descIdx + 1] : '';
    const markup = markupIdx !== -1 ? args[markupIdx + 1] : (fileIdx !== -1 ? args[fileIdx + 1] : null);
    addComponent(name, desc, markup);
  } else if (tokenIdx !== -1) {
    const token = args[tokenIdx + 1];
    const light = lightIdx !== -1 ? args[lightIdx + 1] : '#ffffff';
    const dark = darkIdx !== -1 ? args[darkIdx + 1] : '#000000';
    const role = roleIdx !== -1 ? args[roleIdx + 1] : '';
    addToken(token, light, dark, role);
  } else {
    console.error('Error: Unrecognized command. Use --help to view usage.');
    process.exit(1);
  }
}

main();
