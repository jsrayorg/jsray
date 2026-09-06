#!/usr/bin/env node
// Every doc in this repository is written twice. A change that lands in one
// language and not the other does not break a build, does not fail a test, and
// reads perfectly well — in the language you happen to be reading. The Core
// sync rule sat in `docs/projects.md` for a day with no Chinese counterpart;
// the Chinese repository table answered a different question than the English
// one ("status" against "where you get it today") while the sentence under
// both explained the English one.
//
// So this compares the parts of a document that cannot legitimately differ
// between translations: version numbers, file paths, package specifiers, and
// links. Prose differs, sentence counts differ, and a placeholder is expected
// to be translated (`<version>` / `<版本>`) — none of that is checked. What is
// checked is presence: something named in one language and nowhere in the
// other.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SKIP = new Set(['node_modules', '_site', '.git', '.vscode-test', 'dist']);
const fail = [];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

// A translated placeholder is still the same placeholder.
const normalise = (s) => s.replace(/<[^>]*>/g, '<>').trim();

// Anything that names a file, a directory, or a package — the things a reader
// is meant to go and find. A backticked fragment of prose or a translated
// example (`# Heading` / `# 标题`) is not one of these and is left alone.
const PATHISH = /\/|\.(mjs|cjs|js|json|css|sh|php|md|vsix|zip|html|ts|yml|yaml)\b/;

function invariants(path) {
  const text = readFileSync(path, 'utf8');
  const code = new Set();
  for (const [, span] of text.matchAll(/`([^`\n]+)`/g)) {
    const value = normalise(span);
    if (PATHISH.test(value)) code.add(value);
  }
  const versions = new Set(
    [...text.matchAll(/\b\d+\.\d+\.\d+(?:-[A-Za-z0-9.]+)?\b/g)].map((m) => m[0])
  );
  const links = new Set(
    [...text.matchAll(/https?:\/\/[^\s)\]`"'>]+/g)]
      .map((m) => normalise(m[0].replace(/[.,;:，。、]+$/, '')))
      // Badge URLs carry their own translated label, by design.
      .filter((url) => !url.includes('img.shields.io'))
  );
  // Headings are counted outside fenced blocks only: a shell comment reading
  // `# Install` is not a section, and it is translated.
  const prose = text.replace(/^```[\s\S]*?^```/gm, '');
  const headings = [...prose.matchAll(/^(#{1,6})\s+\S/gm)].map((m) => m[1].length);
  const tableRows = (text.match(/^\s*\|.*\|\s*$/gm) || []).length;
  return { code, versions, links, headings, tableRows };
}

function compare(label, enPath, zhPath, enSet, zhSet) {
  for (const [side, missing, from] of [
    ['中文', [...enSet].filter((v) => !zhSet.has(v)), enPath],
    ['English', [...zhSet].filter((v) => !enSet.has(v)), zhPath],
  ]) {
    for (const value of missing) {
      fail.push(`${from} names ${label} ${JSON.stringify(value)}, its ${side} counterpart does not`);
    }
  }
}

const docs = walk('.');
const pairs = docs
  .filter((p) => p.endsWith('.zh-CN.md'))
  .map((zh) => [`${zh.slice(0, -'.zh-CN.md'.length)}.md`, zh])
  .filter(([en]) => docs.includes(en));

if (!pairs.length) {
  console.error('No translated document pairs found — this check would pass vacuously.');
  process.exit(1);
}

for (const [en, zh] of pairs) {
  const a = invariants(en);
  const b = invariants(zh);
  compare('the version', en, zh, a.versions, b.versions);
  compare('the path', en, zh, a.code, b.code);
  compare('the link', en, zh, a.links, b.links);
  // A section present in one language and not the other, or a table that grew
  // a row on one side only.
  if (a.headings.join() !== b.headings.join()) {
    fail.push(`${en} and ${zh} do not have the same section structure: heading levels ${a.headings.join('-')} against ${b.headings.join('-')}`);
  }
  if (a.tableRows !== b.tableRows) {
    fail.push(`${en} has ${a.tableRows} table rows, ${zh} has ${b.tableRows}`);
  }
}

if (fail.length) {
  console.error('Translated documents have drifted:');
  for (const message of fail) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`docs parity ok: ${pairs.length} translated pairs agree`);
