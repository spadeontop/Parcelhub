const fs = require('fs');
const path = require('path');

/**
 * Scan rules for triggers that cause react-native-css-interop's printUpgradeWarning
 * which trips Expo Router's uninitialized LinkingContext getter on mobile native.
 */
const CHECKS = [
  {
    id: 'ACTIVE_PSEUDO_CLASS',
    description: 'Usage of active:* pseudo-classes on TouchableOpacity/Pressable/View (triggers SHOULD_UPGRADE state.pressable in css-interop)',
    regex: /\bactive:bg-[^\s"'`]+|\bactive:text-[^\s"'`]+|\bactive:border-[^\s"'`]+/g,
    remedy: 'Remove active:* pseudo-class. Use activeOpacity={0.8} on TouchableOpacity or standard React Native style / Pressable state callback.',
  },
  {
    id: 'DYNAMIC_SHADOW_INTERPOLATION',
    description: 'Dynamic or conditional shadow classes interpolated in className (e.g. ${isOpen ? "shadow-sm" : ""})',
    regex: /\$\{[^}]*\bshadow(?:-(?:xs|sm|md|lg|xl|2xl|inner|none))?\b[^}]*\}/g,
    remedy: 'Move shadow styles to static inline style prop (elevation, shadowColor, shadowOffset, shadowOpacity, shadowRadius).',
  },
  {
    id: 'SPACE_SIBLING_SELECTOR',
    description: 'Usage of space-y-* or space-x-* which generates sibling combinators requiring runtime CSS interop wraps',
    regex: /\b(?:space-y|space-x)-(?:[0-9.]+|px)\b/g,
    remedy: 'Replace space-y-* / space-x-* with standard Flexbox gap-* (e.g., gap-3.5 or gap-4).',
  },
];

function scanDirectory(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', '.expo', 'dist', 'build', '.next'].includes(entry.name)) {
        continue;
      }
      scanDirectory(fullPath, fileList);
    } else if (/\.(tsx|jsx|js|ts)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const findings = [];

  lines.forEach((line, index) => {
    CHECKS.forEach((check) => {
      let match;
      const re = new RegExp(check.regex);
      while ((match = re.exec(line)) !== null) {
        findings.push({
          line: index + 1,
          rule: check.id,
          matched: match[0],
          description: check.description,
          remedy: check.remedy,
        });
      }
    });
  });

  return findings;
}

function main() {
  const targetDir = process.argv[2] || path.resolve(process.cwd(), 'apps/customer-mobile/src');
  console.log(`\n🔍 Scanning for NativeWind LinkingContext collision triggers in:\n   ${targetDir}\n`);

  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Target directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  const files = scanDirectory(targetDir);
  let totalViolations = 0;
  const fileReports = [];

  for (const file of files) {
    const violations = auditFile(file);
    if (violations.length > 0) {
      totalViolations += violations.length;
      fileReports.push({ file, violations });
    }
  }

  if (totalViolations === 0) {
    console.log('✅ No NativeWind LinkingContext crash triggers found! All audit checks passed.\n');
    process.exit(0);
  }

  console.log(`⚠️ Found ${totalViolations} potential upgrade collision trigger(s) across ${fileReports.length} file(s):\n`);

  fileReports.forEach(({ file, violations }) => {
    const relPath = path.relative(process.cwd(), file);
    console.log(`📄 ${relPath}:`);
    violations.forEach((v) => {
      console.log(`   Line ${v.line}: [${v.rule}] -> "${v.matched}"`);
      console.log(`      💡 Fix: ${v.remedy}`);
    });
    console.log('');
  });

  console.log(`Summary: ${totalViolations} issues detected. Clean these before mobile Expo deployment to avoid "Couldn't find a LinkingContext context" red screens.\n`);
  process.exit(totalViolations > 0 ? 1 : 0);
}

main();

