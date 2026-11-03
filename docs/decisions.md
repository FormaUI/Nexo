# Decisions

Decisions taken without stopping to ask, kept here so they can be reviewed and reversed.

- Each entry says what was decided, why, and what was declined.
- A rule a decision settles is stated in the [specification](../spec/README.md) too.
- Questions not yet decided are in the status overview's [open decisions](features-status.md#open-decisions).

Each entry is one of four kinds:

| Kind | Meaning |
| --- | --- |
| Approved rule | A rule of the language or the runtime the owner approved, which the specification states |
| Current restriction | Something the contract deliberately leaves unsupported for now, refused explicitly, which a later design may lift |
| Implementation limitation | Where the implementation falls short of the contract, recorded in the status overview until it closes |
| Process | How versions, records and releases are kept |

<a id="d1"></a>

## D1 — The language advances to `1.0.0-alpha.39`

*October 30, 2026*

- **Kind:** Process.
- **Decision:** the language version is `1.0.0-alpha.39`. The definition format stays at 36.
- **Why:** after the implementation followed `1.0.0-alpha.38`, the host API was renamed and more of the contract was specified, with no version change. Two builds both reporting `1.0.0-alpha.38` had different APIs. A version must name one contract.
- **Declined:** counting the rename as part of `1.0.0-alpha.38`.

<a id="d2"></a>

## D2 — The history's earliest entry covers everything before `1.0.0-alpha.33`

*October 30, 2026*

- **Kind:** Process.
- **Decision:** one entry, *Before `1.0.0-alpha.33`*, tells the language's origin: DOMQL's query language, its port as Lexica, and the numbering of its versions. Every version from `1.0.0-alpha.33` on has its own entry.
- **Why:** versions were first numbered on October 21, 2026, to match the definition format. No version was ever called `1.0.0-alpha.1` to `.30`. From `.33` on, the record shows each version's boundaries exactly.
- **Declined:** a heading of `1.0.0-alpha.1` to `.32`, which names versions that never existed.

<a id="d3"></a>

## D3 — A change belongs to the first version whose implementation has it

*October 30, 2026*

- **Kind:** Process.
- **Decision:** a change is listed under the first version whose implementation follows it. So lineage is in `.35`, the verbs' removal in `.37`, and the briefly enforced capital letter in no version.
- **Why:** a host reads the history to learn what an implementation reporting a version does. Some specification changes landed after the implementation had followed a version, without a version change.
- **Declined:** placing a change by the version the specification carried when it was written. That would put the verbs' removal in a version whose implementation still has them.

<a id="d4"></a>

## D4 — A history entry covers both contracts, and what breaks

*October 30, 2026*

- **Kind:** Process.
- **Decision:** each entry lists the language's changes and the runtime's separately, then what the version breaks.
- **Why:** a language version names the whole specification, so a host needs the runtime's changes too. Until the beta any version may break the one before.
- **Declined:** a language-only history, which would record the renamed API nowhere.

<a id="d5"></a>

## D5 — A test and a rule keep the history current

*October 30, 2026*

- **Kind:** Process.
- **Decision:** the alignment test requires the history's newest entry to match the specification's version. The working instructions require a version advance to add its entry.
- **Why:** a history kept by hand falls behind. The gate already holds the README, the design and the status overview to the version.

<a id="d6"></a>

## D6 — Feature status lives in the status overview

*October 30, 2026*

- **Kind:** Process.
- **Decision:** the status overview takes Roslyn's feature-table shape. No separate runtime status document is added. Roslyn's people columns are left out.
- **Why:** Nexo has one implementation, so its runtime status and its implementation status are one subject, and each subject has one home.
- **Declined:** a second document under `docs/`.

<a id="d7"></a>

## D7 — A feature is dated by language version

*October 30, 2026*

- **Kind:** Process.
- **Decision:** each feature names the language version the implementation has followed it since.
- **Why:** the implementation's own version is a package version. It has stayed at `1.0.0-alpha.37` because nothing is published, so it would date every feature alike.

<a id="d8"></a>

## D8 — A feature's state names its gaps

*October 30, 2026*

- **Kind:** Process.
- **Decision:** a feature's state is *Implemented*, *Implemented, with a gap*, *Implemented in part* or *Planned*, and names the gap or deferral it links to.
- **Why:** a host deciding whether to rely on a feature needs its gaps beside it.

<a id="d9"></a>

## D9 — A clarification keeps the version

*October 30, 2026, narrowed the same day*

- **Kind:** Process, approved.
- **Decision:** a clarification of the agreed contract keeps the version. A change to the contract, new syntax or new semantics, advances it. Making the implementation follow a rule the specification already states is a fix, which keeps it too.
- **Why:** a version names a contract, not an implementation. What an implementation happens to do establishes no contract by itself.
- **Declined:** a new version for each rule written down, which would date the specification's text rather than the language; and treating the implementation's behaviour as the contract wherever the specification was silent.

<a id="d10"></a>

## D10 — Extension members are read with `:` alone

*October 30, 2026*

- **Kind:** Approved rule.
- **Decision:** `.` reads a type's own members and `:` reads extension members. `device.usage` is refused, giving `device:usage` (NEXO3090). The language advances to `1.0.0-alpha.40`.
- **The definition format, 37:** its serialized form changed. A `memberAccess`'s `extension` became `{}` for an access naming no extension, where it had always held a `name`, and an `indexerAccess` no longer held one, since an extension's unnamed indexer has no form. A behaviour change alone would have kept the format.
- **Why:** the owner agreed that extension members are reached through `:` exclusively, so where a member comes from is always visible, and an owner and an extension never compete.
- **Declined:** keeping `.` for extension members beside `:`, which keeps the competition the owner rule had to settle.

<a id="d11"></a>

## D11 — The last name of the extension reference is the member

*October 30, 2026, revised the same day*

- **Kind:** Approved rule.
- **Decision:** an extension reference writes one to three names: the member, its extension's name before it, and that extension's module's before that. Each name fills its role, whatever the spacing. The rule applies to the reference, not to every name that follows it.
- **Revised:** the first version read every dotted name after the colon as part of the reference, refusing more than three (NEXO1071). The owner sent it back: that was a decision of its own, not a consequence of the three forms.
- **Declined:** reading `count: it.devices.count` as a named argument.

<a id="d12"></a>

## D12 — An access's names are read by the declarations they name

*October 30, 2026, revised the same day*

- **Kind:** Approved rule.
- **Decision:** resolution reads the names after the colon the ways their declarations allow: the first an extension member; the first an extension declaring the second; or the first a module whose extension the second is, declaring the third. Names after the member are ordinary access of its answer. One way that fits is taken, several are refused as ambiguous (NEXO3091), and a group or a named extension writes one.
- **Why:** the owner's review. `name:size.width` should read as the extension member `size` and its answer's `width`, and a group is useful only where the names really read two ways. A name still fills a role only where it names what the role needs, never a local or a parameter.
- **Revised:** the first version required a group after every bare member, `(device:readings).first`, because it read the dotted names greedily.
- **Declined:** resolving the rest of the chain to choose among ways, which would make a typo in a later name change how the first ones read; the roles of the names decide alone.

<a id="d13"></a>

## D13 — A member's declaration decides how it is read

*October 30, 2026, revised the same day*

- **Kind:** Approved rule.
- **Decision:** a member declared within a type is read with `.`, and one declared within an extension with `:`, whichever module declares it and whichever type it extends. `flatten` is declared among `List<T>`'s own members, for a list of lists, a receiver narrower than `List`'s, so `lists.flatten` reads it. Nexo's module declares no extension.
- **Why:** the owner's review. Access syntax should follow the declaration, not how the declaring module relates to the receiver's type. `flatten` is a list operation like every other list member, so it is declared as one.
- **Revised:** the first version read with `.` the members a module declared in an extension of its own type, which `flatten`, then declared through an extension, relied on.
- **Declined:** reading `flatten` with `:`, which would make one list member unlike the others.

<a id="d14"></a>

## D14 — An extension's indexers are named

*October 30, 2026, revised the same day*

- **Kind:** Approved rule.
- **Decision:** an extension declares indexers, each named, read `device:setting["mode"]`, through its extension and its module as any extension member is, with its signatures. Brackets after the member are its key where the member the access selects for the receiver is a named indexer, and otherwise index the member's answer. An extension declaring an indexer without a name is refused (NEXO4564), giving the named form.
- **Why:** the owner's decision. Brackets after a value alone write no name, so they can't show where the indexer comes from, which reading extension members with `:` exists to show; they read the receiver's owner's unnamed indexer.
- **Revised:** the first version recorded an unnamed extension indexer as a current restriction, which a later design might lift. It is a rule: an extension indexes by name.
- **Declined:** a colon indexer form, `x:[key]`, which the owner ruled out.

<a id="d15"></a>

## D15 — The codes of the new access

*October 30, 2026*

- **Kind:** Approved rule.
- **Decision:** NEXO3090 refuses an extension member read with `.`. NEXO3091 refuses names that read more than one way, and NEXO3026 a first name that names neither an extension nor an extension member. NEXO1014 keeps a colon no name follows, now `f(a: 5)` and `a ?: 0` among it. NEXO3062 covers a member no applicable extension declares as well as one a named extension does not. NEXO4564 refuses an extension's unnamed indexer. NEXO1071, which the first reading of the names used, is retired.
- **Why:** each condition has one code. A colon no name follows is one condition however it is spaced or followed, so NEXO1014 stays rather than being retired.
- **Declined:** retiring NEXO1014 for a new code, which would split one condition.

<a id="d16"></a>

## D16 — A bound extension reference keeps its argument kinds

*October 30, 2026*

- **Kind:** Approved rule.
- **Decision:** `let keep = words:keep` then `keep(it.length > 1)` reads its argument as `words:keep(it.length > 1)` does. The receiver is still captured once, as the reference is created.
- **Why:** the owner decided it, as a held reference to a module's function already does. It clarifies the agreed contract, so it keeps `1.0.0-alpha.40`, by [D9](#d9).
- **Revised:** a local that may hold one of several functions first gave each of them values alone. That was this implementation's limitation, not a rule: the specification already made a held reference's call its qualified form's, wherever it was chosen. [D22](#d22) settles it.

<a id="d17"></a>

## D17 — A set is captured wherever a list is declared

*October 30, 2026*

- **Kind:** Approved rule.
- **Decision:** a host's set is accepted wherever a value is declared `List<T>`: a declared binding, a member's answer and a host call's supplied value. Its items are captured in traversal order and checked against `T`, at every depth. The list keeps no uniqueness.
- **Why:** the owner decided it. A member's answer and an undeclared binding already took a set, so capture now treats a host's collections one way wherever a type is declared. It clarifies the contract, so it keeps `1.0.0-alpha.40`, by [D9](#d9).
- **Declined:** a set type in the language, which no script needs to tell from a list.

<a id="d18"></a>

## D18 — A function is never a collection's item, value or key

*October 30, 2026*

- **Kind:** Approved rule.
- **Decision:** a function, an arrow function, a script's function or a reference, is never a list's item, a dictionary's value or an indexer's key. Each is reported where it is found: an arrow function in text as a syntax error (NEXO1057), one in a definition as a structure error (NEXO2027), and one resolution finds as a validation error (NEXO3082). A call answering a valid item stays allowed.
- **Why:** the owner decided it. The catalog already gave text NEXO1057 for an arrow function outside a local or an argument, so `[x => 1]` follows it; an indexer's key is data as an item is, so it shares NEXO3082 rather than taking a code of its own.
- **Declined:** a new code for a function as a key, which would split one condition.

<a id="d19"></a>

## D19 — The revised reading is `1.0.0-alpha.41`, definition format 38

*October 30, 2026*

- **Kind:** Process.
- **Decision:** reading an access's names by their declarations advances the language to `1.0.0-alpha.41` and the definition format to 38. A definition records each name as written, its first holding `extension: true` and each later one `continues: true`, and resolution assigns their roles.
- **The definition format, 38:** its serialized form changed again. A definition can no longer hold an access's extension and module as an object, since the text alone can't say which names they are, so each name is a node of its own, marked.
- **Why:** a build already reports `1.0.0-alpha.40` with the greedy reading, and a version names one contract, as [D1](#d1) decided. The text alone can't say which names are the reference's, so the definition keeps every name, and a group, which ends the names, stays distinct from a dot that continues them.
- **Declined:** revising `1.0.0-alpha.40` in place; and a definition holding the names as one list, which would leave the ordinary accesses after the member without a place of their own for their resolutions and their errors.

<a id="implementation-decisions-reviewed"></a>

## The implementation decisions, reviewed

Forty decisions were taken while implementing the declarations, member selection, script text and collections, and reviewed together on October 30, 2026. Each went one of four ways:

- **Specified:** the specification already states it.
- **Now specified:** behaviour the implementation had, stated in the specification by the review.
- **Internal:** how the work landed, private code or test fixtures, with nothing a script or a host sees.
- **Open:** a question no one has decided, moved to the status overview's [open decisions](features-status.md#open-decisions).

| ID | What it settled | Outcome |
| --- | --- | --- |
| I1 | Where a module error stands | Specified: [locations](../spec/runtime/errors.md#validation-diagnostics) |
| I2 | How nested declarations landed | Internal |
| I3 | Where a nested member's collision stands | Specified: [locations](../spec/runtime/errors.md#validation-diagnostics) |
| I4 | A type's `members` that are not a list | Now specified: [NEXO4503](../spec/runtime/errors.md#module-errors) |
| I5 | A data property, read and never invoked | Specified: [what an implementation receives](../spec/runtime/members.md#members-what-an-implementation-receives) |
| I6 | A structured type with no data property | Specified: [retired codes](../spec/runtime/errors.md#runtime-retired-codes) |
| I7 | An unnamed indexer's use, `List[]` | Specified: [resolution](../spec/runtime/resolution.md#runtime-bindings-and-resolution) |
| I8 | The indexer helper | Specified: [declaration helpers](../spec/runtime/members.md#members-declaration-helpers) |
| I9 | Where an unnamed indexer stands | Now specified: [locations](../spec/runtime/errors.md#validation-diagnostics) |
| I10 | A mapping's key | Now specified: [NEXO4008 and locations](../spec/runtime/errors.md#validation-diagnostics) |
| I11 | An internal type as an extension's target | Specified: [internal declarations](../spec/runtime/modules.md#modules-internal-declarations) |
| I12 | Where the scalar type names live | Internal |
| I13 | How named extension types landed | Internal |
| I14 | Implicit type parameters of the flat form | Internal: the flat form is gone |
| I15 | How Nexo declares its own value types | Internal |
| I16 | When a tolerance is checked | Now specified: [numeric tolerance](../spec/runtime/members.md#what-a-member-declares-numeric-tolerance) |
| I17 | How the tests moved | Internal |
| I18 | `target` refused, and a parameter as receiver | Specified: [collisions](../spec/language/modules.md#namespaces-a-modules-own-collisions) |
| I19 | The order of inference | Specified: [binding a call's parameters](../spec/language/types.md#types-type-parameters-binding) |
| I20 | Owner first, then specificity | Specified: [owners and extensions](../spec/language/extensions.md#extensions-owners) |
| I21 | A cast operator's rejection | Now specified: [NEXO5004](../spec/runtime/errors.md#runtime-evaluation-errors) |
| I22 | Deferred calls, and a value's actual type | Specified: [deferred member selection](../spec/language/types.md#types-any-deferred-selection) |
| I23 | The shapes of a resolution's reports | Specified: [resolution](../spec/runtime/resolution.md#runtime-bindings-and-resolution) |
| I24 | A receiver of unknown type, evaluated | Specified: [what it answers](../spec/language/types.md#receivers-of-unknown-type-what-it-answers) |
| I25 | A callback answering `Any` | Specified: [functions passed to members](../spec/language/functions.md#functions-passed-to-members) |
| I26 | Line endings | Specified: [line breaks](../spec/language/lexical-structure.md#line-structure-line-breaks) |
| I27 | `import` as a keyword | Specified: [names and reserved words](../spec/language/lexical-structure.md#names-and-reserved-words) |
| I28 | The order and conflicts of imports | Specified: [the definition](../spec/runtime/definition.md#definition) |
| I29 | What an import makes available | Specified: [imports](../spec/language/modules.md#scripts-imports) |
| I30 | Extension access | Now specified: [NEXO3026 and used declarations](../spec/runtime/resolution.md#runtime-bindings-and-resolution); two questions [open](features-status.md#open-decisions) then, since settled |
| I31 | Line structure's refusals | Now specified: [where a line breaks](../spec/language/lexical-structure.md#line-structure-where-a-line-breaks) |
| I32 | Compact text's layout | Now specified: [canonical text](../spec/runtime/definition.md#definition-canonical-text) |
| I33 | The order a message lists types in | Now specified: [type name lookup](../spec/language/types.md#types-type-name-lookup) |
| I34 | Lineage | Specified: [provenance](../spec/runtime/evaluation.md#runtime-results-provenance) |
| I35 | The collection foundation | Now specified: [parameter defaults](../spec/runtime/members.md#members-parameter-declaration-keys); one question [open](features-status.md#open-decisions) then, settled by [D38](#d38) |
| I36 | Collection expressions | Now specified: [one-line constructs](../spec/language/lexical-structure.md#line-structure-where-a-line-breaks); one question [open](features-status.md#open-decisions) then, since settled |
| I37 | The members of collections | Specified: [list members](../spec/language/collections.md#collections-list-members) |
| I38 | Indexer signatures | Now specified: [unnamed indexers](../spec/language/members.md#property-access-calls-and-indexers-unnamed-indexers) |
| I39 | Ordering | Specified: [ordering](../spec/language/collections.md#collections-list-ordering) |
| I40 | The examples' fixtures | Internal |

<a id="d20"></a>

## D20 — Whitespace never changes an access

*October 30, 2026*

- **Kind:** Approved rule.
- **Decision:** spaces and tabs between an access expression's tokens change nothing, in a property access, a computed one and an extension access, qualified or not, and decide no name's role. Whitespace never splits a token, so `? .` is no `?.`. Line breaks follow the line structure: an extension access's colon and dots are member steps, with no continuation rule of their own.
- **Consequences:** `f(a:b)`, `f(a: b)` and `f(a : b)` each pass what `a:b` answers, never a named argument. An object field's `count: 1` stays NEXO1003, since the parser knows it reads a field's name there.
- **Why:** the owner's rule. The parser already read whitespace so; the specification now says it.

<a id="d21"></a>

## D21 — A computed name reads a type's own members

*October 30, 2026*

- **Kind:** Approved rule.
- **Decision:** `x.[name]` reads the members `.` reads, never an extension member. A computed extension access, if one is introduced, needs a design of its own.
- **Why:** otherwise a computed name would be a second route to extension members, undoing their separation.

<a id="d22"></a>

## D22 — A chosen function's call reads the contract the functions share

*October 30, 2026*

- **Kind:** Approved rule, closing an implementation limitation.
- **Decision:** a call of a local that may hold several functions reads its arguments by the contract they share, and invokes the one the local holds. They share one where every one is a reference to a module's function, bound alike, agreeing on the argument form and each parameter's kind, type, requirement, null policy and default once their receivers bind what their types write. Where they read the arguments differently, the call is refused naming where they part (NEXO3079).
- **Why:** the owner's review: a restriction should follow from the callables' contracts, not from there being several. The specification already made a held reference's call its qualified form's, wherever it was chosen; giving each function values alone was this implementation's limitation.
- **What still can't share one:** a script's function beside one taking a callback, since a script's function takes values alone; references bound and unbound, which place the receiver differently; and declarations with type parameters of their own, which their own arguments bind, unless they are one declaration.

<a id="d23"></a>

## D23 — The package version waits for publication

*October 30, 2026, superseded by [D27](#d27) on October 31*

- **Kind:** Process.
- **Decision:** the package keeps `1.0.0-alpha.37` while nothing is published. The next published package takes the version due then. Its README names it and the language version it implements, and `nexo.info.versions` names the language and definition versions.
- **Why:** a package version names what was published, and an unpublished working tree need not track every language revision.

<a id="d24"></a>

## D24 — The README's example runs as it is written

*October 30, 2026*

- **Kind:** Process, approved.
- **Decision:** the README's example declares a vocabulary of its own, a billing module, rather than the examples' vocabulary the specification shares. A test runs the README's JavaScript against its script, and checks the result, the type and the refusals the README states.
- **Reference date:** the example's date is one the application gives the evaluation, which the README's text names, never the clock. The test runs under a clock set years later, so the result it shows stays right.
- **Why:** a reader meets a use case they recognize, and the integration they would write. Running the README's own code keeps all of it true.
- **Declined:** adding billing types to the examples' vocabulary, which would grow a domain the specification's examples do not use; and checking the script alone, which would leave the JavaScript untested.

<a id="d25"></a>

## D25 — A performance change keeps every behaviour

*October 30, 2026, narrowed October 31 after its review*

- **Kind:** Process.
- **Decision:** a change made for speed or memory keeps every behaviour the contract states, errors and their paths, hook requests, metadata and the checks among them. Each change is measured alone against the commit before it, and kept only where the benchmark shows it helps. A test pins any behaviour a change reimplements, run against the code before and after it.
- **Measured in pairs:** a gain is established by paired runs against the commit before it, every round agreeing and the median beyond what a run against an unchanged copy shows. A single run's change can't be told from noise of the same size. Paired runs confirmed the pass, and showed the account summary's evaluation 16% faster, which single runs had put within noise.
- **Why:** the user asked for safe improvements. A faster Nexo that answers differently is a different Nexo.
- **Declined:**
  - Skipping the checks of Nexo's own members' answers. One run measured it at about a tenth of an evaluation, no more than runs vary, so the gain is not established. It relied on no implementation changing a value it is given, which the contract didn't state. It was adopted after D26, below.
  - Collecting a text's locations at its first error, about a tenth of a parse. A kept script would hold its lowered definition beside its validated one. The third pass collects them from the text read again, which holds nothing more.
  - A structure-type table for each registry, and one empty list shared by every type without type arguments. Neither measured beyond noise.
  - Freezing a filter's positions in place. `pick` gives the script's own list as its positions.
  - Keeping an answer's list as its own copy where its structures each stand as they are and it carries no lineage, and a flat structure already recorded as its type standing without its keys checked again. A profile put copying at about a sixth of the portfolio report. Paired runs measured no gain in time, −0.3% with rounds from −10% to +10%, and 9% more allocation.
  - Calling a function of one argument without collecting its arguments in a list. Paired runs measured the portfolio report from 5% faster to 18% slower.
  - Comparing a structure's record by type equality, so a copy never records an equal type again. Paired runs measured no change in time or allocation.
  - Holding an object's field selections in a private field of the object, as a structure's type is held. Paired runs measured every case 5% slower, the field changing each object's shape after it is built.
  - Indexing a resolved definition by the pointer strings resolution stored its resolutions by, rather than strings built again, which a profile put at a sixth of resolving. Paired runs measured resolving 4% faster, one round of nine disagreeing, so the gain is not established. The walk itself was the cost: the third pass drops the index, resolution recording each node's pointer as it reaches the node, and resolving measured 17% faster.
  - Copying a result's list at its length, and listing its items' identities only once an item has some, rather than for every list. Allocation measured 1% less, within what a run against an unchanged copy shows, and time could not be measured while other builds loaded the machine.
  - Fusing a chain of Nexo's own list members into one loop. It interleaves what the members evaluate, which changes the order of host calls, the first failure and what hooks hear.
- **Adopted after [D26](#d26):**
  - A list member of Nexo's own that answers its receiver's items relies on the check those items had, where resolution selected it, the answer keeps the receiver's item type, and that type may hold no reference, as the [design](nexo-design.md#relying-on-a-check-of-data) sets out. Paired runs measured the account summary's evaluation 6% faster in every round. The portfolio report measured between 2% and 7% faster across four runs, with slower rounds in three, so that gain is not established. These paired runs replace the single run's tenth.
  - Every answer of Nexo's own whose type may hold neither a reference nor a value of `Any` is neither captured nor checked, where resolution selected the member, rather than the answers of its receiver's items alone. Paired runs measured the portfolio report's evaluation 15% faster, every round agreeing, and the account summary's unchanged.
  - A function given to one of Nexo's own members relies on the check its argument had, an item of the member's receiver, under the same conditions. Paired runs measured the portfolio report's evaluation 17% faster and the account summary's 8%, every round agreeing.
- **The second pass:** the changes kept after these, each measured alone, are listed in the [design](nexo-design.md#the-second-performance-pass). Together they made the portfolio report's evaluation 57% faster, binding its customers 59%, and the account summary's evaluation 47%.
- **The third pass:** it prepares a script faster, as the [design](nexo-design.md#the-third-performance-pass) lists. Together its changes made resolving the account summary 32.5% faster, resolving and evaluating it once 25%, and resolving and evaluating once a script of 150 fields 67%, allocating 81% less.
- **Declined in the third pass:** relying on the shape of the structures Nexo's own members answer, so their answers are not copied to their declared shape again. A cast from `Any` keeps a value as it is once it belongs to the type, extra fields among them, which a later member's copy strips today; without that copy, a result would hold them.
- **Correction:** the commit that keeps a structure's unchanged record says it saves a quarter of the portfolio report's allocation. Measured alone, it saves 9%.

<a id="d26"></a>

## D26 — Data is read-only once it passes between Nexo and its host

*October 31, 2026*

- **Kind:** Approved rule, as the review of the first performance pass proposed it.
- **Decision:** data that passes between Nexo and its host, in either direction, is read-only from then on, nested data included. A host changes neither the data it is given nor the data it gave, through any alias it keeps. The rule is stated in [data shared with a host](../spec/runtime/evaluation.md#runtime-shared-data). The language advances to `1.0.0-alpha.42`, and the definition format stays 38.
- **References:** a reference is no data. The host object it identifies changes as its type's contract allows, and the rule lets Nexo rely on an earlier check of data alone, never on one of a reference's membership.
- **The boundary:** Nexo copies a binding and a value a host call projects, so the host's own data stays its own. It doesn't copy an answer, so the rule covers what a host gave as well as what it was given.
- **Why:** the language holds every value immutable, while the runtime left a host free to change data it shares. The rule closes that gap, whatever it saves. A check of data then holds for as long as the data does.
- **Declined:**
  - "An implementation may never change a value Nexo gives it", the first wording. It forbids changing the host object a reference identifies too.
  - Forbidding changes to what an implementation is given alone. An answer the host keeps would stay open to change.
  - Copying or freezing each answer. It costs what the checks cost, and freezing changes objects the host keeps.
  - Detecting a change made against the rule. It needs the work the rule saves.

<a id="d27"></a>

## D27 — Nexo enters the beta at `1.0.0-beta.1`

*October 31, 2026*

- **Kind:** Process, approved.
- **Decision:** the owner moved Nexo to the beta. The language and the packages both take `1.0.0-beta.1`. Later betas number on from it, `1.0.0-beta.N`, each version advancing for its own reason as before. The definition format stays 38.
- **The contract:** both contracts are those of `1.0.0-alpha.42`, unchanged. The version advances because its promise does: no breaking redesign is planned, and a later version that breaks this one says how to migrate.
- **The packages:** the sources declare `1.0.0-beta.1` before it is published, since it is the version due at publication. This supersedes [D23](#d23), which kept `1.0.0-alpha.37` until then. The [changelog](../CHANGELOG.md) records each release, and the gate holds its newest entry to the versions the sources declare.
- **Why:** a host reads `nexo.info.versions.language` to learn what it can rely on. A beta package implementing an alpha language would promise a stability that its contract's version denies.
- **Declined:**
  - A bare `1.0.0-beta` for the language, as the release plan named it. The language's second beta would then be `1.0.0-beta.1`, the name the first package already carries, for another contract.
  - Moving the packages to the beta and keeping the language at `1.0.0-alpha.42`. The promise is the contract's, and the language version names the contract.
  - An empty changelog until the first change after the beta, as the plan named it. The first release is itself an entry, and the gate can check only an entry that exists.

<a id="d28"></a>

## D28 — The npm package is `@formaui-net/nexo`

*October 31, 2026*

- **Kind:** Process, approved.
- **Decision:** the npm package is `@formaui-net/nexo`, under the npm organization `formaui-net`, and publishes as public.
- **Why:** an npm organization named `formaui` already exists, so the scope `@formaui` isn't available. On NuGet, the prefix reserved for the packages is `formaui-net`, as `formaui-net.Nexo` shows, so both registries now name the packages alike. A scoped package publishes as private unless it says otherwise, which a free organization refuses.
- **Declined:** asking npm to transfer the unused `formaui` organization, whose outcome and timing aren't ours to decide.

<a id="d29"></a>

## D29 — A host builds module errors, and an operator has a declaration type of its own

*November 1, 2026*

- **Kind:** Runtime contract, decided while migrating DOMQL.
- **Decision:** `NexoError.module(code, message, location)` is one of the factories a host builds its errors with, beside `structure`, `validation` and `evaluation`, and the language advances to `1.0.0-beta.2` for it. In `nexo.d.ts`, an operator is a `NexoOperatorDeclaration`, its `impl` taking `{ value, reject }`, apart from a `NexoMemberDeclaration`, whose kind is `property`, `function` or `indexer` and whose `impl` takes the member's input.
- **Why:**
  - A host that reads keys of its own on a declaration refuses a declaration that breaks its rules, as DOMQL's dispatch table refuses a host call without its request kind. That is a declaration breaking a contract, a module error; built as a structure error, one mistake in a module would fail as two kinds, by who checks it.
  - A union of two function types gives an `impl` written inline no parameter type, so a TypeScript host's `({ receiver }) => …` failed to compile under `strict`. A declaration type for each kind types each `impl` by the declaration it carries out.
- **Declined:**
  - Building DOMQL's refusals as structure errors, which keeps the contract and splits one kind of mistake in two.
  - Declaring `syntax` and `locate` for hosts as well: a host reads no text of its own, so they stay the gap the status records.

<a id="d30"></a>

## D30 — A host call answers its candidates

*November 1, 2026*

- **Kind:** Runtime contract, decided while reviewing DOMQL's migration.
- **Decision:** `resolution.hostCall` answers its `pointer` and its `candidates`: its declaration alone, or, while its receiver's type is unknown, every declaration that takes the call as it is written. The language advances to `1.0.0-beta.3` for it.
- **Why:**
  - DOMQL tells a subscription from an execution by keys of its own, so it must know what a call on a null receiver requests before a binding gives the receiver a type. Nexo already found the declarations that take the call, and checked that they agree on who invokes it, but answered the call's name alone.
  - A host that repeats the lookup misses what the language decides: an import of one type, an extension the call names, internal declarations and arguments a declaration does not take. DOMQL's copy counted host calls its queries could not reach, and refused requests Nexo resolved.
  - A host locates a refusal of the call where the call stands, as Nexo locates its own.
- **Declined:**
  - Adding them to `getCandidateDeclarations()`, whose declarations are those evaluation may select: a call on a null receiver is skipped, so evaluation selects none of them.
  - Leaving each host to filter the declarations by imports and access form, which repeats the language's rules and drifts from them.

<a id="d31"></a>

## D31 — A host call through a value of Any is refused as it resolves

*November 1, 2026*

- **Kind:** Language contract, decided after DOMQL's migration.
- **Decision:** An access on a value of `Any` whose every candidate is a host call is refused as it resolves (NEXO3092). One with other candidates still resolves, and is refused as it is evaluated where its selection is a host call (NEXO5013). The language advances to `1.0.0-beta.4`.
- **Why:**
  - Resolution alone selects a host call, so such an access can never select a member. It resolved as a value of `Any` and failed only when evaluated.
  - A host reads what a script requests from its resolution. DOMQL refused `panel:bag:later()` as a value to evaluate, and evaluating it then failed: both messages pointed away from the fix.
  - A failure known when resolving is reported then, as every other one is.
- **Declined:**
  - Resolving it as a host call with its candidates, as a call on a null receiver is: a value of `Any` holds a value, and a host could not prepare the call without the declaration evaluation alone would select.
  - Leaving host calls out of a deferred access's candidates: a receiver whose actual type declares one would then read as lacking the member (NEXO5012), hiding why.

<a id="d32"></a>

## D32 — A module's own types are named first, whatever their names

*November 1, 2026*

- **Kind:** Language contract, decided after DOMQL's migration.
- **Decision:** In a module's declarations, every unqualified type name follows the lookup's tiers, the module's own types first, the names of Nexo's generic types, `Any` and `Never` included. A generic type's name written alone that reaches Nexo's own is refused at registration (NEXO4070). NEXO4512 names the notation that does not parse. The language advances to `1.0.0-beta.5`.
- **Why:**
  - The specification lets a module declare a type spelled as one of Nexo's own, and names the module's first. The type reader refused `Pair` alone before the lookup ran, and read `Any` and `Never` as Nexo's whatever the module declared.
  - DOMQL met it naming a type `Pair`: "It declares the type of its result" said neither which notation failed nor why.
  - Registration resolves every type reference, so it is where a name is found to reach a generic type without its arguments.
- **Declined:**
  - Refusing a module's type spelled as one of Nexo's own: a name is not invalid because something elsewhere has the same name, and a qualified name reaches any module's type.
  - Reading a generic type's name alone as Nexo's type with no arguments: its members are declared over its type parameters, which nothing would bind.

<a id="d33"></a>

## D33 — A namespace standing alone gives the script parameter's form

*November 1, 2026*

- **Kind:** Runtime contract, decided after DOMQL's migration.
- **Decision:** NEXO2520, refusing a namespace that stands where a value does, names the module's namespace and gives `~Home` for the script parameter of its name, and a local of its name for `@Home` to read. The language advances to `1.0.0-beta.6`.
- **Why:** `@Home` reads the import binding where no local of its name is in scope, so a script reaching for a script parameter named `Domql` with `@Domql` got a rule about namespaces and no way out, where `Domql` alone gets both forms (NEXO1506).
- **Declined:** Reading `@Home` as the script parameter where no local is in scope: `@` reads locals and import bindings, and `~` script parameters, so each form keeps one meaning.

<a id="d34"></a>

## D34 — Origins outlive a resolution made again

*November 1, 2026*

- **Kind:** Runtime contract, decided after DOMQL's migration.
- **Decision:** An origin token is kept by the definition, the pointer of its expression, the declaration its resolution selects there and the candidate selected, so every resolution of one definition gives a value the same origin where it selects the same declaration. The language advances to `1.0.0-beta.7`.
- **Why:**
  - A registration that may change how values are recognized makes a resolution stale, and the host resolves the definition again. With origins of its own, the new resolution's first result compared exactly against the last one, so a watch reported a change within its tolerance once after every such registration.
  - The declaration and the expression decide what a value means, and both survive the new resolution; the resolution object was only where the token was kept.
- **Declined:**
  - Comparing within a tolerance whatever the origins: a value of another branch or operand would then hide a change, which origins exist to prevent.
  - Leaving each host to compare its first result after a renewal leniently, which repeats a rule the language owns.

<a id="d35"></a>

## D35 — A member selected as it is evaluated declares its value's tolerance

*November 1, 2026*

- **Kind:** Runtime contract, decided after DOMQL's migration.
- **Decision:** An evaluation records the declaration each deferred access selects, as it records a bracket's selected name, and the value's record takes that declaration's tolerance and an origin of its own for it. The language advances to `1.0.0-beta.8`.
- **Why:** A value's tolerance is the one its producing member declares. A deferred access knew its member only as it was evaluated, so its value's record had no tolerance, and DOMQL reported a change within it as a change.
- **Declined:** Taking a tolerance the candidates share: candidates may declare different ones, and the value is produced by one of them alone.

<a id="d36"></a>

## D36 — Nexo's own types are named `Nexo.Number` where a registry's names are read

*November 1, 2026*

- **Kind:** Language contract, closing an open decision.
- **Decision:** A module's declarations and a declared binding type name Nexo's own types qualified by Nexo's module, `Nexo.Number`, `Nexo.Any` and `Nexo.Never`, as they name any registered module's type. A qualified name takes no type arguments, so a generic type stays written unqualified with them. A script names Nexo's own types unqualified, and `Nexo` in a script is a local name an import gives, as before. The language advances to `1.0.0-beta.9`.
- **Why:**
  - Type name lookup puts a module's own types before Nexo's in its declarations, and a declared binding puts Nexo's and every module's in one tier. A module declaring `Number` could not name Nexo's in its own declarations, and a binding declared `Number` beside it was refused as ambiguous with no spelling that selected Nexo's.
  - Both read names against the registry, where a qualified name names a registered module by its own name. Nexo's own module is registered as `Nexo` in every registry, and no other module can take that name, so `Nexo.Number` adds no rule and no namespace: it is the qualified name every type already has.
  - A script needs none. Only the types it imports by name come before Nexo's own, under local names the script chooses, so it can always name Nexo's unqualified.
- **Declined:**
  - A permanent namespace for Nexo in scripts, which an alias may spell, `import Nexo = Home`, and which the language declined before.
  - Reading `Nexo.Number` in a script where no import gives `Nexo`: a script's qualifiers are the local names its imports give, and the name would mean two things by whether an import gives it.
  - `Nexo.List<T>`: a qualified name never takes type arguments, and a generic type written with them is always Nexo's.

<a id="d37"></a>

## D37 — A parameter of a type parameter takes a default every type admits

*November 1, 2026*

- **Kind:** Language contract, closing an open decision.
- **Decision:** A parameter whose type writes a type parameter takes a default every type it may bind to admits: null where its type is nullable, `T?`, and a list of none of its values, `[]` for `List<T>` or `[null]` for `List<T?>`. Any other default is refused when the module is registered (NEXO4548). The language advances to `1.0.0-beta.10`.
- **Why:**
  - A default is part of a member's contract, and every call reads it. A type parameter binds to any type at the call, so a default holds for every call only where every type admits it. `0` for a `T` reached an implementation whose `T` a call bound to `String`.
  - Registration checks every declaration, a default among them, before anything resolves against it, so a member is valid or not whatever calls it, as registration already decides that a type parameter has a source.
  - A dictionary's, a pair's and a position's parameter already take no default but null, for the same reason: no other default holds for every value of the type.
- **Declined:**
  - Refusing the call that leaves the argument out where the default doesn't fit its binding. A member would be valid for some calls and not for others, a deferred call would find out only as it is evaluated, and a default no call can take would still register.
  - A parameter of a type parameter taking no default at all. Null for `T?` and `[]` for `List<T>` fit every binding, and a module needs them.

<a id="d38"></a>

## D38 — A parameter is required and propagates null unless it says otherwise

*November 1, 2026*

- **Kind:** Runtime contract, closing a gap between the specification and the code.
- **Decision:** A parameter may leave out `required` and `nulls`. Left out, `required` is `true` unless the parameter declares a `default`, and `nulls` is `propagate`, but for a function parameter, which takes none. The module's copy writes both. The language advances to `1.0.0-beta.11`.
- **Why:**
  - The language said a parameter is required unless its declaration marks it optional, and propagates null by default, while `createModule` refused a parameter that left either out. The two contracts described one parameter differently.
  - A module's declarations already leave out what has a default, `internal`, `invokedBy`, `abstract` and `fixed` among them, and the copy writes what its contract leaves implicit. `required` and `nulls` were the exceptions.
  - The declaration helpers already gave these defaults, `required` false where a default is given. One rule now serves both, so a declaration written by hand reads as one the helpers wrote.
- **Declined:**
  - Changing the language's words to require both keys: the language describes what a parameter means, and its default is what most parameters are.
  - `required` always `true` where it is left out: a parameter declaring a default would then be refused as a required one with a default (NEXO4538), against the helpers' rule.

<a id="d39"></a>

## D39 — A declaration helper writes every option it is given

*November 1, 2026*

- **Kind:** Runtime contract, closing gaps between the specification and the code.
- **Decision:** Each declaration helper that takes options writes every key they give over the defaults it creates, and leaves none out, so `createModule` validates what a host wrote. `createPredicateParameterDeclaration` takes options, as `createExpressionParameterDeclaration` does. A value parameter declaring `context` is refused (NEXO4030), and a type's copy leaves out a key holding `undefined`, as every other declaration's does. The language advances to `1.0.0-beta.12`.
- **Why:**
  - A helper that drops an option hides a host's mistake: `internal` was dropped, so a member written internal was public, and `selects` without `fixed` was dropped, so a parameter meant to select a type silently selected none. Written, each is either kept, as `internal` now is, or refused where it is written, with a module error naming the key.
  - One rule now serves every helper. `createValueParameterDeclaration` already wrote its options over its defaults, while the member helpers read five keys and dropped the rest, and wrote `invokedBy` for a property, which `createModule` then refused.
  - `nexo.d.ts` declared options for `createPredicateParameterDeclaration`, which took none, and a predicate that accepts a null item, as `where(it == null)` would keep null items, is a parameter a module needs.
  - A value parameter is evaluated once, where the call is written, so it has no implicit parameter; a `context` on one meant nothing and was never read.
- **Declined:**
  - Dropping every option a declaration doesn't take, the rule the member helpers half followed: a mistake would still pass silently, and the helper would repeat what `createModule` already checks.
  - Refusing in the helper: `createModule` is where a declaration is validated, located at its module and its key, and a helper constructs a record and checks nothing.

<a id="d40"></a>

## D40 — Membership and distinctness compare values of a key type alone

*November 1, 2026*

- **Kind:** Language contract, closing gaps between the specification and the code.
- **Decision:** `contains`, `indexOf` and `distinct` compare the items of a list whose item type is a key type alone, and `distinctBy` keys of one; anything else is refused where it is resolved (NEXO3083), whose condition now covers every value key equality compares, and, for a call selected as it is evaluated, where its receiver's actual type is found (NEXO5042). The language advances to `1.0.0-beta.13`.
- **Why:**
  - The specification says these members compare by key equality, which defines no equality of an object, a list, a structured value or a value of `Any`. The evaluator compared them by identity instead, so two equal lists were distinct, an answer no rule of the language gives.
  - The equality of those values is [deferred](features-status.md#deferred): it needs its hashing, its type identity and its capture designed together. A current restriction is refused explicitly, never answered by an accident of the host language.
  - A dictionary's keys already followed the rule: `toDictionary` and `groupBy` refuse a key of another type. `distinctBy`, which keys its items the same way, was the exception.
- **Declined:**
  - Defining structural equality for these members now, which would decide alone what the deferred design decides for every key.
  - Checking values of `Any` as they are evaluated and taking scalars among them, as an equality does: a dictionary's key of `Any` is refused where it is resolved, and one rule serves every value key equality compares. An equality still compares them, `any(it == value)`.
  - A code of its own for `distinctBy`: a key of no key type is one condition, whichever member compares it.

<a id="d41"></a>

## D41 — A dictionary records no lineage of its entries

*November 1, 2026*

- **Kind:** Runtime contract, stated where the specification was silent, closing a gap between it and the collections proposal.
- **Decision:** A dictionary's record is its origin and its tolerance alone, whichever member answered it, its `where` and `select` among them. [Provenance](../spec/runtime/evaluation.md#runtime-results-provenance) now says so. The language version stays `1.0.0-beta.13`: every implementation of it already answers so, and no host can tell the statement from its absence.
- **Why:**
  - The collections proposal's decision 9 kept a retained item's metadata through filtering. The specification states that rule for a list's members, and a dictionary has nothing for it to keep: no projection builds one, `toDictionary` and `groupBy` record no lineage, and a collection expression and a binding record none, so no dictionary's entries carry records, sources or provenance.
  - A list's `select` describes its items by its own record, so a dictionary's `select` describing its values by its own record is the rule the list follows.
  - A result exports a dictionary as its entries' data, and a host matches by what a list's lineage gives, which a script reaching a dictionary's entries can project, `prices.entries { name = it.key }`.
- **Declined:** Records of a dictionary's entries, kept through `toDictionary`, `groupBy` and `where`: it would design a lineage for keys and values the language deferred with dictionary sources, for no host that needs one.

<a id="d42"></a>

## D42 — Each condition has its code, and a code that is never raised retires

*November 1, 2026*

- **Kind:** Language and runtime contracts, closing gaps between the specification and the code.
- **Decision:** NEXO5012 keeps a deferred access whose receiver's actual type has no member of its name, and each condition it shared takes a code of its own, NEXO5043 to NEXO5050, each the evaluation's counterpart of a condition resolution codes apart. NEXO3045, NEXO3065, NEXO4021 and NEXO4067, catalogued and never raised, retire, each row of the code that identifies their condition saying so. A test holds every catalogued code to one the sources raise. The language advances to `1.0.0-beta.14`.
- **Why:**
  - A code identifies its condition, and distinct conditions never share one. NEXO5012 also identified an ambiguous selection, a value an extension's target doesn't take and five ways a call's values don't fit its member, which resolution reports where it knows the receiver's type as NEXO3024, NEXO3027, NEXO3058, NEXO3080, NEXO3057, NEXO3018 and NEXO3079, and a value of no actual type, which only an evaluation meets.
  - A retired code is the catalog's record of a condition that no longer has one. The four were never raised because their conditions are others': two object-root references of different fields are branches of different types, an argument checked against its receiver's binding is an argument of the wrong type, a function parameter is refused by the codes of the declarations that take none, and an operator outside an extension always stands in its own module's type.
  - Raising NEXO3045 and NEXO3065 instead would give one condition two codes by where its types came from.
- **Declined:** One code for every way a deferred call's values don't fit its member: resolution tells those conditions apart, and an evaluation finding the same facts later tells them apart too.

<a id="d43"></a>

## D43 — The error class declares the factories a host builds with alone

*November 1, 2026*

- **Kind:** Implementation limitation, closed.
- **Decision:** `NexoError` exposes the four factories [the runtime contract](../spec/runtime/errors.md#diagnostics-and-errors) and `nexo.d.ts` declare, `structure`, `validation`, `module` and `evaluation`, and nothing else. A syntax error, which stands in text, is made by Nexo's own code alone, and where an offset stands in a text is `TextPositions`', internal to Nexo. The language version stays `1.0.0-beta.14`: the contract already said so.
- **Why:**
  - The class is the package's one export a host builds errors with, so what it exposes is a contract. `syntax` and `locate` were reachable on it, undeclared, a surface a host could come to rely on that no version promised.
  - A host reads no text of its own, as [D29](#d29) found when it declined declaring them, so it has no offset in a text to raise a syntax error at.
  - Locating an offset is a text's concern, which `TextLocations` already relies on, never an error's.
- **Declined:** Declaring them for hosts, as D29 declined: a host raises its own failures as structure, validation, module or evaluation errors.

<a id="d44"></a>

## D44 — A result path is checked wherever it is given

*November 1, 2026*

- **Kind:** Runtime contract, closing a gap between the specification and the code.
- **Decision:** `resolution.typeAt` and `nexo.paths.valueAt` refuse a path of another shape before they read it, as `nexo.paths.validate` does (NEXO2646), a path that is no list among it. `nexo.paths.valueAt` steps to an object field a value holds and a list's item alone, null for anything else. `nexo.paths.validate` stays, for a host checking a path before a resolution or a result is at hand. The language advances to `1.0.0-beta.15`.
- **Why:**
  - Every public operation of an implementation is strict, throwing its first diagnostic as an error, as [errors](../spec/runtime/errors.md#diagnostics-and-errors) set out. `typeAt` read a negative or a fractional number as an index and answered a type for a path no result has, and `valueAt` answered null for the same mistake, which a host can't tell from a path that reached null.
  - A path names a part of a script's result, an object field or a list's item. `valueAt` read whatever its host language reached through a value, a list's `length` and an object's `constructor` among them, which name no part of a result.
  - A string's characters iterate as steps, so `validate('rooms')` passed: a path is a list, and one that is none is of another shape.
- **Declined:** Leaving the check to `validate` alone, as the specification said: a host that forgets it gets an answer for a path that names nothing, and the check costs a pass over a few steps.

<a id="d48"></a>

## D48 — Tooling waits for its design

*November 2, 2026*

- **Kind:** Process.
- **Decision:** The tooling built in languages `1.0.0-beta.16` to `1.0.0-beta.18`, tolerant reading, diagnostics, source-preserving formatting, completion and hover, is withdrawn from `main` until the owner designs it. Its commits are reverted, and the work is kept on the `tooling-draft` branch as a draft for that design. The language advances to `1.0.0-beta.19`, so no version names two contracts.
- **Its decisions:** D45 to D47, which the tooling settled, are withdrawn with it. They stay on the `tooling-draft` branch, and their numbers are not reused.
- **Why:** The status listed tooling as next, in a few bullets, and it was built from them without a design the owner had made. Its contract, a public API and a specification document, is the owner's to shape.
- **Declined:**
  - Keeping it on `main` as a draft, which would leave an undesigned contract in the specification.
  - Discarding it, which would lose work a design may reuse.

<a id="d49"></a>

## D49 — A host call's function arguments are kept by its host until it disposes the call

*November 2, 2026*

- **Kind:** Language and runtime contract, for DOMQL's behaviors.
- **Decision:** A function the host invokes may declare function parameters. Preparing it gives its host each function argument as a kept function, which the host calls later, any number of times. Each call evaluates the function as an evaluation of its own, in the context preparation found: the locals before the call with their prepared values, the script's bindings and the function's own parameters, without hooks, checked against its callback contract, and refused while its evaluator evaluates or where its resolution is stale. The kept functions last until the host calls the prepared call's `dispose()`; a call after it fails with NEXO5051 at the argument. Expression and predicate parameters stay refused. The language advances to `1.0.0-beta.20`.
- **Why:**
  - A running behavior, as an input router matching keys, keeps a test of what it hears and calls it at each event, long after preparation ended, so a function argument a host call takes must outlive the call's preparation; data alone made every such test a protocol of the host's own.
  - The evaluation context is the one a projection already has, the frame of the locals preparation evaluated, so a kept function reads the same values the call's projections read, and no local is evaluated again.
  - Only the host knows when what it started ends, so it ends the functions it keeps, as it ends what it started; a call after that is a host's mistake, which fails loudly with a code of its own, apart from a member calling a function after its own invocation.
  - Without hooks a kept function reads members as they are, which is what a test of an event needs; a host that must keep its result current holds the observations itself, so Nexo adds no hooks to a call it doesn't schedule.
  - An expression or a predicate argument is a body of each item of a list its member follows, which a host call never reads, so a function parameter, of a contract the declaration states, is the one form a host can call.
- **Declined:**
  - A lifetime Nexo ends by itself, as with the evaluator or a timer, which can't know when a host's behavior ends.
  - Hooks for a kept function's calls, which would make every call an evaluation a host schedules, where a test is called inside an event's dispatch.
  - Answering null after disposal, which would hide a host's mistake behind a value the contract allows.

<a id="d50"></a>

## D50 — `and` and `or` are typed where their value is used

*November 3, 2026*

- **Kind:** Approved rule.
- **Decision:** `and` and `or` mean the same in every expression, and are evaluated as before, left to right, stopping at the operand that decides. Their values must share a type only where the value is used:
  - **Used:** a result, a function's among them, a local's initializer, an object field, an argument other than a predicate's, a branch, a list's item, and an operand of arithmetic, a comparison, an equality, `??` or an interpolation.
  - **Tested for truthiness alone:** a condition, the operand of `not`, an operand of another `and` or `or`, and a predicate argument written as an expression of `it`. Their values need share no type.
  - **Bound:** a conditional binding binds the truthy values, which share one.

  The values that reach a place are those `and` and `or` can answer there, so `c and fee or 0` is a `Number`, a null fee among them. Parentheses add no requirement, and a local is a boundary: it holds one type from its declaration. The language advances to `1.0.0-beta.21`.
- **Why:**
  - `c and x or y` is a familiar way to choose a value, and the false `c and x` gives can only select `y`. Refusing it at the `and` reported a type no value of the whole ever has.
  - A truthiness test reads no value's type, so requiring one there refused scripts whose meaning was clear.
  - Settling the type where a value is used keeps every value of one type, without union types.
- **Declined:**
  - A type for "false or a number", which would let `c and x` itself be a value. Nexo keeps every value of one type.
  - Carrying a logical expression's values through a local, which would accept `let level = c and fee` before `level or 0`. A local's type is settled at its declaration, so reading it never depends on how its initializer is written.
  - Testing the values of an arrow function given as a predicate for truthiness alone. A function's result is a value used, as every function's is.
  - Typing a fixed operand by its value rather than its declared type, which would change the type of scripts accepted before.

<a id="d51"></a>

## D51 — A malformed number is one invalid token

*November 3, 2026*

- **Kind:** Approved rule.
- **Decision:** A number is written as in JSON. Where a zero is followed by a digit, or an exponent has no digits, the whole run is one invalid token, NEXO1000, "A number is written as in JSON". An `e` that starts a longer name is that name, by the longest match, so `1else` stays `1` and `else`, and `1ex` stays a member written without its dot, NEXO1011.
- **Why:**
  - `0123` was read as `0` and `123`, and refused as "nothing follows a body's result". `1e` was read as `1` and a member `e`, and refused with advice to write `1.e`. Neither says what is wrong.
  - Refusing every number a letter follows, as JavaScript does, would refuse `1else`, which the longest match reads today.
- **Declined:** Refusing a number any letter follows, which would break texts accepted today for a diagnostic alone.

<a id="d52"></a>

## D52 — A value of `Any` is one value, which may be false

*November 3, 2026*

- **Kind:** Approved rule.
- **Decision:**
  - A value of `Any` may hold false, so its falsey part is `Any`, and `Any?` where it can be null.
  - An object expression following a value of `Any` applies to it once, whatever it holds, as its resolution types it.
  - A function and `root` merge with nothing but their own kind, so neither is chosen beside a value of `Any`, and `root` is given to no member's value parameter.
- **Why:**
  - Typing a falsey value of `Any` as never made `value and 5` a `Number` that evaluated to false, and let a computed name that could be false reach evaluation, which threw a TypeError.
  - Resolution typed an object expression after a value of `Any` as one object, while evaluation projected a list, so a script's type and its value disagreed.
  - `Any` holds values. A function or `root` merged into it reached a host's implementation, or a result, where evaluation overflowed the stack copying Nexo's own objects.
- **Declined:**
  - Typing an object expression after a value of `Any` as `Any`, which would keep projecting lists, but lose the object's type wherever the value is no list, the common case.
  - Typing the falsey part of `Any` as `Boolean`, which would refuse `value and 5` where its value is used, though `Any` is checked when it is evaluated.

<a id="d53"></a>

## D53 — Nexo's own members answer finite numbers, and data holds each key once

*November 3, 2026*

- **Kind:** Approved rule.
- **Decision:**
  - A `sum`, or a number a `sequence` reaches, that no finite number holds fails with NEXO5020, as an addition's does. `average` gives the mean of finite numbers whose sum overflows, by summing their shares.
  - `sequence` refuses a count above 4294967295, the most items a list holds, with NEXO5035.
  - A dictionary a host supplies or binds that holds a key twice once its keys are captured is refused, never keeping the first or the last.
  - The text Nexo's own conversions read and write is stated as they implement it.
- **Why:**
  - The specification says every number an expression holds is finite, and Nexo's own members skipped the check a module's member gets, so an infinity reached results.
  - A count too long for any list failed inside the implementation, as a fault, NEXO5007, rather than as the count's refusal.
  - Constructing a dictionary from duplicate keys is refused; capturing one collapsed them silently.
- **Declined:**
  - A lower bound on `sequence`'s count for memory's sake, which would be a policy no count can justify; a host that runs untrusted scripts bounds what it evaluates.
  - Normalizing `-0` from arithmetic, which no rule of Nexo's members covers and an interpolation already writes as `"0"`.

<a id="d54"></a>

## D54 — Only a maintained member is pending, and its result can be null

*November 3, 2026*

- **Kind:** Approved rule.
- **Decision:**
  - A member reading maintained values declares a result that can be null, NEXO4071, since it reads as null while pending.
  - `beforeInvoke` answers `{ pending: true }` for such a member alone. Any answer but samples, that, or nothing fails the evaluation at the member, NEXO5009, with the answer as its cause.
  - The functions a member is given close however its invocation ends.
- **Why:**
  - A pending member reads as null, so one declared `Number` gave a `Number` that was null, and arithmetic on it failed at evaluation with a code meant for values of `Any`.
  - A malformed answer reached the implementation as its samples, and its failure was blamed on the module, NEXO5007.
  - A function the member was given, kept by a host whose `beforeInvoke` answered pending or threw, stayed callable after its evaluation ended, outside the evaluator's guard.
- **Declined:**
  - Typing a read of a maintained member as nullable whatever its declaration says, which would give a script a type its module never declared.

<a id="d55"></a>

## D55 — A compilation compiles through an evaluator of its own

*November 3, 2026*

- **Kind:** Implementation decision, measured.
- **Decision:** The functions a resolved definition compiles to are compiled by an evaluator of the compilation's own, which holds empty bindings and an empty environment. A deferred access keeps the selections of the first 32 types it meets, and a value's metadata shares object records within its own description alone.
- **Why:**
  - The first evaluator to compile a resolution stayed reachable from the functions it compiled, which the compilation keeps for every evaluator, so its environment and its bindings lived as long as the resolution did.
  - A deferred access kept a selection for every object shape it met through `Any`, without bound: 200,000 shapes kept about 210 MB.
  - Object records shared across evaluations kept host values their sources held, past the evaluations that read them.
- **Measured** in paired runs against the commit before it, eleven rounds: evaluating with a reused evaluator −3.7%, and with a new evaluator and new bindings for each evaluation +8% (about 3 µs), with no more allocation; the other cases are unchanged. The added cost comes with compiling through another evaluator, and is the price of releasing the host's values.
- **Declined:** Compiling through the first evaluator and clearing its host values after it compiles, which would leave a function compiled later during that evaluator's own evaluations reading values cleared under it.

<a id="d56"></a>

## D56 — A resolution key holds what can decide a resolution, unambiguously

*November 3, 2026*

- **Kind:** Runtime contract, closing a gap between the specification and the code.
- **Decision:**
  - A resolution key holds each binding's type, and the value of a binding that is a string, a Boolean or null. A number, always truthy, never null and never a string, decides nothing, so it is no part of the key.
  - A type's notation writes a field name that is no name quoted, as JSON writes a string, in the key and in messages alike.
  - A binding's declared type is a public type, as the specification says; an internal one is no candidate.
- **Why:**
  - A field name of bound data was written raw, so a name holding `:` or `;` made two binding sets of different types write one key, and a resolution was reused with bindings it did not fit, its fields reading as null.
  - Bindings differing in a number alone were refused a shared resolution, each resolving anew, about four times the cost of reusing one.
  - An internal type, which no script names, was accepted as a binding's declared type.
- **Declined:** Keying by the bindings a resolution read for its decisions alone, which would track every read at resolution for a gain the rule above already gives.

<a id="d57"></a>

## D57 — A script nests at most 256 levels

*November 3, 2026*

- **Kind:** Approved rule.
- **Decision:** A script nests at most 256 levels, each expression within another a level deeper. The parser refuses text nesting deeper where it does, NEXO1072, and validation refuses a definition at its node, NEXO2046, a chain of operators nesting a level for each operator after its first. Validation refuses a node that holds itself, and an array with a missing entry, NEXO2000. A bound on the data a host binds or a member answers is deferred, as the status records.
- **Why:**
  - Reading text, validating, resolving, evaluating and writing a definition each follow its nesting, so a deep script overflowed the stack as a `RangeError`, from about 440 nested parentheses, which no host can tell from a fault, and a cyclic or sparse definition passed validation and failed later.
  - The parser reads at least 437 levels of every construct, so 256 leaves room on smaller stacks, and one limit for text and definitions keeps every definition validation accepts writing text that reads back.
- **Declined:**
  - Counting a chain of operators as one level, which would leave a chain of thousands of terms overflowing validation and resolution.
  - Catching the stack's overflow, which engines report apart, as `RangeError` or `InternalError`, and which can leave what was being read half done.
