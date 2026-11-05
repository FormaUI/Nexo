# Embedding Guide

This guide shows how a host uses Nexo, by example: read text, declare a domain as a module, resolve a script against it, evaluate it, and follow what the evaluation reads. Each section leads with code, which runs in the gate as it is written, and the rules below it say what the code relies on. The [runtime contract](../spec/README.md#the-runtime) gives the exact rules a host relies on, the [language contract](../spec/README.md#the-language) what a script means, and the [design](nexo-design.md) how each stage works.

## Load it

| Package | Import |
| --- | --- |
| npm, `@formaui-net/nexo` | `import { nexo, NexoError } from '@formaui-net/nexo';` |
| NuGet, `formaui-net.Nexo` | The bundle is served at `_content/nexo/nexo.js` |

Nexo is one ES module with its type declarations. Neither package is published yet; `./build.ps1 -Full` packs both into `artifacts/`.

## Read and write text

```js
const definition = nexo.parse('{ total = price  *  quantity }');

nexo.format(definition); // '{ total = price * quantity }'
nexo.getLocation(definition, '/expression/objectFields/0/value'); // { pointer: '/expression/objectFields/0/value', offset: 10, line: 1, column: 11 }
```

- `nexo.parse` reads text into a definition, the script's frozen JSON form.
- `nexo.format` writes any definition, or text, back as canonical text.
- `nexo.getLocation` finds where a definition node came from.
- None of these needs a domain: reading, checking and formatting know the language and the script's imports alone.

### Imports

```js
nexo.parse('import Shop\nShop.open').imports;    // [{ module: 'Shop' }]
nexo.parse('Shop.open', { imports: ['Shop'] });  // the same definition
nexo.format('Shop.open', { imports: ['Shop'] }); // 'Shop.open'
nexo.format('import Store = Shop\nStore.open');  // 'import Store = Shop\n\nStore.open'
nexo.quote('{\n    open = Shop.open\n}', { imports: ['Shop'] }); // '{ open = Shop.open }'
```

- A script imports each module whose namespace it reads, at its start.
- A host whose scripts all use its module supplies the import instead, and formatting for that host leaves it out.
- `nexo.quote` writes the compact text a diagnostic quotes, which reads back as the same definition. It writes one line, except that a body using `return` puts each local and its `return` on a line of its own.
- A registry reads no text of its own. `registry.resolve(script, bindings, { imports })` reads a text as `nexo.parse` does, and registering a module changes how no text reads.

## Declare a domain

```js
const { createPropertyDeclaration, createFunctionDeclaration, createValueParameterDeclaration } = nexo.declarations;

const shop = nexo.createModule('Shop', {
    types: [
        { name: 'Price', kind: 'structured', members: [createPropertyDeclaration('amount', 'Number'), createPropertyDeclaration('currency', 'String')] },
        {
            name: 'Products',
            kind: 'extension',
            target: 'String',
            members: [
                createPropertyDeclaration('price', 'Price', {
                    updates: { changes: 'constant', reads: 'fresh', tolerance: 0.01 },
                    impl: ({ receiver, env }) => ({ amount: env.catalog[receiver], currency: 'EUR' }),
                }),
                createFunctionDeclaration('discount', 'Number', {
                    updates: { changes: 'constant', reads: 'fresh' },
                    parameters: [createValueParameterDeclaration('code', 'String')],
                    impl: ({ args }) => (args.code === 'TEN' ? 10 : 0),
                }),
                createFunctionDeclaration('order', 'Price', {
                    invokedBy: 'host',
                    parameters: [createValueParameterDeclaration('quantity', 'Number')],
                }),
            ],
        },
    ],
});
```

- A module declares what scripts can read: its types, with their members, and the members it adds to other types in extensions.
- Each member declares its signature, how its value changes, and the implementation that answers it. `order` has none: its host invokes it, as [a host call](#prepare-a-host-call) shows.
- The declaration helpers fill in the defaults, and where a member stands gives it its receiver: the members of `Products` extend `String`, so a product's name is their receiver.
- An implementation receives one object and reads what it needs by name: its `receiver`, its `args` by parameter name, and the `env` the host supplies.

[Declarations](../spec/runtime/modules.md#modules-declarations) sets out each kind of declaration and the declaration keys it takes, and [updates](../spec/runtime/members.md#members-updates) what `updates` means.

## Resolve a script

```js
const registry = nexo.createRegistry([shop]);
const bindings = registry.createBindings({ product: 'tea', code: 'TEN' });
const resolution = registry.resolve('{ price = product:price, cut = product:discount(code) }', bindings, { imports: ['Shop'] });

resolution.type;                        // '{ price: Price, cut: Number }'
resolution.typeAt(['price', 'amount']); // 'Number'
resolution.usedDeclarations.map(used => used.qualifiedName); // ['String.price', 'String.discount']
```

- A registry holds the modules a host registers.
- Resolving checks every member, argument and type before anything runs.
- A script reaches a module's members through its import, and Nexo's own always. A member of a module no import names is refused, giving the import to write.
- `registry.createBindings` asks each module's `typeOf` which values are references. It keeps each reference as it is and a frozen copy of the data, so later changes to the original data never reach a script. The bindings are that registry's alone.
- A resolution is reused for bindings of the same types and the same strings, Booleans and nulls, which can decide what a script reads. Bindings that differ in their numbers alone share it.
- An access on a value of `Any` selects its member as it is evaluated, so no used declaration names it. `resolution.deferredAccesses` lists each such access by its pointer and the name it accesses, and `resolution.getCandidateDeclarations()` answers every declaration an evaluation could select, marked as an overestimate while a deferred access remains.

### Maps and sets

```js
const menu = { prices: new Map([['coffee', 3], ['tea', 2]]) };

nexo.createRegistry([]).resolve('{ tea = prices["tea"], all = prices }', menu).createEvaluator(menu).evaluate().value;
// { tea: 2, all: { entries: [{ key: 'coffee', value: 3 }, { key: 'tea', value: 2 }] } }
```

- A host's map binds as a dictionary, read by key, and a set as a list in its order.
- A result exports a dictionary as its entries.

## Evaluate

```js
const evaluator = resolution.createEvaluator(bindings, { catalog: { tea: 4.5 } });
const { value, metadata } = evaluator.evaluate();

value;                                 // { price: { amount: 4.5, currency: 'EUR' }, cut: 10 }
metadata.objectFields.price.tolerance; // 0.01
```

- An evaluator holds one set of bindings and the environment the host owns.
- Evaluating answers the value and the metadata that describes it.
- The result is frozen throughout and holds only data.
- Evaluate again whenever the host's state may have changed. Each evaluation answers a new result and leaves earlier ones as they were.

### Bound the work

```js
const sized = { count: 5000000 };
const bounded = nexo.createRegistry([]).resolve('0.sequence(count)', sized).createEvaluator(sized, {}, { limits: { items: 10000 } });

try {
    bounded.evaluate();
} catch (error) {
    error.code;             // 'NEXO5054'
    error.location.pointer; // '/expression'
}
```

- An evaluator's `limits` bound what each of its evaluations makes. A list `sequence` or `concat` would make past `items` is refused at the call, before it is made, and the evaluator goes on evaluating.
- A limit bounds each such list alone. Every other list Nexo's own members make holds no more items than their receiver, and a host bounds the text it is given, and what its own implementations answer, itself.
- An evaluator has none unless its host sets one, so one host can evaluate an interaction and a report under different limits.

## Follow what an evaluation reads

```js
const reads = [];

evaluator.evaluate({
    beforeInvoke: request => { reads.push(request.declaration.name); },
    afterEvaluation: outcome => { reads.push(outcome.kind); },
});

reads; // ['price', 'discount', 'completed']
```

- A host that keeps a result current gives the evaluation hooks.
- `beforeInvoke` is called before each member's implementation, `afterInvoke` after each one that answered, and `afterEvaluation` once as the evaluation ends.
- Only the reads an evaluation reaches are reported: a branch not taken reports nothing, and each evaluation reports the branch it took.

The [design](nexo-design.md#evaluation) sets out every hook, maintained members' samples among them.

<a id="prepare-a-host-call"></a>

## Prepare a host call

```js
const ordering = registry.resolve('product:order(2) { charged = it.amount }', bindings, { imports: ['Shop'] });
const call = ordering.createEvaluator(bindings).prepareHostCall();

call.kind;                                          // 'prepared'
[call.declaration.name, call.receiver, call.args];  // ['order', 'tea', { quantity: 2 }]
call.project({ amount: 8, currency: 'EUR' }).value; // { charged: 8 }
```

- A script that ends in a host call is prepared, never evaluated: the runtime evaluates its receiver and arguments, and the host invokes it, when and as often as it decides.
- `call.project` captures a value the host supplies as the call's declared result, then evaluates what the script writes after the call against it.
- A call whose receiver is null is skipped, its `kind` `'skipped'`, and invokes nothing.
- A function argument reaches the host as a kept function, which it calls later until it disposes the call with `call.dispose()`.

[Host calls](../spec/runtime/host-calls.md) sets out preparing, capturing and kept functions.

## Share data with Nexo

```js
const { createFunctionParameterDeclaration } = nexo.declarations;
const pantry = nexo.createModule('Pantry', {
    members: [
        createFunctionDeclaration('stock', 'List<String>', { updates: { changes: 'constant', reads: 'fresh' }, impl: ({ env }) => env.stock }),
        createFunctionDeclaration('watch', undefined, { invokedBy: 'host', parameters: [createFunctionParameterDeclaration('when', 'Boolean', ['String'])] }),
    ],
});
const kitchen = nexo.createRegistry([pantry]);
const wanted = [{ item: 'tea' }];
const shopping = kitchen.createBindings({ wanted });

wanted.push({ item: 'cocoa' });

shopping.readValue('wanted');                  // [{ item: 'tea' }]
Object.isFrozen(shopping.readValue('wanted')); // true

const larder = { stock: ['tea', 'coffee'] };
const answers = [];
const listing = kitchen.resolve('{ stock = Pantry.stock(), names = wanted { name = it.item } }', shopping, { imports: ['Pantry'] }).createEvaluator(shopping, larder);
const listed = listing.evaluate({ afterInvoke: (request, answer) => { answers.push(answer); } });

answers[0] === larder.stock;         // true
listed.value;                        // { stock: ['tea', 'coffee'], names: [{ name: 'tea' }] }
listed.value.stock === larder.stock; // false
listed.metadata.objectFields.names.sources[0].value === shopping.readValue('wanted')[0]; // true

larder.stock = [...larder.stock, 'cocoa'];

listing.evaluate().value.stock; // ['tea', 'coffee', 'cocoa']

const watching = kitchen.resolve('Pantry.watch(name => wanted.any(it.item == name))', shopping, { imports: ['Pantry'] }).createEvaluator(shopping, larder).prepareHostCall();
const { when } = watching.args;

[when('tea'), when('cocoa')]; // [true, false]

watching.dispose();

try {
    when('tea');
} catch (error) {
    error.code; // 'NEXO5051'
}
```

Data is read-only once it passes between Nexo and its host, in either direction, nested data included. Whether Nexo copies it depends on what passes:

| What passes | What Nexo does | The host may | The host may not |
| --- | --- | --- | --- |
| A binding | Copies and freezes its data, and keeps each reference as it is | Change its own data afterwards, as `wanted.push` does, which changes nothing bound | Rely on a change to its own data reaching a script: it binds anew instead |
| An answer | Holds the data the implementation answered, checked, never copied | Answer new data once its own changes, as replacing `larder.stock` does | Change the data it answered, or reuse it for a later answer, through any alias it keeps, as `larder.stock.push('cocoa')` would |
| A kept function | Keeps it callable, in the context preparation found, until the host disposes the call | Call it later, any number of times, synchronously, while it keeps the call | Call it while its evaluator evaluates (NEXO5010), or after `dispose()` (NEXO5051) |
| A result | Answers it new and frozen throughout | Keep it, and compare it with the next | Rely on it following its own data: it evaluates again for a new result |

- A binding's copy is what the script reads, whatever the host does to its own data afterwards.
- Nexo holds an answer as it was given: `afterInvoke` reports the very list the implementation answered.
- A kept function reads the locals the script declares before the call, as preparation found them, and the script's bindings; a member it reads is given the environment.
- A prepared call holds the locals and the references it was prepared with for as long as it is reachable. `dispose()` ends every function it keeps and lets go of what each read, so a function the host keeps past it holds nothing of the evaluation: its locals, the bindings or the environment. Disposing again does nothing; a call that keeps none needs no disposal.
- A result keeps neither the evaluator that made it nor its bindings or environment alive, its metadata read or not, and an error Nexo raises keeps nothing of its evaluation either.
- A result is new and frozen throughout, so `listed.value.stock` is not the list the implementation answered. The sources its metadata records hold data frozen, as the evaluator holds it, a part of a binding's copy among them, and each reference as the host holds it.

[Data shared with a host](../spec/runtime/evaluation.md#runtime-shared-data) sets out the rule, [bindings](../spec/runtime/bindings.md#runtime-bindings) what binding copies, and [kept functions](../spec/runtime/host-calls.md#runtime-host-calls-kept-functions) their context and their lifetime.

## Handle errors

```js
try {
    registry.resolve('product.weight', bindings);
} catch (error) {
    error.code;          // 'NEXO3001'
    error.kind;          // 'validation'
    error.location.line; // 1
    error.message;       // "'weight' is no member of the vocabulary (line 1, column 1, at /expression)"
}
```

- Every failure is a `NexoError` with the code of its condition, a `kind` and the location it concerns.
- React to a condition by its code, never by its message: the code stays whatever the message says. The catalogs of [the language](../spec/language/errors.md) and [the runtime](../spec/runtime/errors.md) list every code, as [codes](../spec/runtime/errors.md#diagnostics-codes) set out.
- A value a hook or a member's implementation throws reaches the host as the `cause` of Nexo's own error, unchanged.

The kinds, `syntax`, `structure`, `validation`, `module` and `evaluation`, and what each reports, are in [errors](../spec/runtime/errors.md).
