import { describe, it, expect } from 'vitest';
import { SyntaxTree } from '#nexo/language/SyntaxTree.mjs';
import { TextReading } from '#nexo/language/TextReading.mjs';
import { Tokenizer } from '#nexo/language/Tokenizer.mjs';
import { NexoRegistry } from '#nexo/language/vocabulary/NexoRegistry.mjs';
import { Vocabulary } from '#nexo/language/vocabulary/Vocabulary.mjs';

/** A registry of Nexo's own vocabulary alone. */
const registry = new NexoRegistry([Vocabulary.module]);

describe('TextReading', () => {
    it('reads a text that follows the grammar into its tree and its definition, with no diagnostic and no hole', () => {
        const reading = new TextReading('{ size = 1 }', []);

        expect(reading.syntaxDiagnostics).toEqual([]);
        expect(reading.definition.expression).toEqual({ kind: 'object', objectFields: [{ name: 'size', value: { kind: 'literal', value: 1 } }] });
        expect(SyntaxTree.textOf(reading.tree)).toBe('{ size = 1 }');
    });

    it('lowers a value the text lacks to a hole, a member whose name it lacks to a hole of its receiver, and an object of no field to a hole', () => {
        const reading = new TextReading('{ a = , b = items., c = Shop., d = {} }', [{ module: 'Shop' }]);

        expect(reading.definition.expression.objectFields.map(field => field.value)).toEqual([
            { kind: 'hole' },
            { kind: 'hole', receiver: { kind: 'scriptParameter', name: 'items' } },
            { kind: 'hole' },
            { kind: 'hole' },
        ]);
        expect(reading.locations.getSpan('/expression/objectFields/1/value')).toEqual({ start: 12, end: 18 });
    });

    it('answers each stage\'s diagnostics in the order of the text, a syntax diagnostic\'s range the token at its offset and a script\'s the span its pointer names', () => {
        const reading = new TextReading('{ b = it.x, a = (1 2) }', []);

        expect(reading.getDiagnostics(null, {}).map(({ code, kind, range }) => ({ code, kind, range }))).toEqual([
            { code: 'NEXO1000', kind: 'syntax', range: { start: 19, end: 20 } },
            { code: 'NEXO2026', kind: 'structure', range: { start: 6, end: 8 } },
        ]);
    });

    it('validates through holes, leaving out what a hole explains, and resolves against the registry with bindings of the types declared, each refusal of one at its binding', () => {
        const reading = new TextReading('{ a = count.round, b = , c = (it.x).y, d = items.first }', []);
        const { definition, diagnostics } = reading.validate();
        const resolved = reading.resolve(registry, { count: 'Number', items: 'List<Nothing>' });

        expect(definition.expression.objectFields.map(field => field.value.kind)).toEqual(['memberAccess', 'hole', 'memberAccess', 'memberAccess']);
        expect(diagnostics.map(error => [error.code, error.location.pointer])).toEqual([['NEXO2026', '/expression/objectFields/2/value/receiver/receiver']]);
        expect(resolved.bindingDiagnostics.map(error => [error.code, error.location])).toEqual([['NEXO2036', { binding: 'items' }]]);
        expect(resolved.diagnostics.map(error => [error.code, error.location.pointer])).toEqual([['NEXO3009', '/expression/objectFields/3/value/receiver']]);
        expect(String(resolved.resolver.nodeTypes.get('/expression/objectFields/0/value'))).toBe('Number');
    });

    it("keeps the scanner's tokens in order through an interpolation that reads past a block's closing delimiter, so the tree holds each character once", () => {
        const text = '{ m = $"""\n    Saved {"path}\n    """\n}';
        const tokens = Tokenizer.scan(text);

        expect(tokens.every((token, index) => token.end >= token.start && (index === 0 || token.triviaStart >= tokens[index - 1].end))).toBe(true);
        expect(SyntaxTree.textOf(new TextReading(text, []).tree)).toBe(text);
    });
});
