# Tooling

<a id="runtime-tooling"></a>

Tooling reads text that is still being written, as an editor does. Every other public operation is strict: it throws its first diagnostic as an error, as [errors](errors.md#diagnostics-and-errors) set out. Tooling reads tolerantly instead:

- **It never throws for any text.** What a strict operation would refuse, tooling answers as diagnostics, each the code, the kind, the message and the location the strict operation's error would have.
- **It recovers.** Where text breaks the grammar, reading goes on, so a text being written gives a syntax tree and the diagnostics of every stage that can read it.
- **It runs no host code.** It reads text, a registry's declarations and the types of bindings, as resolution does.

`nexo.tooling` holds its operations. Each reads a script's source, and refuses anything else (NEXO2645), a misuse of the API rather than a diagnostic of a text. Each reads the text with the imports `options.imports` supplies, as `nexo.parse` does.

In this document:

1. [Tokens](#tooling-tokens)
2. [The syntax tree](#tooling-syntax-tree)
3. [Diagnostics](#tooling-diagnostics)

<a id="tooling-tokens"></a>

## Tokens

`nexo.tooling.scan(text)` answers every token of the text, in order, ending with the `end` token, frozen. The tokens cover the whole text, whatever it holds: text that is no token is an `invalid` token holding its diagnostic, `{ code, message, offset }`, and scanning goes on after it.

| Property | What it holds |
| --- | --- |
| `type` | One of `nexo.tooling.tokenTypes` |
| `start`, `end` | Where the token begins and ends, as offsets into the text |
| `triviaStart`, `trivia` | Where the trivia before the token begins, and its pieces, each `{ kind, start, end }`, its `kind` `whitespace`, `line-comment` or `block-comment` |
| `value` | An identifier's or a keyword's word, a literal's value, the identifier a script parameter's `~` or a lexical reference's `@` reads, or the text a run of an interpolated string stands for |
| `quote`, `delimiter` | A string's quote, `"` or `'`, and how many quotes its delimiter has, one inline and three or more for a block, which keep its written form |
| `diagnostic` | An invalid token's diagnostic |

Every character of the text belongs to one token or to the trivia before one. A strict reading meets the same diagnostic and throws it as a syntax error, so a diagnostic says the same whichever way it is reached.

<a id="tooling-syntax-tree"></a>

## The syntax tree

`nexo.tooling.parse(text, options)` answers `{ tree, diagnostics }`: the text's syntax tree and its syntax diagnostics, frozen.

- **The tree.** Its root is the `script` node. Each node has a `kind`, one of `nexo.tooling.nodeKinds`, named after the grammar rule that produces it, its `start` and its `end`, and its `children`, nodes and tokens in the order of the text.
- **It holds every character.** Its tokens, the trivia before each and the tokens recovery skipped give the text back character for character.
- **A token the text lacks** stands `missing: true` where it was expected, of the type expected, with no text: a closer, as `)` or `end`, a name after a dot, and a value, which stands as a missing `identifier`.
- **Tokens recovery skipped** are held by the token after them, under `skipped`, each a token as `scan` answers it, an invalid one among them.

<a id="tooling-recovery"></a>

A tolerant reading recovers as follows:

- **A closer the text lacks** stands missing where the text reaches what an enclosing construct awaits, or its end.
- **Tokens a construct can't read** are skipped to the next token it, or a construct around it, awaits: a separator, a closer, a branch's keyword, or a body's `let` or `return` beginning a line.
- **A value that can't be read** stands as a missing value, its tokens skipped. A local, an object field, a dictionary's entry or an import that can't be read is left out.
- **One diagnostic for one break.** Once a construct reaches what a construct around it awaits, the constructs between close with what they lack and record nothing more. A diagnostic at a token directly after invalid text is left out, since the invalid token's own diagnostic explains it, and a diagnostic of a code at an offset is recorded once.
- **The first diagnostic** of a text a strict reading refuses is the error the strict reading throws. A tolerant reading goes on to report more, so the two readings' lists of diagnostics are not promised to match beyond it.

The diagnostics are in the order of the text, each `{ code, kind, message, location, range }`, as [diagnostics](#tooling-diagnostics) set out. Recovery never makes a text read: a missing token is never permission to guess what the text meant, and `nexo.parse` still refuses any syntax error.

<a id="tooling-diagnostics"></a>

## Diagnostics

`nexo.tooling.getDiagnostics(text, options)` answers every diagnostic of the text, frozen, in the order of its stages, each stage's in the order of the text:

1. **Syntax**, as `parse` answers it.
2. **The bindings' types**, where `options.types` declares one a registry can't read.
3. **Structure**: the definition the tree lowers to, validated as `nexo.validate` validates a definition.
4. **Resolution**, where `options.registry` gives a registry: the definition resolved against it, as `registry.resolve` resolves one, with bindings of the types `options.types` declares.

Each diagnostic is a frozen object:

| Property | What it holds |
| --- | --- |
| `code`, `kind`, `message`, `location` | What the strict operation's error would hold, as [errors](errors.md#diagnostics-and-errors) set out |
| `range` | The text it stands at, `{ start, end }`: a syntax diagnostic's from its offset to the end of the token there, and a script's the span of the part its pointer names; absent for one that stands nowhere in the text, as a binding's |

What each stage reads:

- **A hole.** A part the text lacks is a hole in the definition, and so is a node whose validation or resolution failed, which each later stage reads as a value of `Any`. A diagnostic standing at a hole, or at a node that holds one, is left out, since the hole may explain it.
- **The bindings' types.** `options.types` gives each binding's type by its name, a notation read as a [declared binding type](bindings.md#runtime-bindings) is, its names qualified or not. A type refused there is a structure diagnostic located at the binding, as `{ binding }`, and the binding is left out.
- **No binding's value.** A binding declared by its type alone holds no value, so nothing its value would settle is settled: a fixed argument or a computed name a script parameter gives is refused as one no value settles.
- **Imports.** An import the registry can't give is a diagnostic at the import, and the resolution's other diagnostics are left out, since what the script's names read depends on its imports.
- **A text that breaks the grammar** is read as far as it can be: its holes stand where the text lacks a part, and the diagnostics of every part that reads are given.

It refuses options a host misuses, each a structure error with an empty location: a registry `nexo.createRegistry` did not create (NEXO2647), types that are no plain object (NEXO2020) and supplied imports that break their rules (NEXO2008).
