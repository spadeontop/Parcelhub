#!/usr/bin/env node

/**
 * Automated Verification Checker for Expo + Firebase Cloud Messaging (FCM v1)
 * Validates package names, google-services.json, app.json plugins, ProGuard rules,
 * dependencies, and source code usage against common failure modes.
 */

const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(process.argv[2] || '.');

console.log(`\n🔍 Checking Expo FCM Setup in: ${targetDir}\n`);

let errors = 0;
let warnings = 0;

function pass(msg) {
  console.log(`  ✅ PASS: ${msg}`);
}

function fail(msg) {
  errors++;
  console.log(`  ❌ FAIL: ${msg}`);
}

function warn(msg) {
  warnings++;
  console.log(`  ⚠️  WARN: ${msg}`);
}

// 1. Check google-services.json
const googleServicesPath = path.join(targetDir, 'google-services.json');
let googleServicesJson = null;
if (!fs.existsSync(googleServicesPath)) {
  fail('google-services.json not found in root of mobile project!');
} else {
  try {
    googleServicesJson = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
    pass('google-services.json found and is valid JSON');
  } catch (err) {
    fail('google-services.json contains invalid JSON: ' + err.message);
  }
}

// 2. Check app.json
const appJsonPath = path.join(targetDir, 'app.json');
let appJson = null;
if (!fs.existsSync(appJsonPath)) {
  fail('app.json not found in project directory!');
} else {
  try {
    appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    pass('app.json found and is valid JSON');
  } catch (err) {
    fail('app.json contains invalid JSON: ' + err.message);
  }
}

// 3. Compare package name and googleServicesFile in app.json
if (appJson && appJson.expo) {
  const expoConfig = appJson.expo;
  const androidConfig = expoConfig.android || {};
  const appPackage = androidConfig.package;

  if (!appPackage) {
    fail('Missing expo.android.package in app.json!');
  } else {
    pass(`expo.android.package is set to "${appPackage}"`);
    if (googleServicesJson && googleServicesJson.client) {
      const clientPackages = googleServicesJson.client.map(
        (c) => c.client_info?.android_client_info?.package_name
      );
      if (clientPackages.includes(appPackage)) {
        pass(`Package name "${appPackage}" matches client in google-services.json`);
      } else {
        fail(
          `Package mismatch! app.json has "${appPackage}", but google-services.json lists: ${clientPackages.join(
            ', '
          )}`
        );
      }
    }
  }

  if (!androidConfig.googleServicesFile) {
    fail('Missing expo.android.googleServicesFile in app.json!');
  } else if (!fs.existsSync(path.resolve(targetDir, androidConfig.googleServicesFile))) {
    fail(
      `googleServicesFile points to "${androidConfig.googleServicesFile}", but the file does not exist!`
    );
  } else {
    pass(`googleServicesFile correctly references "${androidConfig.googleServicesFile}"`);
  }

  // 4. Check plugins
  const plugins = expoConfig.plugins || [];
  const hasAppPlugin = plugins.some(
    (p) => p === '@react-native-firebase/app' || (Array.isArray(p) && p[0] === '@react-native-firebase/app')
  );
  const hasMessagingPlugin = plugins.some(
    (p) =>
      p === '@react-native-firebase/messaging' ||
      (Array.isArray(p) && p[0] === '@react-native-firebase/messaging')
  );

  if (hasAppPlugin) {
    pass('Plugin "@react-native-firebase/app" registered in app.json');
  } else {
    fail('Plugin "@react-native-firebase/app" is missing from app.json plugins!');
  }

  if (hasMessagingPlugin) {
    pass('Plugin "@react-native-firebase/messaging" registered in app.json');
  } else {
    fail('Plugin "@react-native-firebase/messaging" is missing from app.json plugins!');
  }

  // Check ProGuard rules inside expo-build-properties
  const buildPropertiesPlugin = plugins.find(
    (p) => Array.isArray(p) && p[0] === 'expo-build-properties'
  );
  if (!buildPropertiesPlugin) {
    warn(
      'Missing "expo-build-properties" plugin. Preview/Release builds may crash on startup due to R8 minification!'
    );
  } else {
    const androidProps = buildPropertiesPlugin[1]?.android || {};
    const rules = androidProps.extraProguardRules || '';
    if (rules.includes('com.google.firebase') && rules.includes('io.invertase.firebase')) {
      pass('Firebase ProGuard keep rules found in expo-build-properties');
    } else {
      warn('expo-build-properties is present, but extraProguardRules does not include Firebase keep rules!');
    }
  }
}

// 5. Check dependencies in package.json
const packageJsonPath = path.join(targetDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (allDeps['@react-native-firebase/app']) {
      pass(`@react-native-firebase/app installed (${allDeps['@react-native-firebase/app']})`);
    } else {
      fail('@react-native-firebase/app is not installed in package.json!');
    }

    if (allDeps['@react-native-firebase/messaging']) {
      pass(
        `@react-native-firebase/messaging installed (${allDeps['@react-native-firebase/messaging']})`
      );
    } else {
      fail('@react-native-firebase/messaging is not installed in package.json!');
    }
  } catch (err) {
    fail('package.json could not be read: ' + err.message);
  }
}

// 6. Check source code for deprecated legacy namespaced calls
const sourceFiles = ['App.js', 'App.tsx', 'index.js', 'index.ts', 'src/App.js', 'src/App.tsx'];
let legacyCallFound = false;

for (const relFile of sourceFiles) {
  const filePath = path.join(targetDir, relFile);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Check for legacy calls like messaging().
    if (/messaging\(\)\./.test(content)) {
      fail(
        `Deprecated legacy syntax "messaging()." found in ${relFile}! In @react-native-firebase v22+/v27+, use modular imports: getMessaging(), getToken(messaging), requestPermission(messaging)`
      );
      legacyCallFound = true;
    }
    // Check for TypeScript syntax in .js files
    if (relFile.endsWith('.js')) {
      if (/useState<[a-zA-Z0-9_\[\]]+>/.test(content)) {
        fail(
          `TypeScript generics (<...>) found in plain JavaScript file "${relFile}"! This causes Metro bundler syntax errors during EAS build.`
        );
      }
    }
  }
}
if (!legacyCallFound) {
  pass('No deprecated legacy "messaging().method()" calls found in primary source files');
}

// 7. Check eas.json
const easJsonPath = path.join(targetDir, 'eas.json');
if (fs.existsSync(easJsonPath)) {
  try {
    const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
    const previewBuildType = easJson.build?.preview?.android?.buildType;
    if (previewBuildType === 'apk') {
      pass('eas.json configured with "preview" profile generating standalone "apk"');
    } else {
      warn(
        'eas.json "preview" profile does not specify android.buildType="apk". By default, EAS creates .aab which cannot be installed directly.'
      );
    }
  } catch (err) {
    warn('eas.json could not be parsed: ' + err.message);
  }
} else {
  warn('eas.json not found in project directory. Needed for EAS cloud or local APK builds.');
}

// Summary
console.log('\n----------------------------------------');
if (errors === 0 && warnings === 0) {
  console.log('🎉 ALL CHECKS PASSED! Your Expo FCM setup is ready for EAS build.\n');
  process.exit(0);
} else if (errors === 0) {
  console.log(`⚠️  PASSED WITH ${warnings} WARNING(S). Review the warnings above.\n`);
  process.exit(0);
} else {
  console.log(`❌ FAILED WITH ${errors} ERROR(S) and ${warnings} WARNING(S). Fix the issues above before building.\n`);
  process.exit(1);
}
