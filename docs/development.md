# JSRay Development Guide

[English](development.md) · [简体中文](development.zh-CN.md)

The engineering reference for the JSRay ecosystem: architecture, contracts,
conventions, and workflows across all official repositories.

> One renderer. Many places for code to shine.

---

## 1. Ecosystem map

Four sibling repositories, each independently versioned and releasable:

| Repository | Role | Ships | Key entry points |
|---|---|---|---|
| `jsray` | **Core** — the rendering kernel | `dist/jsray.js` + `dist/jsray.css` + `dist/themes/*.css` | `src/jsray.js` (~1.4k lines), `tokens.json`, `themes/*.json` |
| `jsray-wp` | WordPress plugin | installable zip (`jsray` slug) | `jsray.php`, `assets/js/jsray-loader.js`, `assets/js/jsray-block.js` |
| `jsray-vscode` | VS Code extension | 8 color themes + Markdown preview | `package.json` contributions, `tools/build-themes.mjs`, `media/preview-adapter.js` |
| `jsray-terminal` | Terminal CLI | `jsray` binary | `bin/jsray.mjs`, `lib/ansi.mjs` |

Every integration bundles a **snapshot** of Core (never a live dependency) and
can swap in another renderer through the ecosystem renderer contract (§5).
Project split and release boundaries: [projects.md](projects.md).

---

## 2. Core architecture

Everything lives in one zero-dependency file, `src/jsray.js`, organized as a
pipeline:

```
code string ──tokenize(code, rules)──▶ token stream ──renderer──▶ output
                     ▲                       │
              G[lang] grammar          strings and {type, content}
              (ordered regex rules)    nodes, recursively nested
```

1. **Tokenizer** — `tokenize()` applies a grammar's rules in order
   (first-match-wins). Rules support `inside` (recursive sub-grammar for the
   captured text — parameter lists, template-string interpolation) and
   `lookbehind` (capture group 1 is consumed as prefix but left uncolored
   *and* still matchable by later rules).
2. **Token stream** — the renderer-agnostic contract: an array of plain
   strings and `{ type: 'tk-*', content: string | stream }` nodes. Every
   surface consumes this same shape: `render()` emits HTML spans,
   `jsray-terminal` emits ANSI sequences.
3. **Grammar registry `G`** — one rule array per language family. Aliases are
   declared once in `LANGUAGE_ALIASES` and registered on `G` by the loop that
   follows it, so `G.rb` and `G.ruby` are the same array without anyone
   writing the second one down. Add an alias there and nowhere else; a
   hand-written `G.x = G.y` beside the table is a duplicate, and a test
   rejects it. Names that share a grammar without being aliases of it
   (`typescript`, `xml`, `scss`) stay explicit — they normalize to
   themselves, which is what keeps a TypeScript block labelled `typescript`.
   The C family (C, C++, Java, C#,
   Go, Rust, Swift, Kotlin, Dart, Scala, Objective-C) shares the
   `cLikeGrammar(keywords, builtins, options)` factory
   (options: `rustMacros`, `fnDeclKeywords`).
4. **Detection** — `detectLanguage()` resolves in three steps: JSON parse
   fast path → shebang fast path (`#!` interpreter map) → per-language signal
   scoring above a confidence threshold. The diff detector is ranked first so
   patch payloads don't get detected as their embedded language.
5. **Theme runtime** — `applyTheme(themeBlock, root)` writes `--jr-*` CSS
   variables. Default root is the element carrying `data-theme` (usually
   `<body>`), because theme stylesheets set the same variables via a
   `[data-theme]` selector there — inline variables on an ancestor would be
   shadowed.
6. **Public API** — `highlight`, `highlightElement`, `highlightAll`,
   `tokenize`, `render`, `applyTheme`, `detectLanguage`, `normalizeLanguage`,
   `languages`. UMD-ish export: CommonJS `module.exports` + `global.JSRay`.

**Grammar rule ordering matters.** Strings must be matched before comments
(a `#` or `//` inside a string must not start a comment), declaration rules
before keyword rules (otherwise `function`/`def` consume the name).
See CONTRIBUTING.md for the full checklist.

---

## 3. The token & palette contract

The semantic vocabulary is **23 token keys**, grouped by the six-identifier-family philosophy: parameters,
system builtins, constants, declarations, calls, and neutral variables are
always visually separable.

One palette JSON is the single source of truth per theme, fanned out to every
surface:

```
tokens.json (default) ─┐
themes/aurora.json     ├─▶ tools/generate-theme.mjs ─▶ src/themes/<id>.css  (web)
themes/ember.json      ├─▶ jsray-vscode build-themes ─▶ VS Code theme JSON  (editor)
themes/fjord.json      ┴─▶ jsray-terminal lib/ansi   ─▶ SGR sequences       (runtime)
```

The same semantic key travels under three names — keep them in lock-step:

| Layer | Name | Defined in |
|---|---|---|
| palette JSON | `variable.parameter` | `tokens.json`, `themes/*.json` |
| CSS variable | `--jr-var-param` | generated `src/themes/*.css` |
| runtime class | `tk-var-param` | grammar `cls:` values, styled by `src/jsray.css` |

Mapping tables that must stay synchronized (each repo's tests enforce its own
slice):

- `tools/generate-theme.mjs` `ALIAS` (Core)
- `THEME_ALIAS` inside `src/jsray.js` (Core runtime)
- `jsray-vscode/tools/build-themes.mjs` `TEXTMATE_MAP` / `SEMANTIC_MAP`
- `jsray-terminal/lib/ansi.mjs` `TOKEN_KEY`

Every palette must define **both** `dark` and `light` blocks with all 23
tokens in 6-digit hex; Core's `tests/palettes.test.mjs` fails otherwise.
`fontStyle` fields (`bold` / `italic`) are consumed by the VS Code and
terminal renderers; the web layer hardcodes equivalent font rules in
`src/jsray.css`.

### Fallback chain

Every renderer resolves a token key by stripping dot segments until a
palette entry is found:

```
function.declaration → function → (plain foreground)
string.escape (future) → string → (plain foreground)
```

Implemented in all four consumers (`applyThemeToRoot`, `generate-theme.mjs`,
VS Code `build-themes.mjs`, terminal `ansi.mjs`). This is what lets the
vocabulary **grow in minor versions without breaking anything**: a new
refined key renders as its base family everywhere until palettes and
surfaces opt in.

### Vocabulary governance

The 23-key vocabulary is deliberately closed. Adding a key requires all of:

1. The semantic appears in **≥ 3 supported languages** — never add a
   per-language token; map to the nearest existing key instead.
2. A real visual-separation need that the base family cannot express
   (remember the hue budget: hues belong to the six identifier families;
   new keys refine with shade/weight, they don't add hues).
3. A defined fallback base (`new.key` must strip to an existing key).
4. The full checklist: grammar `cls:` usage, `.tk-*` rule in
   `src/jsray.css`, entries in all four alias maps (§3), palette updates
   optional (fallback covers them), a consistency test, and a docs row.

New keys ride minor versions (purely additive); renaming or removing a key
is a major-version event.

---

## 4. Languages

35 language families, 83 language keys (with aliases). Adding one:

1. Grammar in `src/jsray.js` (standalone `G.<lang>` array, or the
   `cLikeGrammar` factory for C-family syntax).
2. Aliases: `G.<alias> = G.<lang>` **and** `LANGUAGE_ALIASES` entry.
3. Detector in `DETECTORS` (distinctive signals; keep weights modest so
   existing languages don't regress) and/or `SHEBANGS`.
4. Test in `tests/highlight.test.mjs` + a `detectLanguage` assertion.
5. Docs: `docs/languages.md` + `docs/languages.zh-CN.md` section, README
   tables (en/zh).
6. Downstream: WP language picker (`jsray_wp_supported_languages` in
   `jsray.php`), terminal `EXT_LANG` extension map.

---

## 5. Integrations

All integrations honor the **renderer contract** so a host can swap JSRay for
another engine:

```js
renderer.highlight(code, language) -> html
renderer.highlightElement(element) -> void
renderer.detectLanguage(code)      -> language id | ''
renderer.languages                 -> { [language]: grammar }
```

### jsray-wp (WordPress)

- `jsray.php` registers assets, the **JSRay Code** Gutenberg block, a
  settings page (palette / custom colours / theme mode / fallback language /
  asset toggles / code-block coverage), and the `[jsray]` shortcode, which
  renders through the same path the block does. Seven `jsray_wp_*` filters
  expose the platform layer.
- `assets/js/jsray-loader.js` runs on the front end: resolves each block's
  language (class → data attribute → auto-detect → fallback), normalizes
  markup, applies the theme, binds copy buttons, and re-scans DOM mutations.
  Adapters can replace the engine via `window.JSRayWP.renderer`.
- Packaging: `npm run build` → `build/jsray-wp-<version>.zip`
  (gated on `check:versions`).

### jsray-vscode (VS Code)

- **Themes**: `tools/build-themes.mjs` maps the 23 keys twice — TextMate
  scopes (best-effort, works everywhere) and semantic token selectors (the
  precise layer where declaration-bold / parameter-italic land). Workbench
  colors accept only hex, so `rgba()` line-highlights are converted to
  `#RRGGBBAA`.
- **Markdown preview**: static contributions load `media/jsray.js` (Core
  itself) plus `media/preview-adapter.js`, which re-renders fenced blocks,
  caches by source text, and mirrors the editor's light/dark UI. No
  activation code.
- Marketplace releases require plain semver (strip the `-internal.N`
  suffix at publish time).

### jsray-terminal (CLI)

- `bin/jsray.mjs`: single file or stdin; language from `--lang` → extension
  map → special filenames (`Dockerfile`, `Makefile`) → `detectLanguage()`.
  Undetectable input degrades to plain text. Bare `jsray` on a TTY prints
  help (never blocks).
- `lib/ansi.mjs`: truecolor by default, xterm-256 downsampling (6×6×6 cube +
  gray ramp), plain when piped. Every SGR sequence is reset-prefixed so
  nested tokens resume the parent style. Core is vendored as
  `vendor/jsray.cjs` (`.cjs` because the package is ESM).
- **jsray is a `cat`/`less` replacement, not a shell-wide hook** — document
  this prominently in user-facing help.

---

## 6. Cross-repo conventions

**Versioning** — every repo carries `version.json`
(`version`, `channel: internal|beta|stable`, `publicBetaReleased`,
`bundledCore`). Channel invariants (enforced by each repo's
`tools/check-versions.mjs`):

- `internal` → version ends `-internal.N`, `package.json` stays
  `private: true`, WordPress `Stable tag: trunk`.
- `beta` → `-beta.N` in Core, `-beta` in the integrations; `stable` → plain
  semver. Core keeps the counter because its betas iterate within a patch; an
  integration bumps the patch every release, so its counter would always be 1.
  Both orders correctly under `version_compare()`.

**Core snapshot sync** — integrations never depend on Core at runtime; they
vendor it. Each has `tools/sync-core.sh` (copy Core `dist/` + palettes,
update `bundledCore.version`, regenerate derived assets) and an
**opportunistic drift check**: when Core is checked out as a sibling
(`../jsray`, or `JSRAY_CORE_DIR`), `check:versions` byte-compares the bundle;
when Core is absent (CI cloning one repo) it silently skips. Day-to-day,
drift is **advisory** (a warning, exit 0) — it becomes a hard failure only in
strict mode (`JSRAY_STRICT_DRIFT=1` or `--strict`), which the packaging gates
and `sync-integrations` use. Integrations **batch** Core updates the way
Electron apps batch Chromium: a plugin release picks up whatever Core is
current at that moment; it never chases individual Core releases.

**Release trains** — plugin releases pin an exact Core version
(`bundledCore` in `version.json`); users receive plugin updates through
each platform's auto-update channel.

1. *Minor/patch Core releases* ride a **selective train**: security fixes,
   new languages/themes, and rendering fixes always trigger plugin patch
   releases (`npm run sync:integrations` → bump → push); internal-only
   changes may be skipped and snapshots may lag between trains.
2. *Major Core releases* are a **synchronized train**: every integration
   ships a matching major release. Breaking changes to token classes, the
   public API, or the renderer contract are allowed **only** in Core
   majors — minors must stay purely additive.
3. Convention: an integration's major version equals its bundled Core's
   major version (plugin 2.x bundles Core 2.x); minor/patch numbers stay
   independent per repository.

**Security releases do not batch.** The selective train above covers features
and ordinary fixes; an integration may skip one. A Core release that fixes a
vulnerability is a synchronized train regardless of version number: every
integration syncs and releases, immediately. Merging a sync PR is not the end —
a user receives the fix only after the integration is released and the
platform's review queue clears, which is days, not hours.

**Keeping the snapshots honest** — integrations vendor Core rather than
depending on it, so a published fix reaches nobody until each repository
re-syncs. Two mechanisms make that automatic rather than remembered, and both
live in the integration repositories:

- `tools/check-core-freshness.mjs` runs in CI and **fails** when the bundled
  `bundledCore.version` is behind the `beta` dist-tag on npm. It queries the
  registry, so unlike the sibling-checkout drift check it works in CI, where no
  Core checkout exists. An unreachable registry skips rather than fails —
  not knowing is not the same as being stale.
- `.github/workflows/sync-core.yml` polls every six hours and, when a newer
  Core is published, syncs from the tarball, runs the suite, pushes the branch
  and **files an issue** carrying the compare link. It stops there: `gh pr
  create` needs "Allow GitHub Actions to create and approve pull requests",
  which is an organisation-wide switch, and the alternative is a stored PAT —
  the same credential the polling design avoids. The click that remains buys
  something back, because a pull request opened by a person runs its checks
  and one opened with GITHUB_TOKEN never does.

  It polls rather than reacting to a Core release trigger, which would need a
  long-lived token in Core able to write to all three integrations — a
  credential this project should not be creating to save a few hours.

`tools/sync-core.sh` accepts either source: `JSRAY_CORE_DIR` for a sibling
checkout (what a maintainer has, and what lets `sync-integrations.sh` exercise
an unreleased Core) or `JSRAY_CORE_VERSION` to unpack the published tarball
(what CI uses). Core's `files` array therefore has to publish everything a sync
copies — including `themes/*.json`, the palette sources the VS Code and
terminal builds regenerate from.

**Zero dependencies** — no runtime npm dependencies anywhere. Tests use
`node --test`; scripts are plain sh/node.

**Naming** — repos are `jsray-<platform>` (`jsray-wp` abbreviates WordPress
per the WordPress Foundation trademark guidance). User-facing plugin
names/slugs stay `JSRay` / `jsray`.

**Docs** — English is the source language; major docs keep `*.zh-CN.md`
copies. Language-switcher labels and the zh-content assertion in Core's
`check-versions` are intentionally Chinese.

**Branding** — one master logo for the whole ecosystem; platform variants
are text lockups, never separate marks. The final mark is the gradient
`</>` on a dark tile (`assets/brand/`, dark + light variants in SVG and
PNG). README heroes use the `jsray-logo-hero-*` derivatives (transparent,
ink-centered, same scale — designer originals stay untouched); see
`assets/brand/README.md`.

---

## 7. Edit loops

**Core**

```sh
cd jsray
# edit src/jsray.js · src/jsray.css · tokens.json · themes/*.json
sh build.sh              # regenerate theme CSS + sync src/ → dist/
# ...and update CHANGELOG.md with any user-visible change — audits keep
# catching unrecorded batches; treat the changelog as part of the change.
npm test                 # node --test tests/*.mjs
npm run check:versions
# demo: serve the repo root with any static server → /demo/index.html
```

**Integrations** (after Core changes) — one command from Core propagates to
every sibling and runs its tests + checks:

```sh
npm run sync:integrations          # build Core → sync + test all siblings
sh tools/sync-integrations.sh --check   # report drift only, change nothing
```

Snapshots only *need* to be in step at an integration's release point — the
drift check is a dev-machine reminder, not a user-facing break. Individual
repos can still sync alone via their own `npm run sync:core`.

**Adding a theme** — author `themes/<id>.json` in Core (all 23 tokens ×
dark+light; keep the six-family intuitions: parameters warm italic, builtins
cool bold, constants muted gold), run `sh build.sh`, add the README table
rows (en/zh) and the demo palette switcher button, then `sync:core`
downstream — VS Code themes need a matching `contributes.themes` entry.

**Adding an integration** — new sibling repo `jsray-<platform>`; copy the
conventions: `version.json` + `check-versions` + `sync-core.sh` + drift
check + `node --test` suites + CI workflow; consume either the token stream
(non-DOM surfaces) or `highlightElement` (DOM surfaces); expose an adapter
seam per the renderer contract.

---

## 8. Testing matrix

| Repo | Suite | Covers |
|---|---|---|
| `jsray` | `highlight.test.mjs` | every grammar, detection incl. shebangs, aliases, XSS escaping, tokenize/render equivalence |
| | `dom.test.mjs` | `highlightElement`/`highlightAll` against fake elements, XSS through the DOM path |
| | `palettes.test.mjs` | palette completeness, generated CSS presence, `--jr-*` ↔ `tk-*` consistency, detection negatives |
| `jsray-wp` | `loader.test.mjs` | loader in a `node:vm` fake DOM: language priority, adapter precedence, theme, copy buttons |
| `jsray-vscode` | `themes/manifest/adapter.test.mjs` | generator output (incl. rgba→hex8, family separation), manifest integrity, preview adapter |
| `jsray-terminal` | `ansi/cli.test.mjs` | color math, nested-style resumption, end-to-end CLI via `execFile` |

CI: GitHub Actions in every repo (Node 18/20/22 matrix; Core also verifies
`dist/` sync and `npm pack`; WP adds `php -l` on PHP 7.4/8.3; terminal adds a
CLI smoke). WP `jsray.php` has **no behavioral tests** (PHPUnit + WP stubs
deliberately deferred).

---

## 9. Known issues & roadmap

- **WP**: PHPUnit coverage deferred — `tests/php/checks.php` runs 104
  assertions inside a real WordPress instead, on both ends of the supported
  range. Palette selection *is* exposed (`palette` and `custom_palette` in
  Settings → JSRay), which this list claimed for a while after it shipped.
- **VS Code**: `vsce package` not yet run. Editor acceptance is covered —
  `npm run test:editor` boots a real VS Code through `@vscode/test-electron`
  and runs 32 assertions against `markdown.api.render`, the preview's own
  pipeline.
- **Terminal**: `--bg` (painted background), pager integration, and a
  `--core <path>` override are roadmap items.
- **User-side core pinning** (roadmap): platform-native update controls
  already let users decline a train (WP manual updates, VS Code
  per-extension auto-update off + version install, npm pinning). An
  in-plugin "core update policy" (follow / lock / custom file) is feasible
  for WP and the terminal, impossible for the VS Code preview (static
  contribution paths). Hard rule: a locked core must surface an explicit
  warning when a security-grade Core update ships — security fixes are
  never silently pinnable.
- **jsray-vscode / jsray-terminal**: both public since 2026-09-03 and
  2026-09-05. jsray-vscode has a release carrying an installable `.vsix`;
  jsray-terminal has no release yet, so the only way in is
  `npm i -g github:jsrayorg/jsray-terminal` — a tag exists to cut one from.
  They now
  carry what `jsray-wp` gained on 2026-08-26/27, because all three drift the
  same way:
  `tools/sync-core-version.mjs` deriving the README Core badge instead of
  leaving it to whoever runs the sync; `check:versions` asserting the badges
  and the phase wording *in both directions* — the wrong phrase sitting beside
  the right one is what let "Internal test build · no public beta yet" survive
  the whole public beta; and the plugin version ladder (`0.0.1-beta →
  0.0.2-beta`, no counter) rather than Core's. Both bundle Core
  `0.0.2-beta.1`, and stay there until each cuts its own release: an
  integration syncs Core as part of releasing, not when Core ships. The rule
  and its one exception are in `docs/projects.md`.

- **Core**: minification is deliberately absent, and that is a decision now
  rather than a pending one. Stripping comments and indentation takes the
  brotli transfer from 23.9 KB to 14.8 KB — 9 KB is a real saving, and the
  comments alone are 31% of the file, written for maintainers and downloaded
  by every visitor. What it buys against that is a second artifact travelling
  the whole chain — `integrity.json`, the three bundled snapshots, the
  `/v/<version>/` paths, the SRI examples in both READMEs — and a new way for
  a release to ship corrupted. A `dist/` a user can read and audit against its
  digest is worth more than 9 KB today. Reopen this on a real size complaint
  or a substantial growth in Core, not at a version number: "revisit at public
  beta" named 2026-07-17, a date that passed, after which the entry sat here
  being rediscovered as an open question every planning round.
- **Literal forms with no rule** (found while auditing for beta.5, deferred
  because they are absent features rather than wrong spans): heredocs —
  `<<<EOT` in PHP, `<<~EOT` in Ruby, `<<EOF` in shell — plus Ruby `%w[]` and
  `%q()`, Perl `q{}` and `qq{}`, and Elixir sigils. Each renders its body as
  ordinary code today. Haskell's nested `{- {- -} -}` comments close at the
  first inner terminator and cannot be fixed with a flat pattern at all; they
  need the same nesting support embedded languages will need.
- **Language detection tuning** (audited for beta.5, deferred): detection is
  correct on all 22 realistic multi-line samples, and correctly returns empty
  for prose, digits and single words rather than guessing. On one-line
  snippets it misreads Go's `func f(x int) int` as Swift and a shell
  `x=1; echo "$x"` as PHP, and returns empty for short C#, Kotlin and TOML.
  Retuning the scores changes the relative ranking of all 83 grammars at
  once, so it needs its own corpus and a beta round of its own —
  the failure is mild (usually plain text) and only reachable when the caller
  supplies no language, which the integrations normally do.
- **Cosmetic, deliberately left**: a literal prefix that sits outside its
  string — `@"…"` and `$"…"` in C#, `r"…"` in Rust, `#"…"#` in Swift, `s"…"`
  in Scala — and the sign in a CSS `-1.5em` or the leading dot in JavaScript's
  `.5`. The literal is coloured; one character in front of it is not.
- **The string rules themselves** are hand-written once per grammar family
  without encoding a terminator model, which is what produced every fix in
  beta.5. Rewriting them onto one builder changes the shape of the objects in
  `languages`, which is a declared public type, so it waits for the API pass in
  0.0.2. `tests/constructs.test.mjs` is what guards the behaviour until then.
