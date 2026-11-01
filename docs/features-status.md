# Features Status

## Current state

**The language and its runtime are implemented as the specification describes them, language `1.0.0-beta.6` and definition version 38, the sixth beta.** What remains is the [open decisions](#open-decisions), [tooling](#tooling) and [the release](#release); DOMQL, Nexo's first host, has [migrated](#domqls-migration) to them.

| Version | Implementation | Specification |
| --- | --- | --- |
| Language | `1.0.0-beta.6` | `1.0.0-beta.6` |
| Definition format | 38 | 38 |

The bundle and type declarations are built. npm and NuGet packages are packed locally but unpublished. Every example the specification gives resolves against [the examples' vocabulary](../spec/language/examples-vocabulary.md) and evaluates in the gate, a host call's preparation and projection among them, and each example the specification gives as an error is refused. The README's example runs as it is written, against the vocabulary its own JavaScript declares, as [decisions](decisions.md#d24) records.

The [specification](../spec/README.md) defines the contract; the [design](nexo-design.md) explains the architecture. This file tracks implementation and the remaining work. "Implemented" means built and tested in the gate for the current implementation version; it does not imply that later specification changes are implemented.

<a id="remaining-work"></a>

## Remaining work

| Work | State |
| --- | --- |
| [DOMQL's migration](#domqls-migration) | Done: DOMQL migrated at `1.0.0-beta.3` |
| [Tooling](#tooling) | Next |
| [Release](#release) | The beta is declared; publishing remains |

- **A change is a commit,** each passing the gate, and moving each aspect once: a declaration, a test or a document takes its final form the first time the aspect changes.
- **A breaking change says how to migrate.** Since the beta, a version's entry in the [language history](../LANGUAGE-HISTORY.md) says how to migrate beside each thing it breaks.
- **A change a host can notice is in the [changelog](../CHANGELOG.md),** listed by its rules.
- **Documents move with their change.** The specification, the README, the [embedding guide](embedding-guide.md), the type declarations and this file change in the commit that changes what they describe.
- **Every diagnostic has its code,** given when its condition is introduced, and the tests of each condition assert its code, never only its message.

<a id="features"></a>

## Features

Each feature, the contract that states it, its state in the implementation, and the language version the implementation has followed it since, whose changes [the language history](../LANGUAGE-HISTORY.md) records. A state names a gap the implementation keeps from its contract, open until it is decided, and what is deferred.

### The language

| Feature | Contract | State | Since |
| --- | --- | --- | --- |
| Scripts, their parameters, bodies and locals | [Scripts](../spec/language/scripts.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Tokens, names, strings and comments | [Lexical structure](../spec/language/lexical-structure.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Line structure | [Line structure](../spec/language/lexical-structure.md#line-structure) | Implemented | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |
| Objects, the object root and null | [Values](../spec/language/values.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Tests, equality, arithmetic, comparisons, logic, conditionals, coalescing, attempts and interpolated strings | [Expressions](../spec/language/expressions.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Casts and conversions | [Casts](../spec/language/types.md#casts), [conversions](../spec/language/values.md#conversions) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Functions a script declares, and function references | [Functions](../spec/language/functions.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Members, their arguments and their kinds, and host calls in a script | [Members](../spec/language/members.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Indexers and computed property access | [Named indexers](../spec/language/members.md#property-access-calls-and-indexers-named-indexers), [computed property access](../spec/language/members.md#computed-property-access) | Implemented | [`alpha.33`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-33) |
| Types identified by their module | [Type identity](../spec/language/types.md#types-type-identity) | Implemented | [`alpha.33`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-33) |
| Imports, aliases and type imports, a host's among them, namespaces, module members and qualified access | [Imports](../spec/language/modules.md#scripts-imports), [namespaces](../spec/language/modules.md#namespaces) | Implemented | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |
| Extensions: the owner's members read with `.`, extension members with `:`, the most specific extension selected, an access's names read by the declarations they name | [Extensions](../spec/language/extensions.md) | Implemented | [`alpha.40`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-40) |
| Type parameters, inferred at each call | [Type parameters](../spec/language/types.md#types-type-parameters) | Implemented; a type parameter's default is an [open decision](#open-decisions) | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |
| `Any`, its members selected as it is evaluated | [Values of `Any`](../spec/language/types.md#types-any) | Implemented in part: a function given to a deferred call is [deferred](#deferred) | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |
| Reference types in hierarchies, and the casts among them | [Reference types](../spec/language/types.md#reference-types) | Implemented | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |
| Structured values an object expression constructs where they are declared | [Constructing a structure](../spec/language/types.md#types-constructing-a-structure) | Implemented | [`alpha.36`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-36) |
| Lists, dictionaries, pairs and collection expressions, with their members | [Collections](../spec/language/collections.md) | Implemented, with a [gap](#open-decisions): `distinctBy`'s key, and the membership of values key equality doesn't compare | [`alpha.35`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-35) |
| Positions, ranges, slicing and ordering | [Positions](../spec/language/collections.md#collections-positions), [ordering](../spec/language/collections.md#collections-list-ordering) | Implemented | [`alpha.35`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-35) |
| The members of numbers and strings | [Number members](../spec/language/vocabulary.md#vocabulary-number-members), [string members](../spec/language/vocabulary.md#vocabulary-string-members) | Implemented | [`alpha.36`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-36) |
| Boolean functions, the tests a module declares | [Boolean functions](../spec/language/vocabulary.md#vocabulary-boolean-functions) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Type selectors | [Type selectors](../spec/language/vocabulary.md#vocabulary-type-selectors) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| The conditions a script fails on, each with its code | [Errors](../spec/language/errors.md) | Implemented, with a [gap](#open-decisions): NEXO5012 shared by several conditions, and four codes never raised | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |

### The runtime

| Feature | Contract | State | Since |
| --- | --- | --- | --- |
| Bindings, recognition and declared types | [Bindings](../spec/runtime/bindings.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Resolution, its reports, result paths and locations | [Resolution](../spec/runtime/resolution.md) | Implemented, with a [gap](#open-decisions): a path validated by `nexo.paths.validate` alone | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Resolutions that stay current across registrations | [Reusing a resolution](../spec/runtime/resolution.md#runtime-reuse) | Implemented | [`alpha.36`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-36) |
| Evaluation, its hooks, and results with their metadata | [Evaluation](../spec/runtime/evaluation.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Data shared with a host, read-only once it passes | [Data shared with a host](../spec/runtime/evaluation.md#runtime-shared-data) | Implemented: Nexo changes no data it shares, a host keeps its own part, which Nexo doesn't check, and Nexo's own members rely on their answers, and their list members on the check of the data items they give their functions | [`alpha.42`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-42) |
| The lineage of projected items | [Provenance](../spec/runtime/evaluation.md#runtime-results-provenance) | Implemented, with a [gap](#open-decisions): a dictionary's metadata | [`alpha.35`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-35) |
| Values in a host's forms | [A value in a host's form](../spec/runtime/evaluation.md#runtime-host-forms) | Implemented | [`alpha.35`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-35) |
| Preparing host calls and projecting what their host supplies | [Host calls](../spec/runtime/host-calls.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Modules: their declarations, operators, internal declarations, duplicates and registries | [Modules](../spec/runtime/modules.md) | Implemented, with a [gap](#open-decisions): a type's copy keeps a key holding `undefined` | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |
| Declaring members, their parameter keys and the declaration helpers | [Members](../spec/runtime/members.md) | Implemented, with a [gap](#open-decisions): parameter defaults, options the helpers drop, and a value parameter's `context` left unchecked | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Extensions a module declares | [Extensions](../spec/runtime/extensions.md) | Implemented | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |
| Observation types and targets | [Observations](../spec/runtime/observations.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Type selectors' keys as mappings | [Type selectors](../spec/runtime/type-selectors.md) | Implemented | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |
| The definition, its structural validation and canonical text | [Definition](../spec/runtime/definition.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| The error object, its factories and locations | [Errors](../spec/runtime/errors.md) | Implemented, with a [gap](#open-decisions): `NexoError`'s undeclared `syntax` and `locate` | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |
| The host API named for Nexo | [Hosting Nexo](../spec/runtime/hosting.md) | Implemented | [`alpha.39`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-39) |
| A tolerant reading that collects diagnostics without throwing | [Tooling](#tooling) | Planned | — |
| Formatting that keeps a text's source form | [Tooling](#tooling) | Planned | — |
| Editor diagnostics and completion | [Tooling](#tooling) | Planned | — |
| The beta, its promise and the changelog | [Language history](../LANGUAGE-HISTORY.md#v1-0-0-beta-1), [changelog](../CHANGELOG.md) | Implemented | [`beta.1`](../LANGUAGE-HISTORY.md#v1-0-0-beta-1) |
| Published packages | [Release](#release) | Planned | — |

The bundle and type declarations are built, as [the build](../README.md#build) sets out.

<a id="domqls-migration"></a>
<a id="domqls-migration-fifth"></a>

## DOMQL's migration

DOMQL, Nexo's first host, has migrated from Lexica at `0e98b3e` to language `1.0.0-beta.3`, at the commit its `nexo.commit` pins, and passes its gate there, browser tests included. Its [status](https://github.com/FormaUI/DOMQL/blob/main/docs/features-status.md#migration-to-nexo) records how, and its version history what changed for its callers.

- **The checklists are removed,** as each was to be once its migration was verified. Their history holds them, at [`c9db3ad`](https://github.com/FormaUI/Nexo/blob/c9db3adc838ab8d16a6aa1626ce6df5a61b50f79/docs/features-status.md#domqls-migration).
- **What it brought to Nexo:**
  - a module error a host builds, and operator declarations a TypeScript host can type, which language `1.0.0-beta.2` and [decisions](decisions.md#d29) record;
  - a host call's candidates, which tell a host what a call on a null receiver requests, as language `1.0.0-beta.3` and [decisions](decisions.md#d30) record.

<a id="tooling"></a>

## Tooling

Built once, on the final syntax and visibility rules:

- Error recovery, and a public tooling API that collects diagnostics without throwing, over the lossless syntax tree and the tolerant tokenizer that are built and internal.
- Formatting that preserves a text's source form; tokens already keep each string's form.
- Editor tooling: diagnostics and completion through the syntax tree, offering only the declarations a script can reach.

References: [Syntax tree](nexo-design.md#the-syntax-tree), [tooling](nexo-design.md#tooling).

<a id="release"></a>

## Release

**Packages.** One source and build produce both packages locally; neither is published. Both carry the implementation version declared by `src/language/Versions.mjs`.

| Package | Contents or delivery |
| --- | --- |
| npm: `@formaui-net/nexo` | The ES module sources and their type declarations, `src/nexo.d.ts` |
| NuGet: `formaui-net.Nexo` | `nexo.js` and `nexo.d.ts` served at `_content/nexo/` |

Publish both, and test them as consumers install them: NuGet in a published application, and npm installed, bundled, and loaded in Chromium.

The gate holds the packages, the README and `nexo.info.versions` to the versions the sources declare. Publishing a version dates its entry in the [changelog](../CHANGELOG.md).

**Beta.** Nexo entered the beta at `1.0.0-beta.1`, as [decisions](decisions.md#d27) records:

- The documents and the module API were audited, and the behavior of a cast inside an optional enclosed access was settled.
- No breaking redesign is planned. The [open decisions](#open-decisions) and the [deferred work](#deferred) document the remaining limitations.

<a id="open-decisions"></a>

## Open decisions

The decisions taken while implementing were reviewed together, and the outcome of each is in [decisions](decisions.md#implementation-decisions-reviewed): the rules they settled are stated in the specification, and the questions they left open are below.

Two open decisions are recorded, and [decisions](decisions.md#d26) settles a third, who may change data Nexo and its host share. The first: a module that declares a type spelled as one of Nexo's own, as `Home.Number`, can't name Nexo's own type of that name in its own declarations, since [type name lookup](../spec/language/types.md#types-type-name-lookup) finds the module's own first and Nexo's own types have no qualified spelling. Giving Nexo a permanent namespace for that was declined; the limitation stands until another spelling is chosen.

The second: a type parameter's default is checked at registration to be data, and against what the parameter binds to nowhere, since resolution checks the arguments a call gives and passes a default left out as it is, so `0` reaches an implementation whose `T` is `String`. Whether resolution refuses such a call, or a parameter of a type parameter takes no default, is open.

These gaps between the specification and the code, found by audits and by the review above, are each open until decided:

- **Parameter defaults.** [Null arguments](../spec/language/members.md#nullability-a-null-argument-follows-the-parameter) make propagating null a parameter's default, and a parameter required unless marked optional, while `createModule` requires `required` and `nulls` of every parameter (NEXO4536), and only the [declaration helpers](../spec/runtime/members.md#members-declaration-helpers) supply defaults.
- **`distinctBy`'s key.** [List members](../spec/language/collections.md#collections-list-members) refuse a key of no key type that `distinctBy` gives (NEXO3083), while the resolver refuses one only where a call answers a dictionary, so `xs.distinctBy({ a = it })` is accepted.
- **Membership of other values.** `contains`, `indexOf`, `distinct` and `distinctBy` compare by [key equality](../spec/language/collections.md#collections-dictionaries-and-pairs), which defines none for an object, a list or a structured value, while the evaluator compares those by identity, so `[[1], [1]].distinct.count` is 2.
- **A dictionary's metadata.** [Provenance](../spec/runtime/evaluation.md#runtime-results-provenance) gives a list's lineage through filtering and reordering alone, while the collections proposal's decision 9 keeps a retained entry's metadata too; a dictionary's `where` and `select` record none.
- **Codes.** NEXO5012 is raised for an ambiguous deferred selection and for each argument a selected member can't take, and for a value of `Any` an extension access is given outside the extension's target, conditions its catalogue row doesn't name, against the rule that distinct conditions never share a code; NEXO3045, NEXO3065, NEXO4021 and NEXO4067 are catalogued and never raised.
- **Declarations.** `createPredicateParameterDeclaration` takes no options, which `nexo.d.ts` declares; a member helper drops `internal` and passes `invokedBy` to a property, which `createModule` then refuses; a value parameter's `context` is never checked; and a type's copy keeps a key holding `undefined`, which [valid declarations](../spec/runtime/modules.md#modules-declarations) count as left out.
- **Errors.** `NexoError` exposes `syntax` and `locate`, beside the four factories `nexo.d.ts` declares, and result paths are validated by `nexo.paths.validate` alone, never by `typeAt` and `valueAt`.

Deferred items below require their stated trigger before design or implementation resumes.

<a id="deferred"></a>

## Deferred

| Work | Why it waits | Reopened by |
| --- | --- | --- |
| Collection conversions, `values to List` and `entries to Dictionary` | Collections are constructed by members; conversions to or from a collection would extend conversion targets and contracts. | A use members do not serve |
| Unions of structured types | One shape of nullable fields, and a field telling which of them a value fills, holds data of several families, its consumer validating each family; a union would need a notation, narrowing and a projection rule of its own. | A host whose data no one shape holds |
| Rounding a number to decimal digits | Rounding a binary value's decimal expansion is a contract of its own; a step is written by arithmetic around `round`. | A host that needs digits a step can't give |
| Explicit application identity, `identifyBy` | Sources and lineage serve the collection foundation; identities apart from keys and sources need scoping rules of their own. | A host that matches by identities its sources cannot give |
| Incremental reparsing, specialized tree machinery, and a public tree schema shared by C# and JavaScript | No tool needs them yet. | A concrete tooling need |
| Expression, predicate, and function arguments to host calls | Prepared arguments are values retained by the host; callbacks need an evaluation context and lifetime. | A host call that must call back into its script, with that context and lifetime designed |
| An extension targeting several types | Each extension has one target, and reusing a declaration in an extension for each target serves current cases. | Many repeated members across unrelated types |
| Selecting a module's operator when several compete | No syntax selects an operator by module; qualified calls cannot reach operators. | Competing operators in real use |
| Structured-data casts, reference/data conversions, and operators beyond `cast` and `convert` | Each needs rules for checking and copying. | A use the two operators do not serve |
| Object-typed parameter defaults, under the ordinary compatibility rules | No parameter can be object-typed while an object type has no notation a declaration writes. | An object type's notation in declarations |
| A value of `Any` a callback contract passes to a function reference whose parameter declares a concrete type, which [assignability](../spec/language/types.md#types-assignability) accepts and checks | Nothing stands between a callback and the reference's implementation to check what it is called with, so such a reference is refused with NEXO3036. | A host whose callback contract passes `Any` to a typed reference |
| A function given to a deferred call, as [deferred member selection](../spec/language/types.md#types-any-deferred-selection) accepts one | A function's reading is the declaration's, chosen only as the call is evaluated, so a deferred call takes values alone. | A host whose deferred call needs one |
| Calling a module's internal declarations through Nexo | JavaScript implementations can reach their own values directly. | An internal-call API with a defined module context |
| Wrapping canonical text by width | `format` follows the structural layout alone and never wraps; a width needs a layout policy of its own that keeps canonical text deterministic and every one-line construct whole past it | A host or a tool that needs text kept within a width |
| Equality of structured values, objects and lists, as keys, members and distinct items | Key equality covers numbers, strings, Booleans, references and null; the equality of the rest needs its hashing, type identity and capture designed together | A host whose keys or distinct items are data of those kinds |

<a id="temporary-implementation-coverage"></a>

## Temporary implementation coverage

Conditions the implementation reports that no catalog holds, each coded so every diagnostic it throws carries a code until the work that removes the condition lands. None remains: the last, conditions of language `1.0.0-alpha.33` alone, retired as their replacements landed. Such a code stays out of the specification's catalogs, retires to the retired codes of its catalog, [the language's](../spec/language/errors.md#diagnostics-retired-codes) or [the runtime's](../spec/runtime/errors.md#runtime-retired-codes), when the work that removes its condition lands, and is never reused.
