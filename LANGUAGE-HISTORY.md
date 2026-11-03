# Language history

Each version of the Nexo language, newest first, with what it changed. A language version names the [specification](spec/README.md)'s whole contract, the [language](spec/README.md#the-language) a script is written in and the [runtime](spec/README.md#the-runtime) a host builds on, so an entry lists the changes to both; the definition format, the JSON a host and its tools exchange, has a version of its own, which each entry names. Each version is dated by the day the specification first described it, and each change stands in the first version whose implementation follows it, named by the section of the specification that states it now.

Each entry says what its version breaks:

- **Before the beta,** a version could break what the one before it allowed, with no guidance on migrating.
- **From `1.0.0-beta.1` on,** no breaking redesign is planned. A version that breaks what the one before it allowed says, beside each break, how a host or a script migrates.

<a id="v1-0-0-beta-23"></a>

## `1.0.0-beta.23`

*November 3, 2026 · definition format 38*

**Runtime**

- [A negation of a numeric literal](spec/runtime/definition.md) is the negative literal however it is grouped or negated again, so `-(5)` reads as `-5`, and validation folds a definition's negation of a literal as reading text does. Every definition then writes text that reads back as itself.
- A cast whose receiver is a negative number, which no text writes, is refused, NEXO2002.
- An extension access on a namespace is refused at validation, NEXO2520, rather than at resolution, NEXO3026, since its text reads otherwise.

**Breaking:** a definition holding `arithmeticNegation` of a numeric literal is validated as the literal, and one holding a cast of a negative number or an extension access on a namespace is refused at validation. Neither wrote text that read back as itself; write the literal, and a member read after `.` for a namespace.

<a id="v1-0-0-beta-22"></a>

## `1.0.0-beta.22`

*November 3, 2026 · definition format 38*

**Language**

- [Numbers](spec/language/lexical-structure.md#tokens-and-whitespace-numbers-and-the-minus-sign) are written as in JSON. A zero a digit follows and an exponent with no digits are refused over their whole run, NEXO1000, rather than read as two tokens and refused later.
- A conditional or a `do` block an operator follows, as in `if a then 1 else 2 end + 1`, is refused with NEXO1027 at the block, as a right operand is.
- An extension call's arguments are enclosed, so a line may break before an operator within them, as within any call's.
- A value that starts the line after a body's local is the body's to refuse, NEXO1031, as a name there is.
- The examples of NEXO1053, NEXO1036 and NEXO2011 match the codes raised: `device as Light.brightness` casts to a qualified type.

**Breaking:** nothing a script relied on. Texts refused before are refused with the codes above, and an extension call's arguments take a line break they refused.

<a id="v1-0-0-beta-21"></a>

## `1.0.0-beta.21`

*November 3, 2026 · definition format 38*

**Language**

- [The type of a logical expression](spec/language/expressions.md#logical-expressions-negations-and-groups-type): `and` and `or` mean the same in every expression, and their values share a type only where the value is used. A condition, the operand of `not`, an operand of another `and` or `or`, and a predicate written as an expression of `it` test truthiness alone, and a conditional binding binds the truthy values. So `metered and light.brightness or 0` is a `Number`: the false that selects `0` reaches nothing. NEXO3040 refuses values of no one type where the value is used, and a conditional binding whose truthy values are of none.
- [Not a conditional](spec/language/expressions.md#logical-expressions-negations-and-groups-not-a-conditional) is a note on behavior: `c and x or y` gives `y` where `x` is falsey, which a conditional doesn't.

**Breaking:** nothing. Every script accepted before keeps its type, and some it refused are accepted.

<a id="v1-0-0-beta-20"></a>

## `1.0.0-beta.20`

*November 2, 2026 · definition format 38*

**Language**

- [Host calls](spec/language/members.md#members-host-calls): a host call takes a function argument, which its host keeps and calls later, as a running behavior keeps a test of what it hears.

**Runtime**

- [Kept functions](spec/runtime/host-calls.md#runtime-host-calls-kept-functions): a function the host invokes declares function parameters, and preparing it gives its host each function argument as a kept function. Each call evaluates the function in the context preparation found, the locals before the call and the bindings, without hooks, checked against its callback contract, and refused while its evaluator evaluates or once its resolution is stale, as a projection is. A prepared call's `dispose()` ends them, and a call of one after it fails (NEXO5051), as [decisions](docs/decisions.md#d49) records.
- [Members](spec/runtime/members.md#members-declaring-a-member): NEXO4056 refuses an expression or a predicate parameter of a function the host invokes, and no longer a function parameter.

**Breaking:** nothing. A prepared call gains `dispose`, and a declaration refused before is accepted.

<a id="v1-0-0-beta-19"></a>

## `1.0.0-beta.19`

*November 2, 2026 · definition format 38*

**Runtime**

- The tooling of `1.0.0-beta.16` to `1.0.0-beta.18`, `nexo.tooling` and its tooling contract, is withdrawn until it is designed, as [decisions](docs/decisions.md#d48) records. Its first draft is kept on the `tooling-draft` branch. The runtime is that of `1.0.0-beta.15` again.
- NEXO2647 and NEXO2648, which only that tooling raised, are [retired](spec/runtime/errors.md#runtime-retired-codes).

**Breaking:** `nexo.tooling` is gone. No release carried it.

<a id="v1-0-0-beta-18"></a>

## `1.0.0-beta.18`

*November 2, 2026 · definition format 38*

**Runtime**

- [Completion](https://github.com/FormaUI/Nexo/blob/76ddb3f39d58b0fb1327013c2a8c9690a5c4fb1e/spec/runtime/tooling.md#tooling-completion): `nexo.tooling.getCompletions` answers what a script can reach at an offset, each completion with what it inserts and the range it replaces: the names in scope where a value stands, the members a receiver's type selects after `.`, the extension members that apply to it after `:`, a namespace's members after its `.`, and the modules and their types after `import`. It offers only what the script's imports make available, an internal declaration never.
- [Hover](https://github.com/FormaUI/Nexo/blob/76ddb3f39d58b0fb1327013c2a8c9690a5c4fb1e/spec/runtime/tooling.md#tooling-hover): `nexo.tooling.getHover` answers what the name at an offset reads: a member's declaration, its signature and its qualified name, or a name in scope, a script parameter, `it`, `root` or a namespace, each with the type it gives there.
- [Structure errors](https://github.com/FormaUI/Nexo/blob/76ddb3f39d58b0fb1327013c2a8c9690a5c4fb1e/spec/runtime/errors.md#runtime-structure-errors): an offset that is no whole number from 0 to its text's length is refused (NEXO2648).

**Breaking:** nothing.

<a id="v1-0-0-beta-17"></a>

## `1.0.0-beta.17`

*November 2, 2026 · definition format 38*

**Runtime**

- [Formatting](https://github.com/FormaUI/Nexo/blob/76ddb3f39d58b0fb1327013c2a8c9690a5c4fb1e/spec/runtime/tooling.md#tooling-formatting): `nexo.tooling.format` lays a text out as it was written, beside `nexo.format`'s canonical text. It keeps each token as the text spells it, each string's written form among them, every comment and every line break, a run of blank lines as one. It indents each line by the constructs open at its start and spaces the tokens of a line as canonical text does. The text it gives reads back as the same definition, and a text that breaks the grammar is answered as it is.

**Breaking:** nothing.

<a id="v1-0-0-beta-16"></a>

## `1.0.0-beta.16`

*November 1, 2026 · definition format 38*

**Runtime**

- [Tooling](https://github.com/FormaUI/Nexo/blob/76ddb3f39d58b0fb1327013c2a8c9690a5c4fb1e/spec/runtime/tooling.md): `nexo.tooling` reads text being written, and never throws for any text. `scan` answers its tokens and their trivia. `parse` answers its syntax tree, recovered where the text breaks the grammar, and its syntax diagnostics. `getDiagnostics` answers every diagnostic of its syntax, its bindings' types, its structure and, against a registry, its resolution, each with the range of text it stands at. `tokenTypes` and `nodeKinds` list what a token and a node are.
- [Tolerant reading](https://github.com/FormaUI/Nexo/blob/76ddb3f39d58b0fb1327013c2a8c9690a5c4fb1e/spec/runtime/errors.md#diagnostics-tolerant-reading): a strict reading's error is a tolerant one's first diagnostic, and a tolerant reading goes on to report every diagnostic it can.
- [Structure errors](https://github.com/FormaUI/Nexo/blob/76ddb3f39d58b0fb1327013c2a8c9690a5c4fb1e/spec/runtime/errors.md#runtime-structure-errors): a tooling operation refuses a registry `nexo.createRegistry` did not create (NEXO2647), and what is no text (NEXO2645), as `nexo.parse` does.

**Breaking:** nothing.

<a id="v1-0-0-beta-15"></a>

## `1.0.0-beta.15`

*November 1, 2026 · definition format 38*

**Runtime**

- [Result paths](spec/runtime/resolution.md#runtime-result-paths): `resolution.typeAt` and `nexo.paths.valueAt` refuse a path of another shape, as `nexo.paths.validate` does (NEXO2646), where they read it as given: `typeAt` read a negative or a fractional number as an index, and `valueAt` answered null for both.
- [Result paths](spec/runtime/resolution.md#runtime-result-paths): a path is a list, and one that is none, as a string, is refused (NEXO2646); `nexo.paths.validate('rooms')` read a string's characters as its steps.
- [Result paths](spec/runtime/resolution.md#runtime-result-paths): `nexo.paths.valueAt` steps to an object field a value holds and a list's item alone, null for anything else, so `['rows', 'length']` and `['constructor']` reach null, never a list's length or an object's constructor.

**Breaking:** a host giving `typeAt` or `valueAt` a path of another shape is refused with NEXO2646 where it got an answer. Build paths of field names and whole indices that are not negative, or check one with `nexo.paths.validate` first. A host that read a list's `length` or another property its host language gives through `valueAt` reads it from the value it got.

<a id="v1-0-0-beta-14"></a>

## `1.0.0-beta.14`

*November 1, 2026 · definition format 38*

**Language**

- [Evaluation errors](spec/language/errors.md#evaluation-errors): each condition NEXO5012 shared has a code of its own, as distinct conditions never share one. NEXO5012 keeps a deferred access whose receiver's actual type has no member of its name. A value of `Any` an extension's target doesn't take is NEXO5043; several applicable declarations none of which is more specific, NEXO5044; a value of no actual type, NEXO5045; and a deferred call given more values than its selected member takes, NEXO5046, leaving out one it requires, NEXO5047, giving a value that is no object where it takes options, NEXO5048, an object field it has no parameter for, NEXO5049, or meeting a parameter a call selected as it is evaluated never gives a value, NEXO5050.
- [Retired codes](spec/language/errors.md#diagnostics-retired-codes): NEXO3045 and NEXO3065, catalogued and never raised, are retired. Two references to the object root with different fields available are branches of different types (NEXO3041), and an argument that does not satisfy a binding its receiver established is an argument of the wrong type (NEXO3042), which each row now says.

**Runtime**

- [Retired codes](spec/runtime/errors.md#runtime-retired-codes): NEXO4021 and NEXO4067, catalogued and never raised, are retired: what a function parameter stands on is refused by the codes of the declarations that take none, and an operator outside an extension never has a foreign source.

**Breaking:** a host that matches NEXO5012 for one of the conditions it shared matches that condition's code now: NEXO5043 to NEXO5050, as listed above.

<a id="v1-0-0-beta-13"></a>

## `1.0.0-beta.13`

*November 1, 2026 · definition format 38*

**Language**

- [List members](spec/language/collections.md#collections-list-members): key equality compares values of a key type alone. `contains`, `indexOf` and `distinct` compare items of one, and `distinctBy` keys of one, and anything else is refused where it is resolved (NEXO3083), as `toDictionary` and `groupBy` already refused a key of another type. The evaluator compared objects, lists and structured values by identity, which key equality defines for none of them, so `[[1], [1]].distinct.count` was 2.
- [List members](spec/language/collections.md#collections-list-members): `contains`, `indexOf` and `distinct` selected as they are evaluated, on a value of `Any` whose actual item type is no key type, fail before anything is invoked (NEXO5042).

**Breaking:** a script calling `contains`, `indexOf` or `distinct` on a list of objects, of lists, of structured values or of values of `Any`, or `distinctBy` with a key of one, is refused. Compare by a key of the items: `distinctBy(it.id)` for `distinct`, `any(it.id == value.id)` for `contains` and `indexWhere(it.id == value.id)` for `indexOf`; over a list of values of `Any`, `any(it == value)` and `indexWhere(it == value)` compare each item as an equality does.

<a id="v1-0-0-beta-12"></a>

## `1.0.0-beta.12`

*November 1, 2026 · definition format 38*

**Runtime**

- [Declaration helpers](spec/runtime/members.md#members-declaration-helpers): a helper writes every option it is given over the defaults it creates, and leaves none out, so `createModule` refuses one its declaration doesn't take. A member helper dropped every option but `impl`, `parameters`, `updates`, `arguments` and `invokedBy`, `internal` among them, and `updates` for a function its host invokes; `createValueParameterDeclaration` dropped `selects` and `selector` from a parameter that is not fixed.
- [Declaration helpers](spec/runtime/members.md#members-declaration-helpers): `createPredicateParameterDeclaration(options)` takes options, `nulls` among them, as `createExpressionParameterDeclaration` does, so a predicate may accept a null item.
- [Parameter declaration keys](spec/runtime/members.md#members-parameter-declaration-keys): a value parameter declaring `context` is refused (NEXO4030), as a function parameter is; it was taken and never read.
- [Creating a module](spec/runtime/modules.md#modules-declarations): a type's copy leaves out a key that held `undefined`, as every other declaration's does.

**Breaking:**

- A helper given an option its declaration doesn't take, as `parameters` or `invokedBy` for a property, `arguments` for a function without parameters, `updates` with `invokedBy: 'host'`, or `selects` without `fixed: true`, now writes it, and `createModule` refuses it (NEXO4030, NEXO4534, NEXO4542). Leave the option out, or give `fixed: true` where the parameter selects a type.
- A value parameter declaring `context` is refused (NEXO4030). Leave it out: only an expression and a predicate parameter declare one.

<a id="v1-0-0-beta-11"></a>

## `1.0.0-beta.11`

*November 1, 2026 · definition format 38*

**Runtime**

- [Parameter declaration keys](spec/runtime/members.md#members-parameter-declaration-keys): a parameter may leave out `required`, which is then `true` unless it declares a `default`, and `nulls`, which is then `propagate`, as [null arguments](spec/language/members.md#nullability-a-null-argument-follows-the-parameter) describe a parameter its declaration says nothing of. Creating a module refused a parameter leaving out either (NEXO4536), which now refuses a value of them it doesn't take alone.
- [Creating a module](spec/runtime/modules.md#modules-declarations): a module's copy of a parameter holds `required` and, but for a function parameter, `nulls`, as given or as their defaults give them.

**Breaking:** nothing. A declaration refused before is taken now.

<a id="v1-0-0-beta-10"></a>

## `1.0.0-beta.10`

*November 1, 2026 · definition format 38*

**Language**

- [Binding a call's parameters](spec/language/types.md#types-type-parameters-binding): a default fits every binding. A parameter whose type writes a type parameter takes a default every type it may bind to admits, null for `T?` and `[]` for `List<T>`, so an argument left out never gives an implementation a value its binding refuses. A default of any data was taken, and `0` reached an implementation whose `T` a call bound to `String`.

**Runtime**

- [Parameter declaration keys](spec/runtime/members.md#members-parameter-declaration-keys): registering a module refuses a default of a parameter of a type parameter that not every type admits (NEXO4548).

**Breaking:** a module declaring such a default, as `0` for a parameter of type `T`, is refused at registration. Make the parameter's type nullable and its default null, `T?` and `null`, and give the value the implementation used where its argument is null; or make the parameter's type concrete where the value is of one type.

<a id="v1-0-0-beta-9"></a>

## `1.0.0-beta.9`

*November 1, 2026 · definition format 38*

**Language**

- [Type name lookup](spec/language/types.md#types-type-name-lookup): a module's declarations name Nexo's own types qualified by Nexo's module, `Nexo.Number`, as they name any registered module's type, so a module declaring a type spelled as one of Nexo's own still names Nexo's. `Nexo.Any` and `Nexo.Never` name the reserved types. A qualified name takes no type arguments, so a generic type stays written unqualified with them, and `Nexo.List` alone is refused as `List` alone is (NEXO4070).
- [Type identity](spec/language/types.md#types-type-identity): a script names Nexo's own types unqualified, and `Nexo.Number` stays refused where no import gives the local name `Nexo` (NEXO3004), its message no longer giving `import Nexo`, which is refused.
- [Type identity](spec/language/types.md#types-type-identity): a diagnostic writing a type of Nexo's own beside a module's type of its name writes `Nexo.Number`, and one listing several types of one name lists Nexo's first.

**Runtime**

- [Bindings](spec/runtime/bindings.md#runtime-bindings): a declared binding type names Nexo's own qualified too, `{ count: 'Nexo.Number' }`, where a module's public type of the name makes `Number` alone ambiguous (NEXO2037).

**Breaking:** nothing.

<a id="v1-0-0-beta-8"></a>

## `1.0.0-beta.8`

*November 1, 2026 · definition format 38*

**Runtime**

- [Result metadata](spec/runtime/evaluation.md#runtime-results): a member a value of `Any` selects as it is evaluated describes its value as a member resolution selects does, with the tolerance it declares and an origin of that selection. Its value had no tolerance, so a host compared it exactly.

**Breaking:** nothing.

<a id="v1-0-0-beta-7"></a>

## `1.0.0-beta.7`

*November 1, 2026 · definition format 38*

**Runtime**

- [Result metadata](spec/runtime/evaluation.md#runtime-results): an origin is comparable across every resolution of one definition, where it selects the same declaration. A resolution made again after a registration made the first stale gives its values the origins the first gave, so a host comparing within a tolerance goes on doing so. An origin was comparable within one resolution alone.

**Breaking:** nothing. A host that relied on two resolutions never sharing an origin compares results of one definition, which share them now.

<a id="v1-0-0-beta-6"></a>

## `1.0.0-beta.6`

*November 1, 2026 · definition format 38*

**Runtime**

- [Structure errors](spec/runtime/errors.md#runtime-structure-errors): a namespace standing where a value does, as `@Home` reads where no local of its name is in scope, is refused giving `~Home` for the script parameter of its name, as a module's name standing alone is (NEXO1506).

**Breaking:** nothing.

<a id="v1-0-0-beta-5"></a>

## `1.0.0-beta.5`

*November 1, 2026 · definition format 38*

**Language**

- [Type name lookup](spec/language/types.md#types-type-name-lookup): a module's own type named as one of Nexo's generic types, `Any` or `Never` is named by that name alone in the module's declarations, as one named `Number` already was. A generic type's name written alone was refused before the lookup ran, and `Any` and `Never` always named Nexo's own.

**Runtime**

- [Module errors](spec/runtime/errors.md#module-errors): a declaration naming `List`, `Dictionary` or `Pair` alone, where no nearer tier declares a type of the name, is refused at registration (NEXO4070), giving the type with its type arguments. It was refused when its module was created (NEXO4512), a code whose message now names the notation that does not parse.

**Breaking:**

- In a module declaring a type named `Any` or `Never`, that name alone now names the module's type in its declarations. Rename the module's type to keep naming Nexo's.
- A generic type's name written alone is refused at registration with NEXO4070, where it was refused at creation with NEXO4512. A host matching that code for it matches NEXO4070.

<a id="v1-0-0-beta-4"></a>

## `1.0.0-beta.4`

*November 1, 2026 · definition format 38*

**Language**

- [Deferred member selection](spec/language/types.md#types-any-deferred-selection): an access on a value of `Any` whose every candidate is a host call is refused as it resolves (NEXO3092), since no evaluation could select a member. It was refused as it was evaluated (NEXO5013), which still refuses one whose selection is a host call among other candidates.

**Breaking:** a script ending in such an access, as `shelf.item("lamp").book()` where `item` answers `Any` and every `book` is a host call, is refused as it resolves. It never invoked anything. Make the receiver known, as `(shelf.item("lamp") as Light).book()` does, or name the extension the call is declared in.

<a id="v1-0-0-beta-3"></a>

## `1.0.0-beta.3`

*November 1, 2026 · definition format 38*

**Runtime**

- [Host calls](spec/runtime/host-calls.md#runtime-host-calls): a resolution's host call answers its `pointer`, where it stands, and its `candidates`: its declaration alone, or, while its receiver's type is unknown, every declaration that takes the call as it is written. A host that tells its host calls apart by keys of its own reads what a call on a null receiver requests there, as DOMQL tells a subscription from an execution, instead of repeating the language's lookup.

**Breaking:** nothing.

<a id="v1-0-0-beta-2"></a>

## `1.0.0-beta.2`

*November 1, 2026 · definition format 38*

**Runtime**

- [Errors](spec/runtime/errors.md): a host builds a module error of its own with `NexoError.module(code, message, location)`, beside the structure, validation and evaluation errors it builds, as a host refuses a declaration whose keys of the host's own break the host's rules. DOMQL's dispatch table refuses its host calls' request kinds so.

**Breaking:** nothing.

<a id="v1-0-0-beta-1"></a>

## `1.0.0-beta.1`

*October 31, 2026 · definition format 38*

The first beta. Both contracts are those of `1.0.0-alpha.42`, unchanged. What changes is the promise a version makes about the next one:

- **Stability:** no breaking redesign is planned.
- **Migration:** a later version that breaks what this one allows says how to migrate.
- **Limitations:** the status overview documents what remains [open](docs/features-status.md#open-decisions) and what is [deferred](docs/features-status.md#deferred).

**Breaking:** nothing.

<a id="v1-0-0-alpha-42"></a>

## `1.0.0-alpha.42`

*October 31, 2026 · definition format 38*

**Runtime**

- [Data shared with a host](spec/runtime/evaluation.md#runtime-shared-data): data is read-only once it passes between Nexo and its host, in either direction, nested data included. A host changes neither the data it is given nor the data it gave, through any alias it keeps.
- [Data shared with a host](spec/runtime/evaluation.md#runtime-shared-data): a reference is no data. It passes as itself, and the host object it identifies changes as its type's contract allows.
- [Data shared with a host](spec/runtime/evaluation.md#runtime-shared-data): Nexo may rely on a check it made of data rather than make it again, never on one of a reference's membership, and what an evaluation over data changed against the rule answers is unspecified.

**Breaking:**

- A host that changes data after giving it, as a list an implementation answered and keeps in a cache, or changes data it was given, breaks the contract, which `1.0.0-alpha.41` left unspecified.

<a id="v1-0-0-alpha-41"></a>

## `1.0.0-alpha.41`

*October 30, 2026 · definition format 38*

**Language**

- [Reading an access's names](spec/language/extensions.md#extensions-reading-names): an extension access's names are read by the declarations they name, so ordinary access continues after the member in each form, as `name:size.width` and `device:Energy.Device.power.round` read.
- [Reading an access's names](spec/language/extensions.md#extensions-reading-names): names that read more than one way are refused (NEXO3091), and a group or a named extension writes one; a group is needed only there.
- [Owners and extensions](spec/language/extensions.md#extensions-owners): how a member is declared decides how it is read, `.` for one declared within a type and `:` for one declared within an extension, whichever module declares it; `flatten` is a member `List<T>` declares as its own for a list of lists.
- [Function references](spec/language/functions.md#functions-module-functions): a call of a local that may hold several functions reads its arguments by the contract they share, as each one's call would, and is refused where their contracts read them differently (NEXO3079).
- [Extension access](spec/language/extensions.md#extensions-access): an extension's indexers are named, read `device:setting["mode"]` with their signatures, and brackets after the member are its key where the member the access selects for the receiver is a named indexer, as after a dot.
- [Whitespace in access expressions](spec/language/lexical-structure.md#tokens-and-whitespace-access-expressions): spaces and tabs between an access's tokens change nothing, in a property access, a computed one and an extension access alike, and a line break before a step is the line structure's, an extension access's colon and dots among them.

**Runtime**

- [The definition](spec/runtime/definition.md#definition): an extension access records each name as written, its first holding `extension: true` and each later one `continues: true`.

**Breaking:**

- Names `1.0.0-alpha.40` read as an extension and its member are refused where an extension member of the first name applies too (NEXO3091).
- NEXO1071 is retired.
- A definition is of version 38.

<a id="v1-0-0-alpha-40"></a>

## `1.0.0-alpha.40`

*October 30, 2026 · definition format 37*

**Language**

- [Owners and extensions](spec/language/extensions.md#extensions-owners): `.` reads a type's own members and `:` its extension members, so the two never compete. `device.usage` is refused, giving `device:usage` (NEXO3090).
- [Extension access](spec/language/extensions.md#extensions-access): an extension member is read as `receiver:member`, `receiver:Extension.member` or `receiver:Module.Extension.member`, the last name always the member.
- [Extension access](spec/language/extensions.md#extensions-access): each name fills its role, whatever the spacing. Names that fit no form are refused (NEXO1071), never read as a shorter access.
- [Extension access](spec/language/extensions.md#extensions-access): a call or a key closes the access. Ordinary access on a bare member's answer is grouped, `(device:readings).first`.
- [Extension access](spec/language/extensions.md#extensions-access): a function reference bound to its receiver takes its member's argument kinds wherever it is called, a local holding it included.
- [Indexer selection](spec/language/modules.md#namespaces-indexers): `x[key]` reads the unnamed indexer of the receiver's owner alone, and an extension's named indexer is read as `x:name[key]`.
- [Collection expressions](spec/language/collections.md#collections-collection-expressions): an arrow function written as a list's item or a dictionary's value is a syntax error (NEXO1057), and an indexer's key is never a function (NEXO3082).

**Runtime**

- [Extensions](spec/runtime/extensions.md#extensions-declaring): an extension declares no unnamed indexer (NEXO4564).
- [Capturing a supplied value](spec/runtime/host-calls.md#runtime-host-calls-capturing): a set is captured as a list wherever a list is declared, in a declared binding and a host call's supplied value as in a member's answer, its items in their order and each checked.
- [The definition](spec/runtime/definition.md#definition): an extension access's `extension` is empty, `{}`, where the member alone is written, and an `indexerAccess` holds none.

**Breaking:**

- A script reads an extension member with `:`, where it read it with `.`.
- A colon after a name is an extension access wherever an expression stands, so `f(a: b)` is no longer refused as a named argument but read as one.
- A module's extension declares no unnamed indexer, and `x:Extension[key]` is no form.
- A definition is of version 37.

<a id="v1-0-0-alpha-39"></a>

## `1.0.0-alpha.39`

*October 30, 2026 · definition format 36*

**Language**

- [Deferred member selection](spec/language/types.md#types-any-deferred-selection): a value's actual type, by which a member is selected as the value is evaluated, is stated, a reference's by recognition, a structured value's by its declared result, a list's by the type its items share, and an object's by its fields.
- [Imports](spec/language/modules.md#scripts-imports): a member an imported type inherits is read on any receiver it applies to, a supertype's among them, and a type selector's key needs no import of its own.
- [Function references](spec/language/functions.md#functions-references): a function used as a value is a function reference, whatever declares it, and the term *delegate* is retired.

**Runtime**

- [Hosting Nexo](spec/runtime/hosting.md): the host API is named for Nexo, `nexo`, `NexoError` and each type beginning `Nexo`.
- [Resolution](spec/runtime/resolution.md): what a resolution answers, result paths and locations are specified.
- [Evaluation](spec/runtime/evaluation.md#runtime-evaluation): what each hook receives and answers is specified.
- [Members](spec/runtime/members.md#members-declaration-helpers): every parameter declaration key and the declaration helpers are specified.
- [Modules](spec/runtime/modules.md#modules-registries): the module object and the registry's queries are specified.
- [Observations](spec/runtime/observations.md#observations): how a member names its observations, and what an observation type's implementation answers, are specified.
- [Errors](spec/runtime/errors.md): the error object, its factories and its locations are specified.
- [The definition](spec/runtime/definition.md#definition): a definition orders its imports by their local names' UTF-16 code units.

**Specification**

- [The specification](spec/README.md): organized as its two contracts, the language's and the runtime's, each with its glossary and its error catalog, and collections and extensions are each a document of their own.
- [Decisions](docs/decisions.md#implementation-decisions-reviewed): behaviour the implementation already had is stated where the specification was silent, among it where a refused line break stands, compact text's indentation, and where an unnamed indexer's and a mapping's errors stand.

**Breaking:** a host imports `nexo` and `NexoError`, and names each type `Nexo…`, where it imported `lexica` and `LexicaError` and named each type `Lexica…`.

<a id="v1-0-0-alpha-38"></a>

## `1.0.0-alpha.38`

*October 29, 2026 · definition format 36*

**Language**

- [The specification](spec/README.md): the language Lexica is renamed Nexo.
- [Imports](spec/language/modules.md#scripts-imports): the language's own module is `Nexo`, which no script imports.
- [Codes](spec/runtime/errors.md#diagnostics-codes): every diagnostic code is `NEXO` and four digits.

**Runtime**

- [The definition](spec/runtime/definition.md#definition): definition format 36 refuses an import of `Nexo`.

**Breaking:** every diagnostic code begins `NEXO`, where it began `LEXICA`, the language's own module is `Nexo`, where it was `Lexica`, and an implementation reads definitions of format 36 alone.

<a id="v1-0-0-alpha-37"></a>

## `1.0.0-alpha.37`

*October 29, 2026 · definition format 35*

**Language**

- [Boolean functions](spec/language/vocabulary.md#vocabulary-boolean-functions): `is`, `has` and `supports` are removed, and a module declares the tests of a receiver its domain needs, as Boolean functions.
- [A value keeps its identity](spec/language/types.md#types-any-identity): a structured value keeps its type through `Any`.

**Runtime**

- [Bindings](spec/runtime/bindings.md#runtime-bindings): a declared binding type refuses `Any`, `Never` and a position anywhere in its data, and captured data that reaches itself is refused.
- [Reusing a resolution](spec/runtime/resolution.md#runtime-reuse): registering a module that declares `typeOf` makes stale only the resolutions that may recognize values.

**Breaking:** a script that called `is`, `has` or `supports` calls a Boolean function its module declares instead.

<a id="v1-0-0-alpha-36"></a>

## `1.0.0-alpha.36`

*October 29, 2026 · definition format 35*

**Language**

- [Constructing a structure](spec/language/types.md#types-constructing-a-structure): an object expression written where a structured type is declared constructs a value of it.
- [Number members](spec/language/vocabulary.md#vocabulary-number-members): `round`, `floor`, `ceiling`, `truncate`, `abs`, `min`, `max` and `clamp`.
- [String members](spec/language/vocabulary.md#vocabulary-string-members): `length`, `trim`, `lowercase`, `uppercase`, `startsWith`, `endsWith`, `contains`, `indexOf`, `replace`, `split` and the slice `[range]`.
- [List members](spec/language/collections.md#collections-list-members): a list tells where an item stands, `indexOf` and `indexWhere`.

**Runtime**

- [Reusing a resolution](spec/runtime/resolution.md#runtime-reuse): a resolution stays current across every registration that can't change it, and says so, `resolution.isCurrent`.
- [Bindings](spec/runtime/bindings.md#runtime-bindings): a host declares a binding's data type, which captures the data as that type, a structured value among them.

**Breaking:** nothing a script or a host wrote before.

<a id="v1-0-0-alpha-35"></a>

## `1.0.0-alpha.35`

*October 28, 2026 · definition format 35*

**Language**

- [Dictionaries and pairs](spec/language/collections.md#collections-dictionaries-and-pairs): addressed by keys of a key type, compared by one exact equality.
- [Collection expressions](spec/language/collections.md#collections-collection-expressions): a list, `[1, 2]`, or a dictionary, `["coffee" = 3]`, written where a value stands.
- [List members](spec/language/collections.md#collections-list-members): selecting, searching, aggregating, partitioning, joining, grouping and constructing dictionaries.
- [Dictionary and pair members](spec/language/collections.md#collections-dictionary-members): a dictionary's lookups, keys, values and entries, and its own selection.
- [Positions](spec/language/collections.md#collections-positions): an index from the end, `^n`, a range, `start..end`, a list's slice, `pick` and a number's `sequence`.
- [Ordering](spec/language/collections.md#collections-list-ordering): a list ordered by keys, `orderBy` and `thenBy`, stably, each key evaluated once.

**Runtime**

- [Provenance](spec/runtime/evaluation.md#runtime-results-provenance): a result records each projected item's lineage, kept through filtering, reordering, slicing and `pick`.
- [A value in a host's form](spec/runtime/evaluation.md#runtime-host-forms): an implementation receives and gives collections in a host's forms, a set, a map and a key with its value.
- [The definition](spec/runtime/definition.md#definition): definition format 35 records collection expressions, indices and ranges.

**Breaking:** an implementation reads definitions of format 35 alone.

<a id="v1-0-0-alpha-34"></a>

## `1.0.0-alpha.34`

*October 22, 2026 · definition format 34*

**Language**

- [Imports](spec/language/modules.md#scripts-imports): a script imports the modules and the types whose vocabulary it uses, under aliases where it chooses, and resolution reaches only what they make available.
- [Owners and extensions](spec/language/extensions.md#extensions-owners): a member of the type's owner wins over every extension, and the most specific extension otherwise.
- [Extension access](spec/language/extensions.md#extensions-access): selects an extension explicitly, `device:Device.usage`.
- [Type parameters](spec/language/types.md#types-type-parameters): declared by a declaration and inferred at each call.
- [Values of `Any`](spec/language/types.md#types-any): a value whose members are selected as it is evaluated.
- [Reference types](spec/language/types.md#reference-types): types in hierarchies, [cast](spec/language/types.md#casts) within them and across them by declared casts.
- [Conversions](spec/language/values.md#conversions): operators a type declares, competing as members do.
- [Line structure](spec/language/lexical-structure.md#line-structure): where a line may break, must break and can't.
- [Type names](spec/language/types.md#types-type-names): a module's name is unique whatever its case, and the casing of names is a convention, never enforced.

**Runtime**

- [Declaring a type](spec/runtime/modules.md#modules-declaring-a-type): a type holds its members, as a reference or a structured type, beside operators and each member's `impl`.
- [Extensions](spec/runtime/extensions.md#extensions-declaring): a module declares the members it adds to a type another module owns as an extension.
- [Internal declarations](spec/runtime/modules.md#modules-internal-declarations): a declaration its own module alone reaches.
- [Reference types](spec/runtime/modules.md#runtime-reference-types): bindings recognize references by every module's `typeOf` and check membership by `isInstance`.
- [Type selectors](spec/runtime/type-selectors.md#runtime-type-selectors): a selector's keys are mappings any module declares.
- [Resolution](spec/runtime/resolution.md#runtime-bindings-and-resolution): a resolution reports its deferred accesses and its candidate declarations.
- [Codes](spec/runtime/errors.md#diagnostics-codes): every diagnostic has a code.
- [Canonical text](spec/runtime/definition.md#definition-canonical-text): `quote` writes compact, parseable text.
- [The definition](spec/runtime/definition.md#definition): definition format 34 records imports, extension selections and the renamed nodes.

**Breaking:** members declared flat with a target, the built-in DOM types and `bind` are removed, and a declaration takes its new shape; a script imports the modules whose vocabulary it uses; and an implementation reads definitions of format 34 alone.

<a id="v1-0-0-alpha-33"></a>

## `1.0.0-alpha.33`

*October 22, 2026 · definition format 33*

**Language**

- [Named indexers](spec/language/members.md#property-access-calls-and-indexers-named-indexers): an indexer its type declares with a name, `x.name[k]`.
- [Unnamed indexers](spec/language/members.md#property-access-calls-and-indexers-unnamed-indexers): a type's indexer without a name, `x[k]`.
- [Computed property access](spec/language/members.md#computed-property-access): a property read by a name an expression gives, `x.[p]`.
- [Type identity](spec/language/types.md#types-type-identity): a type is identified by its module, and a cast or a conversion names one qualified by it, `device as Home.Light`.

**Runtime**

- [The definition](spec/runtime/definition.md#definition): definition format 33 records indexers, computed property access and qualified type names.

**Breaking:** a property read by a name an expression gives is written `x.[p]`, where it was `x[p]`, which now reads a type's unnamed indexer; and an implementation reads definitions of format 33 alone.

<a id="before-v1-0-0-alpha-33"></a>

## Before `1.0.0-alpha.33`

*October 9 to 21, 2026 · definition formats 1 to 32*

The language began inside DOMQL, and left it to stand alone before its versions were numbered:

- **DOMQL's query language,** October 9, 2026: a language for querying the DOM, read from text into a definition of format 1, which grew within DOMQL to definition format 30.
- **Lexica,** October 19, 2026: ported from DOMQL as an extensible language of its own, named Lexica, at version `1.0.0-alpha`, the modules a host registers declaring its domain, and DOMQL building on it from then.
- **Numbered versions,** October 21, 2026: each language version declared in one place, numbered to match the definition format then current, the specification describing `1.0.0-alpha.32` and the implementation following `1.0.0-alpha.31`.

Together they built the foundation every later version extends:

- [Scripts](spec/language/scripts.md#scripts): their parameters a host binds, bodies and locals.
- [Values](spec/language/values.md): objects and the object root, lists and null.
- [Expressions](spec/language/expressions.md#expressions): tests, truthiness, equality, arithmetic, comparisons, logic, conditionals and conditional bindings, `do` blocks, coalescing, attempts, casts, conversions and interpolated strings.
- [Functions](spec/language/functions.md#functions): regular and arrow functions a script declares, and references to a module's functions.
- [Members](spec/language/members.md): their arguments and their kinds.
- [Host calls](spec/runtime/host-calls.md#runtime-host-calls): calls the host invokes, which Nexo prepares and projects.
- [Modules](spec/runtime/modules.md): modules and their declarations, registries, and type selectors.
- [Hosting Nexo](spec/runtime/hosting.md): bindings, resolution, evaluation with its hooks, and results with their metadata.
- [Observations](spec/runtime/observations.md#observations): what a member names to learn its result may have changed.
- [The definition](spec/runtime/definition.md#definition): the JSON definition and its canonical text.
