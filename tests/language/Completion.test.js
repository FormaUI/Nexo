import { describe, it, expect } from 'vitest';
import { Completion } from '#nexo/language/Completion.mjs';
import { Declarations } from '#nexo/language/vocabulary/Declarations.mjs';
import { NexoModule } from '#nexo/language/vocabulary/NexoModule.mjs';
import { NexoRegistry } from '#nexo/language/vocabulary/NexoRegistry.mjs';
import { Vocabulary } from '#nexo/language/vocabulary/Vocabulary.mjs';
import { constantUpdates } from '../support/updates.mjs';

/** A lexicon whose words have a size and an internal secret, and a shop's two extensions of a word, each with a member of its own. */
const lexicon = new NexoModule('Lexicon', {
    types: [{
        name: 'Word',
        kind: 'reference',
        isInstance: () => true,
        members: [
            Declarations.createPropertyDeclaration('size', 'Number', { updates: constantUpdates }),
            Declarations.createPropertyDeclaration('secret', 'Number', { updates: constantUpdates, internal: true }),
        ],
    }],
});
const shop = new NexoModule('Shop', {
    types: [
        { name: 'Loud', kind: 'extension', target: 'Lexicon.Word', members: [Declarations.createPropertyDeclaration('shout', 'String', { updates: constantUpdates })] },
        { name: 'Quiet', kind: 'extension', target: 'Lexicon.Word', members: [Declarations.createPropertyDeclaration('whisper', 'String', { updates: constantUpdates })] },
    ],
});
const registry = new NexoRegistry([Vocabulary.module, lexicon, shop]);
const imports = [{ module: 'Lexicon' }, { module: 'Shop' }];

/** The completions at the offset `|` marks, against the shop, a word bound as `word`, each as its kind and what it inserts. */
const complete = (marked, typeNames = { word: 'Lexicon.Word' }) => new Completion(marked.replace('|', ''), marked.indexOf('|'), imports, registry, typeNames).complete().map(({ kind, insert }) => [kind, insert]);

describe('Completion', () => {
    it("offers a receiver's members its type selects through a dot, an internal one never, and an object's fields", () => {
        expect(complete('word.|')).toEqual([['property', 'size']]);
        expect(complete('{ a = 1, b = "x" }.|')).toEqual([['objectField', 'a'], ['objectField', 'b']]);
    });

    it("offers the extension members that apply after a colon, and an extension's own after its name", () => {
        expect(complete('word:|')).toEqual([['property', 'shout'], ['property', 'whisper']]);
        expect(complete('word:Quiet.|')).toEqual([['property', 'whisper']]);
        expect(complete('word:Shop.Loud.|')).toEqual([['property', 'shout']]);
    });

    it('offers the names in scope where a value stands, a conditional binding in its consequent alone', () => {
        expect(complete('if let n = word.size then | else 0 end')).toEqual([['conditionalBinding', 'n'], ['scriptParameter', 'word'], ['namespace', 'Lexicon'], ['namespace', 'Shop']]);
        expect(complete('if let n = word.size then 1 else | end')).toEqual([['scriptParameter', 'word'], ['namespace', 'Lexicon'], ['namespace', 'Shop']]);
    });

    it('replaces the word the offset stands in or after, and inserts at the offset elsewhere', () => {
        const at = (text, offset) => new Completion(text, offset, imports, registry, { word: 'Lexicon.Word' }).complete()[0]?.range;

        expect(at('word.si', 6)).toEqual({ start: 5, end: 7 });
        expect(at('word.si', 7)).toEqual({ start: 5, end: 7 });
        expect(at('word. ', 5)).toEqual({ start: 5, end: 5 });
    });

    it('offers nothing where the probe stands for no value nor member, as a field\'s name or after a value, and nothing within a string or a comment', () => {
        expect(complete('{ si| = 1 }')).toEqual([]);
        expect(complete('word |')).toEqual([]);
        expect(complete('"word.|"')).toEqual([]);
        expect(complete('1 /* word.| */')).toEqual([]);
    });
});
