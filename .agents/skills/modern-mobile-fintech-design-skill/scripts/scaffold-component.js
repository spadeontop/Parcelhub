#!/usr/bin/env node

/**
 * scaffold-component.js
 * Non-interactive CLI helper to extract and instantiate canonical component recipes
 * from static references, eliminating agent hallucination.
 */

const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');

function showHelp() {
  console.log(`
Usage: node scaffold-component.js [options]

Options:
  --type <name>       Component recipe name (e.g., card, button, navbar, modal, table, input)
  --variant <name>    Specific variant (e.g., primary, secondary, metric, action)
  --target <path>     Optional output file to append or write the snippet to
  --list              List all available component recipes and variants
  --help              Show this help message
`);
}

function getReferencesDir() {
  return path.resolve(__dirname, '../references');
}

function parseRecipes() {
  const refDir = getReferencesDir();
  if (!fs.existsSync(refDir)) return {};

  const catalog = {};

  function ensureType(type, sourceFile) {
    if (!catalog[type]) {
      catalog[type] = { sourceFile, variants: {} };
    }
  }

  const allFiles = fs.readdirSync(refDir).filter(f => f.endsWith('.md'));

  for (const file of allFiles) {
    if (file === 'semantic-tokens.md') continue;

    const fullPath = path.join(refDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const sections = content.split(/^###? /m);

    for (const sec of sections) {
      const lines = sec.trim().split('\n');
      const title = lines[0].toLowerCase();
      const codeMatch = sec.match(/```html\s*([\s\S]*?)\s*```/);
      if (!codeMatch) continue;

      const snippet = codeMatch[1].trim();
      let key = title.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

      if (file === 'buttons-inputs.md') {
        if (title.includes('input') || title.includes('select') || title.includes('text field')) {
          ensureType('input', file);
          let v = key.includes('select') ? 'select' : (key.includes('error') ? 'error' : 'standard');
          catalog.input.variants[v] = snippet;
        } else {
          ensureType('button', file);
          let v = key.includes('secondary') || key.includes('outline') ? 'secondary'
            : (key.includes('ghost') ? 'ghost'
            : (key.includes('destructive') ? 'destructive'
            : (key.includes('icon') ? 'icon' : 'primary')));
          catalog.button.variants[v] = snippet;
        }
      } else if (file === 'cards.md') {
        ensureType('card', file);
        let v = key.includes('action') ? 'action' : (key.includes('elevated') || key.includes('container') ? 'container' : 'metric');
        catalog.card.variants[v] = snippet;
      } else if (file === 'navbar.md') {
        ensureType('navbar', file);
        let v = key.includes('breadcrumb') ? 'breadcrumb' : (key.includes('drawer') || key.includes('mobile') ? 'mobile' : 'header');
        catalog.navbar.variants[v] = snippet;
      } else if (file === 'layouts-tables.md') {
        if (title.includes('table')) {
          ensureType('table', file);
          catalog.table.variants['responsive'] = snippet;
        } else {
          ensureType('layout', file);
          catalog.layout.variants['shell'] = snippet;
        }
      } else if (file === 'feedback-dialogs.md') {
        if (title.includes('drawer') || title.includes('slide-over')) {
          ensureType('drawer', file);
          catalog.drawer.variants['detail'] = snippet;
        } else if (title.includes('form') || title.includes('creation') || title.includes('entity')) {
          ensureType('modal', file);
          catalog.modal.variants['form'] = snippet;
        } else if (title.includes('modal') || title.includes('dialog')) {
          ensureType('modal', file);
          catalog.modal.variants['dialog'] = snippet;
        } else if (title.includes('empty')) {
          ensureType('empty', file);
          catalog.empty.variants['default'] = snippet;
        } else if (title.includes('status') || title.includes('notification') || title.includes('alert') || title.includes('success') || title.includes('warning')) {
          ensureType('alert', file);
          let v = key.includes('warning') ? 'warning' : 'success';
          catalog.alert.variants[v] = snippet;
        }
      } else if (file === 'typography.md') {
        ensureType('typography', file);
        catalog.typography.variants['hero'] = snippet;
      } else {
        const customType = path.basename(file, '.md').toLowerCase();
        ensureType(customType, file);
        const variantName = key.length > 0 ? key : 'default';
        catalog[customType].variants[variantName] = snippet;
      }
    }
  }

  return catalog;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const catalog = parseRecipes();

  if (args.includes('--list')) {
    console.log('Available Component Recipes:\n');
    for (const [type, data] of Object.entries(catalog)) {
      const variants = Object.keys(data.variants).join(', ');
      console.log(`  - ${type.padEnd(12)} (variants: ${variants || 'default'}) [${data.sourceFile}]`);
    }
    process.exit(0);
  }

  const typeIdx = args.indexOf('--type');
  if (typeIdx === -1) {
    console.error('Error: Missing required argument --type <name>. Use --list to see options.');
    process.exit(1);
  }

  const reqType = args[typeIdx + 1];
  const variantIdx = args.indexOf('--variant');
  const reqVariant = variantIdx !== -1 ? args[variantIdx + 1] : null;
  const targetIdx = args.indexOf('--target');
  const targetPath = targetIdx !== -1 ? args[targetIdx + 1] : null;

  if (!catalog[reqType]) {
    console.error(`Error: Unknown component type "${reqType}". Available: ${Object.keys(catalog).join(', ')}`);
    process.exit(1);
  }

  const variants = catalog[reqType].variants;
  let selectedSnippet = null;

  if (reqVariant && variants[reqVariant]) {
    selectedSnippet = variants[reqVariant];
  } else if (Object.keys(variants).length > 0) {
    selectedSnippet = variants[Object.keys(variants)[0]];
  }

  if (!selectedSnippet) {
    console.error(`Error: No snippet found for component "${reqType}" with variant "${reqVariant || 'default'}".`);
    process.exit(1);
  }

  if (targetPath) {
    fs.writeFileSync(path.resolve(targetPath), selectedSnippet + '\n', 'utf8');
    console.log(`Successfully generated ${reqType} (${reqVariant || 'default'}) into: ${targetPath}`);
  } else {
    console.log(selectedSnippet);
  }
}

main();
