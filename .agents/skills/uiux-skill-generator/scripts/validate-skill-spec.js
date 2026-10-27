#!/usr/bin/env node

/**
 * validate-skill-spec.js
 * Validates any skill directory against the agentskills.io open specification:
 * - SKILL.md presence and frontmatter schema (name, description, limits)
 * - Name regex (lowercase alphanumeric, hyphens, max 64 chars) matching dir basename
 * - Line count budget (< 500 lines)
 * - Reference link resolution
 * - Script execution sanity (--help flag on bundled scripts)
 */

const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');
const { execFileSync } = require('node:child_process');

function showHelp() {
  console.log(`
Usage: node validate-skill-spec.js <skill-dir-path> [options]

Options:
  --json     Output validation report as JSON
  --help     Show this help message
`);
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const rawYaml = match[1];
  const data = {};
  const lines = rawYaml.split(/\r?\n/);

  let currentKey = null;
  let multilineVal = [];

  for (const line of lines) {
    const keyMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (keyMatch) {
      if (currentKey && multilineVal.length > 0) {
        data[currentKey] = multilineVal.join(' ').trim();
        multilineVal = [];
      }
      currentKey = keyMatch[1];
      const val = keyMatch[2].trim();
      if (val === '>-' || val === '|' || val === '>') {
        multilineVal = [];
      } else {
        data[currentKey] = val.replace(/^["']|["']$/g, '');
        currentKey = null;
      }
    } else if (currentKey && line.startsWith('  ')) {
      multilineVal.push(line.trim());
    }
  }

  if (currentKey && multilineVal.length > 0) {
    data[currentKey] = multilineVal.join(' ').trim();
  }

  return { frontmatter: data, rawYaml, bodyOffset: match[0].length };
}

function validateSkill(skillDir) {
  const issues = [];
  const dirName = path.basename(path.resolve(skillDir));
  const skillMdPath = path.join(skillDir, 'SKILL.md');

  // Check SKILL.md existence
  if (!fs.existsSync(skillMdPath)) {
    return {
      skillDir,
      dirName,
      passed: false,
      issues: [{ level: 'error', rule: 'FILE_EXISTS', message: 'Missing required SKILL.md entry point.' }]
    };
  }

  const skillContent = fs.readFileSync(skillMdPath, 'utf8');
  const linesCount = skillContent.split('\n').length;

  // Check line count (< 500 lines)
  if (linesCount > 500) {
    issues.push({
      level: 'error',
      rule: 'LINE_BUDGET',
      message: `SKILL.md exceeds 500 lines (${linesCount} lines). Offload content to references/.`
    });
  } else if (linesCount > 350) {
    issues.push({
      level: 'warning',
      rule: 'LINE_BUDGET',
      message: `SKILL.md is moderately large (${linesCount} lines). Consider pruning to preserve context tokens.`
    });
  }

  // Parse frontmatter
  const parsed = parseFrontmatter(skillContent);
  if (!parsed || !parsed.frontmatter) {
    issues.push({
      level: 'error',
      rule: 'YAML_FRONTMATTER',
      message: 'SKILL.md must begin with a valid YAML frontmatter block (enclosed by "---").'
    });
    return { skillDir, dirName, passed: false, issues };
  }

  const { name, description } = parsed.frontmatter;

  // Validate name
  if (!name) {
    issues.push({ level: 'error', rule: 'NAME_REQUIRED', message: 'Frontmatter must specify a "name" property.' });
  } else {
    if (name.length > 64) {
      issues.push({ level: 'error', rule: 'NAME_LENGTH', message: `Skill name "${name}" exceeds 64 characters (${name.length}).` });
    }
    const nameRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!nameRegex.test(name)) {
      issues.push({
        level: 'error',
        rule: 'NAME_FORMAT',
        message: `Skill name "${name}" is invalid. Must consist only of lowercase letters, numbers, and hyphens, and cannot start/end with a hyphen.`
      });
    }
    if (name !== dirName) {
      issues.push({
        level: 'warning',
        rule: 'NAME_MATCH_DIR',
        message: `Skill name "${name}" does not match directory basename "${dirName}". Recommended to align them.`
      });
    }
  }

  // Validate description
  if (!description) {
    issues.push({ level: 'error', rule: 'DESCRIPTION_REQUIRED', message: 'Frontmatter must specify a "description" property.' });
  } else {
    if (description.length > 1024) {
      issues.push({
        level: 'error',
        rule: 'DESCRIPTION_LENGTH',
        message: `Description exceeds 1024 characters (${description.length} chars).`
      });
    }
    if (description.length < 20) {
      issues.push({
        level: 'warning',
        rule: 'DESCRIPTION_QUALITY',
        message: 'Description is very short. Describe both WHAT the skill does and WHEN to trigger it.'
      });
    }
  }

  // Check references links
  const refLinks = skillContent.match(/\[([^\]]+)\]\(\.\/references\/([^)]+)\)/g) || [];
  for (const link of refLinks) {
    const fileMatch = link.match(/\(\.\/references\/([^)]+)\)/);
    if (fileMatch) {
      const targetPath = path.join(skillDir, 'references', fileMatch[1]);
      if (!fs.existsSync(targetPath)) {
        issues.push({
          level: 'error',
          rule: 'BROKEN_REFERENCE',
          message: `Linked reference file does not exist: references/${fileMatch[1]}`
        });
      }
    }
  }

  // Check scripts executable sanity (--help)
  const scriptsDir = path.join(skillDir, 'scripts');
  if (fs.existsSync(scriptsDir)) {
    const scriptFiles = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js'));
    for (const s of scriptFiles) {
      const scriptPath = path.join(scriptsDir, s);
      try {
        execFileSync(process.execPath, [scriptPath, '--help'], { stdio: 'pipe', timeout: 3000 });
      } catch (err) {
        issues.push({
          level: 'error',
          rule: 'SCRIPT_EXECUTION',
          message: `Script "scripts/${s}" failed when invoked with --help: ${err.message}`
        });
      }
    }
  }

  const errors = issues.filter(i => i.level === 'error');
  return {
    skillDir,
    dirName,
    passed: errors.length === 0,
    totalLines: linesCount,
    issues
  };
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const isJson = args.includes('--json');
  const targetDir = args.find(a => !a.startsWith('--'));

  if (!targetDir) {
    console.error('Error: Please provide path to skill directory.');
    process.exit(1);
  }

  const resolved = path.resolve(targetDir);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: Directory not found: ${resolved}`);
    process.exit(1);
  }

  const report = validateSkill(resolved);

  if (isJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`\nValidating agentskills.io Compliance: ${report.dirName}`);
    console.log(`Directory: ${report.skillDir}`);
    console.log(`Lines:     ${report.totalLines} lines in SKILL.md\n`);

    if (report.issues.length === 0) {
      console.log('✓ [PASS] Skill is 100% compliant with agentskills.io specification.');
      process.exit(0);
    }

    for (const issue of report.issues) {
      const icon = issue.level === 'error' ? '✖ [ERROR]' : '▲ [WARN]';
      console.log(`${icon} ${issue.rule}: ${issue.message}`);
    }

    if (!report.passed) {
      console.error(`\nResult: FAILED (${report.issues.filter(i => i.level === 'error').length} error(s)).`);
      process.exit(1);
    } else {
      console.log(`\nResult: PASSED with warnings.`);
      process.exit(0);
    }
  }
}

main();
