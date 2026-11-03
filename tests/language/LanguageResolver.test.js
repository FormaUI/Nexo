import { describe, it, expect } from 'vitest';
import { LanguageResolver } from '#nexo/language/LanguageResolver.mjs';
import { ParameterBindings } from '#nexo/language/ParameterBindings.mjs';
import { ParsedTexts } from '#nexo/language/ParsedTexts.mjs';
import { Declarations } from '#nexo/language/vocabulary/Declarations.mjs';
import { NexoModule } from '#nexo/language/vocabulary/NexoModule.mjs';
import { NexoRegistry } from '#nexo/language/vocabulary/NexoRegistry.mjs';
import { Vocabulary } from '#nexo/language/vocabulary/Vocabulary.mjs';
import { constantUpdates } from '../support/updates.mjs';
import { dataPropertyDeclarations, extensionDeclaration, operatorDeclaration } from '../support/declarations.mjs';
import { errorThrownBy } from '../support/errors.mjs';
import { parseImporting } from '../support/pipeline.mjs';

/** A word the shop sells, a value with identity the shop recognizes. */
class Word {
    constructor(text) {
        this.text = text;
    }
}

const padding = countType => Declarations.createFunctionDeclaration('pad', 'String', { updates: constantUpdates, parameters: [Declarations.createValueParameterDeclaration('count', countType)], impl: ({ receiver }) => receiver });
const trimming = impl => Declarations.createFunctionDeclaration('trim', 'String', { updates: constantUpdates, parameters: [Declarations.createValueParameterDeclaration('count', 'Number')], impl });

/**
 * A shop whose `pad` is a module member taking a word and a count written as a string, a member of its own word taking a count, which its namespace reaches too, and a member of a Boolean taking a count written as a
 * string; and whose `trim` is a member of a string and of a Boolean, each taking a count.
 */
const registry = new NexoRegistry([Vocabulary.module, new NexoModule('shop', {
    typeOf: value => (value instanceof Word ? 'Word' : null),
    types: [
        { name: 'Word', kind: 'reference', isInstance: value => value instanceof Word, members: [padding('Number')] },
        extensionDeclaration('Booleans', 'Boolean', [padding('String'), trimming(() => 'trimmed')]),
        extensionDeclaration('Strings', 'String', [trimming(({ receiver }) => receiver)]),
    ],
    members: [
        Declarations.createFunctionDeclaration('pad', 'String', { updates: constantUpdates, parameters: [Declarations.createValueParameterDeclaration('text', 'Word'), Declarations.createValueParameterDeclaration('count', 'String')], impl: ({ args }) => args.text }),
    ],
})]);

/** Local functions a script's arguments call, each call resolving a copy of its body: one answering a number and one a string. */
const LOCALS = 'let next = function(x)\n    return x + 1\nend\nlet same = function(s)\n    return s\nend';

/** The script resolved against the shop, with `missing` bound to null and `word` to one of its words. */
const resolve = result => {
    const definition = ParsedTexts.parse(`${LOCALS}\nreturn ${result}`, [{ module: 'shop' }]);

    return new LanguageResolver(registry, new ParameterBindings(registry, { missing: null, word: new Word('oat') }), ParsedTexts.locationsOf(definition)).resolveDefinition(definition);
};

/** What a resolution kept of the three stores a speculative resolution restores: each use by its name and pointer, the pointer of each body copy, and whether the pointer was resolved. */
const keptOf = (resolved, pointer) => ({
    uses: resolved.usedDeclarations.map(use => `${use.qualifiedName}@${use.pointer}`),
    copies: resolved.functionBodyCopies.map(bodyCopy => bodyCopy.pointer),
    isResolved: resolved.getResolution(pointer) !== undefined,
});

describe('LanguageResolver', () => {
    describe('a reading through a namespace that fits two ways', () => {
        it('keeps nothing of a refused reading: no resolution, no use and no body copy', () => {
            // The module member's count is a string, so its reading is refused after it resolved `next(1)`; the qualified form's count is a number.
            expect(keptOf(resolve('shop.pad(word, next(1))'), '/expression/result/arguments/1')).toEqual({
                uses: ['Word.pad@/expression/result'],
                copies: ['/expression/result/arguments/1/body'],
                isResolved: true,
            });
        });

        it('keeps a successful reading\'s records where a later reading is refused', () => {
            // The module member takes a string count; the qualified form, read later, is refused for the same argument after resolving it again.
            const resolved = resolve('shop.pad(word, same("x"))');

            expect(keptOf(resolved, '/expression/result/arguments/1')).toEqual({
                uses: ['shop.pad@/expression/result'],
                copies: ['/expression/result/arguments/1/body'],
                isResolved: true,
            });

            const { kind, declaration } = resolved.getResolution('/expression/result');

            expect({ kind, name: declaration.name, takesReceiver: registry.takesReceiver(declaration) }).toEqual({ kind: 'invocation', name: 'pad', takesReceiver: false });
        });
    });

    describe('the candidates of a receiver of unknown type', () => {
        it('keeps nothing of a refused candidate\'s arguments', () => {
            // Of the two `pad`s of a receiver, the word's takes `next(1)` and the Boolean's refuses it, each after resolving it.
            expect(keptOf(resolve('missing?.pad(next(1))'), '/expression/result/chain/arguments/0')).toEqual({ uses: [], copies: [], isResolved: false });
        });

        it('keeps nothing of a fitting candidate\'s arguments, while its fit and its type are kept', () => {
            const resolved = resolve('missing?:trim(next(1))');

            expect(keptOf(resolved, '/expression/result/chain/arguments/0')).toEqual({ uses: [], copies: [], isResolved: false });
            expect(resolved.getResolution('/expression/result/chain')).toMatchObject({ kind: 'invocation', candidates: [{ name: 'trim' }, { name: 'trim' }], arguments: [] });
            expect(String(resolved.type)).toBe('String?');
        });
    });

    describe('a computed property access', () => {
        it('keeps each name\'s resolution by its name and records each use as its name is resolved, its own pointer holding its own resolution', () => {
            const property = (name, result = 'Number') => Declarations.createPropertyDeclaration(name, result, { updates: constantUpdates, impl: () => 1 });
            const lit = new NexoRegistry([Vocabulary.module, new NexoModule('shop', {
                typeOf: value => (value instanceof Word ? 'Word' : null),
                types: [{ name: 'Word', kind: 'reference', isInstance: value => value instanceof Word, members: [property('glow'), property('dim'), property('long', 'Boolean')] }],
            })]);
            const definition = parseImporting(lit, 'return word.[if word.long then "glow" else "dim" end]');
            const resolved = new LanguageResolver(lit, new ParameterBindings(lit, { word: new Word('oat') }), ParsedTexts.locationsOf(definition)).resolveDefinition(definition);
            const { kind, resolutionsByName } = resolved.getResolution('/expression/result');

            expect(kind).toBe('computedPropertyAccess');
            expect([...resolutionsByName].map(([name, resolution]) => [name, resolution.kind, resolution.declaration.name])).toEqual([['glow', 'invocation', 'glow'], ['dim', 'invocation', 'dim']]);
            expect(resolved.usedDeclarations.map(use => `${use.qualifiedName}@${use.pointer}`)).toEqual(['Word.long@/expression/result/name/condition', 'Word.glow@/expression/result', 'Word.dim@/expression/result']);
        });
    });

    describe('an object field and a structured type\'s data property', () => {
        /** A registry whose `Cup` is a structured type of a size, converted from a string. */
        const cups = new NexoRegistry([Vocabulary.module, new NexoModule('shop', {
            types: [{ name: 'Cup', kind: 'structured', members: dataPropertyDeclarations({ size: 'Number' }) }, extensionDeclaration('Orders', 'String', [operatorDeclaration('convert', 'Cup', ({ value }) => ({ size: value.length }))])],
        })]);
        const values = { word: 'oat', pair: { a: 1, b: null }, missing: null };
        const resolveCups = text => {
            const definition = parseImporting(cups, `return ${text}`);

            return new LanguageResolver(cups, new ParameterBindings(cups, values), ParsedTexts.locationsOf(definition)).resolveDefinition(definition);
        };
        const refusalOf = text => {
            try {
                resolveCups(text);
            } catch (error) {
                return { code: error.code, message: error.message, pointer: error.location.pointer };
            }

            return null;
        };

        it('are read by their names: an object field by its name alone, of the type null among them, and a data property by its declaration, which the script uses and never invokes', () => {
            expect(resolveCups('pair.a').getResolution('/expression/result')).toEqual({ kind: 'objectField', name: 'a' });
            expect(String(resolveCups('pair.b').type)).toBe('null');

            const resolved = resolveCups('(word to Cup).size');

            expect(resolved.getResolution('/expression/result')).toEqual({ kind: 'dataProperty', declaration: { name: 'size', kind: 'property', result: 'Number', parameters: [] }, name: 'size' });
            expect(resolved.usedDeclarations.map(use => use.qualifiedName)).toEqual(['String to Cup', 'Cup.size']);
        });

        it('is refused where it is called, as an object field, as a property of a structured type\'s data, and as one where the receiver\'s type is unknown', () => {
            expect(refusalOf('pair.a()')).toEqual({ code: 'NEXO3017', message: expect.stringContaining("'a' is an object field of { a: Number, b: null } and takes no argument: write 'pair.a'"), pointer: '/expression/result' });
            expect(refusalOf('(word to Cup).size()')).toEqual({ code: 'NEXO3017', message: expect.stringContaining("'size' is a property of Cup's data and takes no argument: write '(word to Cup).size'"), pointer: '/expression/result' });
            expect(refusalOf('missing?.size()')).toEqual({ code: 'NEXO3017', message: expect.stringContaining("'size' is a property of a structured type's data and takes no argument: write 'missing?.size'"), pointer: '/expression/result/chain' });
        });
    });

    describe('the object root', () => {
        /** The code of the error resolving the script fails with. */
        const codeOf = result => {
            try {
                resolve(result);
            } catch (error) {
                return error.code;
            }

            return null;
        };

        it('reads the fields completed where it is written, a reference written earlier and a scope captured earlier keeping the fields completed there', () => {
            expect(String(resolve('{ a = 1, b = root.a, c = "x", d = { e = root.c, f = root.b } }').type)).toBe('{ a: Number, b: Number, c: String, d: { e: String, f: Number } }');
            expect(codeOf('{ a = 1, b = root.c, c = 2 }')).toBe('NEXO3044');
            expect(codeOf('{ let peek = () => root.a, a = 1, b = peek() }')).toBe('NEXO3044');
            expect(String(resolve('{ a = 1, b = { let peek = () => root.a, c = peek() } }').type)).toBe('{ a: Number, b: { c: Number } }');
        });

        it('names the fields completed where a reference reads one it lacks, and none before the first', () => {
            /** The message of the error resolving the script fails with. */
            const messageOf = result => {
                try {
                    resolve(result);
                } catch (error) {
                    return error.message;
                }

                return null;
            };

            expect(messageOf('{ a = 1, b = "x", c = root.z, d = 2 }')).toMatch(/those completed are a, b \(/);
            expect(messageOf('{ let early = () => root.z, a = 1, b = { c = early() } }')).toMatch(/none is completed there \(/);
        });
    });

    describe('the name a use is qualified by', () => {
        /** The qualified names `word.fade` uses, where `fade` is a property of an extension of the target given. */
        const usesOf = target => {
            const fading = new NexoRegistry([Vocabulary.module, new NexoModule('shop', {
                types: [extensionDeclaration(target === 'T' ? 'Fades<T>' : 'Fades', target, [Declarations.createPropertyDeclaration('fade', 'String', { updates: constantUpdates, impl: ({ receiver }) => receiver })])],
            })]);
            const definition = parseImporting(fading, 'return word:fade');

            return new LanguageResolver(fading, new ParameterBindings(fading, { word: 'oat' }), ParsedTexts.locationsOf(definition)).resolveDefinition(definition).usedDeclarations.map(use => use.qualifiedName);
        };

        it('is the type the receiver applies to it by, and the name alone where that is a type parameter, which takes a receiver of any type', () => {
            expect(usesOf('String')).toEqual(['String.fade']);
            expect(usesOf('T')).toEqual(['fade']);
        });
    });

    describe('a deferred access', () => {
        it('records the name it accesses and its candidates, each qualified by the type it is declared for, the name alone where that is a type parameter, and uses none of them', () => {
            const fade = () => Declarations.createPropertyDeclaration('fade', 'String', { updates: constantUpdates, impl: ({ receiver }) => receiver });
            const fading = new NexoRegistry([Vocabulary.module, new NexoModule('shop', {
                types: [extensionDeclaration('Fades', 'String', [fade()]), extensionDeclaration('AllFades<T>', 'T', [fade()])],
                members: [Declarations.createFunctionDeclaration('held', 'Any', { updates: constantUpdates, impl: () => 'oat' })],
            })]);
            const definition = ParsedTexts.parse('return shop.held():fade', [{ module: 'shop' }]);
            const resolved = new LanguageResolver(fading, new ParameterBindings(fading, {}), ParsedTexts.locationsOf(definition)).resolveDefinition(definition);
            const [stringFade, anyFade] = fading.getReceiverMembers('fade');

            expect(resolved.getResolution('/expression/result')).toMatchObject({ kind: 'deferred', name: 'fade', candidates: [stringFade, anyFade] });
            expect(resolved.deferredAccesses).toEqual([{ name: 'fade', pointer: '/expression/result', candidates: [{ declaration: stringFade, qualifiedName: 'String.fade', pointer: '/expression/result' }, { declaration: anyFade, qualifiedName: 'fade', pointer: '/expression/result' }] }]);
            expect(resolved.usedDeclarations.map(use => use.qualifiedName)).toEqual(['shop.held']);
            expect(resolved.candidateDeclarations.map(use => use.qualifiedName)).toEqual(['shop.held', 'String.fade', 'fade']);
        });
    });

    describe('whether it may recognize a value', () => {
        const recognizing = new NexoRegistry([Vocabulary.module, new NexoModule('shop', {
            types: [{ name: 'Supplier', kind: 'reference', isInstance: () => true }],
            members: [
                Declarations.createFunctionDeclaration('supplier', 'Supplier?', { invokedBy: 'host' }),
                Declarations.createFunctionDeclaration('takes', 'Number', { updates: constantUpdates, parameters: [Declarations.createValueParameterDeclaration('value', 'Any')], impl: () => 1 }),
                Declarations.createFunctionDeclaration('held', 'Any', { updates: constantUpdates, impl: () => 'oat' }),
                Declarations.createFunctionDeclaration('count', 'Number', { updates: constantUpdates, impl: () => 1 }),
                Declarations.createFunctionDeclaration('restocks', 'Number', { invokedBy: 'host' }),
                Declarations.createFunctionDeclaration('close', undefined, { invokedBy: 'host' }),
            ],
        })]);
        const mayRecognize = text => {
            const definition = ParsedTexts.parse(text, [{ module: 'shop' }]);

            return new LanguageResolver(recognizing, new ParameterBindings(recognizing, { wanted: false }), ParsedTexts.locationsOf(definition)).resolveDefinition(definition).mayRecognize;
        };

        it('may where a declaration it uses gives it a value of Any, in a branch evaluation never takes among them, or where it ends in a host call supplying a nullable reference', () => {
            expect([mayRecognize('shop.held()'), mayRecognize('if wanted then shop.held() else 0 end'), mayRecognize('shop.supplier() { found = it != null }'), mayRecognize('shop.restocks() { n = it, h = shop.held() }')]).toEqual([true, true, true, true]);
        });

        it('may not where nothing it uses gives it a value of Any and its host call supplies no nullable reference, a value parameter of Any and a host call supplying a number among them', () => {
            expect([mayRecognize('shop.count() + 1'), mayRecognize('shop.close()'), mayRecognize('shop.restocks()'), mayRecognize('shop.takes(1)')]).toEqual([false, false, false, false]);
        });
    });

    describe('a logical expression', () => {
        /** A billing module whose functions answer whether an invoice is overdue, a fee and a fee that can be null, none fixed, so no operand decides an expression before it is evaluated. */
        const billing = new NexoRegistry([Vocabulary.module, new NexoModule('billing', {
            members: [
                Declarations.createFunctionDeclaration('overdue', 'Boolean', { updates: constantUpdates, impl: () => true }),
                Declarations.createFunctionDeclaration('fee', 'Number', { updates: constantUpdates, impl: () => 10 }),
                Declarations.createFunctionDeclaration('waived', 'Number?', { updates: constantUpdates, impl: () => null }),
            ],
        })]);
        const resolveBilling = text => {
            const definition = ParsedTexts.parse(text, [{ module: 'billing' }]);

            return new LanguageResolver(billing, new ParameterBindings(billing, {}), ParsedTexts.locationsOf(definition)).resolveDefinition(definition);
        };
        const typeOf = text => String(resolveBilling(text).type);
        const refusalOf = text => errorThrownBy(() => resolveBilling(text));

        it('is of the values that reach it where its value is used: a falsey value its or selects past reaches none, a null fee among them, and parentheses add nothing', () => {
            expect([
                typeOf('billing.overdue() and billing.fee() or 0'),
                typeOf('(billing.overdue() and billing.fee()) or 0'),
                typeOf('billing.overdue() and billing.waived() or 0'),
                typeOf('(billing.overdue() and false) or "late"'),
            ]).toEqual(['Number', 'Number', 'Number', 'String']);
        });

        it('is refused where its value is used and the values reaching it are of no one type, at the logical expression whose value it is', () => {
            expect(refusalOf('billing.overdue() and "late" or 0')).toMatchObject({ code: 'NEXO3040', kind: 'validation', message: expect.stringContaining("What 'or' gives is String or Number"), location: { pointer: '/expression', line: 1, column: 1 } });
            expect(refusalOf('billing.overdue() and billing.fee()')).toMatchObject({ code: 'NEXO3040', kind: 'validation', message: expect.stringContaining("What 'and' gives is false or Number"), location: { pointer: '/expression', line: 1, column: 1 } });
            expect(refusalOf('[billing.fee()].select(billing.overdue() and it)')).toMatchObject({ code: 'NEXO3040', kind: 'validation', location: { pointer: '/expression/arguments/0', line: 1, column: 24 } });
        });

        it('needs no one type where its truthiness alone is tested: a condition, the operand of not, and a predicate', () => {
            expect([
                typeOf('not (billing.overdue() and billing.fee())'),
                typeOf('if billing.overdue() and billing.fee() then "charge" else "skip" end'),
                typeOf('if billing.overdue() then billing.fee() else 0 end'),
                typeOf('[billing.fee()].where(billing.overdue() and it).count'),
            ]).toEqual(['Boolean', 'String', 'Number', 'Number']);
        });

        it('binds its truthy values of one type where a conditional binding binds it, and is refused where they are of none', () => {
            expect(typeOf('if let fee = billing.overdue() and billing.waived() then fee else 0 end')).toBe('Number');
            expect(refusalOf('if let fee = billing.overdue() and "late" or 0 then fee else 0 end')).toMatchObject({ code: 'NEXO3040', kind: 'validation', message: expect.stringContaining("What 'if let' binds is String or Number where it is truthy"), location: { pointer: '/expression/binding/value', line: 1, column: 14 } });
        });

        it('settles its type at a local, which holds one type from its declaration, so a later or reads the local by its type alone', () => {
            expect(refusalOf('let candidate = billing.overdue() and billing.fee()\nreturn candidate or 0')).toMatchObject({ code: 'NEXO3040', kind: 'validation', location: { pointer: '/expression/locals/0/value', line: 1, column: 17 } });
            expect(refusalOf('let waived = billing.overdue() and false\nreturn waived or "late"')).toMatchObject({ code: 'NEXO3040', kind: 'validation', message: expect.stringContaining("What 'or' gives is true or String"), location: { line: 2, column: 8 } });
        });
    });
});
