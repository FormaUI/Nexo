import { describe, it, expect } from 'vitest';
import { Hover } from '#nexo/language/Hover.mjs';
import { NexoRegistry } from '#nexo/language/vocabulary/NexoRegistry.mjs';
import { Vocabulary } from '#nexo/language/vocabulary/Vocabulary.mjs';

const registry = new NexoRegistry([Vocabulary.module]);

/** What the name at the offset `|` marks reads, against Nexo's own vocabulary, a list of numbers bound as `numbers`. */
const describeAt = marked => Hover.describe(marked.replace('|', ''), marked.indexOf('|'), [], registry, { numbers: 'List<Number>' });

describe('Hover', () => {
    it("describes a member by the declaration resolution selected, its signature, its qualified name and the type of what it answers, a call's where it is called", () => {
        expect(describeAt('numbers.co|unt')).toEqual({ name: 'count', kind: 'property', range: { start: 8, end: 13 }, detail: 'count: Number', qualifiedName: 'List.count', type: 'Number' });
        expect(describeAt('numbers.sel|ect(it + 1)')).toEqual({ name: 'select', kind: 'function', range: { start: 8, end: 14 }, detail: 'select<U>(expression: U): List<U>', qualifiedName: 'List.select', type: 'List<Number>' });
    });

    it('describes a name in scope by the nearest construct that declares it, the innermost name the offset stands on or after', () => {
        expect(describeAt('{ a = 1, b = a| }')).toEqual({ name: 'a', kind: 'objectField', range: { start: 13, end: 14 }, type: 'Number' });
        expect(describeAt('let a = 1\nreturn { let a = "x", b = a| }')).toMatchObject({ kind: 'local', type: 'String' });
        expect(describeAt('if let n = numbers.first then n| else 0 end')).toMatchObject({ kind: 'conditionalBinding', type: 'Number' });
        expect(describeAt('numbers.select(n => n|)')).toMatchObject({ kind: 'functionParameter', type: 'Number' });
        expect(describeAt('numbers|.count')).toEqual({ name: 'numbers', kind: 'scriptParameter', range: { start: 0, end: 7 }, type: 'List<Number>' });
    });

    it('answers null on no name, and on a name resolution selected no declaration for', () => {
        expect(describeAt('1 |+ 2')).toBeNull();
        expect(describeAt('numbers.cuo|nt')).toBeNull();
    });
});
