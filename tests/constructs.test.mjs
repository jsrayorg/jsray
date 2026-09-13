// Node built-in test runner · no external dependencies
// Run with: node --test tests/
//
// Real-world constructs, asserted on token *boundaries* rather than on "some
// token appeared".
//
// The existing suites ask whether a rule fires. Every bug fixed in beta.5 fired
// a rule — it simply claimed the wrong span. A Rust signature carrying two
// lifetimes painted the twelve characters between them as one string, and a
// test asserting "the string rule matched" would have passed while the code
// on screen was ruined. So each case here names an exact substring and the
// exact class it must carry, and several assert that a span is *not* swallowed.
//
// The recurring cause behind all of them is that string rules are written by
// hand, once per grammar family, without encoding the language's real
// terminator model — 35 chances to get it wrong. Until that is refactored, this
// corpus is what stands between a sixth instance and a release.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const JSRay = require('../dist/jsray.js');

/** Reassemble a node's source text, however deeply it nests. */
function textOf(node) {
  if (typeof node === 'string') return node;
  return Array.isArray(node.content) ? node.content.map(textOf).join('') : node.content;
}

/**
 * Every token in the stream as `{type, text}`, parents included.
 *
 * An interpolating string is one token whose content is an array — `"a #{b} c"`
 * in Ruby is a tk-string holding the interpolation as a nested tk-operator. A
 * walker that descended into children and dropped the parent would never see
 * the string as a whole, and would report a correct engine as broken. Both the
 * container and what it contains are listed.
 */
function leaves(nodes, out = []) {
  for (const node of nodes) {
    if (typeof node === 'string') {
      out.push({ type: '', text: node });
      continue;
    }

    out.push({ type: node.type, text: textOf(node) });

    if (Array.isArray(node.content)) leaves(node.content, out);
  }
  return out;
}

/** Assert `text` is carried by exactly one token, and that it has `type`. */
function token(code, lang, type, text) {
  const found = leaves(JSRay.tokenize(code, lang)).filter((t) => t.text === text);

  assert.ok(
    found.length,
    `[${lang}] no token holds exactly ${JSON.stringify(text)}\n` +
      `        stream: ${JSON.stringify(leaves(JSRay.tokenize(code, lang)))}`
  );
  assert.equal(
    found[0].type,
    `tk-${type}`,
    `[${lang}] ${JSON.stringify(text)} should be tk-${type}, got ${found[0].type || 'plain text'}`
  );
}

/** Assert no token has swallowed `text` inside a larger span of `type`. */
function notSwallowed(code, lang, type, text) {
  const swallower = leaves(JSRay.tokenize(code, lang)).find(
    (t) => t.type === `tk-${type}` && t.text.includes(text) && t.text !== text
  );

  assert.equal(
    swallower,
    undefined,
    `[${lang}] tk-${type} swallowed ${JSON.stringify(text)} inside ` +
      `${JSON.stringify(swallower && swallower.text)}`
  );
}

// ── Fixed in beta.5 ────────────────────────────────────────────────────────
// Each of these produced visibly wrong output in 0.0.1-beta.4.

test('Rust: a lifetime is a type, and does not open a string', () => {
  const code = "struct Foo<'a> { s: &'a str, t: &'a str }";

  token(code, 'rust', 'type', "'a");
  // The original failure: everything from the first apostrophe to the next
  // one became a single string, taking `> { s: &` with it.
  notSwallowed(code, 'rust', 'string', '{');
  token(code, 'rust', 'keyword', 'struct');
});

test('Rust: an apostrophe in a comment is not a lifetime', () => {
  // Shipped broken in beta.5. A lifetime has no closing quote, so the rule
  // matched any apostrophe followed by letters — and sitting ahead of the
  // line-comment rule it cut `// don't do this` at the apostrophe and rendered
  // the rest as code. English comments in Rust are full of these.
  token("// don't do this\nlet x = 1;", 'rust', 'comment', "// don't do this");
  token(
    "/// keeping the shorter one's allocation.\nfn f() {}",
    'rust',
    'comment',
    "/// keeping the shorter one's allocation."
  );
  token("/* it's fine */\nfn f() {}", 'rust', 'comment', "/* it's fine */");

  // The rule sits behind line comments, not in front, and must still fire.
  token("fn f<'a, 'b>(x: &'a str) {}", 'rust', 'type', "'a");

  // Strings still shield a `//` from the comment rule, which is why line
  // comments come after strings in the first place.
  token('let u = "https://jsray.org";', 'rust', 'string', '"https://jsray.org"');
});

test('Rust: character literals still work beside lifetimes', () => {
  token("let c = 'x';", 'rust', 'string', "'x'");
  token("let n = '\\n';", 'rust', 'string', "'\\n'");
  token("let e = '\\u{1F600}';", 'rust', 'string', "'\\u{1F600}'");
});

test('Go: a raw string literal spans lines and takes no escapes', () => {
  token('s := `line1\nline2`', 'go', 'string', '`line1\nline2`');
  // `\n` inside a raw string is two characters, not an escape.
  token('s := `a\\nb`', 'go', 'string', '`a\\nb`');
  // Quoted strings must be unaffected.
  token('s := "plain"', 'go', 'string', '"plain"');
});

test('Java: a text block is one string, not three quote fragments', () => {
  const code = 'String s = """\nhello\n""";';

  token(code, 'java', 'string', '"""\nhello\n"""');
  // The original failure: `""` matched first, leaving the body bare.
  notSwallowed(code, 'java', 'string', 'String');
  token("char c = 'a';", 'java', 'string', "'a'");
});

test('Triple-quoted strings hold in every language that has them', () => {
  token('val s = """a"b"""', 'kotlin', 'string', '"""a"b"""');
  token('val s = """x"""', 'scala', 'string', '"""x"""');
  token('var s = """a""";', 'csharp', 'string', '"""a"""');
  token("var s = '''a''';", 'dart', 'string', "'''a'''");
});

test('C++ and Rust raw strings hold the quotes they exist to hold', () => {
  // The syntax exists so a literal can contain a quote, which is exactly what
  // closed the general rule early and left the middle bare.
  token('auto s = R"(raw "quoted" here)";', 'cpp', 'string', 'R"(raw "quoted" here)"');
  token('let s = r#"has "quotes" in"#;', 'rust', 'string', 'r#"has "quotes" in"#');

  // The delimiter is counted or named, so a sequence that merely looks like
  // the terminator does not end the literal.
  token('auto s = R"tag(has )" inside)tag";', 'cpp', 'string', 'R"tag(has )" inside)tag"');
  token('let s = br##"a "# b"##;', 'rust', 'string', 'br##"a "# b"##');
  token('let s = r"plain raw";', 'rust', 'string', 'r"plain raw"');

  // A capital R calling a function is not a raw string.
  token('int r = a; R(b);', 'cpp', 'function', 'R');
  token('auto s = "normal";', 'cpp', 'string', '"normal"');
});

test('JavaScript: the BigInt suffix belongs to the number', () => {
  token('const a = 10n;', 'js', 'number', '10n');
  token('const b = 0x1fn;', 'js', 'number', '0x1fn');
  // Ordinary numeric forms must not regress.
  token('const c = 1_000_000;', 'js', 'number', '1_000_000');
  token('const d = 0b1010;', 'js', 'number', '0b1010');
  token('const e = 1.5e3;', 'js', 'number', '1.5e3');
});

test('Python: a PEP 701 field may carry the delimiting quote', () => {
  const code = 'f"{a["k"]}"';

  token(code, 'python', 'string', code);
  // The original failure: two string tokens with `k` bare between them.
  assert.equal(
    leaves(JSRay.tokenize(code, 'python')).filter((t) => t.type === 'tk-string').length,
    1,
    'the f-string should be a single token'
  );
  // Plain and triple-quoted forms must not regress.
  token('t = f"{x}"', 'python', 'string', 'f"{x}"');
  token('s = "plain"', 'python', 'string', '"plain"');
  token('d = """doc"""', 'python', 'string', '"""doc"""');
});

test('A numeric type suffix belongs to its literal', () => {
  // Missing a suffix produced no number token at all, not the digits alone:
  // the word boundary sits between the last digit and the suffix letter.
  token('let x = 1_000i64;', 'rust', 'number', '1_000i64');
  token('let y = 2.5f32;', 'rust', 'number', '2.5f32');
  token('x := 1_000i', 'go', 'number', '1_000i');
  token('var x = 1.5m;', 'csharp', 'number', '1.5m');
  token('auto x = 0x1p3;', 'cpp', 'number', '0x1p3');

  // Java's `L` was already covered and must stay so.
  token('long x = 1_000L;', 'java', 'number', '1_000L');

  // The hexadecimal fraction requires its `p` exponent, or this dot would be
  // eaten and the method call with it.
  token('let n = 0xff.count_ones();', 'rust', 'number', '0xff');
  token('let n = 0xff.count_ones();', 'rust', 'property', 'count_ones');
});

test('Ruby: an =begin block is a comment, not code', () => {
  const code = '=begin\ndoc here\n=end\nputs 1';

  token(code, 'ruby', 'comment', '=begin\ndoc here\n=end');
  // The original failure: the body was highlighted as code, `doc` included.
  token(code, 'ruby', 'fn-builtin', 'puts');
  // The markers only count at column zero.
  token('x = 1 # c', 'ruby', 'comment', '# c');
});

test('A language feature is a keyword the release after it ships', () => {
  // These are all restricted identifiers rather than reserved words, which is
  // why they were absent: the grammars were written from the reserved-word
  // lists. Modern code in each language leads with one of them, so the
  // headline construct rendered with its first word uncoloured.
  token('record Point(int x) {}', 'java', 'keyword', 'record');
  token('sealed interface S permits C {}', 'java', 'keyword', 'sealed');
  token('sealed interface S permits C {}', 'java', 'keyword', 'permits');
  token('actor Counter {}', 'swift', 'keyword', 'actor');
  token('func f() -> some View {}', 'swift', 'keyword', 'some');
  token('func f(v any) any { return v }', 'go', 'keyword', 'any');
  token('class A { required int X { get; init; } }', 'csharp', 'keyword', 'required');
  token('auto x = co_await f();', 'cpp', 'keyword', 'co_await');
  token('enum Suit {}', 'php', 'keyword', 'enum');
  token('class A { override f(): void {} }', 'ts', 'keyword', 'override');
  token('MERGE INTO t', 'sql', 'keyword', 'MERGE');

  // `record` and `actor` introduce a type, so the name after them is one.
  token('record Point(int x) {}', 'java', 'type', 'Point');
  token('actor Counter {}', 'swift', 'type', 'Counter');
});

test('Two contextual keywords are deliberately not claimed', () => {
  // Python 3.12's `type` statement and C# 11's file-local types are real, but
  // both words are far more common as an ordinary call and an ordinary
  // variable. Colouring them would cost more reads than it would pay for.
  token('t = type(x)', 'python', 'fn-builtin', 'type');

  // Plain runs arrive as whole chunks rather than word by word, so the check
  // is that nothing claimed the word — not that a leaf equals it exactly.
  const claimed = leaves(JSRay.tokenize('var file = File.Open(p);', 'csharp')).find(
    (t) => t.type === 'tk-keyword' && t.text === 'file'
  );
  assert.equal(claimed, undefined, '`file` should stay an ordinary identifier');
});

// ── Already correct · guarded against regression ───────────────────────────
// These pass today. They are the constructs a string-rule refactor is most
// likely to break, which is exactly why they are written down before it.

test('JavaScript: a regex literal is not division, and division is not a regex', () => {
  token('const r = /ab+/g;', 'js', 'regex', '/ab+/g');
  const div = 'const d = a / b / c;';
  assert.equal(
    leaves(JSRay.tokenize(div, 'js')).filter((t) => t.type === 'tk-regex').length,
    0,
    'division must not be read as a regex literal'
  );
});

test('JavaScript: a template literal holds its interpolation', () => {
  const code = 'const s = `a${b}c`;';
  notSwallowed(code, 'js', 'string', ';');
  token('const s = `plain`;', 'js', 'string', '`plain`');
});

test('SQL: a doubled quote escapes, and a comment still ends the line', () => {
  const code = "SELECT 'a''b' -- c\nFROM t";
  token(code, 'sql', 'string', "'a''b'");
  token(code, 'sql', 'comment', '-- c');
  token(code, 'sql', 'keyword', 'FROM');
});

test('CSS: a custom property is a property, in declaration and in var()', () => {
  const code = '.a{--x:1px;color:var(--x)}';
  token(code, 'css', 'css-prop', '--x');
  token(code, 'css', 'css-prop', 'color');
});

test('Shell: an interpolation inside a double-quoted string is not the end of it', () => {
  const code = 'echo "value: ${HOME}/bin"';
  notSwallowed(code, 'bash', 'string', 'echo');
  token('echo "plain"', 'bash', 'string', '"plain"');
});

test('TypeScript: a generic constraint is not a comparison', () => {
  const code = 'function f<T extends keyof U>(x: T) {}';
  token(code, 'ts', 'keyword', 'extends');
  token(code, 'ts', 'type', 'T');
  token(code, 'ts', 'fn-decl', 'f');
});

test('Python: a decorator and a return annotation keep their own classes', () => {
  const code = '@dec\ndef f(x: int) -> list[str]: ...';
  token(code, 'python', 'decorator', '@dec');
  token(code, 'python', 'keyword', 'def');
  token(code, 'python', 'fn-decl', 'f');
});

test('Ruby: an interpolation does not terminate the string', () => {
  const code = 'puts "a #{b} c"';
  token(code, 'ruby', 'string', '"a #{b} c"');
  notSwallowed(code, 'ruby', 'string', 'puts');
});

// ── No pathological input may take super-linear time ───────────────────────

test('every new string form stays linear on pathological input', () => {
  const shapes = [
    ['go', '`' + 'a'.repeat(20000)],            // unterminated raw string
    ['go', '`a'.repeat(10000)],                 // alternating backticks
    ['java', '"""' + 'x'.repeat(20000)],        // unterminated text block
    ['java', '"""a'.repeat(5000)],              // repeated openers
    ['java', '"'.repeat(20000)],                // quote storm
    ['csharp', '"""\n'.repeat(5000)],
    ['python', 'f"' + '{a}'.repeat(10000)],     // unterminated f-string
    ['python', 'f"' + '{'.repeat(10000)],       // unbalanced braces
    ['python', 'f"' + '{"}'.repeat(5000)],      // quotes inside fields
    ['js', '1n'.repeat(20000)],                 // BigInt storm
    ['rust', "'".repeat(20000)],                // apostrophe storm
    ['cpp', 'R"(' + 'a'.repeat(20000)],         // unterminated raw string
    ['cpp', 'R"(a'.repeat(5000)],               // repeated raw openers
    ['cpp', 'R"' + 't'.repeat(5000) + '('],     // oversized delimiter tag
    ['rust', 'r#"' + 'a'.repeat(20000)],        // unterminated hashed raw
    ['rust', 'r' + '#'.repeat(10000) + '"'],    // hash storm
    ['rust', '1i'.repeat(20000)],               // numeric suffix storm
    ['rust', '1' + 'i'.repeat(10000)],          // one long false suffix
    ['cpp', '0x1p'.repeat(10000)],              // hex exponent storm
    ['go', '1' + '_'.repeat(20000)],            // separator storm
    ['ruby', '=begin\n'.repeat(5000)],          // unterminated block comments
    // Runtime terminators scan forward from each opening. An opening that
    // never closes makes that scan reach the end of the input, so a file of
    // nothing but openings is the shape that would expose a quadratic one.
    ['shell', 'cat <<EOF\n'.repeat(4000)],
    ['php', '<<<EOT\n'.repeat(4000)],
    ['ruby', '%w[' .repeat(8000)],
    ['perl', 'q{'.repeat(8000)],
    // A span group keeps one cursor per rule. Openers of several kinds that
    // interleave and rarely close make every cursor search again, which is
    // where a group pass that rescanned from the start would turn quadratic.
    ['js', '"/* \'// `'.repeat(3000)],
    ['php', '\'/* "# '.repeat(3000)],
    ['ruby', '%w[ "# \''.repeat(3000)],
  ];

  for (const [lang, code] of shapes) {
    const started = process.hrtime.bigint();
    JSRay.highlight(code, lang);
    const ms = Number(process.hrtime.bigint() - started) / 1e6;

    // Generous by two orders of magnitude: the observed worst case is ~10ms,
    // and catastrophic backtracking does not land near this bound — it hangs.
    assert.ok(
      ms < 1000,
      `[${lang}] ${code.length} chars took ${ms.toFixed(0)}ms — check the ` +
        `new pattern for alternatives that can match the same input two ways`
    );
  }
});

// ── Forms whose end is decided at runtime ──────────────────────────────────
// A heredoc ends at the word its own opening named; a %w[…] ends at the
// bracket matching its opener. Neither is expressible as a RegExp, so both
// rendered as ordinary code until `close` existed. The cases that matter are
// the ones where the body holds characters another rule wants: `#`, `//`, a
// quote, a brace.

test('shell: a heredoc body is one string, and its # is not a comment', () => {
  const code = 'cat <<EOF\nhello "world" # not a comment\nEOF\necho done';

  token(code, 'shell', 'string', 'hello "world" # not a comment\nEOF');
  token(code, 'shell', 'fn-builtin', 'echo');
});

test('shell: a redirect on the opening line stays shell', () => {
  const code = 'cat <<EOF > out.txt\nbody\nEOF';

  // The opening line is consumed as an uncolored prefix precisely so that
  // `> out.txt` is not dragged into the literal.
  notSwallowed(code, 'shell', 'string', '> out.txt');
  token(code, 'shell', 'operator', '>');
});

test('shell: <<- permits an indented terminator, << does not', () => {
  token('cat <<-END\n\tbody\n\tEND\n', 'shell', 'string', '\tbody\n\tEND');

  // Plain `<<` requires the word at column zero; an indented one is not a
  // terminator, and with none present the form declines rather than running on.
  const indented = 'cat <<END\n\tbody\n\tEND\n';
  const strings = leaves(JSRay.tokenize(indented, 'shell')).filter((t) => t.type === 'tk-string');
  assert.equal(strings.length, 0, `expected no string, got ${JSON.stringify(strings)}`);
});

test('shell: an arithmetic shift does not open a heredoc', () => {
  const code = 'echo $(( a << 2 ))';
  const strings = leaves(JSRay.tokenize(code, 'shell')).filter((t) => t.type === 'tk-string');

  assert.equal(strings.length, 0, `<< opened a literal: ${JSON.stringify(strings)}`);
});

test('PHP: a heredoc holds // and closes on an indented word', () => {
  const code = '<?php\n$sql = <<<SQL\n  SELECT 1; // not a comment\n  SQL;\n';

  token(code, 'php', 'string', '  SELECT 1; // not a comment\n  SQL');
  notSwallowed(code, 'php', 'comment', 'SELECT 1');
});

test('PHP: a nowdoc is a string like any other', () => {
  const code = "<?php\n$raw = <<<'EOT'\n\$notInterpolated\nEOT;\n";

  token(code, 'php', 'string', '$notInterpolated\nEOT');
});

test('Ruby: <<~ opens a heredoc, << on a lowercase word does not', () => {
  token('sql = <<~SQL\n  SELECT 1\nSQL\n', 'ruby', 'string', '  SELECT 1\nSQL');

  // `items << thing` is the append operator and must stay one.
  const append = 'items << thing';
  const strings = leaves(JSRay.tokenize(append, 'ruby')).filter((t) => t.type === 'tk-string');
  assert.equal(strings.length, 0, `append became a literal: ${JSON.stringify(strings)}`);
});

test('Ruby: %w and %q close on the matching bracket, and nest', () => {
  token('a = %w[one two three]', 'ruby', 'string', '%w[one two three]');
  token('c = %q{outer {inner} still}', 'ruby', 'string', '%q{outer {inner} still}');
  token('d = %r{^\\d+$}', 'ruby', 'regex', '%r{^\\d+$}');
});

test('Ruby: modulo is not a percent literal', () => {
  const code = 'e = x % y';
  const strings = leaves(JSRay.tokenize(code, 'ruby')).filter((t) => t.type === 'tk-string');

  assert.equal(strings.length, 0, `modulo became a literal: ${JSON.stringify(strings)}`);
});

test('Perl: q{} holds a # without becoming a comment', () => {
  const code = 'my $s = q{hello # not comment};';

  token(code, 'perl', 'string', 'q{hello # not comment}');
  notSwallowed(code, 'perl', 'comment', 'not comment');
  token('my @w = qw(a b c);', 'perl', 'string', 'qw(a b c)');
  token('my $r = qr{^\\d+};', 'perl', 'regex', 'qr{^\\d+}');
});

test('Elixir: a sigil carries its own delimiters', () => {
  token('a = ~w[one two]', 'elixir', 'string', '~w[one two]');
  token('b = ~r/^\\d+/', 'elixir', 'regex', '~r/^\\d+/');

  const code = 'c = ~s{hi # not comment}';
  token(code, 'elixir', 'string', '~s{hi # not comment}');
  notSwallowed(code, 'elixir', 'comment', 'not comment');
});

// ── Spans that compete by position ─────────────────────────────────────────
// A string may hold a comment marker and a comment may hold a quote, in the
// same grammar. No fixed rule order renders both, so these rules share a group
// and whichever opens first wins. Before beta.5 every grammar had picked one of
// the two failures: most read `// don't … won't` as a comment holding a string,
// and the C family, JavaScript and PHP read "/* x */" as a string holding a
// comment. The only test that touched this — Rust's `// don't do this` — held
// a single apostrophe, which cannot open a string that needs a closing one.

/** Every normalised language with a discoverable line comment, and its marker. */
function lineCommentLanguages() {
  const markers = ['//', '#', '--'];
  const names = [...new Set(Object.keys(JSRay.languages).map((k) => JSRay.normalizeLanguage(k)))];
  const found = [];
  for (const lang of names) {
    const marker = markers.find((m) =>
      leaves(JSRay.tokenize(`${m} plain words`, lang)).some(
        (t) => t.type === 'tk-comment' && t.text === `${m} plain words`
      )
    );
    if (marker) found.push([lang, marker]);
  }
  return found;
}

test('A line comment holding two quotes is one comment, in every language', () => {
  const langs = lineCommentLanguages();

  // Discovery decides which languages are checked, so a grammar whose comment
  // rule broke outright would silently drop out of this test. These must stay.
  for (const must of ['javascript', 'python', 'php', 'shell', 'ruby', 'c', 'java', 'go',
    'rust', 'sql', 'yaml', 'lua', 'perl', 'elixir', 'haskell', 'toml', 'jsonc']) {
    assert.ok(langs.some(([l]) => l === must), `${must} has no discoverable line comment`);
  }

  for (const [lang, m] of langs) {
    for (const body of ["don't stop, won't stop", 'say "hi" then "bye"']) {
      const line = `${m} ${body}`;
      token(`${line}\nx = 1`, lang, 'comment', line);
    }
  }
});

test('A string holding a comment marker is one string', () => {
  for (const [lang, literal] of [
    ['js', '"https://jsray.org"'], ['js', "'/* not a comment */'"], ['js', '"/** nor this */"'],
    ['c', '"/* x */"'], ['cpp', '"// x"'], ['java', '"a // b"'], ['go', '"/* x */"'],
    ['php', '"/* x */"'], ['php', "'# anchor'"], ['python', '"# not a comment"'],
    ['shell', '"a # b"'], ['ruby', "'# x'"], ['sql', "'-- not a comment'"], ['lua', '"-- x"'],
    ['yaml', '"a # b"'], ['r', '"# x"'], ['perl', '"# x"'], ['powershell', '"# x"'],
    ['elixir', '"# x"'], ['toml', '"# x"'], ['dockerfile', '"# x"'],
    ['jsonc', '"https://jsray.org"'],
  ]) {
    token(`x = ${literal};\n`, lang, 'string', literal);
  }
});

test('JavaScript: a regex may hold a quote without opening a string', () => {
  const code = 's.split(/"/); t = "u";';

  token(code, 'js', 'regex', '/"/');
  token(code, 'js', 'string', '"u"');
});

test('A literal named inside a comment opens nothing', () => {
  // beta.4 put these rules ahead of the comment rule, so each comment lost
  // everything from the literal onward.
  token('# prefer %w[a b] over arrays\nx = 1', 'ruby', 'comment', '# prefer %w[a b] over arrays');
  token('# wrap it in q{like this} here\nx = 1', 'perl', 'comment', '# wrap it in q{like this} here');
  token('# match with ~r/abc/ first\nx = 1', 'elixir', 'comment', '# match with ~r/abc/ first');

  // A heredoc opening written in a comment must not turn the lines below it
  // into a string, even when a matching terminator happens to follow.
  for (const [lang, code] of [
    ['shell', '# pipe it: cat <<EOF\nx = 1\nEOF\n'],
    ['ruby', '# builds <<~SQL like this\nx = 1\nSQL\n'],
  ]) {
    const strings = leaves(JSRay.tokenize(code, lang)).filter((t) => t.type === 'tk-string');
    assert.equal(strings.length, 0, `[${lang}] a commented heredoc opened: ${JSON.stringify(strings)}`);
  }
});

test('shell: a quoted redirect does not cost a heredoc its opening', () => {
  // Measured from where its body starts, this heredoc would lose to "out.txt",
  // which sits earlier on the opening line. Positions are compared where the
  // whole match begins, lookbehind prefix included.
  token('cat <<EOF > "out.txt"\nbody\nEOF\n', 'shell', 'string', 'body\nEOF');
});

test('JavaScript: a parameter list competes with the spans around it', () => {
  // Ahead of the comments it would read a signature inside a doc comment as
  // code; behind the strings it could not match a list holding a string default.
  token('/** call function f(a, b) here */\nx = 1', 'js', 'doc', '/** call function f(a, b) here */');
  token('function f(a, b = "x") {}', 'js', 'var-param', 'b');
  token('function f(a /* why */, b) {}', 'js', 'comment', '/* why */');
  token('function f(a /* why */, b) {}', 'js', 'var-param', 'b');
  token('const g = (a = "x,y") => a;', 'js', 'string', '"x,y"');
});

test('C family: preprocessor lines and annotations respect the spans around them', () => {
  token('/*\n#define X 1\n*/\nint y;', 'c', 'comment', '/*\n#define X 1\n*/');
  token('#include "stdio.h"\nint y;', 'c', 'decorator', '#include "stdio.h"');
  token('// see @Override\nint y;', 'java', 'comment', '// see @Override');
  token('@Override\nvoid f() {}', 'java', 'decorator', '@Override');
});

test('SQL: an apostrophe in a comment does not open a string across lines', () => {
  // SQL strings may span lines, so the old order let `-- don't` open a literal
  // that ran on to the next apostrophe anywhere below it.
  const code = "-- don't\nSELECT 'x' FROM t";

  token(code, 'sql', 'comment', "-- don't");
  token(code, 'sql', 'string', "'x'");
});
