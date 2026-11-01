# Changelog

Each release of Nexo's packages, newest first. The npm package `@formaui-net/nexo` and the NuGet package `formaui-net.Nexo` carry the same version. An entry names the language version the release implements, and what changed in the implementation. What changed in the contracts of the language and the runtime is in the [language history](LANGUAGE-HISTORY.md).

- **An entry is dated when its release is published,** and reads *Unpublished* until then.
- **A change a host can notice** is listed in the newest entry while it is unpublished. Once it is published, the change opens the next version's entry, and the sources declare that version in the same commit.

<a id="v1-0-0-beta-1"></a>

## `1.0.0-beta.1`

*Unpublished · language `1.0.0-beta.9` · definition format 38*

- The first beta, and the first release. The [language history](LANGUAGE-HISTORY.md) records what came before it.
- `NexoError.module` is declared for a host, which builds a module error of its own with it.
- An operator is declared as a `NexoOperatorDeclaration`, its `impl` taking `{ value, reject }`, so each `impl` a TypeScript host writes is typed by the declaration it carries out. A member declaration's kind is `property`, `function` or `indexer`.
- A resolution's host call answers where it stands, and its candidates: its declaration alone, or, while its receiver's type is unknown, every declaration that takes the call as it is written.
- An access on a value of `Any` whose every candidate is a host call is refused as it resolves, NEXO3092, rather than when it is evaluated.
- A module's own type named `Pair`, `List`, `Dictionary`, `Any` or `Never` is named by that name alone in its declarations. A generic type's name written alone where no nearer tier declares it is refused at registration, NEXO4070.
- NEXO4512 names the notation that does not parse.
- A namespace standing where a value does is refused giving `~` for the script parameter of its name, NEXO2520.
- An origin in a result's metadata is comparable across every resolution of one definition that selects the same declaration, so a result after a renewal keeps comparing within its tolerance.
- A member a value of `Any` selects as it is evaluated gives its value the tolerance it declares in the result's metadata.
- A module's declarations and a declared binding type name Nexo's own types qualified, `Nexo.Number`, `Nexo.Any` and `Nexo.Never`, where a module's own type of the name would hide Nexo's or make it ambiguous.
- A diagnostic writes Nexo's own type as `Nexo.Number` beside a module's type of its name, and a script's `Nexo.Number` is refused without suggesting `import Nexo`.
