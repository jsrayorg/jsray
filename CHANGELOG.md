# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [SemVer](https://semver.org/).

> This repository tracks JSRay Core versions only. Platform plugins such as WordPress maintain their own versions and changelogs in separate repositories.

## [Unreleased]

### Added

- **`check:docs-parity`.** Every document here is written twice, and nothing
  checked that the two agreed. The check compares what cannot legitimately
  differ between translations — versions, paths, package specifiers, links,
  section structure, table row counts — and leaves prose, sentence counts and
  translated placeholders alone. It is wired into CI beside `check:versions`.

### Fixed

- **The Chinese docs said less than the English ones.** The Core sync rule
  merged in #22 existed only in English; the Chinese repository table was
  headed 状态 and answered a different question than the English column, while
  the sentence under it explained the English one; and the versioning doc
  dropped the npm account the package publishes from.

- **The roadmap described jsray-terminal as having a release.** It has none —
  the only way in is the GitHub install line. It also carried "syncing them to
  0.0.2-beta.2 is the next step", written when Core was on beta.2 and wrong in
  two ways since: it named a superseded release, and an integration syncs Core
  as part of its own release, so being behind between releases is the expected
  state rather than a queued chore.

### Changed

- **Two deadlines became conditions.** "Revisit at public beta" named
  2026-07-17; that date passed and the entry became something every planning
  round rediscovered and re-argued. Minification now carries its answer — a
  readable, auditable `dist/` is worth more than the 9 KB brotli saves, and
  the comments are 31% of the file — together with a trigger that cannot
  expire: a real size complaint, or Core growing substantially. Detection
  tuning no longer "belongs with the 0.0.2 engine work" while we are inside
  0.0.2; it needs a beta round of its own, because retuning the scores
  reorders all 83 grammars at once.

## [0.0.2-beta.3] — 2026-09-06

Documentation and the guards around it. No runtime change: `dist/` differs from
beta.2 only in the version string it reports.

### Fixed
- **The Code of Conduct says where to report.** Its enforcement section invited
  reports "to the community leaders responsible for enforcement" and named no
  address, which is the same as having no channel. It now names
  `support@jsray.org`, the address SECURITY.md already used.
- **A release subject that is a version and one word is rejected.**
  `tools/hooks/commit-msg` already refused a bare `0.0.1-beta.3`, with a
  comment about how a version number lands on every file the release touched.
  `Release 0.0.2-beta.2` walked past that pattern and did exactly what it
  describes, on twelve files. The pattern now covers a leading
  release/bump/publish/tag word.
- **The subject check runs on pull requests.** The hook only protects a
  machine that has configured `core.hooksPath`; CI now runs the same file
  against every commit a pull request adds, where it cannot be skipped.
- **The roadmap entry for jsray-vscode and jsray-terminal.** It described both
  as unpublished, bundling Core `0.0.1-beta.5`, with READMEs pointing at
  `0.0.1-beta.1`. Both are public, both bundle `0.0.2-beta.1`, and both now
  derive and check the badges it said they needed first.

### Changed
- **Availability is stated, not contrasted.** The integrations table and
  `docs/projects.md` paired each channel with the one it is not on yet. They
  now say where each integration is installed from.

## [0.0.2-beta.2] — 2026-09-05

Ships the portable renderer, and corrects what the registry and the site were
saying about this project.

### Added

- **Window frames for a portable block**, via `renderPortable(…, { frame })`. `header` is jsray-wp's own title bar — bold filename on the left, language on the right — so a block copied from the site and a block the plugin rendered read as the same product; `macos` is the three dots; `minimal` is a hairline strip. `title` and `label` fill them, and the chrome's colours are computed from the palette with the same arithmetic the plugin's stylesheet does in `color-mix()`, rather than a second set of colours that would drift. A frame costs 490 bytes for the hairline, 750 for the title bar and 1,060 for the dots.
- **`renderPortable()` — HTML that carries its own styling.** A third consumer of the token stream, beside `render()` and the terminal's ANSI writer, for the case a plugin cannot reach: code pasted into somebody else's site, where `class="tk-keyword"` resolves to nothing because `jsray.css` was never loaded. Every colour is written inline and the container carries its own background, padding and monospace stack, so the block depends on nothing outside the string it returns. Rich-text editors that strip `<style>` blocks and class attributes generally keep inline `style`, which is the whole basis of it — though what any particular destination allows is worth testing before relying on it. Two limits come with the approach rather than the implementation: the theme is fixed when the string is produced, so a pasted block cannot follow the destination's light/dark setting; and it costs about 40% more than the class-based form, roughly twelve times the source, which is nothing to paste and a lot to serve.
- **A page to use it**, at `/paste.html`. Pick a language, palette and mode, and copy. The copy carries both `text/html` and `text/plain`, so pasting into a code editor gives the original source rather than a screenful of markup.

### Fixed

- **A host styling `code` no longer shows through the block.** The inner `<code>` carried its declarations at normal weight while the `<pre>` around it carried `!important`, and `code { background: … !important }` is one of the most common rules a blog theme ships: it painted a band behind every line, and its colour showed on any token the palette leaves unstyled. Both elements now take the same weight.
- **An unframed block draws its own edge.** On a host whose background is close to the palette's, a borderless rectangle had nothing to say where it started.
- **A portable block now outranks the host stylesheet.** Inline styles beat anything a destination writes at normal weight, but an author's `!important` beats inline — and themes ship `pre { white-space: pre-wrap !important }` to stop code scrolling on phones, which reflows the block and destroys its alignment. The container's own declarations carry `!important` for the 70 bytes it costs. Token colours do not by default; `renderPortable(…, { important: true })` extends it to them, for about a quarter more bytes, and is worth reaching for only when a destination's CSS reaches into spans.
- **The clipboard fallback writes the string, not the browser's idea of it.** It used to select an offscreen `contenteditable` and let `execCommand` serialise it — but a selection is serialised from *computed* styles, so 2612 bytes of renderer output arrived as 6934 with 57 copies of a host declaration baked into the spans. It looked right, which is why nobody would have reported it. Intercepting the copy event and calling `setData` puts the exact string on the clipboard.
- **`highlightAll()` no longer overwrites a portable block.** The auto-scan matches `pre > code`, which is exactly the shape `renderPortable()` produces, so a portable block sharing a page with JSRay was re-rendered in class form — losing every inline colour on any page without `jsray.css`, which is most of the pages this feature exists for. The block now marks itself `data-jsray-portable` and the scan skips it. The failure hid well: on the paste page the class rendering picked up the site's own stylesheet and looked plausible, and because the scan runs once at `DOMContentLoaded`, editing the code afterwards repainted it correctly. A destination that strips data attributes still falls back to being re-highlighted in that site's palette — wrong, but legible.

### Changed

- **The palette fallback chain has one implementation.** `applyThemeToRoot` carried the only copy of it; `resolveToken` is now shared with the portable renderer, because two renderers resolving the same palette by two implementations is how they come to disagree about a palette that predates a token key.
- The site build ships `themes/` and the new page. The paste page fetches every palette at runtime for the same reason the Studio does — a second copy of the colours is a second thing to drift.
- **The README says what the integrations are, because npm shows this file.** The published page for `@jsray/core@0.0.2-beta.1` still lists all three as "Coming soon"; all three are public with releases, and the table now links each one and says where each can be installed from. npm freezes a package page per version, so a correction only reaches the registry by publishing.
- **`repository` and `bugs` point at the organisation's current name.** They were published as `github.com/JSRayCore/JSRay`, which still redirects — but the frozen metadata is what every tool reads, and the org name it names no longer exists.
- **The versioning doc says why Core counts its betas.** It justified the counter mechanically — `check:versions` wants it, `version_compare()` orders it — which is true and is not the reason. Core is the kernel every integration renders through, so it earns more revision rounds before `0.1.0` than anything built on it, and those land inside one patch. The integrations bump the patch each time, so a counter would say nothing.

## [0.0.2-beta.1] — 2026-08-24

One regression, shipped in beta.5 and found by rendering a real page.

### Fixed

- **An apostrophe in a Rust comment is no longer read as a lifetime.** A lifetime has no closing quote, so the rule beta.5 introduced matched any apostrophe followed by letters — and it sat ahead of the line-comment rule, which cannot defend against something in front of it. `// don't do this` was cut at the apostrophe: the comment ended there, `'t` became a type, and the rest of the line rendered as code. English comments in Rust are full of `don't`, `it's` and `one's`, so this was not an edge case. The rule now sits behind the line-comment rule, where it still fires everywhere a lifetime can occur — a lifetime never appears inside a comment or a string, and both are consumed by then. Character literals stay where they were, because they are strings and line comments deliberately come after strings so a `//` inside `"https://…"` stays a URL.

## [0.0.1-beta.5] — 2026-08-21

The first release since beta.1 that changes what the highlighter puts on screen. Eight literal forms were tokenised by rules that either fired and claimed the wrong span, or did not exist — the failure mode a test asking "did the string rule match?" cannot see, because in most of these cases it did.

Not everything found is fixed here. Heredocs (`<<<EOT` in PHP, `<<~EOT` in Ruby, `<<EOF` in shell), Ruby `%w[]` and `%q()`, Perl `q{}` and `qq{}`, Elixir sigils, and Haskell's nested block comments have no rule at all and are listed in the roadmap rather than patched in a fix release; nesting in particular cannot be done with a flat pattern. A literal prefix that sits outside its string — `@"…"`, `$"…"`, `r"…"`, `#"…"#`, `s"…"` — is cosmetic and left alone.

### Fixed

- **Rust lifetimes no longer swallow the code between them.** `'a` was read as the opening of a character literal, so the shared single-quote rule scanned forward to the next apostrophe: `struct Foo<'a> { s: &'a str }` painted `'a> { s: &'` as one string, losing twelve characters of real code into it. Any signature with two lifetimes — which is most of them — rendered wrong. A lifetime is now typed as the type parameter it stands in for, and the greedy rule is *replaced* rather than preceded, so no pattern survives that can still span from one apostrophe to a later one. Character literals, including `'\u{1F600}'`, are unaffected.
- **Go raw string literals are strings.** Nothing gave the backtick a meaning, so a `` `line1\nline2` `` literal rendered as bare unstyled text. They span newlines and recognise no escapes, which is now what the rule says.
- **Triple-quoted strings survive their opener.** `"""` begins with `""`, so the single-line rule matched an empty string and left the third quote and the entire body outside any token. Java text blocks, Kotlin and Scala raw strings, Swift multiline literals, C# raw strings and Dart's triple-quoted form all share the opener and all shared the bug.
- **A BigInt suffix belongs to its number.** `10n` and `0x1fn` produced no number token at all — not the digits alone, nothing — because `10n` is a single word to a word boundary and the pattern closed on `\b`.
- **C++ and Rust raw strings hold the quotes they exist to hold.** `R"(a "b" c)"` and `r#"a "b" c"#` closed at the inner quote and left `b` bare between two string fragments — the same failure as a triple-quoted block, in the one syntax whose entire purpose is to contain the character that causes it. Both delimiters are counted or named (`R"tag(…)tag"`, `r##"…"##`) and are now matched as such, so a sequence that merely resembles the terminator does not end the literal.
- **A numeric type suffix belongs to its literal.** `1_000i64`, `1_000i`, `1.5m` and `0x1p3` produced no number token at all — not the digits alone, nothing — because the word boundary sits between the last digit and the suffix letter. Rust's integer and float suffixes, Go's imaginary `i`, C#'s decimal `m` and the C hexadecimal exponent are now part of the literal. The hexadecimal fraction requires its `p`, so `0xff.count_ones()` keeps its method call rather than losing the dot to a number.
- **Twenty keywords added, mostly the headline feature of a recent language version.** The grammars were built from each language's reserved-word list, and the features that matter most in modern code are spelled with *restricted identifiers* instead — words that are keywords only in position. So `record Point(int x)`, `sealed interface S permits C`, `actor Counter`, `func f(v any) any` and `required int X { get; init; }` all rendered with their leading word uncoloured. Added: Java `record` `sealed` `permits` `yield`; C# `init` `required` `nint` `nuint`; Swift `actor` `some`; Go `any`; TypeScript `override` `asserts`; JavaScript `accessor` `using`; C++ `co_await` `co_yield` `co_return`; Rust `union`; PHP `enum`; SQL `WINDOW` `LATERAL` `MERGE` `USING`. `record` and `actor` also introduce a type, so the name after them is now coloured as one. Two were deliberately left out: Python 3.12's `type` statement and C# 11's `file` modifier, because `type(x)` and `var file = …` are far more common than the constructs that make those words keywords.
- **A Ruby `=begin` block is a comment.** It had no rule, so documentation blocks were highlighted as ordinary code — words in the body came out coloured as function calls and keywords. The markers are only special at column zero and the rule anchors accordingly.
- **A Python replacement field may carry the delimiting quote.** PEP 701 makes `f"{a["k"]}"` valid from 3.12; the rule stopped at the first inner quote and split one string into two tokens with the key left bare between them. A field is now consumed whole. A nested brace — a format spec such as `:>{w}` — still falls through to the general rule, because covering it needs a nested quantifier, and that is the ambiguous shape behind the denial of service fixed in beta.3.

### Added

- **A construct corpus, asserted on token boundaries.** `tests/constructs.test.mjs` covers the five forms above plus the constructs most likely to break when the string rules are eventually rewritten — regex versus division, template and interpolating strings, doubled SQL quotes, CSS custom properties, generic constraints — and asserts which exact substring carries which exact class, rather than that some token appeared. Pathological inputs for every new pattern run under a time bound in the same file. The shared cause behind all five is that string rules are hand-written once per grammar family without encoding a terminator model: thirty-five chances to get it wrong. Rewriting them onto one builder is an API-shaped change and waits for 0.0.2; until then this corpus is what stands between a sixth instance and a release.
- **A commit-msg hook.** `tools/hooks/commit-msg` rejects type prefixes, bare version numbers, hand-typed `(#N)` and over-long subjects, and is enabled with `git config core.hooksPath tools/hooks`.

### Changed

- **The commit convention says what a subject is for.** It read "short, imperative" and produced short, imperative subjects that reported completion — which the diff stat already said. The rule is now causal: the subject names the mechanism and its effect. Type prefixes are gone; `feat:` classifies rather than describes, `chore:` reads as "not worth your time", and the invented ones here were not from any standard. Both ways to lose a pull request number are written down, including the one this repository demonstrated: typing `(#N)` yourself yields `(#6) (#6)`, because a single-commit pull request squashes using the commit's own subject and appends the number to whatever it finds.

## [0.0.1-beta.4] — 2026-08-01

No engine changes. `dist/jsray.js` is byte-for-byte the 0.0.1-beta.3 build — this release is about what surrounds it: what the package publishes, what the site sends, and how a copied snapshot stays current.

### Added
- **Subresource Integrity for anyone loading Core from jsray.org.** The integrations verify their bundled snapshot against `integrity.json`; a page loading the same file over a `<script>` tag verified nothing. The digests were already `sha256-<base64>`, the exact format SRI takes, so this needed publishing rather than inventing. Two things had to be true for the instructions to work rather than break pages: `/v/<version>/integrity.json` had to exist — it was a 404, because the build copied `dist/` and left the manifest behind — and the pinned paths had to send `Access-Control-Allow-Origin`, because SRI on a cross-origin script is only enforced when `crossorigin="anonymous"` makes the load a CORS request, and the browser blocks the script outright otherwise. Verified end to end from a separate origin: a correct hash loads, a wrong one is refused.
- **Security response headers.** jsray.org serves JavaScript into other people's pages and sent none: no HSTS, so a first visit typed without a scheme was a plaintext request; no `nosniff`, on an origin whose job is serving `.js` and `.css` to third parties. Also `Referrer-Policy` and `X-Frame-Options`.
- **The palette sources ship.** `themes/*.json` is in `files` and in `exports`. The VS Code themes and terminal ANSI maps are regenerated from those sources, not from the CSS, and an integration syncing from the published package would otherwise have quietly ended up with one palette where there should be four — the copy step skipped a missing directory rather than failing on it.
- A footer on both site pages: install, documentation, ecosystem, project. The integrations are named but not linked, because their repositories do not exist yet.

### Fixed
- **`/v/<version>/` is immutable.** Those paths never change by design — that is the entire reason they exist — and were served with the same `must-revalidate` policy as `/dist/`, so every page load asked the origin about a file that cannot differ.
- **One fewer redirect.** The deployed pages link `/studio` rather than `/studio.html`, which Cloudflare was answering with a 307 on every visit. Rewritten at build time, so opening `demo/index.html` from a checkout still works.
- **The theme studio wrote incomplete themes.** Its surface list had two of five entries, so a downloaded theme carried no `--jr-border`, `--jr-gutter-fg` or `--jr-line-hl` — leaving inline code with no background and the scrollbar thumb invisible, on a file the studio itself tells you to drop next to `jsray.css`.

### Changed
- **Integrations stop relying on someone remembering to sync.** They vendor a Core snapshot because a WordPress plugin is a zip on a host with no package manager and a VS Code extension has to work offline. A copy does not update itself, and the existing drift check compares against a sibling checkout and skips silently when Core is absent — which is every CI run. beta.3 fixed a denial of service that stayed in all three bundles until someone measured them. `tools/sync-core.sh` now accepts `JSRAY_CORE_VERSION` and syncs from the published tarball, so the sync can run somewhere other than a maintainer's laptop; `sync-core-version.mjs` falls back to `package.json`, because `version.json` is not published. The integration side — a CI check that fails when the bundle is behind the `beta` dist-tag, and a scheduled workflow that opens a sync pull request — lives in those repositories.
- `docs/development.md` records a convention that was never written down: **security releases do not batch.**

## [0.0.1-beta.3] — 2026-07-31

### Fixed
- **Catastrophic backtracking on unterminated interpolating strings.** JavaScript template literals, Ruby and Elixir `#{}` strings, and shell `"$var"` strings each let an interpolation be matched two ways — as one placeholder or character by character — so an unclosed string made the regex engine try every combination. Twenty-six `$a` in an unclosed shell string took 115 seconds; a few thousand characters would never finish. In a browser that is a frozen tab, reachable from ordinary content: a snippet cut off mid-line, a tutorial showing half a function. Each fallback character class now excludes the character its interpolation branch starts with, which is what PHP and PowerShell already did. The same input is now handled in single-digit milliseconds at any length.
- **CSS custom properties were split in two.** `--jr-keyword: #ff7b72` rendered as an uncolored `--` followed by a `jr-keyword` token, and `var(--brand)` was left entirely uncolored, because a word boundary cannot match before a leading `-`. Custom properties are now matched whole in both roles. JSRay's own theme stylesheets are made of nothing else — all 56 declarations in `default.css` were affected.
- **YAML block scalars treated `#` as a comment.** Everything indented under `key: |` or `key: >` is literal text; a `#` in there is content.
- **The default palette was missing three surfaces.** `tokens.json` declared `background` and `foreground` but not `border`, `gutter`, or `lineHighlight`; the other three themes declared all five. The generated CSS looked complete because `generate-theme.mjs` substitutes a default for anything a palette omits — but `applyTheme()` and the integrations read the palette, not the CSS. Switching to the default palette at runtime therefore left the previous theme's border and gutter in place. The values are now in the palette itself, identical to what the generator was substituting, so the stylesheets are byte-for-byte unchanged.

### Changed
- `JSRay.languages` gained the four punctuation aliases (`c++`, `c#`, `objective-c`, `obj-c`), which were reachable through `normalizeLanguage()` but absent as lookup keys — 79 keys to 83, over the same 35 grammars. No existing key changed what it normalizes to.
- Language aliases are declared once. Thirty-five `G.rb = G.ruby` assignments duplicated `LANGUAGE_ALIASES` and had already drifted from it — `ts` pointed at `javascript` in one place and `typescript` in the other. The table is now the only declaration and the lookup keys are derived from it.
- Node 18 left the CI matrix (end-of-life) and `engines.node` moved to `>=20`. Nothing in Core required the change; a supported version the tests never run is a guess.

### Added
- `tests/contract.test.mjs`: invariants that hold across every language rather than one at a time — highlighting never alters the source text, `tokenize()` never loses text, output can never break out of `innerHTML`, no input shape takes superlinear time in any grammar, and the published package contains what the docs, types, and integrations depend on. 108 tests total, up from 67.
- Drift guards for the two single-source tables. `vocabulary.json` is inlined in the runtime as `THEME_ALIAS` because Core loads as a plain `<script>` and cannot read JSON; a test now asserts the copy matches entry for entry, and that `applyTheme()` uses all of it. `tests/palettes.test.mjs` also stopped restating the token list and reads it from `vocabulary.json` — a hand-copied list in a contract test silently stops checking tokens added after it was written.
- While no stable version exists on the registry, `tools/release.sh` now points `latest` at the newest prerelease as well as `beta`. `latest` has to point somewhere and npm picks it regardless, so leaving it alone did not mean "no default" — it meant the default stayed frozen on whichever prerelease claimed it first. `npm install @jsray/core`, the command in the README, kept installing 0.0.1-beta.2 after beta.3 shipped: older than the current release, and carrying the denial of service above. The check reads the registry rather than a flag, so it ends by itself when 1.0 is published.
- CI verifies `integrity.json` and includes it in the build-sync diff. This manifest is how every integration decides whether the Core snapshot it bundles is the official build, and nothing in CI had been checking it.

### Documentation
- `types/jsray.d.ts` said `require('jsray')` — the package is `@jsray/core` — carried a version example from the retired internal channel, and described `applyTheme()`'s default root as `document.documentElement` when the implementation prefers the element carrying `data-theme`. A test now ties the example version to the real one.
- The README documented four of the eight public API methods. `tokenize()` and `render()`, the entry points for rendering to anything other than HTML, are now shown with the stream shape they exchange; `applyTheme()` and `normalizeLanguage()` are listed. A test keeps the list complete.
- Corrected the identifier-family count (the feature table lists nine, the text said six), the language table's missing identifiers (`jsonc`, `sass`, `less`, `kts`, `cfg`, `conf`), and the repository tree, which omitted `dist/themes/` — the directory every Quick Start snippet links — along with two of the five files in `docs/`.

## [0.0.1-beta.2] — 2026-07-26

### Fixed
- `highlightElement()` tagged elements with `data-cx-lang`, a leftover from the project's pre-rename identity, instead of `data-jsray-lang`. The attribute is informational — nothing in Core reads it back — but it surfaced in the DOM of every page using JSRay. Integrations that read it (the VS Code preview adapter's re-render cache) were updated in step.

### Changed
- Published to npm as [`@jsray/core`](https://www.npmjs.com/package/@jsray/core). The unscoped name `jsray` is unavailable, and the `@jsray` scope reserves the whole family for the integrations.

## [0.0.1-beta.1] — 2026-07-17

### Status
- **First public beta.** The repository is public at [github.com/jsrayorg/jsray](https://github.com/jsrayorg/jsray); integration repositories (WordPress, VS Code, terminal) open as each reaches its own beta.

### Highlights (everything from the internal series below)
- Zero-dependency rendering kernel: 35 language families / 79 language keys, 23-class token semantics with six-family identifier separation.
- Four built-in themes (default, aurora, ember, fjord), each dark + light, generated from palette JSON.
- Three-step language detection (JSON fast path → shebang → signal scoring).
- Token fallback chain and vocabulary governance for forward-compatible growth.
- ~2× tokenizer performance via rule-regex caching.

## [0.0.1-internal.2] — 2026-07-02

### Status
- Internal test build; not a public beta.

### Added
- 13 new language families (30+ total): Scala, Objective-C, R, Perl, PowerShell, Elixir, Haskell, GraphQL, TOML, INI, Dockerfile, Makefile, and Diff/Patch, with aliases (`objc`, `pl`, `ps1`, `ex`, `hs`, `gql`, `docker`, `make`, `patch`, `properties`, ...).
- `cLikeGrammar` gained a `fnDeclKeywords` option for declaration syntaxes without `(...) {` bodies (used by Scala's `def`).
- Shebang fast path in `detectLanguage()`: a leading `#!` line resolves the interpreter directly (python/perl/ruby/node/pwsh/php/bash).
- Detection signals for all new languages, with diff ranked first so patch payloads don't get mistaken for their embedded language.
- Three new built-in themes, each with dark + light variants and full 23-token coverage: **Aurora** (polar night, glacial blue + aurora mint/violet), **Ember** (warm forge, flame keywords + patina-mint functions), and **Fjord** (Nordic low-chroma for long reading sessions).
- `tools/generate-theme.mjs` now fans out every `themes/*.json` palette to `src/themes/<name>.css` in addition to `tokens.json` → `default.css`.
- Demo page gained a palette switcher (Default / Aurora / Ember / Fjord) alongside the dark/light toggle.

### Fixed
- `JSRay.applyTheme()` without an explicit root now targets the element carrying `data-theme` (usually `<body>`) instead of `<html>`. Inline variables on `<html>` were shadowed by the theme stylesheet's `[data-theme]` block on `<body>`, which made runtime theme edits — including every color change in the Theme Studio — visually inert.
- Comment markers inside strings no longer break highlighting, across every language family: `#` in ruby/shell/yaml/r/perl/elixir/toml/python/php/powershell/graphql/dockerfile, `//` in JS/TS, PHP, and the whole C-like family (URLs like `"https://..."` used to turn into comments), and `--` in lua/sql/haskell. Rule: block comments stay before strings; line comments come after.

### Added (post 2026-07-02)
- Token fallback chain in every render consumer (`applyTheme`, theme generator, VS Code themes, terminal ANSI): a refined key resolves through its base (`function.declaration` → `function`), so the vocabulary can grow in minor versions without breaking existing palettes or surfaces. Vocabulary governance rules documented in the development guide.
- `JSRay.version` runtime export for shell/core compatibility negotiation; `check:versions` asserts it matches `version.json`.
- Final logo (gradient `</>` mark, design 11b) wired into README heroes, demo/studio favicons, and downstream marketplace icons.
- `tools/sync-integrations.sh` / `npm run sync:integrations`: one-command Core → integrations propagation.

### Performance
- Grammar-rule regexes are compiled once and cached instead of per stream piece: highlighting is roughly 2× faster (64KB JS: 5.0 → 2.5 ms; 16KB Python: 2.0 → 0.8 ms).

### Changed
- The class count in docs and headers is standardized to the factual **23** (was branded "22"); the six-family separation remains the headline claim. `docs/tokens.md` family grouping corrected from 5 to 6.

## [0.0.1-internal.1] — 2026-06-12

### Status
- Internal test build; not a public beta.

### Added
- JavaScript-native rendering kernel `jsray.js`.
- 20+ language families / identifier sets: JS/TS, Python, PHP, Go, Swift, Kotlin, Dart, Lua, Java, C/C++/C#, Ruby, Rust, HTML, CSS, JSON, Shell, Markdown, SQL, YAML, and more.
- `JSRay.detectLanguage()` for auto-detecting common snippets when no `language-*` class is present.
- 22-class token semantic system with default dark/light themes.
- Programmatic API: `JSRay.highlight()` / `highlightElement()` / `highlightAll()`.
- `version.json` and `tools/check-versions.mjs` for validating Core internal version metadata.
- `docs/projects.md`, defining the boundary between Core and platform-plugin repositories.

### Changed
- Core version reset to `0.0.1-internal.1`.
- `package.json` keeps `"private": true` during the internal test phase to prevent accidental publishing.
- WordPress plugin code moved out of the Core repository, now maintained in a separate repository.
