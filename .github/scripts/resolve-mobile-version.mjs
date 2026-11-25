#!/usr/bin/env node
/**
 * Resolves independent mobile app release versions & tags for Customer and Staff apps,
 * and patches app.json (expo.version + expo.android.versionCode) prior to `expo prebuild`.
 *
 * Tag format:
 *   customer-v1.0.1, customer-v1.1.0, ...
 *   staff-v1.0.1,    staff-v1.1.0,    ...
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const KNOWN_APPS = ['customer', 'staff'];
const SEMVER_FULL_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;
const PRERELEASE_HINT_RE = /(?:^|[-.])(alpha|beta|rc|dev|preview|canary|nightly|pre)(?:[-.]?\d*)?$/i;

function parseSemver(value) {
  const match = String(value ?? '').trim().match(SEMVER_FULL_RE);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] || '',
  };
}

function compareCore(a, b) {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

function formatCore(v) {
  return `${v.major}.${v.minor}.${v.patch}`;
}

function bumpSemver(base, bumpType) {
  switch (bumpType) {
    case 'major':
      return { major: base.major + 1, minor: 0, patch: 0, prerelease: '' };
    case 'minor':
      return { major: base.major, minor: base.minor + 1, patch: 0, prerelease: '' };
    case 'patch':
      return { major: base.major, minor: base.minor, patch: base.patch + 1, prerelease: '' };
    case 'none':
      return { major: base.major, minor: base.minor, patch: base.patch, prerelease: '' };
    default:
      throw new Error(`Unsupported version_bump "${bumpType}". Expected patch, minor, major, or none.`);
  }
}

function computeVersionCode(semver, existingCode = 0) {
  const computed = semver.major * 1_000_000 + semver.minor * 1_000 + semver.patch;
  const existing = Number.isInteger(existingCode) && existingCode > 0 ? existingCode : 0;
  return Math.max(computed, existing, 1);
}

function validateGitTag(tag) {
  if (!tag) {
    throw new Error('Release tag cannot be empty.');
  }
  if (/\s/.test(tag)) {
    throw new Error(`Invalid tag "${tag}": whitespace is not allowed.`);
  }
  if (/[~^:?*[\]\\]/.test(tag) || tag.includes('..') || tag.includes('@{')) {
    throw new Error(`Invalid tag "${tag}": contains forbidden git tag characters.`);
  }
  if (
    tag.startsWith('/') ||
    tag.endsWith('/') ||
    tag.startsWith('.') ||
    tag.endsWith('.') ||
    tag.endsWith('.lock')
  ) {
    throw new Error(`Invalid tag "${tag}": invalid leading or trailing characters.`);
  }
}

function normalizeCustomTag(rawTag, appId) {
  const trimmed = rawTag.trim();
  validateGitTag(trimmed);

  for (const otherApp of KNOWN_APPS) {
    if (otherApp !== appId && trimmed.startsWith(`${otherApp}-`)) {
      throw new Error(
        `Custom tag "${trimmed}" starts with another app's prefix ("${otherApp}-"). ` +
          `Use "${appId}-..." or omit the app prefix (for example "v1.2.0").`
      );
    }
  }

  let normalized = trimmed;
  if (!trimmed.startsWith(`${appId}-`)) {
    if (SEMVER_FULL_RE.test(trimmed)) {
      normalized = `${appId}-v${trimmed}`;
    } else {
      normalized = `${appId}-${trimmed}`;
    }
  }

  validateGitTag(normalized);
  return normalized;
}

function listGitTags() {
  if (process.env.MOCK_GIT_TAGS !== undefined) {
    return process.env.MOCK_GIT_TAGS.split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  const stdout = execFileSync('git', ['tag', '--list'], { encoding: 'utf8' });
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function findHighestStableTag(tags, appId, excludeTag = '') {
  const stableRe = new RegExp(`^${appId}-v(\\d+)\\.(\\d+)\\.(\\d+)$`);
  let best = null;

  for (const tag of tags) {
    if (tag === excludeTag) continue;
    const match = tag.match(stableRe);
    if (!match) continue;
    const parsed = {
      major: Number(match[1]),
      minor: Number(match[2]),
      patch: Number(match[3]),
      prerelease: '',
    };
    if (!best || compareCore(parsed, best.version) > 0) {
      best = { tag, version: parsed };
    }
  }

  return best;
}

function writeGithubOutput(outputs) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}`);
  fs.appendFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const appId = (process.env.APP_ID || '').trim();
  const appDir = (process.env.APP_DIR || '').trim();
  const versionBump = (process.env.VERSION_BUMP || 'patch').trim();
  const customTag = (process.env.CUSTOM_TAG || '').trim();
  const buildVariant = (process.env.BUILD_VARIANT || 'release').trim();
  const writeFiles = (process.env.WRITE_FILES ?? 'true') !== 'false';

  if (!KNOWN_APPS.includes(appId)) {
    throw new Error(`Unsupported APP_ID "${appId}". Expected one of: ${KNOWN_APPS.join(', ')}.`);
  }
  if (!appDir) {
    throw new Error('APP_DIR is required.');
  }

  const appJsonPath = path.resolve(appDir, 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const appName = appJson?.expo?.name;
  const androidPackage = appJson?.expo?.android?.package;
  const appJsonVersionRaw = appJson?.expo?.version || '1.0.0';
  const existingVersionCode = appJson?.expo?.android?.versionCode ?? 0;

  if (!appName || !androidPackage) {
    throw new Error(`Missing expo.name or expo.android.package in ${appJsonPath}.`);
  }

  const appJsonSemver = parseSemver(appJsonVersionRaw) || {
    major: 1,
    minor: 0,
    patch: 0,
    prerelease: '',
  };

  const tags = listGitTags();
  const latestStable = findHighestStableTag(tags, appId);

  const baseSemver =
    latestStable && compareCore(latestStable.version, appJsonSemver) > 0
      ? latestStable.version
      : appJsonSemver;

  let releaseTag;
  let appVersion;
  let versionCode;
  let isPrerelease;
  let releaseTitle;
  let versionSource;

  if (customTag) {
    releaseTag = normalizeCustomTag(customTag, appId);
    const suffix = releaseTag.slice(`${appId}-`.length);
    const candidateVersion = suffix.startsWith('v') ? suffix.slice(1) : suffix;
    const parsedCustom = parseSemver(candidateVersion);

    if (parsedCustom) {
      appVersion = candidateVersion;
      versionCode = computeVersionCode(parsedCustom, existingVersionCode);
      releaseTitle = `${appName} v${appVersion}`;
      isPrerelease = buildVariant === 'debug' || Boolean(parsedCustom.prerelease);
    } else {
      appVersion = formatCore(baseSemver);
      versionCode = computeVersionCode(baseSemver, existingVersionCode);
      releaseTitle = `${appName} (${releaseTag})`;
      isPrerelease = buildVariant === 'debug' || PRERELEASE_HINT_RE.test(suffix);
    }
    versionSource = 'custom_tag';
  } else {
    const nextSemver = bumpSemver(baseSemver, versionBump);
    appVersion = formatCore(nextSemver);
    releaseTag = `${appId}-v${appVersion}`;
    versionCode = computeVersionCode(nextSemver, existingVersionCode);
    releaseTitle = `${appName} v${appVersion}`;
    isPrerelease = buildVariant === 'debug';
    versionSource = versionBump === 'none' ? 'unchanged' : `auto_${versionBump}`;
  }

  const previousTagEntry = findHighestStableTag(tags, appId, releaseTag);
  const previousTag = previousTagEntry ? previousTagEntry.tag : '';
  const releaseTagSlug = releaseTag.replace(/[^0-9A-Za-z._-]/g, '-');

  if (writeFiles) {
    appJson.expo.version = appVersion;
    appJson.expo.android = appJson.expo.android || {};
    appJson.expo.android.versionCode = versionCode;
    fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`, 'utf8');
  }

  const result = {
    app_name: appName,
    android_package: androidPackage,
    app_version: appVersion,
    android_version_code: String(versionCode),
    release_tag: releaseTag,
    release_tag_slug: releaseTagSlug,
    release_title: releaseTitle,
    is_prerelease: String(isPrerelease),
    previous_tag: previousTag,
    version_source: versionSource,
  };

  writeGithubOutput(result);

  console.log(`[version] app=${appId} source=${versionSource}`);
  console.log(`[version] tag=${releaseTag} version=${appVersion} versionCode=${versionCode}`);
  console.log(`[version] previous_tag=${previousTag || '(none)'} prerelease=${isPrerelease}`);
  if (process.env.PRINT_JSON === 'true') {
    console.log(JSON.stringify(result));
  }
}

try {
  main();
} catch (error) {
  console.error(`::error::${error.message}`);
  process.exit(1);
}
