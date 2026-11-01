import { describe, it, expect } from 'vitest';
import { Parser } from '#nexo/language/Parser.mjs';
import { SYNTAX_NODE_KINDS, SyntaxTree } from '#nexo/language/SyntaxTree.mjs';
import { Tokenizer } from '#nexo/language/Tokenizer.mjs';

describe('SyntaxTree', () => {
    it('answers the word a token writes as the text spells it, whatever the token is', () => {
        const text = 'item.to + true  -  @end';
        const tokens = Tokenizer.scan(text).filter(token => token.end > token.start);

        expect(tokens.map(token => SyntaxTree.wordOf(token, text))).toEqual(['item', '.', 'to', '+', 'true', '-', '@end']);
    });

    it('reads the trivia before a token, a line comment ending with the line break after it, LF, CRLF or a lone CR', () => {
        for (const lineBreak of ['\n', '\r\n', '\r']) {
            const text = `1 // one${lineBreak}  /* two */ + 2`;
            const plus = Tokenizer.scan(text).find(token => token.type === '+');
            const commentEnd = text.indexOf(lineBreak) + lineBreak.length;

            expect(SyntaxTree.triviaOf(plus, text), JSON.stringify(lineBreak)).toEqual([
                { kind: 'whitespace', start: 1, end: 2 },
                { kind: 'line-comment', start: 2, end: commentEnd },
                { kind: 'whitespace', start: commentEnd, end: commentEnd + 2 },
                { kind: 'block-comment', start: commentEnd + 2, end: commentEnd + 11 },
                { kind: 'whitespace', start: commentEnd + 11, end: commentEnd + 12 },
            ]);
        }
    });

    it("tells the tokens that make an access optional, a property access's or a call's ?., an indexer's ?[ and an extension access's ?:, from those that don't", () => {
        expect(['?.', '?[', '?:'].map(type => SyntaxTree.isOptionalAccess(type))).toEqual([true, true, true]);
        expect(['.', '[', ':', '??', '(?'].map(type => SyntaxTree.isOptionalAccess(type))).toEqual([false, false, false, false, false]);
    });

    it("yields the tokens a tolerant reading skipped before a token, where they are asked for, and every token the tree holds, a missing one among them", () => {
        const text = '{ a = 1 # 2, b = x. }';
        const tree = new Parser(text, [], true).parse();
        const tokens = [...SyntaxTree.tokensOf(tree)];
        const comma = tokens.find(token => token.type === ',');

        expect(SyntaxTree.skippedBefore(comma).map(token => [token.type, SyntaxTree.wordOf(token, text)])).toEqual([['invalid', '#'], ['literal', '2']]);
        expect(tokens.filter(token => token.missing === true).map(token => [token.type, token.start])).toEqual([['identifier', 19]]);
        expect([...SyntaxTree.tokensOf(tree, false)].some(token => token.type === 'invalid')).toBe(false);
        expect(SyntaxTree.textOf(tree)).toBe(text);
    });

    it('answers a token and a node as the tooling API does, frozen: a token with its trivia and the tokens it holds, and a node with its range', () => {
        const text = '/* note */ a + b ) c';
        const tree = new Parser(text, [], true).parse();
        const view = SyntaxTree.createNodeView(tree, text);
        const [additive, end] = view.children;

        expect(view).toMatchObject({ kind: 'script', start: 11, end: 20 });
        expect(additive).toMatchObject({ kind: 'additive', start: 11, end: 16 });
        expect(additive.children[0]).toEqual({ type: 'identifier', start: 11, end: 12, triviaStart: 0, trivia: [{ kind: 'block-comment', start: 0, end: 10 }, { kind: 'whitespace', start: 10, end: 11 }], value: 'a' });
        expect(end.skipped.map(token => token.type)).toEqual([')', 'identifier']);
        expect(Object.isFrozen(view) && Object.isFrozen(additive.children[0]) && Object.isFrozen(end.skipped)).toBe(true);
    });

    it('names the kind of each node a grammar construct is, frozen', () => {
        expect(SYNTAX_NODE_KINDS).toEqual(expect.arrayContaining(['script', 'conditional-binding', 'arithmetic-negation', 'import-declaration', 'extension-access', 'list-expression', 'dictionary-expression', 'dictionary-entry']));
        expect(Object.isFrozen(SYNTAX_NODE_KINDS)).toBe(true);
    });
});
