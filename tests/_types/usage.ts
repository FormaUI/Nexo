// How a TypeScript host uses Nexo, which the declarations must accept; the declarations test compiles this file.
import { nexo, NexoError } from '../../src/nexo.js';
import type { NexoModuleContents, NexoMemberDeclaration, NexoOperatorDeclaration, NexoRegistry } from '../../src/nexo.js';

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
        members: [{ name: 'shout', kind: 'function', result: 'String', updates: { changes: 'constant', reads: 'fresh' }, impl: ({ receiver }) => `${receiver as string}!` }],
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

export { operator, member, registry, misnamed, misdeclared, kinds, candidates, callPointer };
