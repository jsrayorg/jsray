# JSRay 项目边界

[English](projects.md) · **简体中文**

当前仓库是 **JSRay Core**。

JSRay Core 是独立的 JavaScript 原生代码渲染内核。平台插件是独立产品，应放在独立 git 仓库中。

## 生态愿景

JSRay 是完整开源的代码渲染生态。目标是让 JSRay 出现在代码出现的任何地方：网站、内容平台、编辑器、文档系统、开发者工具。

> 一个渲染核心，让代码在不同平台中发光。

## 生态分层

1. Core：`jsray`，零依赖的 JavaScript 渲染器。
2. 官方集成：由本项目维护的平台项目 —— `jsray-wp`、`jsray-vscode`、`jsray-terminal`。
3. 社区集成：面向框架、静态站点生成器、编辑器、发布工具的第三方适配器。

官方集成应当是完整的开源项目，不得把 JSRay 的基础体验锁在付费功能之后。

## 渲染器边界

官方集成默认使用 JSRay Core。它们是 JSRay 生态的入口，而不是把单一渲染器包死的封闭外壳。

平台层应当开放 adapter hook，让宿主项目在需要时接入其它渲染器。默认体验保持 JSRay，扩展点保持生态开放。

渲染器的最小形状是：

```js
renderer.highlight(code, language, options) -> html
renderer.highlightElement(element, options) -> void
renderer.languages -> { [language]: label }
```

## Core 拥有

- `src/jsray.js`
- `src/jsray.css`
- `src/themes/`
- `tokens.json`
- `types/jsray.d.ts`
- `dist/`
- npm 包元数据
- Core 的版本管理与 changelog

## 平台插件拥有

- 平台特有的编辑器 UI
- 平台特有的设置项
- 平台特有的打包方式
- 插件自身的版本管理与 changelog
- 捆绑的 Core 资产快照

## 依赖方向

平台插件依赖 Core。**Core 不得依赖任何平台插件。**

Core 的变更通过拷贝或打包 `dist/` 资产流向插件仓库。插件的变更不应要求 Core 变更版本，除非它改动了 Core 的 API 或资产。

**集成在自己发布时同步 Core，而不是 Core 一发布就同步。** 捆绑的副本追不上实时的
Core：每个产物都冻结在它构建时的那份快照上 —— `.vsix`、插件 zip，以及 GitHub 为
tag 附带的源码包，一概如此 —— 所以一个在 Core 发布当下就重新同步的仓库，对齐的只是
自己的源码，用户装得到的东西一点没变。对齐是"发布"这个动作完成的事。

因此 `tools/check-core-freshness.mjs` 日常只作提示、在打包关口才严格：两次发布之间
落后会被报告出来，而陈旧的引擎打不出包（`--strict`，接在各集成的构建或打包脚本
里）。唯一不该等下一个功能版的，是安全级别的 Core 发布 —— 为它单独切一次集成发布。

## 仓库拆分

| 仓库 | 交付形态 | 许可 | 今天从哪里拿到 |
|---|---|---|---|
| `jsray` | npm `@jsray/core` | MIT | npm —— `@jsray/core@0.0.2-beta.3` |
| `jsray-wp` | WordPress.org 插件 | GPLv2 or later | GitHub Release 的 zip |
| `jsray-terminal` | npm CLI | MIT | GitHub —— `npm i -g github:jsrayorg/jsray-terminal` |
| `jsray-vscode` | VS Code Marketplace | MIT | GitHub Release 的 `.vsix` |

最后一列是**今天用户从哪里拿到**,第二列是各自在 `0.1.0` 要去的渠道。

未来按需增加的平台仓库，例如 `jsray-react`、`jsray-astro`、`jsray-mdx`。

**许可不同是刻意的。** Core 用 MIT,好让任何东西都能嵌入它。WordPress 插件用
GPLv2 or later,因为 WordPress.org 的第一条指南接受任何 GPL 兼容许可、并**强烈
推荐**用 WordPress 自己那份 —— MIT 是合规的,但在一个周围全是 GPL 的目录里当例外
换不来任何东西。MIT 往 GPL 方向是兼容的,所以插件里装 MIT 的 Core 被允许;而 MIT
要求声明随代码分发,这正是 `jsray-wp/LICENSE-THIRD-PARTY` 的用途。将来落到 GPL
平台上的集成,按同样方式处理。

## 网站路由

官网把品牌集中在 `jsray.org` 之下：

- `https://jsray.org`：项目主页 —— 在线演示、主题切换、Core 渲染器。
- `https://jsray.org/studio.html`：浏览器内主题工作台。
- `https://jsray.org/dist/`：当前发布版的 Core 资产
  (`jsray.org/dist/jsray.js`、`jsray.org/dist/themes/<name>.css`)。这个路径每次
  发版都会变 —— 对演示页是对的，对没人盯着的站点是错的。
- `https://jsray.org/v/<version>/`：同样的文件按版本固化
  (`jsray.org/v/0.0.2-beta.3/jsray.js`)。锁定到这里的页面，今天怎么渲染，
  以后还怎么渲染。

`tools/build-site.sh` 两者都生成。Cloudflare 每次部署都会整体替换资产包，因此
已发布的历史版本无法从上一次构建中留存 —— 它们是从 npm 还原的，而 npm 本来就是
"发布过什么"的权威记录。网络不通时降级为"只有当前版本可锁定"，而不是让部署失败。

各集成的路由在其正式发布时才添加 —— 产品尚未存在的路由不预先公布。
