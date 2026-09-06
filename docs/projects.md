# JSRay Project Boundary

**English** · [简体中文](projects.zh-CN.md)

This repository is **JSRay Core**.

JSRay Core is the standalone JavaScript-native code rendering kernel. Platform plugins are separate products and should live in separate git repositories.

## Ecosystem Vision

JSRay is a fully open-source code rendering ecosystem. The goal is to let JSRay work wherever code appears: websites, content platforms, editors, documentation systems, and developer tools.

> One renderer. Many places for code to shine.

## Ecosystem Layers

1. Core: `jsray`, the zero-dependency JavaScript renderer.
2. Official integrations: maintained platform projects: `jsray-wp`, `jsray-vscode`, and `jsray-terminal`.
3. Community integrations: third-party adapters for frameworks, static-site generators, editors, and publishing tools.

Official integrations should be complete open-source projects. They should not lock the baseline JSRay experience behind paid feature gates.

## Renderer Boundary

Official integrations use JSRay Core by default. They are JSRay ecosystem entry points, not closed wrappers around a single renderer.

The platform layer should expose adapter hooks so host projects can integrate another renderer when needed. The default experience stays JSRay, while the extension points keep the ecosystem open.

The minimum renderer shape is:

```js
renderer.highlight(code, language, options) -> html
renderer.highlightElement(element, options) -> void
renderer.languages -> { [language]: label }
```

## Core Owns

- `src/jsray.js`
- `src/jsray.css`
- `src/themes/`
- `tokens.json`
- `types/jsray.d.ts`
- `dist/`
- npm package metadata
- Core versioning and changelog

## Platform Plugins Own

- Platform-specific editor UI
- Platform-specific settings
- Platform-specific packaging
- Platform plugin versioning and changelog
- Bundled Core asset snapshots

## Dependency Direction

Platform plugins depend on Core. Core must not depend on platform plugins.

Core changes flow into plugin repositories by copying or packaging `dist/` assets. Plugin changes should not require Core version changes unless they alter the Core API or assets.

**An integration syncs Core as part of its own release, not when Core ships.**
A vendored copy cannot follow Core in real time: every artifact freezes the
snapshot it was built from — a `.vsix`, a plugin zip, and the source archive
GitHub attaches to a tag alike — so a repository that re-syncs the moment Core
publishes has aligned its source and nothing a user can install. Alignment is
something a release does.

So `tools/check-core-freshness.mjs` is advisory day to day and strict at the
packaging gate: being behind between releases is reported, and nothing can be
packaged from a stale engine (`--strict`, wired into each integration's build
or packaging script). A security-grade Core release is the case that should not
wait for the next feature release — cut the integration release for it.

## Repository Split

| Repository | Intended channel | Licence | Available from today |
|---|---|---|---|
| `jsray` | npm `@jsray/core` | MIT | npm — `@jsray/core@0.0.2-beta.3` |
| `jsray-wp` | WordPress.org plugin | GPLv2 or later | GitHub release zip |
| `jsray-terminal` | npm CLI | MIT | GitHub — `npm i -g github:jsrayorg/jsray-terminal` |
| `jsray-vscode` | VS Code Marketplace | MIT | GitHub release `.vsix` |

The last column is where a user gets the thing today; the second is the channel
each is headed for at `0.1.0`.

Future platform repositories such as `jsray-react`, `jsray-astro`, or
`jsray-mdx` if needed.

**The licences differ on purpose.** Core is MIT so anything can embed it. The
WordPress plugin is GPLv2-or-later because WordPress.org's first guideline
accepts any GPL-compatible licence and strongly recommends WordPress's own —
MIT qualifies, but there is nothing to gain from being the exception in a
directory where everything else is GPL. MIT is GPL-compatible in that
direction, so the plugin bundling an MIT Core is permitted; MIT asks that its
notice travel along, which is what `jsray-wp/LICENSE-THIRD-PARTY` is for. Any
integration that lands on a GPL platform should expect the same treatment.

## Website Routes

The public website keeps the brand concentrated under `jsray.org`:

- `https://jsray.org`: project home — the live demo, theme switcher, and Core renderer.
- `https://jsray.org/studio.html`: in-browser theme studio.
- `https://jsray.org/dist/`: the current release's Core assets
  (`jsray.org/dist/jsray.js`, `jsray.org/dist/themes/<name>.css`). This path
  moves on every release, which is right for the demo and wrong for a site
  nobody is watching.
- `https://jsray.org/v/<version>/`: the same files frozen per release
  (`jsray.org/v/0.0.2-beta.3/jsray.js`). A page that pins here keeps rendering
  the way it did the day it was written.

`tools/build-site.sh` emits both. Cloudflare replaces the whole asset bundle on
each deploy, so previously published versions cannot survive from the last
build — they are restored from npm, which is already the record of what
shipped. Losing the network degrades to "only the current version is pinnable"
rather than failing the deploy.

Per-integration routes are added as each integration ships — no route is
published before the product behind it exists.
