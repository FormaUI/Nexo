import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { nexo } from '#nexo/nexo.js';
import { errorThrownBy, expectNexoError } from './support/errors.mjs';
import { createExamplesEnergy, createExamplesFixtures, createExamplesHome } from './support/examples.mjs';
import { repositoryRoot } from './support/paths.mjs';

const { createPropertyDeclaration, createFunctionDeclaration, createValueParameterDeclaration } = nexo.declarations;

/** A shop whose items have a name and a price, and whose orders hold items, each type of a module of its own. */
const shop = nexo.createModule('Shop', {
    types: [
        { name: 'Item', kind: 'structured', members: [createPropertyDeclaration('name', 'String'), createPropertyDeclaration('price', 'Number')] },
        {
            name: 'Order',
            kind: 'reference',
            isInstance: value => value?.isOrder === true,
            members: [
                createPropertyDeclaration('items', 'List<Item>', { updates: { changes: 'constant', reads: 'fresh' } }),
                createFunctionDeclaration('item', 'Item?', { updates: { changes: 'constant', reads: 'fresh' }, parameters: [createValueParameterDeclaration('name', 'String')] }),
            ],
        },
    ],
});
const registry = nexo.createRegistry([shop]);
const options = { registry, types: { order: 'Shop.Order' }, imports: ['Shop'] };

/** The text a tree holds, rebuilt from its tokens, the tokens skipped before each among them, and the trivia before each. */
const textOf = (node, text) => {
    if (node.children === undefined) {
        return `${(node.skipped ?? []).map(each => text.slice(each.triviaStart, each.end)).join('')}${text.slice(node.triviaStart, node.end)}`;
    }

    return node.children.map(child => textOf(child, text)).join('');
};

/** The `nexo` blocks of the specification's documents, each a script as it is written. */
const examples = () => ['spec/language/expressions.md', 'spec/language/collections.md', 'spec/language/scripts.md', 'spec/language/functions.md', 'spec/language/members.md'].flatMap(file => readFileSync(resolve(repositoryRoot, file), 'utf8').split('```nexo\n').slice(1).map(block => block.split('\n```')[0]));

describe('nexo.tooling', () => {
    it('lists the token types and the node kinds tooling reads, frozen', () => {
        expect(nexo.tooling.tokenTypes).toEqual(expect.arrayContaining(['identifier', 'invalid', 'end', 'interpolation-start', '?:', '..']));
        expect(nexo.tooling.nodeKinds).toEqual(expect.arrayContaining(['script', 'body', 'member-call', 'extension-access', 'dictionary-entry']));
        expect(Object.isFrozen(nexo.tooling.tokenTypes) && Object.isFrozen(nexo.tooling.nodeKinds)).toBe(true);
    });

    describe('scan', () => {
        it('answers every token of any text, its trivia, and an invalid token for text that is no token, with its diagnostic', () => {
            const tokens = nexo.tooling.scan('a + # // note\n"b');

            expect(tokens.map(token => token.type)).toEqual(['identifier', '+', 'invalid', 'invalid', 'end']);
            expect(tokens[2]).toEqual({ type: 'invalid', start: 4, end: 5, triviaStart: 3, trivia: [{ kind: 'whitespace', start: 3, end: 4 }], diagnostic: { code: 'NEXO1000', message: "Unexpected '#'", offset: 4 } });
            expect(tokens[3]).toMatchObject({ start: 14, end: 16, trivia: [{ kind: 'whitespace', start: 5, end: 6 }, { kind: 'line-comment', start: 6, end: 14 }], diagnostic: { code: 'NEXO1510', offset: 14 } });
            expect(Object.isFrozen(tokens) && Object.isFrozen(tokens[2]) && Object.isFrozen(tokens[2].trivia)).toBe(true);
        });

        it("keeps each string's written form, its quote and its delimiter's length, beside the text it stands for", () => {
            const [raw, block] = nexo.tooling.scan("'it''s' $\"\"\"\n    hi\n    \"\"\"");

            expect(raw).toMatchObject({ type: 'literal', value: "it's", quote: "'", delimiter: 1 });
            expect(block).toMatchObject({ type: 'interpolated-string-start', quote: '"', delimiter: 3 });
        });

        it('refuses what is no text, a misuse of the API rather than a diagnostic (NEXO2645)', () => {
            expectNexoError(errorThrownBy(() => nexo.tooling.scan(5)), 'NEXO2645', 'structure');
        });
    });

    describe('parse', () => {
        it('reads a text that follows the grammar into its tree, each node with its kind and its range, and no diagnostic', () => {
            const text = 'room { size = it.size }';
            const { tree, diagnostics } = nexo.tooling.parse(text);

            expect(diagnostics).toEqual([]);
            expect(tree).toMatchObject({ kind: 'script', start: 0, end: 23 });
            expect(tree.children[0]).toMatchObject({ kind: 'chain', start: 0, end: 23, children: [{ type: 'identifier', value: 'room' }, { kind: 'object' }] });
            expect(textOf(tree, text)).toBe(text);
            expect(Object.isFrozen(tree) && Object.isFrozen(tree.children)).toBe(true);
        });

        it('stands a token the text lacks missing in its place, of the type expected, with no text, and records why', () => {
            const text = '{ a = room., b = f(1 }';
            const { tree, diagnostics } = nexo.tooling.parse(text);
            const tokens = [];
            const collect = node => (node.children === undefined ? tokens.push(node) : node.children.forEach(collect));

            collect(tree);

            expect(tokens.filter(token => token.missing === true).map(token => [token.type, token.start, token.end])).toEqual([['identifier', 11, 11], [')', 20, 20]]);
            expect(diagnostics.map(({ code, location, range }) => ({ code, location, range }))).toEqual([
                { code: 'NEXO1000', location: { offset: 11, line: 1, column: 12 }, range: { start: 11, end: 12 } },
                { code: 'NEXO1000', location: { offset: 21, line: 1, column: 22 }, range: { start: 21, end: 22 } },
            ]);
            expect(diagnostics[0].message).toBe("Expected an identifier, found ',' (line 1, column 12)");
            expect(diagnostics[1].message).toBe("Expected ',' before the next argument, or ')' closing them, found '}' (line 1, column 22)");
            expect(textOf(tree, text)).toBe(text);
        });

        it('skips what begins nothing the construct reads to what it awaits, the token it resumes at holding what it skipped, and goes on to report the next', () => {
            const text = '{ a = 1 2 3, b = foo bar, c = [1,, 2] }';
            const { tree, diagnostics } = nexo.tooling.parse(text);
            const object = tree.children[0];
            const commas = object.children.filter(child => child.type === ',');

            expect(diagnostics.map(diagnostic => [diagnostic.code, diagnostic.location.offset])).toEqual([['NEXO1000', 8], ['NEXO1011', 21], ['NEXO1068', 33]]);
            expect(commas[0].skipped.map(token => token.value)).toEqual([2, 3]);
            expect(commas[1].skipped.map(token => token.value)).toEqual(['foo', 'bar']);
            expect(object.children.filter(child => child.kind === 'field').length).toBe(3);
            expect(textOf(tree, text)).toBe(text);
        });

        it('records a diagnostic once where a construct reaches what an enclosing one awaits, the constructs within it closing with what they lack', () => {
            const { diagnostics } = nexo.tooling.parse('{ a = if b, c = 1 }');

            expect(diagnostics.map(diagnostic => [diagnostic.code, diagnostic.location.offset, diagnostic.message])).toEqual([['NEXO1000', 10, "Expected 'then' after the condition, found ',' (line 1, column 11)"]]);
        });

        it('records an invalid token\'s diagnostic once, leaving out what the parser meets right after the text it lacks', () => {
            const { diagnostics } = nexo.tooling.parse('{ a = # }');

            expect(diagnostics.map(diagnostic => diagnostic.code)).toEqual(['NEXO1000']);
            expect(diagnostics[0].message).toBe("Unexpected '#' (line 1, column 7)");
        });

        it("records a line structure's failures across the text, each with its code", () => {
            const { diagnostics } = nexo.tooling.parse('{\n    a = 1\n        + 2,\n    b = (3 +\n        4)\n}');

            expect(diagnostics.map(diagnostic => [diagnostic.code, diagnostic.location.line])).toEqual([['NEXO1042', 3], ['NEXO1064', 4]]);
        });

        it('gives the error a strict reading throws as its first diagnostic, with its code, its message and its location', () => {
            for (const text of ['{ a = }', 'if a then b', 'room.devices(', 'let x = 1', '[10,', '"open']) {
                const strict = errorThrownBy(() => nexo.parse(text));
                const [first] = nexo.tooling.parse(text).diagnostics;

                expect({ code: first.code, message: first.message, location: first.location }, text).toEqual({ code: strict.code, message: strict.message, location: strict.location });
            }
        });

        it('reads the text with the imports its options supply, which decide which names begin namespaces', () => {
            const { tree } = nexo.tooling.parse('Shop.open', { imports: ['Shop'] });

            expect(tree.children[0].kind).toBe('namespace-access');
        });
    });

    describe('getDiagnostics', () => {
        it('collects every diagnostic of a text, its syntax, its structure and, against a registry, its resolution, each with its code, kind, message, location and range', () => {
            const text = '{\n    a = order.itmes,\n    b = order.,\n    c = it.size,\n    d = 1 + "x"\n}';
            const diagnostics = nexo.tooling.getDiagnostics(text, options);

            expect(diagnostics.map(({ code, kind, location, range }) => ({ code, kind, location, range }))).toEqual([
                { code: 'NEXO1000', kind: 'syntax', location: { offset: 37, line: 3, column: 15 }, range: { start: 37, end: 38 } },
                { code: 'NEXO2026', kind: 'structure', location: { pointer: '/expression/objectFields/2/value/receiver', offset: 47, line: 4, column: 9 }, range: { start: 47, end: 49 } },
                { code: 'NEXO3001', kind: 'validation', location: { pointer: '/expression/objectFields/0/value', offset: 10, line: 2, column: 9 }, range: { start: 10, end: 21 } },
                { code: 'NEXO3067', kind: 'validation', location: { pointer: '/expression/objectFields/3/value/right', offset: 68, line: 5, column: 13 }, range: { start: 68, end: 71 } },
            ]);
            expect(diagnostics[2].message).toBe("'itmes' is no member of the vocabulary (line 2, column 9, at /expression/objectFields/0/value)");
            expect(Object.isFrozen(diagnostics) && Object.isFrozen(diagnostics[0]) && Object.isFrozen(diagnostics[0].location)).toBe(true);
        });

        it('answers none for a script that resolves, and the error a strict resolution throws among those of one that does not', () => {
            expect(nexo.tooling.getDiagnostics('order.items.where(it.price > 2).count', options)).toEqual([]);

            const bindings = registry.createBindings({ order: { isOrder: true } }, { types: { order: 'Shop.Order' } });
            const strict = errorThrownBy(() => registry.resolve('order.item(3)', bindings, { imports: ['Shop'] }));
            const [diagnostic] = nexo.tooling.getDiagnostics('order.item(3)', options);

            expect({ code: diagnostic.code, kind: diagnostic.kind, message: diagnostic.message, location: diagnostic.location }).toEqual({ code: strict.code, kind: strict.kind, message: strict.message, location: strict.location });
        });

        it('reads a part the text lacks, and a node whose resolution failed, as a value of Any, leaving out the diagnostics of what holds it', () => {
            // `total` reads a field that failed, and the object holds a field the text lacks, neither of which gives a diagnostic of its own.
            const diagnostics = nexo.tooling.getDiagnostics('{ a = order.nothing, total = a + 1, b = }', options);

            expect(diagnostics.map(diagnostic => diagnostic.code)).toEqual(['NEXO1000', 'NEXO3001']);
        });

        it('checks structure and syntax alone without a registry, and leaves out resolution', () => {
            expect(nexo.tooling.getDiagnostics('{ a = it.x, b = order.itmes }').map(diagnostic => diagnostic.code)).toEqual(['NEXO2026']);
        });

        it("records a binding's type its registry can't read, at the binding, before the definition's structure, and resolves without it", () => {
            const diagnostics = nexo.tooling.getDiagnostics('{ a = it.x, b = order.items.count, c = count }', { ...options, types: { order: 'Shop.Order', count: 'Shop.Nothing' } });

            expect(diagnostics.map(({ code, location }) => ({ code, location }))).toEqual([
                { code: 'NEXO2036', location: { binding: 'count' } },
                { code: 'NEXO2026', location: { pointer: '/expression/objectFields/0/value/receiver', offset: 6, line: 1, column: 7 } },
                { code: 'NEXO3009', location: { pointer: '/expression/objectFields/2/value', offset: 39, line: 1, column: 40 } },
            ]);
            expect(diagnostics[0].range).toBeUndefined();
        });

        it('records an import the registry cannot give, and leaves out its body\'s diagnostics, which depend on what it imports', () => {
            const diagnostics = nexo.tooling.getDiagnostics('import Shop\nimport Stock\n\nStock.level + order.itmes', { registry, types: { order: 'Shop.Order' } });

            expect(diagnostics.map(({ code, location }) => [code, location.pointer])).toEqual([['NEXO3002', '/imports/1']]);
        });

        it("settles nothing a binding's value would, since a binding declared by its type alone holds none", () => {
            const diagnostics = nexo.tooling.getDiagnostics('order.[name]', { ...options, types: { order: 'Shop.Order', name: 'String' } });

            expect(diagnostics.map(diagnostic => diagnostic.code)).toEqual(['NEXO3014']);
        });

        it('refuses options a host misuses, never a text: a registry no createRegistry created (NEXO2647), types that are no plain object (NEXO2020) and imports that break their rules (NEXO2008)', () => {
            expectNexoError(errorThrownBy(() => nexo.tooling.getDiagnostics('1', { registry: {} })), 'NEXO2647', 'structure');
            expectNexoError(errorThrownBy(() => nexo.tooling.getDiagnostics('1', { registry, types: [] })), 'NEXO2020', 'structure');
            expectNexoError(errorThrownBy(() => nexo.tooling.getDiagnostics('1', { imports: [5] })), 'NEXO2008', 'structure');
            expectNexoError(errorThrownBy(() => nexo.tooling.getDiagnostics(null)), 'NEXO2645', 'structure');
        });
    });

    it('never throws for any text, and its tree holds every character of it: each prefix of the specification\'s examples, and each with a token removed or a stray one written in', () => {
        const { home, values, types } = createExamplesFixtures();
        const examplesRegistry = nexo.createRegistry([createExamplesHome(home), createExamplesEnergy()]);
        const bindings = examplesRegistry.createBindings(values, { types });
        const declared = Object.fromEntries(Object.keys(values).map(name => [name, bindings.getType(name)]).filter(([, type]) => !type.includes('{')));
        const read = { registry: examplesRegistry, types: declared, imports: ['Home', 'Energy'] };
        let texts = 0;

        for (const example of examples()) {
            for (let offset = 0; offset <= example.length; offset += Math.max(1, Math.floor(example.length / 12))) {
                for (const text of [example.slice(0, offset), `${example.slice(0, offset)}${example.slice(offset + 2)}`, `${example.slice(0, offset)} ) ${example.slice(offset)}`, `${example.slice(0, offset)}"${example.slice(offset)}`]) {
                    const { tree, diagnostics } = nexo.tooling.parse(text, read);

                    expect(textOf(tree, text), text).toBe(text);
                    expect(nexo.tooling.getDiagnostics(text, read).slice(0, diagnostics.length), text).toEqual(diagnostics);
                    texts++;
                }
            }
        }

        expect(texts).toBeGreaterThan(1000);
    });
});
