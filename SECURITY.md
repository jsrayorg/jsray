# Security Policy

## Reporting a vulnerability

If you find a security vulnerability, **do not** open a public issue. Please report it privately:

- Email: **support@jsray.org**
- Official site: https://jsray.org

We aim to acknowledge reports within 72 hours.

## Scope

`jsray.js` runs in a browser context, on text the page author often did not
write. Two classes of report are in scope.

**Escaping.** The engine escapes `& < > "` via `escapeHtml()`, and no input
should ever produce unescaped HTML. An input string that makes the output
contain unescaped angle brackets or an attribute-quote escape is a
**high-severity vulnerability**.

**Denial of service.** An input that makes highlighting take disproportionate
time — typically catastrophic regex backtracking — is also a vulnerability, and
should be reported privately. The output is rendered synchronously on the main
thread, so a rule that backtracks does not merely run slowly: it freezes the
tab. In 0.0.1-beta.3 an unterminated shell string of 53 characters held the
engine for 115 seconds, and unterminated strings arrive through ordinary
content — a snippet cut off mid-line, a tutorial showing half a function.

> An earlier version of this policy asked for backtracking to be filed as a
> public issue. That was wrong: it invited public disclosure of a live
> denial of service. Please report it here instead.

Out of scope:
- Security issues introduced by user-defined grammar rules (`G.xxx`).
- Slowness that is merely proportional to input size.

## Supported versions

Only the current public beta receives fixes. Beta versions are not maintained
in parallel — an issue found in an older beta is fixed by releasing the next
one.

| Version | Security updates |
|---|---|
| 0.0.2-beta.5 | ✅ Current public beta |
| 0.0.2-beta.1 – beta.4 | ❌ Superseded — upgrade to the current beta |
| Earlier betas | ❌ Superseded — upgrade to the current beta |
| 0.0.1-internal.∗ | ❌ Superseded by the public beta |
| Stable | Not yet released |
