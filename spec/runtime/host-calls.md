# Host calls

<a id="runtime-host-calls"></a>
<a id="runtime-requests"></a>

A script that ends in a [host call](../language/members.md#members-host-calls) is resolved as any other, and its resolution answers the call, `resolution.hostCall`:

- **`name`**, the name it calls, and **`pointer`**, where it stands in the definition.
- **`declaration`**, the declaration it resolved to, null while its receiver's type is unknown.
- **`candidates`**, the declarations a binding could give it: its declaration alone, or, while its receiver's type is unknown, every declaration that [takes the call as it is written](../language/types.md#receivers-of-unknown-type-the-call-keeps-who-invokes-it), each invoked by the host. A host that tells its host calls apart by keys of its own, as DOMQL tells a subscription from an execution, reads them there before a binding gives the receiver a type.

The runtime prepares the call and projects each value its host supplies; invoking it, when and how often, and for how long what it starts runs, are the host's. Such a script is prepared, never evaluated: `evaluate` refuses a script that ends in a host call, and `prepareHostCall` one that gives a value, each with an [evaluation error](errors.md#runtime-evaluation-errors).

```js
const call = evaluator.prepareHostCall();

if (call.kind === 'prepared') {
    const brightness = await invokeHostCall(call.declaration, call.receiver, call.args);
    const { value } = call.project(brightness);
}
```

- **`evaluator.prepareHostCall()`** evaluates the locals the script declares before the host call, then the call's receiver and arguments, once, without hooks, as `evaluate` given none evaluates a script, and answers a **prepared call**, `{ kind: 'prepared', declaration, receiver, args, pointer, isDeferred, dispose }`, a hook's request in shape, the arguments by parameter name, a function argument as a [kept function](#runtime-host-calls-kept-functions), the call named by its definition pointer, no `receiver` for a module member, `isDeferred` always false, since resolution selects every host call, and `dispose()`, which ends its kept functions; or a **skipped call**, `{ kind: 'skipped', pointer }`, where the receiver is null, an argument whose parameter propagates null is null, or the call has no declaration yet, so there is nothing to invoke and nothing to project. A skipped call is never invoked, and what its host answers for one is the host's to say. Preparing a script that gives a value is refused with an evaluation error. An evaluator prepares its call as often as it is asked, and each prepared call is its own, so the prepared calls of one evaluator coexist without affecting one another.
- **`call.project(value, hooks?)`** projects one value the host supplies for the prepared call: it captures the value as the call's declared `result`, as [capturing a supplied value](#runtime-host-calls-capturing) sets out, then evaluates the result projection against it, as `evaluate` evaluates a script with the hooks given, and answers as `evaluate` does, with the value, whether a member it read was pending, and the metadata. A host call followed by no result projection answers the captured value itself in that shape. A call that declares no `result` supplies nothing to project, so its prepared call has no `project`.

<a id="runtime-host-calls-capturing"></a>

**Capturing a supplied value.** A host supplies its values from outside the script, and `project` captures each as the type its call declares before the result projection reads it, at every level of it: the value itself, each property of a structure's data shape, a structure nested in one of them, and each item of a list.

| What is supplied | What is captured |
| --- | --- |
| Nothing, a property missing or `undefined` among them | Null where its type is nullable; the projection fails where it is not |
| Null | Null where its type is nullable; the projection fails where it is not |
| A value its type admits | The value, a structure as its data shape alone, and a list item by item |
| A set where a list is declared | A list of the set's items in the set's iteration order, each captured and validated as the declared item type, recursively: a collection or a structure an item holds is validated against its own declared type. The list follows list semantics and keeps none of the set's uniqueness, so a later projection may hold an item twice |
| A map where a dictionary is declared, or an object of a `key` and a `value` alone where a pair is | The language's dictionary, its entries in the map's iteration order, or pair, each key and value captured and validated as its declared type, recursively |
| A reference of another type, where a nullable reference type is declared | Null, so the value keeps only the reference its type names, as a `Light?` property holding a thermostat is null |
| Data that reaches itself, a list or an object holding one it lies within | The projection fails with an evaluation error naming the call and where the value reaches itself |
| Any other value, data its type does not admit among them | The projection fails with an evaluation error naming the call and the part of the value |

A list never holds a missing item. Narrowing a reference is the one thing capturing turns into null, so mistyped data fails whatever its type's nullability. A supplied value has no type of its own until it is captured, so where it fails its declared type's membership, the registry's `typeOf` tells a reference of another type from mistyped data, as it recognizes a binding. A member's answer is never captured: its implementation answers what its member declares.

A projection reads what the call was prepared with, and evaluates the rest anew:

- **The locals before the call.** Each local the script declares before the host call is evaluated once, by `prepareHostCall`, as every local is, and each projection of that prepared call reads the value it was prepared with, never running its initializer again. A local holding a reference holds the reference, and one holding a computed value holds the value. In the example, each projection reads `room.occupied` of the room the call was prepared with, as that room is when the motion arrives, while `occupied` keeps whether it was occupied when the call was prepared. Both read one receiver, since reading `sensor.room` again could find another room, a sensor being movable.
- **Its own evaluation.** Each projection is an evaluation of its own, with its own supplied value, host and state; the result projection's own locals are evaluated in each, and projecting a value for one prepared call never changes what another was prepared with.
- **Function references.** A function reference a local before the call holds is called in any projection, as one is anywhere within the script; a callback a projection gives a member lasts while that member's invocation does, as every callback given to a member does. A function reaches the host only as a host call's function argument, a kept function.

```nexo
let room = sensor.room
let occupied = room.occupied
return sensor.on("motion") { at = it.at, isOccupied = room.occupied, wasOccupied = occupied }
```

A prepared call starts nothing, and the lifetime of whatever its host starts is the host's; one that keeps no function needs no disposal, and `dispose()` of it does nothing. A prepared call holds the locals and the references it was prepared with for as long as it is reachable. Each projection goes through the checks every evaluation does, the refusal of a resolution no longer [current](resolution.md#runtime-reuse) among them.

<a id="runtime-host-calls-kept-functions"></a>

**Kept functions.** A host call's function argument, written in any form a function argument takes, as [argument kinds](../language/members.md#arguments-kinds) set out, is prepared as a **kept function**: a function its host keeps and calls later, as a behavior keeps a test of the events it hears, any number of times, synchronously, with the arguments its callback contract declares, and which answers the contract's result.

- **Its context.** Each call is an evaluation of its own: the function's body reads the locals the script declares before the call, with the values preparation found, the script's bindings, and its own parameters, as a function given to a member reads where it is written. It is evaluated without hooks, as preparation is, so a member it reads reads its value as it is called, and a maintained member fails it (NEXO5011).
- **Its checks.** Each call checks the arguments it is given against the contract (NEXO5503), and what the function answers (NEXO5504); it is refused while its evaluator is evaluating (NEXO5010), and where its resolution is no longer current (NEXO2040), as a projection is, so a host keeping a call across a registration prepares it again.
- **Its lifetime.** It lasts as long as its host keeps the prepared call, which only the host knows, so the host ends it: `dispose()` ends every function the call keeps, and a call of one after it fails at the argument that gave it (NEXO5051). Each prepared call's kept functions are its own, so disposing one leaves another call's, of the same evaluator, as they were. Disposing again does nothing. A function ended so holds nothing of its context: the locals, the bindings and the environment it read are let go of with the prepared call, though its host keeps the function.
- **What it answers.** A value of the contract's result type, data or a reference, which the host reads as it reads a member's answer; a failure of the call is thrown to the host, never swallowed.

A host projects each value as it arrives, once for a value its call answers once and once for each of several it supplies over time, so the runtime treats them alike. Waiting for samples, cancellation between evaluations, keeping a result current and scheduling it, and the lifetime of whatever a host call starts, are the host's.
