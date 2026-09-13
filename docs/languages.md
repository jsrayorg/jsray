# Supported Languages

[English](languages.md) · [简体中文](languages.zh-CN.md)

The `class` identifier, recognized tokens, and an example snippet for each language.

---

## JavaScript / TypeScript

**class**: `language-js` `language-javascript` `language-ts` `language-typescript` `language-jsx` `language-tsx`

Recognizes:
- Keywords (incl. TS-only `interface`, `type`, `satisfies`, `infer`, etc.)
- Declaration names in `function foo()` / `class Bar` → `tk-fn-decl`
- Parameter lists → `tk-var-param` (both `function name(a, b: T = 0)` and `(a, b) => ...`)
- Builtin variables: `console`, `window`, `document`, `globalThis`, `Math`, `JSON`, ...
- Builtin functions (as `.fn(` or `fn(`): `log`, `fetch`, `parseInt`, ...
- Template strings `` `...${id}...` `` with inline `${}` interpolation highlighted, including a template nested inside a placeholder (`` `${ok ? `a ${b}` : 'c'}` ``) and one level of braces (`${fn({ a })}`)
- Regex literals `/pattern/flags`, context-sensitive (only after `=` `(` `,` `return`, etc.)
- Numeric literals including separators (`1_000_000`), binary/octal/hex, and the BigInt suffix (`10n`)
- `ALL_CAPS` constants, `.property` access, `@decorator`

```ts
async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}
```

---

## Python

**class**: `language-python` `language-py`

Recognizes:
- Keywords (incl. 3.10+ `match`/`case`)
- Declaration names: `def foo` / `class Bar`
- Parameter lists (incl. type annotations and defaults)
- `self`, `cls`, `__name__`, `__init__`, `__file__` → `tk-var-builtin`
- 80+ builtin functions (`print`, `len`, `range`, `isinstance`, ...)
- Triple-quoted strings, plus f-string / r-string / b-string prefixes
- PEP 701 replacement fields may carry the delimiting quote (`f"{a["k"]}"`); a nested brace inside a format spec is not yet covered
- `@decorator`

```python
@dataclass
class Article:
    title: str
    views: int = 0

    def popular(self) -> bool:
        return self.views > 1_000
```

---

## PHP

**class**: `language-php`

Recognizes PHP open tags, variables (`$name`), declaration names, class/interface names, keywords, common builtin functions, property access (`->name`, `::name`), strings, comments, and numbers.

Heredocs and nowdocs (`<<<EOT`, `<<<'EOT'`) run from their opening line to the closing word, which may be indented and may carry a trailing `;`. A `//` or `#` inside the body is text, not a comment.

```php
<?php
function render_code($code) {
  echo htmlspecialchars($code);
}
```

---

## Go

**class**: `language-go` `language-golang`

Recognizes `package`, `import`, `func`, declarations, builtin calls, strings, comments, numbers, and selector calls such as `fmt.Println`. Raw string literals in backticks span lines and recognize no escapes.

```go
package main

func main() {
  fmt.Println("JSRay")
}
```

---

## Swift / Kotlin / Dart / Lua

**class**: `language-swift` `language-kotlin` `language-kt` `language-kts` `language-dart` `language-lua`

Recognizes common keywords, function declarations, type/class declarations, builtin calls, strings, comments, numbers, punctuation, and member access. Triple-quoted literals — Swift multiline strings, Kotlin raw strings, Dart's `'''` form — are matched whole. Lua uses its own rule set for `--` comments and `function ... end` blocks.

```swift
import Foundation

func greet(name: String) {
  print(name)
}
```

```kotlin
fun main() {
  println("JSRay")
}
```

```dart
void main() {
  print("JSRay");
}
```

```lua
function greet(name)
  print(name)
end
```

---

## Java / C / C++ / C# / Rust / Ruby

**class**: `language-java` `language-c` `language-cpp` `language-csharp` `language-cs` `language-rust` `language-rs` `language-ruby` `language-rb`

Recognizes common keywords, class/type declarations, function declarations, function calls, property/member access, strings, comments, numbers, and constants. C-family grammars include preprocessor lines and annotations; Rust also recognizes macro calls such as `println!`.

Multi-line and raw literals are matched whole rather than closing at the first inner quote: Java text blocks and C# raw strings (`"""`), C++ `R"tag(...)tag"`, and Rust `r#"..."#` — the last two carry a counted or named delimiter, so a quote inside the body does not end the literal. In Rust a leading apostrophe is read as a lifetime and typed as the type parameter it stands in for, not as the opening of a character literal.

Ruby heredocs (`<<~SQL`, `<<-EOS`, `<<EOT`) run to the word their own opening line named, and open only on an uppercase word so that `items << thing` stays the append operator. Its percent literals — `%w[…]`, `%i(…)`, `%q{…}`, `%Q<…>` and the `%r{…}` regex — end at the delimiter matching the one that opened them, counting depth so an inner pair does not close the literal early.

```rust
fn main() {
    let mut count = 1;
    println!("count = {}", count);
}
```

---

## HTML

**class**: `language-html` `language-htm` `language-xml` `language-svg` `language-vue`

Recognizes:
- `<tagname>` `</tagname>` tag names
- Attribute names and quoted attribute values
- HTML comments `<!-- -->`
- `<!DOCTYPE>` declaration
- Entity references `&amp;` `&#x20;`

```html
<article class="card" data-id="42">
  <h2>Title</h2>
</article>
```

---

## CSS

**class**: `language-css` `language-scss` `language-sass` `language-less`

Recognizes:
- Selectors (incl. pseudo-classes `:hover`, attribute selectors `[type="text"]`)
- At-rules: `@media`, `@keyframes`, `@import`, ...
- Property names, values, units (`px`, `rem`, `%`, `s`, `deg`, ...)
- Color literals `#fff` / `#abcdef`
- `!important`

```css
.card:hover {
  transform: translateY(-2px);
  transition: transform 200ms ease;
}
```

---

## JSON

**class**: `language-json` `language-jsonc`

Recognizes:
- **key** (double-quoted string followed by `:`) → `tk-type` cyan
- value strings → `tk-string` coral
- `true` `false` `null` → keyword pink/purple
- Numbers (incl. scientific notation and negatives)

```json
{
  "name": "jsray",
  "version": "1.0.0",
  "active": true,
  "count": 22
}
```

---

## Shell

**class**: `language-bash` `language-shell` `language-sh` `language-zsh`

Recognizes:
- Keywords: `if`, `for`, `function`, `export`, ...
- 70+ common commands as builtin functions: `grep`, `git`, `npm`, `docker`, `kubectl`, ...
- Variables: `$VAR`, `${VAR}`, `$@`, `$?`
- Strings (double-quoted strings support `$` interpolation)
- Heredocs: `<<EOF`, `<<-EOF` with an indented terminator, `<<'EOF'` without
  interpolation. The body is one string through its closing word, and a
  redirect on the opening line — `cat <<EOF > out.txt` — stays shell.
- Command-line options `-x`, `--foo`

```bash
if [ ! -d "$DIST" ]; then
  mkdir -p "$DIST" && cp src/* "$DIST/"
fi
```

---

## Markdown

**class**: `language-md` `language-markdown`

Recognizes:
- `# Headings` (multi-level)
- `**bold**`, `*italic*`
- `[link text](url)`
- `` `inline code` ``, ```` ```fenced code``` ````
- `- item`, `* item`, `1. item` lists
- `> blockquote`
- `---` horizontal rule

```md
# JSRay

A **zero-dependency** code rendering kernel supporting *multiple languages*.

- Auto-scans code blocks
- Dual themes

[View the demo](https://jsray.org)
```

---

## SQL

**class**: `language-sql`

Recognizes SQL comments, strings, numbers, operators, punctuation, common keywords (`SELECT`, `FROM`, `WHERE`, `JOIN`, `CREATE TABLE`, ...), and aggregate functions (`count`, `sum`, `avg`, ...).

```sql
SELECT count(*) FROM posts WHERE status = 'publish';
```

---

## YAML

**class**: `language-yaml` `language-yml`

Recognizes keys, comments, strings, booleans/nulls, numbers, document markers, anchors, aliases, lists, and punctuation.

```yaml
name: jsray
enabled: true
plugins:
  - wordpress
```

---

## Scala / Objective-C

**class**: `language-scala` `language-sc` · `language-objectivec` `language-objc` `language-objective-c`

Both use the shared C-like grammar with their own keyword/builtin tables. Scala additionally marks `def` declaration names (`def f(x: Int): Int = ...`); Objective-C `@interface` / `@property` directives are colored as decorators and `NS*` classes as builtins.

```scala
case class User(name: String)
def greet(u: User): String = s"hi ${u.name}"
```

---

## R

**class**: `language-r`

Recognizes `name <- function(...)` declarations, `library()` / `data.frame()` builtins, `$member` access, `%>%`-style operators, and `<-` assignment.

```r
square <- function(x) { x^2 }
print(square(4))
```

---

## Perl

**class**: `language-perl` `language-pl`

Recognizes POD doc blocks (`=head1 ... =cut`), `sub` declarations, `$scalar` / `@array` / `%hash` sigil variables, special variables (`$_`, `@ARGV`), regex binds (`=~ /.../`), and list builtins.

The quoting operators `q{…}`, `qq{…}`, `qw(…)` and `qr{…}` end at the delimiter matching their opener, so a `#` inside one is text rather than a comment.

```perl
use strict;
my $name = "world";
sub greet { print "hi $name"; }
```

---

## PowerShell

**class**: `language-powershell` `language-ps1` `language-psm1` `language-pwsh`

Recognizes `function Verb-Noun` declarations, common cmdlets (`Write-Host`, `ForEach-Object`, ...), automatic variables (`$_`, `$PSItem`, `$env:*`), `[Type]` accelerators, comparison operators (`-eq`, `-match`), and `<# ... #>` block comments.

```powershell
function Get-Greeting { Write-Host "hi $Name" }
```

---

## Elixir

**class**: `language-elixir` `language-ex` `language-exs`

Recognizes `defmodule` / `def` / `defp` declarations, `:atoms`, module attributes (`@doc` colored as doc when followed by `"""`), capitalized module names, string interpolation `#{...}`, and the `|>` pipe.

Sigils close on the delimiter matching their opener: `~s{…}`, `~w[…]`, and `~r//` as a regex. A `"` delimiter is left to the ordinary string rules, so that `~s"""…"""` is not cut at its second quote.

```elixir
defmodule Greeter do
  def hello(name), do: IO.puts("hi " <> name)
end
```

---

## Haskell

**class**: `language-haskell` `language-hs`

Recognizes type-signature declaration names (`main :: IO ()`), capitalized type constructors, `--` and `{- -}` comments, prelude builtins (`putStrLn`, `fmap`, ...), and arrow/bind operators.

```haskell
main :: IO ()
main = putStrLn "hi"
```

---

## GraphQL

**class**: `language-graphql` `language-gql`

Recognizes operation keywords (`query`, `mutation`, `fragment ... on`), `$variables` (colored as parameters), capitalized type names, field names, `@directives`, and `"""` descriptions.

```graphql
query GetUser($id: ID!) {
  user(id: $id) { name email }
}
```

---

## TOML / INI

**class**: `language-toml` · `language-ini` `language-properties` `language-cfg` `language-conf`

Both mark `[section]` headers as tags and keys as types (mirroring YAML). TOML adds `[[array tables]]`, `"""` multiline strings, dates, and typed numbers; INI accepts `;` comments and `key: value` pairs.

```toml
[package]
name = "jsray"
version = "0.1.0"
```

---

## Dockerfile

**class**: `language-dockerfile` `language-docker`

Recognizes uppercase instructions (`FROM`, `RUN`, `COPY`, ...), stage aliases (`AS build`), `$VAR` / `${VAR}` expansions, and `--flag` options.

```dockerfile
FROM node:18 AS build
RUN npm ci
CMD ["node", "index.js"]
```

---

## Makefile

**class**: `language-makefile` `language-make` `language-mk`

Recognizes target declarations (`all:`), `.PHONY`-style special targets, `$(VAR)` / automatic variables (`$@`, `$<`), conditional directives (`ifeq`, ...), and assignment operators (`:=`, `?=`, `+=`).

```makefile
.PHONY: all
all: build
	$(CC) -o app main.c
```

---

## Diff / Patch

**class**: `language-diff` `language-patch`

Renders `+` additions in mint, `-` deletions in warm rose, `@@ ... @@` hunk headers as keywords, and `diff --git` / `index` / `---` / `+++` metadata as comments.

```diff
diff --git a/f.js b/f.js
@@ -1,2 +1,2 @@
-old line
+new line
```

---

## Automatic Detection

JSRay exposes `JSRay.detectLanguage(code)`. It returns a language id when a snippet has strong signals, and returns an empty string when it is unsure. Explicit `language-*` classes should still be preferred for exact control.

Detection resolves in three steps:

1. **JSON fast path** — input that parses as JSON returns `json` immediately.
2. **Shebang fast path** — a leading `#!` line resolves the interpreter directly (`python`, `perl`, `ruby`, `node` → `javascript`, `pwsh` → `powershell`, `php`, `bash`/`sh`/`zsh` → `shell`).
3. **Signal scoring** — each language's detector scores distinctive patterns (e.g. `defmodule` for Elixir, `^FROM image` for Dockerfile, `@@ -1,2 +1,2 @@` for diff); the best score above the confidence threshold wins.
