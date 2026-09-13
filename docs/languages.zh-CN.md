# 支持的语言

[English](languages.md) · **简体中文**

每种语言的 `class` 标识、所识别 token、范例片段。

---

## JavaScript / TypeScript

**class**: `language-js` `language-javascript` `language-ts` `language-typescript` `language-jsx` `language-tsx`

识别：
- 关键字 (含 TS 专属 `interface`, `type`, `satisfies`, `infer` 等)
- `function foo()` / `class Bar` 声明名 → `tk-fn-decl`
- 形参列表 → `tk-var-param`（含 `function name(a, b: T = 0)` 和 `(a, b) => ...`）
- 内置变量：`console`, `window`, `document`, `globalThis`, `Math`, `JSON`, ...
- 内置函数（出现在 `.fn(` 或 `fn(` 位置）：`log`, `fetch`, `parseInt`, ...
- 模板字符串 `` `...${id}...` ``，含 `${}` 内联高亮，包括占位符里再套一层模板串（`` `${ok ? `a ${b}` : 'c'}` ``）和一层花括号（`${fn({ a })}`）
- 数字字面量含分隔符(`1_000_000`)、二/八/十六进制，以及 BigInt 后缀(`10n`)
- 正则字面量 `/pattern/flags`，上下文敏感（前面是 `=` `(` `,` `return` 等才识别）
- `ALL_CAPS` 常量、`.property` 访问、`@decorator`

```ts
async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}
```

---

## Python

**class**: `language-python` `language-py`

识别：
- 关键字（含 3.10+ `match`/`case`）
- `def foo` / `class Bar` 声明名
- 形参列表（含类型注解和默认值）
- `self`, `cls`, `__name__`, `__init__`, `__file__` → `tk-var-builtin`
- 80+ 内置函数 (`print`, `len`, `range`, `isinstance`, ...)
- 三引号字符串、f-string / r-string / b-string 前缀
- PEP 701 替换字段可携带定界引号(`f"{a["k"]}"`)；格式说明符里的嵌套花括号暂不支持
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

识别 PHP 起始标签、变量（`$name`）、声明名、类/接口名、关键字、常见内置函数、属性访问（`->name`, `::name`）、字符串、注释和数字。

heredoc 与 nowdoc（`<<<EOT`、`<<<'EOT'`）从开头行一直匹配到结束词，结束词可以缩进，后面也可以跟一个 `;`。正文里的 `//` 或 `#` 是文本，不是注释。

```php
<?php
function render_code($code) {
  echo htmlspecialchars($code);
}
```

---

## Go

**class**: `language-go` `language-golang`

识别 `package`、`import`、`func`、声明、内置调用、字符串、注释、数字，以及 `fmt.Println` 这类选择器调用。反引号原始字符串跨行且不识别转义。

```go
package main

func main() {
  fmt.Println("JSRay")
}
```

---

## Swift / Kotlin / Dart / Lua

**class**: `language-swift` `language-kotlin` `language-kt` `language-kts` `language-dart` `language-lua`

识别常见关键字、函数声明、类型/类声明、内置调用、字符串、注释、数字、标点和成员访问。三引号字面量(Swift 多行字符串、Kotlin 原始字符串、Dart 的 `'''` 形式)整体匹配。Lua 使用独立规则支持 `--` 注释和 `function ... end` 结构。

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

识别常见关键字、类/类型声明、函数声明、函数调用、属性/成员访问、字符串、注释、数字和常量。C-family 语法支持预处理行和注解；Rust 额外识别 `println!` 这类宏调用。

多行与原始字面量整体匹配，不会在第一个内部引号处提前闭合：Java 文本块与 C# 原始字符串(`"""`)、C++ 的 `R"tag(...)tag"`、Rust 的 `r#"..."#` —— 后两者的分隔符带计数或命名，正文里的引号不会结束字面量。Rust 中前导撇号按生命周期识别，着色为它所占据的类型参数，而不是字符字面量的开头。

Ruby 的 heredoc（`<<~SQL`、`<<-EOS`、`<<EOT`）一直延伸到它自己开头行所指定的那个词，并且只在大写词上开启，好让 `items << thing` 保持为追加运算符。它的百分号字面量 —— `%w[…]`、`%i(…)`、`%q{…}`、`%Q<…>` 以及正则 `%r{…}` —— 结束于与开启字符配对的那个定界符，并会计数嵌套深度，因此内层的一对不会让字面量提前闭合。

```rust
fn main() {
    let mut count = 1;
    println!("count = {}", count);
}
```

---

## HTML

**class**: `language-html` `language-htm` `language-xml` `language-svg` `language-vue`

识别：
- `<tagname>` `</tagname>` 标签名
- 属性名、属性值（带引号）
- HTML 注释 `<!-- -->`
- `<!DOCTYPE>` 声明
- 实体引用 `&amp;` `&#x20;`

```html
<article class="card" data-id="42">
  <h2>标题</h2>
</article>
```

---

## CSS

**class**: `language-css` `language-scss` `language-sass` `language-less`

识别：
- 选择器（含伪类 `:hover`、属性选择器 `[type="text"]`）
- `@media`, `@keyframes`, `@import` 等 at-rule
- 属性名、值、单位（`px`, `rem`, `%`, `s`, `deg`, ...）
- 颜色字面量 `#fff` / `#abcdef`
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

识别：
- **key**（双引号字符串后跟 `:`）→ `tk-type` 青色
- value 字符串 → `tk-string` 珊瑚色
- `true` `false` `null` → 关键字粉/紫
- 数字（含科学计数法、负数）

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

识别：
- 关键字：`if`, `for`, `function`, `export`, ...
- 70+ 常用命令作为内置函数：`grep`, `git`, `npm`, `docker`, `kubectl`, ...
- 变量：`$VAR`, `${VAR}`, `$@`, `$?`
- 字符串（双引号支持 `$` 内插）
- heredoc：`<<EOF`、允许缩进结束符的 `<<-EOF`、不做内插的 `<<'EOF'`。正文直到结束词
  为止整体作为一个字符串，而开头行上的重定向 —— `cat <<EOF > out.txt` —— 仍留在
  shell 一侧。
- 命令行选项 `-x`, `--foo`

```bash
if [ ! -d "$DIST" ]; then
  mkdir -p "$DIST" && cp src/* "$DIST/"
fi
```

---

## Markdown

**class**: `language-md` `language-markdown`

识别：
- `# 标题` 多级
- `**粗体**`, `*斜体*`
- `[链接文本](url)`
- `` `内联代码` ``, ```` ```围栏代码``` ````
- `- item`, `* item`, `1. item` 列表
- `> 引用`
- `---` 分隔线

```md
# JSRay

一款 **零依赖** 的代码渲染内核，支持 *多种语言*。

- 自动扫描
- 双主题

[查看演示](https://jsray.org)
```

---

## SQL

**class**: `language-sql`

识别 SQL 注释、字符串、数字、运算符、标点、常见关键字（`SELECT`, `FROM`, `WHERE`, `JOIN`, `CREATE TABLE` 等）和聚合函数（`count`, `sum`, `avg` 等）。

```sql
SELECT count(*) FROM posts WHERE status = 'publish';
```

---

## YAML

**class**: `language-yaml` `language-yml`

识别 key、注释、字符串、布尔/null、数字、文档标记、anchor、alias、列表和标点。

```yaml
name: jsray
enabled: true
plugins:
  - wordpress
```

---

## Scala / Objective-C

**class**: `language-scala` `language-sc` · `language-objectivec` `language-objc` `language-objective-c`

两者共用 C 系语法框架,各配独立的关键字/内建表。Scala 额外标记 `def` 声明名(`def f(x: Int): Int = ...`);Objective-C 的 `@interface` / `@property` 指令按装饰器着色,`NS*` 类按内建着色。

```scala
case class User(name: String)
def greet(u: User): String = s"hi ${u.name}"
```

---

## R

**class**: `language-r`

识别 `name <- function(...)` 声明、`library()` / `data.frame()` 内建函数、`$成员` 访问、`%>%` 系操作符和 `<-` 赋值。

```r
square <- function(x) { x^2 }
print(square(4))
```

---

## Perl

**class**: `language-perl` `language-pl`

识别 POD 文档块(`=head1 ... =cut`)、`sub` 声明、`$标量` / `@数组` / `%哈希` 符号变量、特殊变量(`$_`、`@ARGV`)、正则绑定(`=~ /.../`)和列表内建函数。

引用运算符 `q{…}`、`qq{…}`、`qw(…)`、`qr{…}` 结束于与开启字符配对的定界符，因此其中的 `#` 是文本而不是注释。

```perl
use strict;
my $name = "world";
sub greet { print "hi $name"; }
```

---

## PowerShell

**class**: `language-powershell` `language-ps1` `language-psm1` `language-pwsh`

识别 `function Verb-Noun` 声明、常用 cmdlet(`Write-Host`、`ForEach-Object` 等)、自动变量(`$_`、`$PSItem`、`$env:*`)、`[Type]` 类型加速器、比较操作符(`-eq`、`-match`)和 `<# ... #>` 块注释。

```powershell
function Get-Greeting { Write-Host "hi $Name" }
```

---

## Elixir

**class**: `language-elixir` `language-ex` `language-exs`

识别 `defmodule` / `def` / `defp` 声明、`:atom` 原子、模块属性(后接 `"""` 的 `@doc` 按文档注释着色)、大写模块名、字符串插值 `#{...}` 和 `|>` 管道。

sigil 结束于与开启字符配对的定界符：`~s{…}`、`~w[…]`，以及作为正则的 `~r//`。`"` 不被当作 sigil 定界符，交回给普通字符串规则处理，这样 `~s"""…"""` 才不会在第二个引号处被截断。

```elixir
defmodule Greeter do
  def hello(name), do: IO.puts("hi " <> name)
end
```

---

## Haskell

**class**: `language-haskell` `language-hs`

识别类型签名声明名(`main :: IO ()`)、大写类型构造器、`--` 与 `{- -}` 注释、prelude 内建函数(`putStrLn`、`fmap` 等)和箭头/绑定操作符。

```haskell
main :: IO ()
main = putStrLn "hi"
```

---

## GraphQL

**class**: `language-graphql` `language-gql`

识别操作关键字(`query`、`mutation`、`fragment ... on`)、`$变量`(按参数着色)、大写类型名、字段名、`@指令` 和 `"""` 描述。

```graphql
query GetUser($id: ID!) {
  user(id: $id) { name email }
}
```

---

## TOML / INI

**class**: `language-toml` · `language-ini` `language-properties` `language-cfg` `language-conf`

两者的 `[section]` 头按 tag 着色,键按类型着色(与 YAML 一致)。TOML 额外支持 `[[数组表]]`、`"""` 多行字符串、日期和带类型数字;INI 接受 `;` 注释和 `key: value` 形式。

```toml
[package]
name = "jsray"
version = "0.1.0"
```

---

## Dockerfile

**class**: `language-dockerfile` `language-docker`

识别大写指令(`FROM`、`RUN`、`COPY` 等)、阶段别名(`AS build`)、`$VAR` / `${VAR}` 展开和 `--flag` 选项。

```dockerfile
FROM node:18 AS build
RUN npm ci
CMD ["node", "index.js"]
```

---

## Makefile

**class**: `language-makefile` `language-make` `language-mk`

识别目标声明(`all:`)、`.PHONY` 系特殊目标、`$(VAR)` / 自动变量(`$@`、`$<`)、条件指令(`ifeq` 等)和赋值操作符(`:=`、`?=`、`+=`)。

```makefile
.PHONY: all
all: build
	$(CC) -o app main.c
```

---

## Diff / Patch

**class**: `language-diff` `language-patch`

`+` 新增行渲染为薄荷绿,`-` 删除行为暖玫瑰色,`@@ ... @@` hunk 头按关键字着色,`diff --git` / `index` / `---` / `+++` 元信息按注释着色。

```diff
diff --git a/f.js b/f.js
@@ -1,2 +1,2 @@
-old line
+new line
```

---

## 自动识别

JSRay 暴露 `JSRay.detectLanguage(code)`。当代码片段有明确特征时返回语言 id，不确定时返回空字符串。需要精确控制时，仍优先建议显式写 `language-*` class。

识别按三步进行:

1. **JSON 快速通道** —— 能被 JSON 解析的输入直接返回 `json`。
2. **Shebang 快速通道** —— 首行 `#!` 直接解析解释器(`python`、`perl`、`ruby`、`node` → `javascript`、`pwsh` → `powershell`、`php`、`bash`/`sh`/`zsh` → `shell`)。
3. **特征打分** —— 每种语言的检测器对独有特征打分(如 Elixir 的 `defmodule`、Dockerfile 的 `^FROM image`、diff 的 `@@ -1,2 +1,2 @@`),超过置信阈值的最高分胜出。
