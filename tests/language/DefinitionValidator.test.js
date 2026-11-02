import { describe, it, expect } from 'vitest';
import { DefinitionValidator } from '#nexo/language/DefinitionValidator.mjs';
import { ParsedTexts } from '#nexo/language/ParsedTexts.mjs';
import { RecoveryRecord } from '#nexo/language/RecoveryRecord.mjs';
import { Versions } from '#nexo/language/Versions.mjs';
import { errorThrownBy } from '../support/errors.mjs';

/** Every object the part holds, itself among them, in order. */
const objectsOf = (part, found = []) => {
    if (part !== null && typeof part === 'object') {
        found.push(part);
        Object.values(part).forEach(value => objectsOf(value, found));
    }

    return found;
};

describe('DefinitionValidator', () => {
    describe('a copy of a canonical node', () => {
        // `a` is written alone, `~b` hidden by the local `b`, and the list, the call and the strings hold every kind of part a node does.
        const { expression } = ParsedTexts.parse('let b = 1\nreturn { x = a, y = ~b, z = [a, $"{b} of {a}"].count, w = b }');

        it('holds what the node holds, every object its own and none of them frozen', () => {
            const copy = DefinitionValidator.copyOf(expression);
            const originals = new Set(objectsOf(expression));

            expect(copy).toEqual(expression);
            expect(objectsOf(copy).filter(part => originals.has(part) || Object.isFrozen(part))).toEqual([]);
        });

        it("copies a node's own keys alone, whatever its prototype adds", () => {
            // An object-valued property every object inherits, as a library may add, which a copy following it would follow without end.
            Object.defineProperty(Object.prototype, 'added', { value: { kind: 'local', name: 'a' }, enumerable: true, configurable: true, writable: true });

            try {
                const copy = DefinitionValidator.copyOf(expression);

                expect([Object.hasOwn(copy, 'added'), Object.keys(copy)]).toEqual([false, Object.keys(expression)]);
            } finally {
                delete Object.prototype.added;
            }
        });

        it('marks each script parameter as the node marks it, written alone or hidden, and nothing else', () => {
            const marksOf = node => objectsOf(node).filter(part => part.kind === 'scriptParameter').map(part => ({ name: part.name, isWrittenAlone: DefinitionValidator.isWrittenAlone(part), isHidden: DefinitionValidator.isHidden(part) }));

            expect(marksOf(DefinitionValidator.copyOf(expression))).toEqual(marksOf(expression));
            expect(marksOf(expression)).toEqual([
                { name: 'a', isWrittenAlone: true, isHidden: false },
                { name: 'b', isWrittenAlone: false, isHidden: true },
                { name: 'a', isWrittenAlone: true, isHidden: false },
                { name: 'a', isWrittenAlone: true, isHidden: false },
            ]);
        });
    });

    describe('a tolerant validation', () => {
        it('takes a hole, a hole of a receiver validating its receiver, and records each node it recovers from, answering a hole in its place, so validation goes on with the rest', () => {
            const recovery = new RecoveryRecord(['/expression/objectFields/0/value']);
            const definition = { version: Versions.definition, imports: [], expression: { kind: 'object', objectFields: [
                { name: 'a', value: { kind: 'hole' } },
                { name: 'b', value: { kind: 'hole', receiver: { kind: 'scriptParameter', name: 'room' } } },
                { name: 'c', value: { kind: 'memberAccess', receiver: { kind: 'it' }, name: 'size' } },
                { name: 'd', value: { kind: 'local', name: 'nothing' } },
            ] } };
            const validated = new DefinitionValidator(null, null, recovery).validate(definition);

            // The innermost node that fails is the hole: `it`, which the access of `size` keeps reading.
            expect(validated.expression.objectFields.map(field => field.value)).toEqual([
                { kind: 'hole' },
                { kind: 'hole', receiver: { kind: 'scriptParameter', name: 'room' } },
                { kind: 'memberAccess', receiver: { kind: 'hole' }, name: 'size' },
                { kind: 'hole' },
            ]);
            expect(recovery.diagnostics.map(error => [error.code, error.location.pointer])).toEqual([['NEXO2026', '/expression/objectFields/2/value/receiver'], ['NEXO2012', '/expression/objectFields/3/value']]);
            // Its copy is never canonical, so a strict validation reads it again and refuses its holes.
            expect(errorThrownBy(() => new DefinitionValidator().validate(validated))).toMatchObject({ code: 'NEXO2000', location: { pointer: '/expression/objectFields/0/value' } });
        });

        it('marks the optional chain a hole of an optional access stands in, as the access would', () => {
            const recovery = new RecoveryRecord();
            const hole = { kind: 'hole', receiver: { kind: 'scriptParameter', name: 'room' }, optional: true };
            const validated = new DefinitionValidator(null, null, recovery).validate({ version: Versions.definition, imports: [], expression: { kind: 'optionalChain', chain: hole } });

            expect(validated.expression).toEqual({ kind: 'optionalChain', chain: hole });
            expect(recovery.diagnostics).toEqual([]);
        });

        it('is the strict validation\'s alone, which refuses a hole as a node of no kind the format has (NEXO2000)', () => {
            expect(errorThrownBy(() => new DefinitionValidator().validate({ version: Versions.definition, imports: [], expression: { kind: 'hole' } }))).toMatchObject({ code: 'NEXO2000', location: { pointer: '/expression' } });
        });
    });
});
