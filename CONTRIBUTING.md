# Contributing

Issues and PRs for JSRay are welcome.

## Development workflow

1. Fork & clone
2. Edit `src/jsray.js` or `src/jsray.css`
3. Run `sh build.sh` to sync into `dist/` (currently a plain `cp`; minification can be layered on later)
4. Run the tests: `npm test` (requires Node ≥ 20)
5. Preview locally: serve the project root with any static server and open `/demo/index.html`

## Adding a language

Add a grammar object at `G.<lang>` in `src/jsray.js`:

```js
G.mylang = [
  { cls: 'tk-comment', pattern: /\/\/.*/ },
  { cls: 'tk-keyword', pattern: /\b(?:if|then|else)\b/ },
  // ... rules are ordered by priority — first match wins
];
```

Key points:
- **Rule order determines priority.** Comments / strings always go first.
- **Declaration rules go before `keyword`** (otherwise `function`/`def`/`class` are consumed by the keyword rule first and the declaration name is never captured).
- Use `lookbehind: true` with patterns like `(\bfunction\s+)` to mark a prefix; the prefix is consumed but not colored.
- Use `inside: [...]` to re-apply a sub-grammar to captured text (parameter lists and template-string interpolations rely on this).

Add a matching example to [docs/languages.md](docs/languages.md).

## Tuning the palette

Only touch the CSS variables at the top of `src/jsray.css`.
**Do not hardcode colors in the JS engine** — every color is driven through `--jr-*` variables.

After tuning, also update:
- `tokens.json` (machine-readable copy)
- the color table in `docs/tokens.md`
- the color table in `README.md`

## Commit conventions

One imperative sentence, then a blank line, then as much body as the change
deserves.

```
Give Rust its macro rule without a grammar of its own

The C-family factory covers everything else Rust needs, so the whole
difference is `name!` — a `rustMacros` option costs one rule and keeps
Rust reading as the same shape as the other nine languages built on it.
```

The `(#N)` is missing on purpose: the merge appends it, and typing it here
produces it twice. See below.

**Say what changed and why it is better, not that you finished something.**
This is the rule that matters; the rest are formatting. A subject that reports
completion tells a reader nothing they could not see from the diff stat.

```
✗  brand: finalize the logo lockups from the designer source
✗  chore: project identity is Jie <jie@jsray.org>
✗  0.0.1-beta.3

✓  Speed up XAUTOCLAIM by replacing per-entry lookups with a
   single forward scan                              (redis 15505)
✓  Prevent duplicate instances from replacing active Unix
   sockets                                          (redis 15537)
✓  Point latest at the newest prerelease while no stable exists
```

The good ones name the mechanism — *by replacing per-entry lookups*, *while no
stable exists* — so the subject carries the causal link and the body can spend
its space on the reasoning rather than restating the change. Where the
mechanism does not fit in the subject, put it in the first line of the body;
never drop it.

Every non-trivial commit gets a body, and the body answers **why**: what was
wrong before, what breaks if it stays that way, what was measured. A commit
whose body only rephrases its subject is a commit with no body.

**One concern per commit, and a version bump is a concern of its own.** The
subject is printed beside every file the commit touched, so a commit that
carries four unrelated changes prints a sentence that is a quarter true of each
of them. Releasing 0.0.2-beta.3 put *Carry the documentation corrections to npm
and the site* on sixteen paths, including `CODE_OF_CONDUCT.md` and
`.github/` — where it said nothing about what had changed. The subject was not
the problem; folding a Code of Conduct contact, a CI job, a hook pattern and a
version bump into one commit was.

Split by what changed, not by when it shipped: the release ends with a bump
that touches only the files a bump has to touch — `package.json`,
`version.json`, `dist/`, `src/`, `types/`, `tokens.json`, `vocabulary.json`,
`integrity.json`, the badges and pinned paths in the READMEs, `SECURITY.md`,
`CHANGELOG.md`, `demo/`. Everything else is its own commit, made before it.
`tools/release.sh` rejects a release whose final commit reaches outside that
set.

**Keep the subject under about 60 characters.** GitHub's file listing — the
view that shows which commit last touched each file — truncates there, and a
subject that survives it is the difference between a readable history and a
column of ellipses.

**No type prefixes.** `feat:`, `fix:`, `chore:`, and the invented ones this
repository accumulated — `brand:`, `deploy:`, `build:` — classify a commit
instead of describing it, and `chore:` in particular is a label for "not worth
reading". A prefix is worth the characters only when it names *where* the
change lands, the way Redis writes `Cluster: notify modules when node's own
ip/port changes`. Module, not category.

**Let the merge supply the `(#N)` — do not type it yourself.** There are two
ways to get this wrong and this repository has both on `main`:

- Passing `--subject` to `gh pr merge --squash` overrides the default and drops
  the number, leaving no way to reach the discussion behind the commit.
- Writing `(#N)` into the commit yourself doubles it. For a single-commit pull
  request GitHub squashes using *that commit's* subject rather than the pull
  request title, then appends the number to whatever it found —
  `Write down the commit convention (#6) (#6)` is what that looks like.

So: write the subject with no number, set the pull request title to the same
words, and merge with plain `gh pr merge --squash`.

### Enforcing this

```sh
git config core.hooksPath tools/hooks
```

`tools/hooks/commit-msg` refuses a type prefix, a bare version number, a
hand-typed `(#N)`, and a subject over 72 characters; it warns past 60 and when
there is no body. Rules only written down get applied after the fact, and after
the fact the choice is between living with the subject and rewriting published
history — which this project has already decided against. `--no-verify` exists
for real exceptions.

A release commit is a commit like any other — `Publish SRI hashes and harden
the site`, not `0.0.1-beta.3`. A bare version names the release without saying
anything about it, and it lands on every file the release touched.

Whether to use Conventional Commits at all is a coin flip — Redis writes plain
sentences, opencode uses `feat:`/`fix:`, both work at scales this project will
not reach soon. The value is in holding to one. Plain sentences match the
history already here.

## Pull Requests

`main` is protected and **nobody pushes to it directly — maintainers included**.
Every change lands the same way:

```sh
git checkout -b my-change
# ... work, then:
npm test && node tools/check-versions.mjs && node tools/integrity.mjs --check
npm run check:docs-parity   # if the change touched a document
git push origin my-change
gh pr create --fill
```

CI runs the suite on Node 20, 22, and 24. All three must pass before the PR can
merge; the branch also has to be up to date with `main`.

- One PR per concern, to keep reviews easy.
- Engine or grammar changes must come with added / updated tests.
- Every document here is written twice, as `X.md` and `X.zh-CN.md`. Both
  translations belong in the same pull request: a rule that exists in one
  language is a rule half the readers never see, and it reads perfectly well
  in the language you happen to be checking. `check:docs-parity` fails when a
  version, path, package specifier, or link appears in only one of a pair.
- Palette changes should include demo screenshots (both dark and light).

## Releasing

Only for maintainers, and the version bump is itself a pull request:

1. Bump `version.json`, `package.json`, `src/jsray.js`, `tokens.json`, and the
   docs `check:versions` looks at; add the `CHANGELOG.md` section.
2. Open a PR, let CI pass, merge it.
3. From the merged `main`: `npm run release`.

`tools/release.sh` publishes to npm, tags the commit, and cuts the GitHub
release from the changelog section — refusing to start if the tree is dirty,
the tag exists, the version is already on npm, or `dist/` is stale in the
commit. Tags are not covered by branch protection, so the script needs no
special access.

## Code of Conduct

Participating in this project means you agree to follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
