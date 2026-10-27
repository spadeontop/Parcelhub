#!/usr/bin/env node

/**
 * validate-system-skill.js
 * Validates that a generated functional specification skill conforms strictly to
 * the agentskills.io standard and system-spec architectural conventions.
 */

const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');

function showHelp() {
  console.log(`
Usage: node validate-system-skill.js <path-to-skill-dir> [options]

Options:
  --meta                   Validate a meta-generator skill instead of a generated target spec
  --max-router-lines <n>   Max lines allowed in SKILL.md [Default: 120]
  --max-leaf-lines <n>     Max lines allowed in a single reference file [Default: 200]
  --json                   Output results as JSON
  --help                   Show this help message
`);
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const rawYaml = match[1];
  const fields = {};
  for (const line of rawYaml.split(/\r?\n/)) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      fields[key] = val;
    }
  }
  return fields;
}

function extractMarkdownLinks(content) {
  const links = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const target = match[2].trim();
    if (!target.startsWith('http://') && !target.startsWith('https://') && !target.startsWith('#')) {
      links.push(target);
    }
  }
  return links;
}

function main() {
  const args = process.argv.slice(2);
  let targetPath = '';
  let isMeta = false;
  let maxRouterLines = 120;
  let maxLeafLines = 200;
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg === '--json') {
      jsonOutput = true;
    } else if (arg === '--meta') {
      isMeta = true;
    } else if (arg === '--max-router-lines' && args[i + 1]) {
      maxRouterLines = parseInt(args[++i], 10);
    } else if (arg === '--max-leaf-lines' && args[i + 1]) {
      maxLeafLines = parseInt(args[++i], 10);
    } else if (!arg.startsWith('--') && !targetPath) {
      targetPath = arg;
    }
  }

  if (!targetPath) {
    targetPath = '.';
  }

  const skillDir = path.resolve(process.cwd(), targetPath);
  const skillFile = path.join(skillDir, 'SKILL.md');
  const referencesDir = path.join(skillDir, 'references');

  const errors = [];
  const warnings = [];

  // Check 1: SKILL.md exists
  if (!fs.existsSync(skillFile)) {
    errors.push(`Missing mandatory file: SKILL.md at ${skillDir}`);
  } else {
    const skillContent = fs.readFileSync(skillFile, 'utf8');
    const skillLines = skillContent.split(/\r?\n/).length;

    // Frontmatter check
    const frontmatter = parseFrontmatter(skillContent);
    if (!frontmatter) {
      errors.push('SKILL.md is missing valid YAML frontmatter delimiters (---).');
    } else {
      if (!frontmatter.name) {
        errors.push('Frontmatter missing required field: name');
      }
      if (!frontmatter.description) {
        errors.push('Frontmatter missing required field: description');
      }
    }

    // Line budget check
    if (skillLines > maxRouterLines) {
      warnings.push(
        `SKILL.md is ${skillLines} lines (budget: ${maxRouterLines} lines). Consider pushing details into references/.`
      );
    }

    // Link resolution check
    const links = extractMarkdownLinks(skillContent);
    for (const link of links) {
      const resolvedLink = path.resolve(skillDir, link);
      if (!fs.existsSync(resolvedLink)) {
        errors.push(`Broken markdown link in SKILL.md: "${link}" (file not found)`);
      }
    }
  }

  // Check 2: references/ directory
  if (!fs.existsSync(referencesDir)) {
    errors.push(`Missing mandatory directory: references/ at ${skillDir}`);
  } else {
    if (!isMeta) {
      // Check core target files
      const coreFiles = ['topology.md', 'routes.md', 'roles.md', 'flows.md', 'data-models.md'];
      for (const coreFile of coreFiles) {
        const filePath = path.join(referencesDir, coreFile);
        if (!fs.existsSync(filePath)) {
          errors.push(`Missing core reference file: references/${coreFile}`);
        } else {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split(/\r?\n/).length;
          if (lines < 5) {
            warnings.push(`references/${coreFile} appears empty or near-empty (${lines} lines).`);
          }
          if (lines > maxLeafLines) {
            warnings.push(
              `references/${coreFile} is ${lines} lines (budget: ${maxLeafLines} lines). Consider splitting by domain.`
            );
          }
        }
      }
    } else {
      // In meta mode, verify references directory has markdown documents
      const refFiles = fs.readdirSync(referencesDir).filter(f => f.endsWith('.md'));
      if (refFiles.length === 0) {
        errors.push(`Meta-skill references directory has no markdown references.`);
      }
    }

    // Check for orphan reference files (not linked anywhere in SKILL.md)
    if (fs.existsSync(skillFile)) {
      const skillContent = fs.readFileSync(skillFile, 'utf8');
      const allRefFiles = fs.readdirSync(referencesDir, { recursive: true });
      for (const refItem of allRefFiles) {
        const itemStr = String(refItem);
        if (itemStr.endsWith('.md')) {
          const normalized = itemStr.replace(/\\/g, '/');
          if (!skillContent.includes(normalized) && !skillContent.includes(path.basename(normalized))) {
            warnings.push(`Potentially unreferenced leaf file: references/${normalized}`);
          }
        }
      }
    }
  }



  const passed = errors.length === 0;

  if (jsonOutput) {
    console.log(
      JSON.stringify(
        {
          passed,
          errors,
          warnings,
          skillDir,
        },
        null,
        2
      )
    );
  } else {
    console.log(`\n========================================`);
    console.log(` System Spec Validator: ${path.basename(skillDir)}`);
    console.log(`========================================`);
    if (passed) {
      console.log(`\x1b[32m✔ PASS\x1b[0m - Skill conforms to agentskills.io standard.`);
    } else {
      console.log(`\x1b[31m✘ FAIL\x1b[0m - Found ${errors.length} error(s):`);
      for (const err of errors) {
        console.log(`  \x1b[31m✖\x1b[0m ${err}`);
      }
    }

    if (warnings.length > 0) {
      console.log(`\nWarnings (${warnings.length}):`);
      for (const warn of warnings) {
        console.log(`  \x1b[33m▲\x1b[0m ${warn}`);
      }
    }
    console.log('');
  }

  process.exit(passed ? 0 : 1);
}

main();
