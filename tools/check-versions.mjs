#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const json = (path) => JSON.parse(read(path));
const fail = [];

function expect(condition, message) {
  if (!condition) fail.push(message);
}

function includes(path, needle, label = needle) {
  expect(read(path).includes(needle), `${path} is missing ${label}`);
}

const release = json('version.json');
const pkg = json('package.json');
const tokens = json('tokens.json');
const version = release.version;
const channel = release.channel;
const escapedBadgeVersion = String(version || '').replace(/-/g, '--');

expect(release.project === 'jsray', 'version.json project must be jsray');
expect(typeof version === 'string' && /^\d+\.\d+\.\d+-(internal|beta)\.\d+$|^\d+\.\d+\.\d+$/.test(version), `version.json has an unsupported version: ${version}`);
expect(['internal', 'beta', 'stable'].includes(channel), `version.json has an unsupported channel: ${channel}`);

if (channel === 'internal') {
  expect(/-internal\.\d+$/.test(version), 'internal channel versions must end with -internal.N');
  expect(release.publicBetaReleased === false, 'internal channel must keep publicBetaReleased false');
  expect(pkg.private === true, 'internal channel must keep package.json private true');
}

if (channel === 'beta') {
  expect(/-beta\.\d+$/.test(version), 'beta channel versions must end with -beta.N');
}

if (channel === 'stable') {
  expect(!version.includes('-'), 'stable channel versions must not include a prerelease suffix');
}

expect(pkg.version === version, `package.json version ${pkg.version} does not match ${version}`);
expect(tokens.version === version, `tokens.json version ${tokens.version} does not match ${version}`);

includes('README.md', `version-${escapedBadgeVersion}`);
includes('README.zh-CN.md', `version-${escapedBadgeVersion}`);
// Phase wording in the README subtitles must match the channel.
if (channel === 'internal') {
  includes('README.md', 'Internal test build');
  includes('README.zh-CN.md', '内部测试版');
} else if (channel === 'beta') {
  includes('README.md', 'Public beta');
  includes('README.zh-CN.md', '公开测试版');
}
// The demo footers hardcode the version so a visitor without JS still sees a
// true one; script then corrects it from the loaded engine. That means a stale
// hardcoded value is invisible in a browser and only wrong where nobody looks —
// it sat three releases behind until someone read the page source.
for (const page of ['demo/index.html', 'demo/studio.html']) {
  const footer = read(page).match(/<code data-jsray-version>([^<]*)<\/code>/);
  expect(footer, `${page} has no data-jsray-version footer to check`);
  expect(
    !footer || footer[1] === version,
    `${page} footer says ${footer && footer[1]}, not ${version}`
  );
}

includes('CHANGELOG.md', `## [${version}]`);
includes('docs/versioning.md', `Current version: \`${version}\``);
includes('docs/versioning.zh-CN.md', `当前版本:\`${version}\``);
includes('docs/projects.md', 'JSRay Core');
includes('docs/projects.zh-CN.md', 'JSRay Core');

// The repository table's last column tells a reader what to install today, and
// it is the one place in the docs that quotes a full npm specifier. A parity
// check catches it going missing from one language; nothing catches both
// languages naming the same stale release.
for (const path of ['docs/projects.md', 'docs/projects.zh-CN.md']) {
  includes(path, `@jsray/core@${version}`, `the installable specifier @jsray/core@${version}`);
}

// The supported-versions table is a promise to anyone deciding whether to
// report privately. It sat on beta.1 through the whole beta.2 cycle.
includes('SECURITY.md', `| ${version} | ✅`, `${version} in the supported-versions table`);

// Docs that quote a pinned asset URL go stale silently — the page keeps
// working, it just teaches the wrong version. Both languages, both files.
for (const path of ['README.md', 'README.zh-CN.md', 'docs/projects.md', 'docs/projects.zh-CN.md']) {
  includes(path, `/v/${version}/`, `the pinned-version example /v/${version}/`);
}

// Both machine-readable palettes carry the version integrations read back.
expect(json('vocabulary.json').version === version,
  `vocabulary.json version ${json('vocabulary.json').version} does not match ${version}`);

includes('src/jsray.js', `version: '${version}',`, 'runtime JSRay.version matching version.json');

if (fail.length) {
  console.error('Version metadata check failed:');
  for (const message of fail) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

console.log(`version metadata ok: ${version} (${channel})`);
