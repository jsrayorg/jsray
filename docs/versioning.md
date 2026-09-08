# JSRay Versioning

**English** · [简体中文](versioning.zh-CN.md)

JSRay Core uses single-project versioning. Platform plugins keep their own version files in their own repositories.

Current version: `0.0.2-beta.4`
Current channel: `beta`
Public beta released: yes

JSRay Core is the standalone JavaScript-native code rendering kernel. Platform plugins, including the WordPress plugin, are separate repositories that consume and bundle Core.

Internal test builds may be shared privately, but they should not be described as public beta releases.

## Channels

| Channel | Format | Meaning |
|---|---|---|
| Internal | `0.0.1-internal.N` | Private test builds before a public beta. |
| Public beta | `0.0.P-beta.N` | Public beta builds announced to external users. |
| Stable | `0.1.0` | Stable public release. |

### The ladder

Each beta bumps the **patch**, and Core alone keeps a counter after it. That is
not a notation preference: Core is the kernel every integration renders through,
so it earns more revision rounds before `0.1.0` than anything built on top of it,
and those rounds land within a single patch. The integrations do not iterate that
way, so they carry no counter.

The mechanics follow from that: `check:versions` requires the counter here, and
`version_compare()` is what orders these — string order would put `0.0.10` before
`0.0.2`.

```
0.0.1-beta.1 … 0.0.1-beta.5 → 0.0.2-beta.1 … 0.0.2-beta.4 → 0.0.3-beta.1 → … → 0.1.0
```

The `0.0.1` line closed at beta.5. `0.1.0` is where the beta label comes off,
and `0.0.1` is therefore never released as a stable version — the ladder walks
past it.

Integrations climb the same rungs but not the same notation. Core keeps the
counter because its betas iterate *within* a patch — `0.0.1-beta.1` through
`0.0.1-beta.5` were five releases of one patch. An integration bumps the patch
every time, so its counter would be `1` forever and carry nothing; `jsray-wp`
therefore releases `0.0.1-beta → 0.0.2-beta → … → 0.1.0`. Both orders correctly
under `version_compare()`, which is what WordPress uses to decide whether an
update is newer.

What every repository does share is the rule tying an integration's major to
the Core it bundles, which keeps all of them on `0.x` until this reaches
`0.1.0` and beyond.

## Rules

1. `version.json` is the Core release-channel summary.
2. `package.json` and `tokens.json` track the Core version.
3. Platform plugin versions live in their own repositories and may differ from the Core version.
4. Internal Core builds keep `package.json` marked as `"private": true` to prevent accidental npm publishing.
5. Before committing version changes, run `npm run check:versions`.

## Changing channel

Written as a rule rather than as the steps for one transition — this section
used to describe getting to the *first* public beta, an event that happened on
2026-07-17, and read as though the project were still waiting for it.

Whatever the move, `version.json` is the source: change `version` and `channel`
there, then run `npm run check:versions`, which enforces the rest.

| Moving to | Version must | Also |
|---|---|---|
| `internal` | end `-internal.N` | keep `"private": true` in package.json |
| `beta` | end `-beta.N` | drop `"private": true` if npm publishing is intended; set `publicBetaReleased: true` |
| `stable` | carry no prerelease suffix | — |

The README badges and the phase wording in both READMEs have to match the new
channel, and `check:versions` fails on a mismatch in either direction — it is
not enough for the right phrase to be present if the wrong one is still there
beside it. A `CHANGELOG.md` section for the new version is required too.

## npm Publishing

The package is published as [`@jsray/core`](https://www.npmjs.com/package/@jsray/core)
from the `jsray` npm account. The unscoped name `jsray` is unavailable — npm
rejects it as too similar to the existing `js-ray` package — and the `@jsray`
scope has the advantage of reserving the whole family (`@jsray/wp`,
`@jsray/vscode`, `@jsray/terminal`) in one go.

| Channel | npm command | Users install with |
|---|---|---|
| beta | `npm publish --tag beta` | `npm install @jsray/core@beta` |
| stable | `npm publish` | `npm install @jsray/core` |

Scoped packages default to restricted access; `publishConfig.access: "public"`
in package.json keeps every publish public without extra flags.

Prerelease versions ship under the `beta` tag so they never displace a
stable release as the default install.

**Before 1.0 there is no stable release to displace,** and `latest` has to
point somewhere — npm picks it whether or not anyone decides. Leaving it
alone does not mean "no default"; it means the default stays frozen on
whichever prerelease claimed it first. That is exactly what happened
between beta.2 and beta.3 (a past incident, kept here because it is the reason
the rule exists): `npm install @jsray/core`, the command in the
README, kept installing 0.0.1-beta.2 — older than the current release and
carrying a denial of service — while `@beta` had the fix.

So while no stable version exists on the registry, `tools/release.sh`
points `latest` at the newest prerelease as well. It checks the registry
rather than a flag, so the behaviour ends by itself the moment 1.0 is
published: from then on `latest` belongs to stable releases and a
prerelease will never take it back.

`package.json` drops `"private": true` at the beta promotion —
`check:versions` only enforces that flag on the internal channel.

Published contents are governed by the `files` array: `dist/`, `types/`,
`tokens.json`, `vocabulary.json`, `integrity.json`, `assets/brand`, README,
LICENSE, CHANGELOG. The last two of those are not optional — integrations
validate custom palettes against `vocabulary.json` and verify their bundled
Core snapshot against `integrity.json`, so a publish that dropped either would
break them without breaking anything here. `tests/contract.test.mjs` asserts
the package still contains them; `npm pack --dry-run` shows the full list.
