// How a TypeScript host uses Nexo, which the declarations must accept; the declarations test compiles this file.
import { nexo, NexoError } from '../../src/nexo.js';
import type { NexoEvaluator, NexoEvaluatorOptions, NexoModuleContents, NexoMemberDeclaration, NexoOperatorDeclaration, NexoRegistry } from '../../src/nexo.js';

const { createPropertyDeclaration: property } = nexo.declarations;

// A module's implementations take what they read by name, typed by the kind of declaration they carry out: a member its receiver, an operator its value and reject.
const contents: NexoModuleContents = {
    typeOf: value => (value instanceof Map ? 'Shelf' : null),
    types: [{
        name: 'Shelf',
        kind: 'reference',
        isInstance: value => value instanceof Map,
        members: [
            property('count', 'Number', { updates: { changes: 'unobserved', reads: 'fresh' } }),
            { name: 'label', kind: 'property', result: 'String', updates: { changes: 'constant', reads: 'fresh' }, impl: ({ receiver }) => String((receiver as Map<string, unknown>).size) },
            { kind: 'operator', name: 'convert', result: 'Number', impl: ({ value, reject }) => (value instanceof Map ? value.size : reject('no shelf')) },
        ],
    }, {
        name: 'Word',
        kind: 'structured',
        members: [{ name: 'text', kind: 'property', result: 'String' }],
    }, {
        name: 'Strings',
        kind: 'extension',
        target: 'String',
        members: [
            { name: 'shout', kind: 'function', result: 'String', updates: { changes: 'constant', reads: 'fresh' }, impl: ({ receiver }) => `${receiver as string}!` },
            // A parameter declares its name, its kind and its type; whether it is required and its null policy have defaults, which the helpers' options write over.
            { name: 'pad', kind: 'function', result: 'String', arguments: 'positional', parameters: [{ name: 'width', kind: 'value', type: 'Number' }], updates: { changes: 'constant', reads: 'fresh' } },
            { name: 'keep', kind: 'function', result: 'List<String>', arguments: 'positional', parameters: [nexo.declarations.createPredicateParameterDeclaration({ nulls: 'accept' })], updates: { changes: 'derived', reads: 'derived' } },
        ],
    }],
};
const operator: NexoOperatorDeclaration = { kind: 'operator', name: 'cast', result: 'Shelf' };
const member: NexoMemberDeclaration = { name: 'size', kind: 'property', result: 'Number', updates: { changes: 'constant', reads: 'fresh' }, impl: ({ receiver }) => (receiver as Map<string, unknown>).size };
const registry: NexoRegistry = nexo.createRegistry([nexo.createModule('Pantry', contents)]);

// @ts-expect-error An operator is a cast or a conversion.
const misnamed: NexoOperatorDeclaration = { kind: 'operator', name: 'shout', result: 'String' };

// @ts-expect-error An operator is declared as one, never as a member.
const misdeclared: NexoMemberDeclaration = { kind: 'operator', name: 'cast', result: 'Shelf' };

// A host builds an error of its own of each kind it reports, with a code of its own prefix: a module error for a declaration that breaks a rule of the host's.
const refused: NexoError = NexoError.module('PANTRY4001', 'A shelf declares its label', { module: 'Pantry', type: 'Shelf', declaration: 'label', declarationKey: 'result' });
const failed: NexoError = NexoError.evaluation('PANTRY5001', 'The pantry is closed', {}, { cause: refused });
const kinds: string[] = [NexoError.structure('PANTRY2001', 'No pantry', {}), NexoError.validation('PANTRY3001', 'No shelf', {}), refused, failed].map(error => `${error.kind} ${error.code}`);

// A host tells its host calls apart by keys of its own, reading them in a call's candidates while its receiver's type is unknown, and locates a refusal where the call stands.
const hostCall = registry.resolve('nothing', { nothing: null }).hostCall;
const candidates: readonly NexoMemberDeclaration[] = hostCall === null ? [] : hostCall.candidates;
const callPointer: string | undefined = hostCall?.pointer;

// A host keeps the functions a prepared call's function arguments give it, calls them later, and disposes the call once it is done with them.
const prepared = registry.resolve('nothing', { nothing: null }).createEvaluator({ nothing: null }).prepareHostCall();
const limited: NexoEvaluator = registry.resolve('0.sequence(3)', {}).createEvaluator({}, {}, { limits: { items: 10000 } });
const options: NexoEvaluatorOptions = { limits: { items: 0 } };
// @ts-expect-error A limit is a number of items.
registry.resolve('1', {}).createEvaluator({}, {}, { limits: { items: '10' } });
void limited;
void options;

if (prepared.kind === 'prepared') {
    const kept = prepared.args.when;

    if (typeof kept === 'function') {
        kept('hall');
    }

    prepared.dispose();
}

// A helper's options are a member declaration's own keys, so an inline implementation reads its input typed, and a misspelled option is refused.
const helped = nexo.declarations.createFunctionDeclaration('greet', 'String', {
    updates: { changes: 'constant', reads: 'fresh' },
    impl: ({ receiver, args, env }) => `${String(receiver)} ${String(args.name)} ${String(env)}`,
});
// @ts-expect-error A member's updates name how it changes, one of its categories.
const misupdated = nexo.declarations.createPropertyDeclaration('size', 'Number', { updates: { changes: 'constnt', reads: 'fresh' } });
// A module holds each declaration with the type parameters it declares beside its local name.
const parameters: readonly string[] | undefined = nexo.createModule('Generic').members[0]?.typeParameters;

export { operator, member, registry, misnamed, misdeclared, kinds, candidates, callPointer, prepared, helped, misupdated, parameters };
