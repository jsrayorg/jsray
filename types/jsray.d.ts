/**
 * JSRay · type declarations
 * CommonJS usage:   const JSRay = require('@jsray/core');
 * Browser global:   after loading jsray.js, use window.JSRay
 */

declare namespace JSRay {
  /** A single grammar rule · internal shape, rarely constructed directly */
  interface GrammarRule {
    cls: string;
    pattern: RegExp;
    inside?: GrammarRule[];
    lookbehind?: boolean;
    /**
     * For forms whose end is not knowable when the rule is written — a
     * heredoc ends at the word its own opening line named, `%w[…]` at the
     * bracket matching its opener. `pattern` matches the opening; this
     * returns the index just past the end of the whole form, or -1 when no
     * terminator is present, which leaves the opening to the rules behind it.
     */
    close?: (match: RegExpExecArray, text: string, from: number) => number;
    /**
     * Adjacent rules carrying the same group compete by position instead of
     * by order: at every step the match that begins earliest wins, and listed
     * order only breaks a tie. This is how a comment may hold a quote and a
     * string may hold a comment marker in the same grammar.
     */
    group?: string;
  }

  type Grammar = GrammarRule[];

  /** A single token, produced by `tokenize`. */
  interface Token {
    type: string;
    content: string | TokenStream;
  }

  /** A renderer-agnostic stream produced by `tokenize`. */
  type TokenStream = Array<string | Token>;

  /** Runtime version string, matches version.json (e.g. "0.0.2-beta.4"). */
  const version: string;

  /** Grammars for every registered language, keyed by name and by alias. */
  const languages: Record<string, Grammar>;

  /** Normalize aliases such as `language-c++`, `c#`, `yml`, or `py`. */
  function normalizeLanguage(lang: string): string;

  /** Guess a language identifier from source text. Returns an empty string if unsure. */
  function detectLanguage(code: string): string;

  /** One color/style entry in a theme block. */
  interface ThemeTokenStyle {
    color: string;
    fontStyle?: 'bold' | 'italic' | 'bold italic';
  }

  /** A single dark/light theme block from tokens.json. */
  interface ThemeBlock {
    background: string;
    foreground: string;
    border?: string;
    gutter?: string;
    lineHighlight?: string;
    tokens: Record<string, ThemeTokenStyle>;
  }

  /**
   * Apply a theme block (matching tokens.json shape) at runtime by
   * setting `--jr-*` CSS variables on the given root element.
   *
   * Defaults to the first element carrying `data-theme` — usually `<body>` —
   * falling back to `document.documentElement`. That element is where theme
   * stylesheets set the same variables, so writing there is what makes a
   * runtime palette win; variables set on an ancestor would be shadowed.
   */
  function applyTheme(theme: ThemeBlock, root?: HTMLElement): void;

  /**
   * Tokenize a code string into a renderer-agnostic stream.
   * Unknown `lang` returns `[code]` so non-HTML renderers can
   * still emit plain text.
   */
  function tokenize(code: string, lang: string): TokenStream;

  /**
   * Render a token stream (from `tokenize`) into the default
   * HTML form: `<span class="tk-xxx">…</span>`.
   */
  function render(stream: TokenStream | string): string;

  /** Options for the portable renderer's container. */
  interface PortableOptions {
    /** CSS padding for the `<pre>`. Default `16px 18px`. */
    padding?: string;
    /** CSS border-radius for the `<pre>`. Default `8px`. */
    radius?: string;
    /** CSS font shorthand. Default a 13px monospace stack. */
    font?: string;
    /**
     * The window the code sits in. `header` is jsray-wp's own title bar, so a
     * block copied from the site matches one the plugin rendered; `macos` is
     * the three dots; `minimal` is a hairline strip. Default `none`.
     */
    frame?: 'none' | 'header' | 'macos' | 'minimal';
    /** Filename or heading shown in the frame. Escaped before it is written. */
    title?: string;
    /**
     * Text on the right of the frame. Defaults to the language's display name
     * ("JavaScript", "C++"); pass an empty string to leave it off.
     */
    label?: string;
    /**
     * Mark the token colours `!important` too. The container's own
     * declarations always are — inline styles beat a host stylesheet at
     * normal weight but lose to its `!important`, and themes really do ship
     * `pre { white-space: pre-wrap !important }`. Set this only for a
     * destination whose CSS reaches into spans; it costs ~11 bytes per token
     * (about 24% of the block). Default `false`.
     */
    important?: boolean;
  }

  /**
   * Render to HTML that carries its own styling and needs no stylesheet.
   *
   * For code that leaves the page it was rendered on — pasted into a CMS, a
   * newsletter, somebody else's blog, where `class="tk-keyword"` resolves to
   * nothing. Editors that strip `<style>` blocks and class attributes generally
   * keep inline `style`, which is what this relies on.
   *
   * The theme is fixed when the string is produced, so a pasted block cannot
   * follow the destination's light/dark setting.
   *
   * The container's declarations carry `!important`, which is what survives a
   * host stylesheet using the same weight; see `PortableOptions.important` for
   * extending that to the tokens.
   */
  function renderPortable(
    code: string,
    lang: string,
    theme: ThemeBlock,
    options?: PortableOptions
  ): string;

  /**
   * Render a code string into HTML with `<span class="tk-xxx">` wrappers.
   * Unknown `lang` falls back to HTML-escaped source.
   * Equivalent to `render(tokenize(code, lang))`.
   */
  function highlight(code: string, lang: string): string;

  /**
   * Highlight a single `<code>` element.
   * The language is parsed from `language-xxx`/`lang-xxx` or detected from text.
   */
  function highlightElement(el: Element): void;

  /**
   * Scan a root node (defaults to `document`) and highlight every
   * language-marked code block and plain `<pre><code>` block inside it.
   */
  function highlightAll(root?: ParentNode): void;
}

export = JSRay;
export as namespace JSRay;
