# Changelog

Each release of Nexo's packages, newest first. The npm package `@formaui-net/nexo` and the NuGet package `formaui-net.Nexo` carry the same version. An entry names the language version the release implements, and what changed in the implementation. What changed in the contracts of the language and the runtime is in the [language history](LANGUAGE-HISTORY.md).

- **An entry is dated when its release is cut,** and reads *Unreleased* until then. [Cutting a release](CONTRIBUTING.md#cut-a-release) tags its commit, and its packages are published from that tag.
- **A change a host can notice** is listed in the newest entry while it is unreleased. Once it is released, the change opens the next version's entry, and the sources declare that version in the same commit.

<a id="v1-0-0-beta-2"></a>

## `1.0.0-beta.2`

*Unreleased · language `1.0.0-beta.41` · definition format 38*

- Runs language `1.0.0-beta.41`, as the [language history](LANGUAGE-HISTORY.md#v1-0-0-beta-41) sets out: the members that make a value of their receiver are functions, `round()` among them, a value of `Any` enters a structure as its data shape alone, a number and a name after it stand apart, and an evaluator takes the limits its host sets.
- A suggestion writes a function taking no argument with its empty parentheses, `x.flatten()`, and one taking some as `x.concat(…)`.
- `NexoEvaluatorOptions` and `NexoEvaluationLimits` type `createEvaluator`'s options.

<a id="v1-0-0-beta-1"></a>

## `1.0.0-beta.1`

*November 3, 2026 · language `1.0.0-beta.40` · definition format 38*

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
- A computed property name read from a function parameter or a function is refused with NEXO3014, rather than throwing a TypeError. A refused candidate's arguments no longer make the argument around them an implicit body.
- A function local a test narrowed not to be null is called. A reference bound to a value of `Any` is called, its receiver checked as it was created, and among several functions a bound reference takes the arguments the call writes, located where they are written, its call with none no longer throwing a TypeError.
- `[].flatten` is a `List<Never>`.
- A value of `Any` may be false: `value and x` is of `Any`, and a computed name it may give is refused. An object expression following a value of `Any` gives one object, as its type says. A function or `root` chosen beside a value of `Any`, or `root` given to a value parameter, is refused rather than failing at evaluation.
- A member applies to a receiver as the specification says: the items of a `List<Device?>` keep their null, so a member declared for a `List<Device>`, or `flatten` for a list whose inner lists can be null, is not available on it, where before it was accepted and gave its implementation, or a result typed without null, a null item.
- `sum` and `sequence` refuse a number no finite number holds, NEXO5020, `average` no longer overflows, and `sequence` refuses a count too long for a list, NEXO5035, rather than failing inside its implementation. A list's `min`, `max` and `entry`, and a dictionary's `entry`, answer `0` for `-0`.
- A supplied or bound dictionary holding a key twice once captured is refused, NEXO5015 or NEXO2045, rather than keeping the last.
- A member that reads maintained values declares a nullable result, NEXO4071. `beforeInvoke` answering pending for another member, or answering what is neither samples, pending nor nothing, fails the evaluation at the member, NEXO5009, rather than reading null into a value that can't be null or blaming the module. A member's functions close however its invocation ends.
- An evaluator, its bindings and its environment are released once a host drops it, where the first evaluator of a resolution stayed alive as long as the resolution did. An access on a value of `Any` keeps a bounded number of selections, and a value's metadata keeps no host's values past its own description.
- A prepared call's projection reads the lineage of the locals before its call, so its metadata gives their sources and provenance, as an evaluation's does.
- Bindings that differ in their numbers alone share a resolution. A field name of bound data that is no name no longer lets two binding sets of different types share a resolution key, where a resolution was reused with bindings it did not fit. A binding declared as an internal type is refused, NEXO2036.
- A script nesting deeper than 256 levels is refused, NEXO1072 or NEXO2046, rather than overflowing the stack with a RangeError, and a definition holding a node that holds itself, or an array with a missing entry, is refused at validation, NEXO2000, rather than failing later with a TypeError.
- `typeAt` types the paths through a dictionary's entries and a pair's parts that `valueAt` reads. `getLocation` refuses an array's `length`. `createRegistry` and `getImplementation` given what they don't take answer with a NexoError or undefined rather than a TypeError. The declaration helpers type their options, and a module's stored declarations their `typeParameters`.
- The hosting document's example imports the module it reads.
- A module giving an observation an expression, a predicate or a function within a list is refused, NEXO4055, and so is one declaring a fixed parameter optional, NEXO4072. Module errors name the key a notation stands at, a mapping by its key, an unnamed indexer as `[]` and the type a member stands in.
- Resolving reads each part of a script once: a key nested within keys, a generic argument within arguments, and a function calling the one before it twice each resolve in time linear in their depth, where each level doubled the time, and the account summary resolves about 9% faster.
- Data nesting deeper than 1,000 levels, bound, supplied or answered, is refused with NEXO2047, NEXO5015 or NEXO5052 rather than overflowing the stack, and a host call declared `Any` takes the values its host supplies, where it refused every one.
- A misspelled option or hook is refused, NEXO2048, rather than left out, and so is a hook that is no function. A `typeOf` answering nothing is a fault, NEXO5002. A conversion's `reject` kept past its call fails with a NexoError rather than throwing Nexo's private signal. A declared type that is no string is NEXO2044, and `f(1)(2)` gets a message saying what to write.
- A conversion of a value of `Any`, `value to String`, resolves and converts by the type the value turns out to be, failing with NEXO5053 where nothing converts it, where it was refused at resolution. Its candidate conversions are among the resolution's candidate declarations.
- A module error locates a module, a type or a declaration only by a name that is a string, leaving the field out where the name is another value or missing, rather than naming it `'undefined'` or `'[object Object]'`.
- `Home.["rooms"]` reads `Home.rooms`, as `@Home.["rooms"]` did, where it was a syntax error, and `Home.[p]` is refused with NEXO2521 at its name, as `@Home.[p]` is.
- A declared binding type several types share, `List` where a module declares one, is refused naming Nexo's as `List<T>`, the way to write it, rather than `Nexo.List`, which writes no type.
- `value to List<Number>` and `device as Light?` are refused saying a cast or a conversion names its type bare, NEXO1026 and NEXO1000, rather than as a comparison chain turning its direction or an unexpected `?`.
- A string holding a surrogate standing alone, in a script's text or a definition, is refused, NEXO1049 or NEXO2000, rather than read into a value canonical text would write as ill-formed text.
- `format` writes a call's arguments and a list's items each on a line of its own, a level within, where one follows a block's `end`, rather than the next one back at the call's indentation.
- `1.e3` is refused saying a number's exponent follows its digits directly, `1e3`, where it said only that `e3` is no member.
- An indexer declared `invokedBy: 'host'` is refused as one, NEXO4053, before the `updates` or `impl` it declares, NEXO4030, whose removal led only to that refusal.
