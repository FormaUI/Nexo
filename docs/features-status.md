# Features Status

## Current state

**The language and its runtime are implemented as the specification describes them, language `1.0.0-beta.41` and definition version 38, the forty-first beta.** What remains is publishing [the release](#release), `1.0.0-beta.2`, and [what 1.0 requires](#what-1-0-requires), which no new feature comes before, and [no decision is open](#open-decisions); DOMQL, Nexo's first host, has [migrated](#domqls-migration) to them. [Tooling](#tooling) follows 1.0.

| Version | Implementation | Specification |
| --- | --- | --- |
| Language | `1.0.0-beta.41` | `1.0.0-beta.41` |
| Definition format | 38 | 38 |

The bundle and type declarations are built. npm and NuGet packages are packed locally but unpublished. Every example the specification gives resolves against [the examples' vocabulary](../spec/language/examples-vocabulary.md) and evaluates in the gate, a host call's preparation and projection among them, and each example the specification gives as an error is refused. The README's example runs as it is written, against the vocabulary its own JavaScript declares, as [decisions](decisions.md#d24) records, and the [embedding guide](embedding-guide.md)'s run in order as a host writes them, each value they state checked, as [decisions](decisions.md#d68) records. Every link a document gives reaches its document and anchor, as [decisions](decisions.md#d69) records.

The [specification](../spec/README.md) defines the contract; the [design](nexo-design.md) explains the architecture. This file tracks implementation and the remaining work. "Implemented" means built and tested in the gate for the current implementation version; it does not imply that later specification changes are implemented.

<a id="remaining-work"></a>

## Remaining work

| Work | State |
| --- | --- |
| [DOMQL's migration](#domqls-migration) | Done: DOMQL migrated at `1.0.0-beta.3` |
| [Release](#release) | `1.0.0-beta.2` is released; publishing its packages remains |
| [What 1.0 requires](#what-1-0-requires) | Five requirements, one met in part |
| [Tooling](#tooling) | Follows 1.0, and waits for its design |

- **A change is a commit,** each passing the gate, and moving each aspect once: a declaration, a test or a document takes its final form the first time the aspect changes.
- **A language version collects the changes between two releases.** A change to either contract joins the [language history](../LANGUAGE-HISTORY.md)'s newest entry while it reads *Unreleased*, and opens the next version's entry once it is released.
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
| `and` and `or` typed where their value is used, so `c and x or y` chooses a value | [The type of a logical expression](../spec/language/expressions.md#logical-expressions-negations-and-groups-type) | Implemented, as [decisions](decisions.md#d50) records | [`beta.21`](../LANGUAGE-HISTORY.md#v1-0-0-beta-21) |
| Casts and conversions | [Casts](../spec/language/types.md#casts), [conversions](../spec/language/values.md#conversions) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Functions a script declares, and function references | [Functions](../spec/language/functions.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Members, their arguments and their kinds, and host calls in a script | [Members](../spec/language/members.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Indexers and computed property access | [Named indexers](../spec/language/members.md#property-access-calls-and-indexers-named-indexers), [computed property access](../spec/language/members.md#computed-property-access) | Implemented | [`alpha.33`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-33) |
| Types identified by their module | [Type identity](../spec/language/types.md#types-type-identity) | Implemented | [`alpha.33`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-33) |
| Imports, aliases and type imports, a host's among them, namespaces, module members and qualified access | [Imports](../spec/language/modules.md#scripts-imports), [namespaces](../spec/language/modules.md#namespaces) | Implemented | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |
| Extensions: the owner's members read with `.`, extension members with `:`, the most specific extension selected, an access's names read by the declarations they name | [Extensions](../spec/language/extensions.md) | Implemented | [`alpha.40`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-40) |
| Type parameters, inferred at each call | [Type parameters](../spec/language/types.md#types-type-parameters) | Implemented | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |
| `Any`, its members selected as it is evaluated | [Values of `Any`](../spec/language/types.md#types-any) | Implemented in part: a function given to a deferred call is [deferred](#deferred) | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |
| A value of `Any` entering a structure as its data shape alone | [Into a structure](../spec/language/types.md#types-any-into-a-structure) | Implemented, as [D71](decisions.md#d71) records | [`beta.41`](../LANGUAGE-HISTORY.md#v1-0-0-beta-41) |
| Reference types in hierarchies, and the casts among them | [Reference types](../spec/language/types.md#reference-types) | Implemented | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |
| Structured values an object expression constructs where they are declared | [Constructing a structure](../spec/language/types.md#types-constructing-a-structure) | Implemented | [`alpha.36`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-36) |
| Lists, dictionaries, pairs and collection expressions, with their members | [Collections](../spec/language/collections.md) | Implemented | [`alpha.35`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-35) |
| Positions, ranges, slicing and ordering | [Positions](../spec/language/collections.md#collections-positions), [ordering](../spec/language/collections.md#collections-list-ordering) | Implemented | [`alpha.35`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-35) |
| The members of numbers and strings | [Number members](../spec/language/vocabulary.md#vocabulary-number-members), [string members](../spec/language/vocabulary.md#vocabulary-string-members) | Implemented | [`alpha.36`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-36) |
| Boolean functions, the tests a module declares | [Boolean functions](../spec/language/vocabulary.md#vocabulary-boolean-functions) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Type selectors | [Type selectors](../spec/language/vocabulary.md#vocabulary-type-selectors) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| The conditions a script fails on, each with its code | [Errors](../spec/language/errors.md) | Implemented | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |

### The runtime

| Feature | Contract | State | Since |
| --- | --- | --- | --- |
| Bindings, recognition and declared types | [Bindings](../spec/runtime/bindings.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Resolution, its reports, result paths and locations | [Resolution](../spec/runtime/resolution.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Resolutions that stay current across registrations | [Reusing a resolution](../spec/runtime/resolution.md#runtime-reuse) | Implemented | [`alpha.36`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-36) |
| Evaluation, its hooks, and results with their metadata | [Evaluation](../spec/runtime/evaluation.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| The limits a host sets on the lists Nexo's own members make, `createEvaluator(bindings, env, { limits })` | [Evaluation](../spec/runtime/evaluation.md#runtime-evaluation) | Implemented for `sequence` and `concat`, the lists larger than their receivers, each list alone, as [D72](decisions.md#d72) records | [`beta.41`](../LANGUAGE-HISTORY.md#v1-0-0-beta-41) |
| Data shared with a host, read-only once it passes | [Data shared with a host](../spec/runtime/evaluation.md#runtime-shared-data) | Implemented: Nexo changes no data it shares, a host keeps its own part, which Nexo doesn't check, and Nexo's own members rely on their answers, and their list members on the check of the data items they give their functions | [`alpha.42`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-42) |
| The lineage of projected items | [Provenance](../spec/runtime/evaluation.md#runtime-results-provenance) | Implemented | [`alpha.35`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-35) |
| Values in a host's forms | [A value in a host's form](../spec/runtime/evaluation.md#runtime-host-forms) | Implemented | [`alpha.35`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-35) |
| Preparing host calls and projecting what their host supplies | [Host calls](../spec/runtime/host-calls.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| A host call's function arguments, kept by its host until it disposes the prepared call | [Kept functions](../spec/runtime/host-calls.md#runtime-host-calls-kept-functions) | Implemented, as [decisions](decisions.md#d49) records | [`beta.20`](../LANGUAGE-HISTORY.md#v1-0-0-beta-20) |
| The reads a pending result waits for, its metadata's `pending` | [Pending reads](../spec/runtime/evaluation.md#runtime-results-pending-reads) | Implemented, made when the metadata is first read, as [D82](decisions.md#d82) records | [`beta.41`](../LANGUAGE-HISTORY.md#v1-0-0-beta-41) |
| What a disposed function, a result and an error keep: nothing of their evaluation | [Kept functions](../spec/runtime/host-calls.md#runtime-host-calls-kept-functions), [results](../spec/runtime/evaluation.md#runtime-results) | Implemented, as [D78](decisions.md#d78) records, each case tested with a forced collection | [`beta.41`](../LANGUAGE-HISTORY.md#v1-0-0-beta-41) |
| Modules: their declarations, operators, internal declarations, duplicates and registries | [Modules](../spec/runtime/modules.md) | Implemented | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |
| Declaring members, their parameter keys and the declaration helpers | [Members](../spec/runtime/members.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Extensions a module declares | [Extensions](../spec/runtime/extensions.md) | Implemented | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |
| Observation types and targets | [Observations](../spec/runtime/observations.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| Type selectors' keys as mappings | [Type selectors](../spec/runtime/type-selectors.md) | Implemented | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |
| The definition, its structural validation and canonical text | [Definition](../spec/runtime/definition.md) | Implemented | [before `alpha.33`](../LANGUAGE-HISTORY.md#before-v1-0-0-alpha-33) |
| The error object, its factories and locations | [Errors](../spec/runtime/errors.md) | Implemented | [`alpha.34`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-34) |
| The host API named for Nexo | [Hosting Nexo](../spec/runtime/hosting.md) | Implemented | [`alpha.39`](../LANGUAGE-HISTORY.md#v1-0-0-alpha-39) |
| A tolerant reading that collects diagnostics without throwing | [Tooling](#tooling) | Follows 1.0, and waits for its design | — |
| Formatting that keeps a text's source form | [Tooling](#tooling) | Follows 1.0, and waits for its design | — |
| Editor diagnostics and completion | [Tooling](#tooling) | Follows 1.0, and waits for its design | — |
| The beta, its promise and the changelog | [Language history](../LANGUAGE-HISTORY.md#v1-0-0-beta-1), [changelog](../CHANGELOG.md) | Implemented | [`beta.1`](../LANGUAGE-HISTORY.md#v1-0-0-beta-1) |
| Language and definition versions advanced once per release | [Versions](../spec/runtime/versions.md#runtime-versions), [cutting a release](../CONTRIBUTING.md#cut-a-release) | Implemented, as [decisions](decisions.md#d66) records | [`beta.40`](../LANGUAGE-HISTORY.md#v1-0-0-beta-40) |
| Published packages | [Release](#release) | Planned | — |

The bundle and type declarations are built, as [the build](../README.md#build) sets out.

<a id="domqls-migration"></a>
<a id="domqls-migration-fifth"></a>

## DOMQL's migration

DOMQL, Nexo's first host, migrated from Lexica at `0e98b3e` to language `1.0.0-beta.3`, and has since followed Nexo, by its commits until the first release and by the release its `nexo.release` pins from then on, passing its gate on each, browser tests included. Its [status](https://github.com/FormaUI/DOMQL/blob/main/docs/features-status.md#migration-to-nexo) records how, and its version history what changed for its callers.

- **The checklists are removed,** as each was to be once its migration was verified. Their history holds them, at [`c9db3ad`](https://github.com/FormaUI/Nexo/blob/c9db3adc838ab8d16a6aa1626ce6df5a61b50f79/docs/features-status.md#domqls-migration).
- **What it brought to Nexo:**
  - a module error a host builds, and operator declarations a TypeScript host can type, which language `1.0.0-beta.2` and [decisions](decisions.md#d29) record;
  - a host call's candidates, which tell a host what a call on a null receiver requests, as language `1.0.0-beta.3` and [decisions](decisions.md#d30) record.

<a id="tooling"></a>

## Tooling

**Follows 1.0, and waits for its design.** It adds an API, and changes no contract a script or a host relies on, so it waits for [1.0](#what-1-0-requires) like any new feature. A first draft, built before tooling was designed, was withdrawn from `main` and is kept on the `tooling-draft` branch, as [decisions](decisions.md#d48) records. Tooling is built once it is designed, on the final syntax and visibility rules:

- Error recovery, and a public tooling API that collects diagnostics without throwing, over the lossless syntax tree and the tolerant tokenizer that are built and internal.
- Formatting that preserves a text's source form; tokens already keep each string's form.
- Editor tooling: diagnostics and completion through the syntax tree, offering only the declarations a script can reach.

References: [Syntax tree](nexo-design.md#the-syntax-tree), [tooling](nexo-design.md#tooling).

<a id="release"></a>

## Release

**Packages.** One source and build produce both packages locally; neither is published. Both carry the implementation version declared by `src/language/Versions.mjs`. Each release is tagged by its version, the newest, `1.0.0-beta.2`, as `v1.0.0-beta.2`, and its packages are packed from its tag.

| Package | Contents or delivery |
| --- | --- |
| npm: `@formaui-net/nexo` | The ES module sources and their type declarations, `src/nexo.d.ts` |
| NuGet: `formaui-net.Nexo` | `nexo.js` and `nexo.d.ts` served at `_content/nexo/` |

Publish both from the tag, and test them as consumers install them: NuGet in a published application, and npm installed, bundled, and loaded in Chromium.

The gate holds the packages, the README and `nexo.info.versions` to the versions the sources declare. Cutting a release dates its entry in the [changelog](../CHANGELOG.md) and tags its commit, as [contributing](../CONTRIBUTING.md#cut-a-release) sets out, and its packages are published from that tag.

**Beta.** Nexo entered the beta at `1.0.0-beta.1`, as [decisions](decisions.md#d27) records:

- The documents and the module API were audited, and the behavior of a cast inside an optional enclosed access was settled.
- No breaking redesign is planned. The [deferred work](#deferred) documents the remaining limitations, and [no decision is open](#open-decisions).

<a id="what-1-0-requires"></a>

## What 1.0 requires

1.0 promises no break until 2.0, and its first release candidate is where that promise begins, as [D75](decisions.md#d75) records. Nexo reaches it once each requirement holds:

| Requirement | Why | State |
| --- | --- | --- |
| **Contracts settled.** No decision is open, no gap stands between the specification and the code, and each [deferred](#deferred) item is shown to land without a break. | What may still change after 1.0 must be able to change compatibly. | Holds: no decision is open, no gap stands, and each [deferred](#deferred) item lands as an addition, rounding to digits as an optional argument of `round()` and wrapping canonical text as an option. |
| **Robust against any text.** A fuzzing test in the gate reads, resolves and evaluates generated scripts, and meets no failure but a `NexoError`: no hang, no stack overflow, no escaped `TypeError`. | The maintenance sweep, `1.0.0-beta.21` to `1.0.0-beta.40`, found such faults by reading the code. | Not started. |
| **Published.** A release is on npm and NuGet, tested as consumers install it. | A host pins a release it can install. | `1.0.0-beta.2` is released; publishing it remains. |
| **Used for real.** DOMQL runs on a published release, and Forma's own scripts run as DOMQL queries on it. | A contract is settled by the hosts that rely on it. | DOMQL builds against the release `1.0.0-beta.2`, from its tag, and replacing Forma's scripts is planned. |
| **A release candidate that breaks nothing.** `1.0.0-rc.1` is released once the rest hold, and DOMQL and Forma take it with no change but its version. `1.0.0` is its contract, unchanged. | It is the last check that nothing still needs to break. | Waits for the rest. |

**Until 1.0, Nexo takes no new feature:** no new syntax, member, declaration key, API or behaviour a script or a host can use. A change before 1.0 does one of these:

- fixes a fault, or a contract that contradicts itself;
- makes a diagnostic say more;
- makes Nexo faster or leaner, measured as [contributing](../CONTRIBUTING.md#measure-performance) sets out;
- documents what is there;
- meets a requirement above.

A feature a host's real use needs, as a [deferred](#deferred) item's trigger names, one a contract relies on its hosts having, as [D72](decisions.md#d72)'s limits are, or one the owner adds to the language, as [D81](decisions.md#d81)'s numbers are, is the exception, and a decision records each. Until the first release candidate, a decision may be replaced where a host's experience, correctness or a measured cost justifies it, and DOMQL and Forma move with it.

<a id="open-decisions"></a>

## Open decisions

None, and no gap between the specification and the code. The [decisions](decisions.md) record each one taken without stopping to ask, for review: the implementation decisions [reviewed together](decisions.md#implementation-decisions-reviewed), who may change shared data ([D26](decisions.md#d26)), Nexo's own types named qualified ([D36](decisions.md#d36)), a type parameter's default ([D37](decisions.md#d37)), a parameter's defaults ([D38](decisions.md#d38)), what the declaration helpers write ([D39](decisions.md#d39)), what key equality compares ([D40](decisions.md#d40)), a dictionary's record ([D41](decisions.md#d41)), a code for each condition ([D42](decisions.md#d42)), the error class's factories ([D43](decisions.md#d43)) and where a result path is checked ([D44](decisions.md#d44)).

Deferred items below require their stated trigger before design or implementation resumes.

<a id="deferred"></a>

## Deferred

| Work | Why it waits | Reopened by |
| --- | --- | --- |
| Collection conversions, `values to List` and `entries to Dictionary` | Collections are constructed by members; conversions to or from a collection would extend conversion targets and contracts. | A use members do not serve |
| Unions of structured types | One shape of nullable fields, and a field telling which of them a value fills, holds data of several families, its consumer validating each family; a union would need a notation, narrowing and a projection rule of its own. | A host whose data no one shape holds |
| Rounding a number to decimal digits | Rounding a binary value's decimal expansion is a contract of its own; a step is written by arithmetic around `round()`. | A host that needs digits a step can't give |
| Explicit application identity, `identifyBy` | Sources and lineage serve the collection foundation; identities apart from keys and sources need scoping rules of their own. | A host that matches by identities its sources cannot give |
| Incremental reparsing, specialized tree machinery, and a public tree schema shared by C# and JavaScript | No tool needs them yet. | A concrete tooling need |
| Expression and predicate arguments to host calls | Each is a body of each item of a list its member follows, which a host call reads none of; a function argument, kept by its host, serves a host call that calls back into its script. | A host call that follows a list and needs a body of each of its items |
| An extension targeting several types | Each extension has one target, and reusing a declaration in an extension for each target serves current cases. | Many repeated members across unrelated types |
| Selecting a module's operator when several compete | No syntax selects an operator by module; qualified calls cannot reach operators. | Competing operators in real use |
| Structured-data casts, reference/data conversions, and operators beyond `cast` and `convert` | Each needs rules for checking and copying. | A use the two operators do not serve |
| Object-typed parameter defaults, under the ordinary compatibility rules | No parameter can be object-typed while an object type has no notation a declaration writes. | An object type's notation in declarations |
| A value of `Any` a callback contract passes to a function reference whose parameter declares a concrete type, which [assignability](../spec/language/types.md#types-assignability) accepts and checks | Nothing stands between a callback and the reference's implementation to check what it is called with, so such a reference is refused with NEXO3036. | A host whose callback contract passes `Any` to a typed reference |
| A function given to a deferred call, as [deferred member selection](../spec/language/types.md#types-any-deferred-selection) accepts one | A function's reading is the declaration's, chosen only as the call is evaluated, so a deferred call takes values alone. | A host whose deferred call needs one |
| Calling a module's internal declarations through Nexo | JavaScript implementations can reach their own values directly. | An internal-call API with a defined module context |
| Wrapping canonical text by width | `format` follows the structural layout alone and never wraps; a width needs a layout policy of its own that keeps canonical text deterministic and every one-line construct whole past it | A host or a tool that needs text kept within a width |
| Equality of structured values, objects and lists, as keys, members and distinct items | Key equality covers numbers, strings, Booleans, references and null; the equality of the rest needs its hashing, type identity and capture designed together | A host whose keys or distinct items are data of those kinds |

Each lands after 1.0 without a break, which [1.0 requires](#what-1-0-requires):

- **As an addition,** what is refused or absent today becoming valid: collection conversions, unions of structured types, `identifyBy`, the tree and its schema, expression and predicate arguments to host calls, an extension of several targets, selecting a module's operator, structured-data casts and the operators beyond `cast` and `convert`, object-typed defaults, a value of `Any` passed to a typed reference (refused with NEXO3036 today), a function given to a deferred call, calling a module's internal declarations, and the equality of structured values, objects and lists.
- **As an optional argument,** rounding to decimal digits, `round(digits)`, since `round()` is a function.
- **As an option `format` takes,** wrapping canonical text by width, its default the layout [canonical text](../spec/runtime/definition.md) lays out now, which a host comparing it relies on.

<a id="temporary-implementation-coverage"></a>

## Temporary implementation coverage

Conditions the implementation reports that no catalog holds, each coded so every diagnostic it throws carries a code until the work that removes the condition lands. None remains: the last, conditions of language `1.0.0-alpha.33` alone, retired as their replacements landed. Such a code stays out of the specification's catalogs, retires to the retired codes of its catalog, [the language's](../spec/language/errors.md#diagnostics-retired-codes) or [the runtime's](../spec/runtime/errors.md#runtime-retired-codes), when the work that removes its condition lands, and is never reused.
