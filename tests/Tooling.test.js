import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { nexo } from '#nexo/nexo.js';
import { errorThrownBy, expectNexoError } from './support/errors.mjs';
import { createExamplesEnergy, createExamplesFixtures, createExamplesHome } from './support/examples.mjs';
import { repositoryRoot } from './support/paths.mjs';

const { createPropertyDeclaration, createFunctionDeclaration, createValueParameterDeclaration } = nexo.declarations;

/** A shop whose items have a name and a price, whose orders hold items, and which shouts a word, an extension of a string. */
const shop = nexo.createModule('Shop', {
    types: [
        { name: 'Item', kind: 'structured', members: [createPropertyDeclaration('name', 'String'), createPropertyDeclaration('price', 'Number')] },
        { name: 'Words', kind: 'extension', target: 'String', members: [createPropertyDeclaration('shout', 'String', { updates: { changes: 'constant', reads: 'fresh' } })] },
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

/** The text and the offset a text marked with `|` where a tool asks gives. */
const at = marked => [marked.replace('|', ''), marked.indexOf('|')];

/** The completions at the marked offset, each as its kind, what it inserts and its detail. */
const completionsAt = (marked, given = options) => nexo.tooling.getCompletions(...at(marked), given).map(({ kind, insert, detail }) => [kind, insert, detail]);

/** The text a tree holds, rebuilt from its tokens, the tokens skipped before each among them, and the trivia before each. */
const textOf = (node, text) => {
    if (node.children === undefined) {
        return `${(node.skipped ?? []).map(each => text.slice(each.triviaStart, each.end)).join('')}${text.slice(node.triviaStart, node.end)}`;
    }

    return node.children.map(child => textOf(child, text)).join('');
};

/** The `nexo` blocks of the specification's documents, each a script as it is written. */
const examples = () => readdirSync(resolve(repositoryRoot, 'spec/language')).flatMap(file => readFileSync(resolve(repositoryRoot, 'spec/language', file), 'utf8').split('```nexo\n').slice(1).map(block => block.split('\n```')[0]));

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

    describe('format', () => {
        it('lays a text out as it was written, its comments, its strings and its line breaks kept, its lines indented and its tokens spaced as canonical text does', () => {
            const text = "import Shop\n\n{\n  // the items' names\n  names = order.items\n  .select(it.name),   // in order\n  label = 'it''s'\n}\n";

            expect(nexo.tooling.format(text)).toBe("import Shop\n\n{\n    // the items' names\n    names = order.items\n        .select(it.name), // in order\n    label = 'it''s'\n}\n");
            expect(nexo.format(text)).toBe('import Shop\n\n{\n    names = order.items.select(it.name),\n    label = "it\'s"\n}');
        });

        it("formats each of the specification's examples, and each with its lines indented otherwise, as canonical text, which reads back as the same definition, and formats its own text as it is", () => {
            const read = { imports: ['Home', 'Energy'] };
            let formatted = 0;

            for (const example of examples()) {
                const strict = nexo.tooling.getDiagnostics(example, read);

                // An example the specification gives as an error has no canonical text.
                if (strict.some(diagnostic => diagnostic.kind === 'syntax' || diagnostic.kind === 'structure')) {
                    continue;
                }

                const canonical = nexo.format(example, read);

                const reindented = canonical.split('\n').map((line, index) => line.replace(/^ */, ['', '\t', ' '][index % 3])).join('\n');
                const kept = nexo.tooling.format(example, read);

                expect(nexo.tooling.format(canonical, read)).toBe(canonical);
                expect(nexo.tooling.format(reindented, read)).toBe(canonical);
                expect(nexo.parse(kept, read), example).toEqual(nexo.parse(example, read));
                expect(nexo.tooling.format(kept, read)).toBe(kept);
                formatted++;
            }

            expect(formatted).toBeGreaterThan(20);
        });

        it('answers a text that breaks the grammar as it is, and refuses what is no text (NEXO2645)', () => {
            expect(nexo.tooling.format('{ a = room.,\n    b = 1 }')).toBe('{ a = room.,\n    b = 1 }');
            expectNexoError(errorThrownBy(() => nexo.tooling.format(5)), 'NEXO2645', 'structure');
        });
    });

    describe('getCompletions', () => {
        it("offers the members a receiver's type selects after a dot, each with what it inserts, the range it replaces, its signature and its qualified name", () => {
            const [completion] = nexo.tooling.getCompletions(...at('order.it|'), options);

            expect(completion).toEqual({ name: 'items', kind: 'property', insert: 'items', range: { start: 6, end: 8 }, detail: 'items: List<Item>', qualifiedName: 'Order.items' });
            expect(completionsAt('order.|')).toEqual([['property', 'items', 'items: List<Item>'], ['function', 'item', 'item(name: String): Item?']]);
            expect(nexo.tooling.getCompletions(...at('order.|'), options)[0].range).toEqual({ start: 6, end: 6 });
            expect(completionsAt('order.item("tea")?.|')).toEqual([['property', 'name', 'name: String'], ['property', 'price', 'price: Number']]);
        });

        it('offers the names in scope where a value stands, nearest first, then the script parameters and the namespaces, and it and root where they stand', () => {
            expect(completionsAt('let total = 2\nreturn order.items { a = it.price * total, b = | }')).toEqual([
                ['local', 'total', 'Number'],
                ['objectField', 'a', 'Number'],
                ['implicitParameter', 'it', 'Item'],
                ['objectRoot', 'root', undefined],
                ['scriptParameter', 'order', 'Order'],
                ['namespace', 'Shop', 'Shop'],
            ]);
            expect(completionsAt('order.items.where(it.|)')).toEqual([['property', 'name', 'name: String'], ['property', 'price', 'price: Number']]);
            expect(completionsAt('order.items.select(each => each.pr|)').map(([, insert]) => insert)).toEqual(['name', 'price']);
        });

        it('writes a name as it must be written there: a local a keyword names after @, and a script parameter a name in scope hides after ~', () => {
            expect(completionsAt('let to = 1\nreturn { order = to, b = | }', { ...options, types: { order: 'Shop.Order', to: 'Number' } }).map(([kind, insert]) => [kind, insert])).toEqual([
                ['local', '@to'],
                ['objectField', 'order'],
                ['objectRoot', 'root'],
                ['scriptParameter', '~order'],
                ['scriptParameter', '~to'],
                ['namespace', 'Shop'],
            ]);
        });

        it("offers the extension members that apply to a receiver after a colon, a namespace's members after its dot, and the modules and their types after import", () => {
            expect(completionsAt('"tea":|')).toEqual([['property', 'shout', 'shout: String']]);
            expect(completionsAt('Shop.|').map(([kind, insert]) => [kind, insert])).toEqual([['property', 'items'], ['property', 'name'], ['property', 'price'], ['function', 'item']]);
            expect(completionsAt('import |\n\n1')).toEqual([['module', 'Shop', 'module']]);
            expect(completionsAt('import Shop.|\n\n1')).toEqual([['type', 'Item', 'structured'], ['type', 'Order', 'reference'], ['extension', 'Words', 'extension']]);
        });

        it('offers only what the script reaches: no member its imports leave out, none of a receiver of Any, and nothing within a string or a comment', () => {
            expect(completionsAt('order.|', { registry, types: { order: 'Shop.Order' } })).toEqual([]);
            expect(completionsAt('(order.items.first?.name ?? "").|').map(([, insert]) => insert)).toContain('length');
            expect(completionsAt('order.items.first.name.|')).toEqual([]);
            expect(completionsAt('"order.|"')).toEqual([]);
            expect(completionsAt('order // order.|')).toEqual([]);
        });

        it('reads Nexo\'s own vocabulary where no registry is given, and refuses an offset outside the text (NEXO2648)', () => {
            expect(completionsAt('"tea".|', {}).map(([, insert]) => insert)).toContain('uppercase');
            expectNexoError(errorThrownBy(() => nexo.tooling.getCompletions('order', 6, options)), 'NEXO2648', 'structure');
            expectNexoError(errorThrownBy(() => nexo.tooling.getHover('order', 1.5, options)), 'NEXO2648', 'structure');
        });
    });

    describe('getHover', () => {
        it("describes the member a name reads: its kind, its signature, its qualified name and the type of what it answers there", () => {
            expect(nexo.tooling.getHover(...at('order.it|em("tea")'), options)).toEqual({ name: 'item', kind: 'function', range: { start: 6, end: 10 }, detail: 'item(name: String): Item?', qualifiedName: 'Order.item', type: 'Item?' });
            expect(nexo.tooling.getHover(...at('order.items.count|'), options)).toMatchObject({ name: 'count', kind: 'property', qualifiedName: 'List.count', type: 'Number' });
        });

        it('describes a name in scope by what declares it, a script parameter, it, root and a namespace, each with its type there', () => {
            const text = 'let total = 2\nreturn order.items { a = it.price * total, b = root.a, c = Shop.item }';
            const hoverAt = word => nexo.tooling.getHover(text, text.lastIndexOf(word) + 1, options);

            expect(hoverAt('total')).toEqual({ name: 'total', kind: 'local', range: { start: 50, end: 55 }, type: 'Number' });
            expect(hoverAt('order')).toMatchObject({ kind: 'scriptParameter', type: 'Order' });
            expect(hoverAt('it.price')).toMatchObject({ kind: 'implicitParameter', type: 'Item' });
            expect(hoverAt('item')).toMatchObject({ name: 'item', kind: 'function', qualifiedName: 'Shop.item' });
            expect(hoverAt('root')).toMatchObject({ kind: 'objectRoot' });
            expect(hoverAt('Shop')).toEqual({ name: 'Shop', kind: 'namespace', range: { start: 73, end: 77 }, detail: 'Shop' });
            expect(nexo.tooling.getHover('[1].select(n => n + 1)', 16, options)).toEqual({ name: 'n', kind: 'functionParameter', range: { start: 16, end: 17 }, type: 'Number' });
        });

        it('answers null where the offset stands on no name, or on one no declaration resolution selected reads', () => {
            expect(nexo.tooling.getHover('1 + 2', 2, options)).toBeNull();
            expect(nexo.tooling.getHover('order.itmes', 8, options)).toBeNull();
        });
    });

    it("completes and describes the specification's examples at their offsets without throwing, each answer frozen", () => {
        const { home, values, types } = createExamplesFixtures();
        const examplesRegistry = nexo.createRegistry([createExamplesHome(home), createExamplesEnergy()]);
        const bindings = examplesRegistry.createBindings(values, { types });
        const declared = Object.fromEntries(Object.keys(values).map(name => [name, bindings.getType(name)]).filter(([, type]) => !type.includes('{')));
        const read = { registry: examplesRegistry, types: declared, imports: ['Home', 'Energy'] };
        let offered = 0;

        for (const example of examples()) {
            for (let offset = 0; offset <= example.length; offset += 5) {
                const completions = nexo.tooling.getCompletions(example, offset, read);
                const hover = nexo.tooling.getHover(example, offset, read);

                expect(Object.isFrozen(completions) && (hover === null || Object.isFrozen(hover))).toBe(true);
                offered += completions.length;
            }
        }

        expect(offered).toBeGreaterThan(1000);
    }, 60000);

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
                    expect(typeof nexo.tooling.format(text, read)).toBe('string');
                    texts++;
                }
            }
        }

        expect(texts).toBeGreaterThan(1000);
    }, 60000);
});
