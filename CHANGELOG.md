# Changelog

Each release of Nexo's packages, newest first. The npm package `@formaui-net/nexo` and the NuGet package `formaui-net.Nexo` carry the same version. An entry names the language version the release implements, and what changed in the implementation. What changed in the contracts of the language and the runtime is in the [language history](LANGUAGE-HISTORY.md).

- **An entry is dated when its release is published,** and reads *Unpublished* until then.
- **A change a host can notice** is listed in the newest entry while it is unpublished. Once it is published, the change opens the next version's entry, and the sources declare that version in the same commit.

<a id="v1-0-0-beta-1"></a>

## `1.0.0-beta.1`

*Unpublished · language `1.0.0-beta.23` · definition format 38*

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
- A default of a parameter whose type writes a type parameter is refused at registration, NEXO4548, unless every type it may bind to admits it: null where its type is nullable, or a list of none of its values.
- A parameter may leave out `required`, `true` unless it declares a default, and `nulls`, `propagate`; a module's copy writes both. `NexoParameterDeclaration.required` is optional.
- The declaration helpers write every option they are given, `internal` among them, so `createModule` refuses one its declaration doesn't take, where a helper dropped it. `createPredicateParameterDeclaration` takes options, `nulls` among them.
- A value parameter declaring `context` is refused, NEXO4030, and a type's copy leaves out a key holding `undefined`.
- `contains`, `indexOf` and `distinct` refuse a list whose items are of no key type, and `distinctBy` a key of none, NEXO3083 as they resolve and NEXO5042 as a call on a value of `Any` is evaluated, where they compared objects, lists and structured values by identity.
- Each condition NEXO5012 shared has its own code: NEXO5043 for a value an extension's target doesn't take, NEXO5044 for an ambiguous selection, NEXO5045 for a value of no actual type, and NEXO5046 to NEXO5050 for a deferred call's values its member doesn't take. NEXO5012 keeps a member the actual type lacks.
- NEXO3045, NEXO3065, NEXO4021 and NEXO4067, catalogued and never raised, are retired.
- `NexoError` exposes the four factories it declares alone; `NexoError.syntax` and `NexoError.locate`, never declared, are gone.
- `resolution.typeAt` and `nexo.paths.valueAt` refuse a path of another shape, NEXO2646, as `nexo.paths.validate` does, a path that is no list among it; `valueAt` steps to an object field a value holds and a list's item alone.
- A text that ends inside a collection, as `[10,`, is refused with NEXO1000, where a `TypeError` escaped `nexo.parse`.
- A function the host invokes takes function parameters: its prepared call gives the host each function argument as a kept function, which it calls later in the context preparation found, until it disposes the call with `dispose()`, after which a call fails with NEXO5051. NEXO4056 refuses an expression or a predicate parameter alone.
- An `and` or an `or` is typed where its value is used, by the values that reach it, so `c and fee or 0` is a `Number`. A condition, `not`, another `and` or `or`, and a predicate written as an expression of `it` test its truthiness alone. NEXO3040 refuses values of no one type where the value is used, and a conditional binding whose truthy values are of none.
- Reading text no longer hangs on an interpolated block whose closing delimiter has no indentation and a line of which starts with an interpolation, and reads text full of invalid characters in linear time, stopping at the first.
- A character outside the Basic Multilingual Plane that is no token is reported whole. A malformed number, a conditional or `do` block used as a left operand, a `let` or `return` where a value stands, and a `to` before a keyword each give a diagnostic that says what is wrong.
- A cast whose qualified type ends in a keyword is read inside an optional enclosed access.
- Every definition validation accepts writes canonical text that reads back as itself: a negation of a numeric literal is the literal however it is written, and a cast of a negative number or an extension access on a namespace is refused.
