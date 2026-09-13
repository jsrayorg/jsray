<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/jsray-logo-hero-dark.svg">
    <img src="assets/brand/jsray-logo-hero-light.svg" alt="JSRay" width="520">
  </picture>
</p>

[English](README.md) · **简体中文**

[![npm](https://img.shields.io/npm/v/@jsray/core/beta?label=npm)](https://www.npmjs.com/package/@jsray/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.0.2--beta.5-lightgrey)](CHANGELOG.md)
[![Channel](https://img.shields.io/badge/channel-beta-blue)](docs/versioning.md)
[![Zero deps](https://img.shields.io/badge/dependencies-0-success)](package.json)
[![Size](https://img.shields.io/badge/dist-core%20js%20%2B%20css-lightgrey)](dist/)
[![Languages](https://img.shields.io/badge/languages-35-orange)](docs/languages.md)

> JavaScript 原生代码渲染内核 · 零依赖 · 23 类 token 语义体系

<sub>公开测试版 · 仅代表 Core 渲染框架 · 平台插件是独立仓库</sub>

---

## 安装

```sh
npm install @jsray/core
```

```js
const JSRay = require('@jsray/core');
JSRay.highlight('const x = 42;', 'js');
```

自带 TypeScript 类型定义,不需要额外装 `@types` 包。

也可以完全不用构建工具,直接放进页面:

```html
<link rel="stylesheet" href="https://jsray.org/dist/themes/default.css">
<link rel="stylesheet" href="https://jsray.org/dist/jsray.css">
<script src="https://jsray.org/dist/jsray.js"></script>
```

`jsray.org/dist/` 始终提供当前发布版本。**线上站点如果你不会持续盯着,请改用锁定版本的地址** —— 每个发布版本都固化在自己的路径下,永不变动:

```html
<script src="https://jsray.org/v/0.0.2-beta.5/jsray.js"></script>
```

### 校验你加载到的东西

锁定版本的地址说明你**要**的是哪个版本,不说明你**拿到**的是哪些字节。加上
[Subresource Integrity](https://developer.mozilla.org/docs/Web/Security/Subresource_Integrity)
哈希,浏览器在文件与发布内容不符时会直接拒绝执行:

```html
<script src="https://jsray.org/v/0.0.2-beta.5/jsray.js"
        integrity="sha256-…"
        crossorigin="anonymous"></script>
```

哈希就放在它所描述的文件旁边,格式与 SRI 完全一致:

```
https://jsray.org/v/0.0.2-beta.5/integrity.json
```

`crossorigin="anonymous"` 是必需的,不是可选:跨源脚本的 SRI 只有在加载走
CORS 时才会被校验。该路径为此发送 `Access-Control-Allow-Origin: *`。

这与每个 JSRay 集成用来校验其内置 Core 的是同一份清单 —— 自托管的副本、npm
安装、`<script>` 引入,三条路都能用同样的方式验证。

---

## 项目边界

当前仓库是 **JSRay Core**，也就是独立的 JavaScript 原生代码渲染内核。平台插件是单独项目，应该放在独立 git 仓库中开发。

项目拆分与发布边界见 [docs/projects.md](docs/projects.md)。

## 生态愿景

JSRay 的目标是成为完整开源的代码渲染生态：一个轻量 Core 渲染器，多个官方集成与社区集成。

> 一个渲染核心，让代码在不同平台中发光。

官方集成各自独立仓库,默认使用 JSRay Core,并保持完整可用,不以付费锁定基础能力。集成一览:

| 集成 | 仓库 | 状态 |
|---|---|---|
| WordPress 插件 | [`jsray-wp`](https://github.com/jsrayorg/jsray-wp) | 公开测试版 |
| VS Code 扩展 | [`jsray-vscode`](https://github.com/jsrayorg/jsray-vscode) | 公开测试版 |
| 终端 CLI | [`jsray-terminal`](https://github.com/jsrayorg/jsray-terminal) | 公开测试版 |
| …以及更多 | — | 欢迎官方与社区适配器 |

三个集成现在都能装:

```sh
# 终端 CLI
npm i -g github:jsrayorg/jsray-terminal
```

- **VS Code** —— 从[最新 Release](https://github.com/jsrayorg/jsray-vscode/releases/latest) 下载 `.vsix`,执行 `code --install-extension jsray-vscode-<版本>.vsix`,或在 **扩展** → `…` → **从 VSIX 安装…**
- **WordPress** —— 从[最新 Release](https://github.com/jsrayorg/jsray-wp/releases/latest) 下载 `.zip`,在后台 **插件 → 安装插件 → 上传插件**

各仓库在其到达 beta 时对外公开。每个集成都开放 renderer adapter / hook,宿主项目需要时可接入其它渲染器。

---

## 特性

JSRay 把 9 个标识符族**视觉分离**，让你用余光就能区分参数、常量、内置变量、函数声明与调用：

| 类别 | Dark | Light | 直觉 |
|---|---|---|---|
| 普通变量 | `#E1E4E8` | `#1C1C1E` | 中性 |
| **函数参数** | `#F2B870` italic | `#B25E00` italic | 暖琥珀 · "输入流入" |
| **系统变量** (`this/self/console`) | `#7AB1FF` bold | `#0F68A0` bold | 冷蓝 · "运行时" |
| **常量** (`MAX_*`) | `#E2C792` | `#88611E` | 哑金 · "凝固" |
| **函数声明** | `#5DD8B0` bold | `#0F8568` bold | 亮薄荷 · "我定义" |
| **函数调用** | `#4FBD92` | `#1F7F66` | 中薄荷 · "我调用" |
| **内置函数** (`fetch/print`) | `#C9A6F2` | `#7A40C2` | 薰衣草 · "标准库" |
| **类型** (`User/str`) | `#5AC8FA` | `#0070C9` | 锐青 |
| **属性** (`.name`) | `#FFB1B1` | `#B23D6B` | 暖玫 · "归属" |

---

## 快速开始

```html
<!-- 1. 选一个主题（调色板）。后续会加更多主题，"default" 是签名风格。 -->
<link rel="stylesheet" href="https://jsray.org/dist/themes/default.css">
<!-- 2. 加载核心样式（结构 + token 绑定） -->
<link rel="stylesheet" href="https://jsray.org/dist/jsray.css">

<body data-theme="dark">
  <pre><code class="language-js">
    function fibonacci(n) { return n; }
  </code></pre>
</body>
<script src="https://jsray.org/dist/jsray.js"></script>
```

通过 npm 安装时,这些文件位于 `node_modules/@jsray/core/dist/`。

引入后会**自动扫描** `<code class="language-xxx">` 元素并染色。
明暗切换：把 `<body>` 的 `data-theme` 改为 `"light"` 或 `"dark"`。
没有语言 class 时，`JSRay.detectLanguage()` 可以自动识别常见片段——shebang 首行直接解析解释器,特征打分覆盖 PHP、Go、Swift、Kotlin、Dart、Lua、SQL、YAML、HTML、CSS、JavaScript、Python、Shell、Elixir、Scala、Objective-C、R、Perl、PowerShell、Haskell、GraphQL、TOML、Dockerfile、Makefile、diff 等。

### 主题

JSRay 把调色板独立成 `dist/themes/` 下的样式表。**始终加载一个主题 + `jsray.css`**。当前可用：

| 主题 | 文件 | 说明 |
|---|---|---|
| **default** | `dist/themes/default.css` | 签名调色板 · 含 dark / light 双模式 |
| **aurora** | `dist/themes/aurora.css` | 极光 · 极夜蓝底,极光薄荷 + 紫罗兰点缀 · 含 dark / light |
| **ember** | `dist/themes/ember.css` | 余烬 · 暖炭底,火焰关键字 + 铜绿薄荷函数 · 含 dark / light |
| **fjord** | `dist/themes/fjord.css` | 峡湾 · 北欧低饱和蓝灰,适合长时间阅读 · 含 dark / light |

每款主题都内置 dark + light 双模式(通过 `data-theme` 切换),覆盖全部 23 类 token,因此所有受支持的语言在任意主题下都能完整渲染。调色板源文件在 `themes/*.json`,由 `tools/generate-theme.mjs` 生成 CSS。切换主题时**只换 theme 的 `<link>`**,`jsray.css` 保持不动。

### 编程式 API

```js
// 高亮代码字符串
const html = JSRay.highlight('const x = 42;', 'js');

// 高亮单个元素
JSRay.highlightElement(document.querySelector('code'));

// 重新扫描整页
JSRay.highlightAll();

// 没有 class 时猜测语言
const lang = JSRay.detectLanguage('SELECT * FROM posts;');

// 把别名解析为语法表实际使用的名字
JSRay.normalizeLanguage('c++');   // → 'cpp'

// 运行时切换调色板，不必再加载一份样式表
JSRay.applyTheme(palette.themes.dark);
```

#### 代码要离开这个页面时

插件在原地渲染代码,跟随读者的主题 —— 但那只在你装得上插件的地方成立。
`renderPortable()` 是给其余所有地方的:CMS、邮件通讯、别人的博客 —— 那里
`class="tk-keyword"` 什么也解析不到,因为 `jsray.css` 从来没被加载过。

```js
const palette = await fetch('/tokens.json').then((r) => r.json());

JSRay.renderPortable('const x = 42;', 'js', palette.themes.dark);
// <pre style="background:#1C1C1E;…"><span style="color:#D08BFC;font-weight:700">const</span>…
```

每个颜色都写成内联样式,容器自带背景、内边距和等宽字体栈,所以这个块**不需要
任何样式表、自定义属性或 class**。会剥掉 `<style>` 块和 class 属性的编辑器,
通常保留内联 `style` —— 这正是它成立的全部依据。但**具体某个目的地允许什么,
用之前值得先实测**。

#### 窗饰

代码块可以套一层窗框,让从官网复制走的东西和插件渲染出来的样子一致:

```js
JSRay.renderPortable(code, 'js', palette.themes.dark, {
  frame: 'header',        // 'header' | 'macos' | 'minimal' | 'none'
  title: 'merge.js',      // 显示在左侧
});                       // 语言名会自动标在右侧
```

`header` 就是 jsray-wp 自己的标题栏,连颜色都一致:插件用
`color-mix(in srgb, var(--jr-bg) 88%, var(--jr-fg) 12%)` 算出窗饰配色,而粘贴出去
的块没有自定义属性,所以同样的算术在渲染时完成、输出成普通十六进制色值。`macos`
是三个圆点,`minimal` 是一条细边。窗饰的体积代价:细边 490 字节、标题栏 750 字节、三个圆点 1,060 字节。

内联样式能压过目的地写的任何普通优先级声明,但**压不过它的 `!important`** ——
而主题里确实会有 `pre { white-space: pre-wrap !important }` 这种规则(为了不让
代码在手机上横向滚动),它会让块重新换行、毁掉对齐。所以容器自己的声明都带上了
`!important`。token 颜色默认不带:目的地把手伸进 span 的情况很少见,而这个标记
要多花约四分之一的体积 —— 如果发现颜色被压平了,传 `{ important: true }`。

有两个限制来自这个思路本身,而不是实现。主题在生成字符串时就定死了,所以粘贴过去
的块**无法跟随目的地的明暗设置**。它比 class 形式多约 40% 的体积(约为源码的
十二倍)—— 粘贴时不算什么,当页面资源就很多,所以能链样式表的页面请用
`highlight()`。

#### 渲染成 HTML 以外的形式

`highlight()` 就是 `tokenize()` 加 `render()`。把两步拆开，中间那步就归你 ——
token 流只携带语义，对输出格式不作任何假设。终端渲染器正是这样输出 ANSI
而不是 `<span>` 的：

```js
const stream = JSRay.tokenize('const x = 42;', 'js');
// [ { type: 'tk-keyword', content: 'const' }, ' ', … ]

JSRay.render(stream);            // 内置的 HTML 渲染器
stream.map(toAnsi).join('');     // 或者自己遍历
```

流中每一项要么是纯字符串（没有 token），要么是 `{ type, content }`，其中
`content` 是字符串或嵌套的流。`type` 取自 [docs/tokens.md](docs/tokens.md)
里的 token class。

---

## 支持的语言

| 语言 | class 标识 |
|---|---|
| JavaScript / TypeScript / JSX / TSX | `language-js` `language-ts` `language-jsx` `language-tsx` |
| Python | `language-python` `language-py` |
| PHP | `language-php` |
| Go | `language-go` |
| Swift / Kotlin / Dart / Lua | `language-swift` `language-kotlin` `language-kt` `language-kts` `language-dart` `language-lua` |
| Java | `language-java` |
| C / C++ / C# | `language-c` `language-cpp` `language-csharp` `language-cs` |
| Ruby | `language-ruby` `language-rb` |
| Rust | `language-rust` `language-rs` |
| HTML / XML / SVG / Vue | `language-html` `language-xml` `language-svg` `language-vue` |
| CSS / SCSS / SASS / LESS | `language-css` `language-scss` `language-sass` `language-less` |
| JSON / JSONC | `language-json` `language-jsonc` |
| Shell / Bash / Zsh | `language-bash` `language-shell` |
| Markdown | `language-md` `language-markdown` |
| SQL | `language-sql` |
| YAML | `language-yaml` `language-yml` |
| Scala | `language-scala` `language-sc` |
| Objective-C | `language-objectivec` `language-objc` `language-objective-c` |
| R | `language-r` |
| Perl | `language-perl` `language-pl` |
| PowerShell | `language-powershell` `language-ps1` `language-pwsh` |
| Elixir | `language-elixir` `language-ex` `language-exs` |
| Haskell | `language-haskell` `language-hs` |
| GraphQL | `language-graphql` `language-gql` |
| TOML / INI | `language-toml` `language-ini` `language-properties` `language-cfg` `language-conf` |
| Dockerfile | `language-dockerfile` `language-docker` |
| Makefile | `language-makefile` `language-make` |
| Diff / Patch | `language-diff` `language-patch` |

各语言的语法规则细节见 [docs/languages.md](docs/languages.md)。

---

## 仓库结构

下面是**仓库**的结构。npm 包里只有构建产物 —— `dist/`、`types/`、`tokens.json`、`vocabulary.json`、`integrity.json`;其余内容只有克隆仓库才有。

```
jsray/
├── src/                ← 开发源
│   ├── jsray.js
│   ├── jsray.css
│   └── themes/         ← 生成的调色板样式表
├── dist/               ← 发布产物 (零构建,目前 = src 副本)
│   ├── jsray.js
│   ├── jsray.css
│   └── themes/         ← default.css、aurora.css、ember.css、fjord.css
├── themes/             ← 附加调色板源(aurora、ember、fjord)
├── demo/
│   ├── index.html      ← 示例语言可视化演示
│   └── studio.html     ← 浏览器内主题工作台
├── docs/
│   ├── development.md  ← 全生态开发指南
│   ├── tokens.md       ← 23 token 语义详解
│   ├── languages.md    ← 各语言规则范例
│   ├── projects.md     ← 项目拆分与发布边界
│   └── versioning.md   ← 版本通道及其承诺
├── tools/              ← 主题生成器 · 版本校验 · 集成同步
├── tests/              ← node --test 测试
├── tokens.json         ← 调色板机器可读格式(default 主题)
├── vocabulary.json     ← 23 token 词表,所有渲染面共用这一份
├── integrity.json      ← 已发布 dist/ 资源的 SHA-256 摘要
├── build.sh            ← src → dist 同步
├── package.json
├── LICENSE
└── README.md
```

零依赖、零构建。`build.sh` 目前只做 `cp`，未来可叠加 minify。

---

## 设计理念

1. **语义优先于美学**。颜色服务于"工程师一眼看出这是什么"，不为审美而牺牲可辨识度。
2. **六族分离**。变量类不再扁平为一个白色，参数 / 系统 / 常量 / 局部变量在颜色与字重上各占一族。
3. **零依赖**。一个 `.js` 文件 + 一个 `.css` 文件就能跑，不绑定任何构建工具或框架。

详见 [docs/tokens.md](docs/tokens.md)。

---

## License

MIT — see [LICENSE](LICENSE).

---

由 **Jie** 维护 · [JSRay.org](https://jsray.org)
