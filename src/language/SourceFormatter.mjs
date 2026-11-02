/**
 * SourceFormatter — a text laid out as it was written: each token as the text spells it, every comment, and every line break where the text puts one, a run of blank lines kept as one; each line indented by the
 * constructs open at its start, and each token spaced from the one before it, as canonical text does
 */

import { Parser } from './Parser.mjs';
import { SyntaxTree } from './SyntaxTree.mjs';

/** @typedef {import('./SyntaxTree.mjs').Token} Token */
/** @typedef {import('./SyntaxTree.mjs').SyntaxNode} SyntaxNode */

/** The indentation of one level. */
const INDENTATION = '    ';

/** The tokens, by type or keyword, that open a construct, whose lines are indented a level where the token ends its line; a function's head's `)` opens its body too. */
const OPENERS = new Set(['(', '(?', '[', '?[', '{', 'then', 'else', 'do']);

/** The tokens, by type or keyword, that close the construct opened last: a bracket's closer, `end`, and a conditional's `elseif` and `else`, which close the branch before them. */
const CLOSERS = new Set([')', ']', '}', 'end', 'else', 'elseif']);

/** The tokens written directly against the token after them. */
const ATTACHED_TO_NEXT = new Set(['(', '(?', '[', '?[', '.', '?.', ':', '?:', '..', '^', 'interpolated-string-start', 'interpolated-text', 'interpolation-start', 'interpolation-end']);

/** The tokens written directly against the token before them. */
const ATTACHED_TO_PREVIOUS = new Set([')', ']', ',', '.', '?.', ':', '?:', '..', '?[', 'interpolated-text', 'interpolation-start', 'interpolation-end', 'interpolated-string-end']);

/** The kinds of node a call is, whose `(` follows the name it calls directly, as a function's follows `function`. */
const CALL_KINDS = new Set(['function-call', 'member-call', 'namespace-access', 'extension-access', 'function-expression']);

/** The kinds of node whose operators join their operands, each operator a child at an odd index. */
const OPERATOR_KINDS = new Set(['disjunction', 'conjunction', 'equality', 'comparison', 'additive', 'multiplicative', 'coalescing']);

/** The kinds of node whose `.`, `?.`, `:` or `?:` a line may begin with, continuing a chain: a member step, an extension access's names and a namespace's member. */
const STEP_KINDS = new Set(['dot-property-access', 'member-call', 'computed-property-access', 'extension-access', 'namespace-access']);

/** The tokens that join a member to what is before it. */
const JOINERS = new Set(['.', '?.', ':', '?:']);

/** The tokens after which a value continues on the next line, a line that continues it indented a level more. */
const CONTINUED_AFTER = new Set(['=', '=>']);

/** What a comment written in a gap stands as, for what is written after it. */
const COMMENT = Object.freeze({ type: 'comment' });

export class SourceFormatter {
    #text;

    /** The text's tokens, in order, the `end` token last. @type {Token[]} */
    #tokens;

    /** The node each token is a child of, and its index there. @type {Map<Token, { parent: SyntaxNode, index: number }>} */
    #places = new Map();

    /** The line break the text writes first, which every line break the formatting writes outside a token is. */
    #lineBreak;

    /**
     * The constructs open where the formatting stands, the innermost last, each with the level of the line its opener stands on and the level of the lines within it: a level more where its opener ends its line, and the
     * level of the construct around it otherwise.
     * @type {{ line: number, content: number }[]}
     */
    #open = [];

    /** The level of the line being written. */
    #lineLevel = 0;

    /**
     * @param {string} text
     * @param {import('./SyntaxTree.mjs').ScriptNode} tree The text's syntax tree, read with no syntax diagnostic.
     */
    constructor(text, tree) {
        this.#text = text;
        this.#tokens = [...SyntaxTree.tokensOf(tree)];
        this.#lineBreak = /\r\n|\r|\n/.exec(text)?.[0] ?? '\n';
        this.#placeChildren(tree);
    }

    /**
     * The text laid out as it was written, read with the imports supplied, or the text as it is where it breaks the grammar, since where its constructs begin and end is not known then. It reads back as the same
     * definition, since its tokens and its line breaks are the text's, and canonical text, and a text formatted already, is formatted as it is.
     * @param {string} text
     * @param {readonly object[]} [suppliedImports] The imports a host supplies, in a definition's shape, checked already.
     */
    static format(text, suppliedImports = []) {
        const parser = new Parser(text, suppliedImports, true);
        const tree = parser.parse();

        return parser.diagnostics.length > 0 ? text : new SourceFormatter(text, tree).#write();
    }

    /** Records the node each token of the tree is a child of. */
    #placeChildren(node) {
        node.children.forEach((child, index) => {
            if (SyntaxTree.isToken(child)) {
                this.#places.set(child, { parent: node, index });
            } else {
                this.#placeChildren(child);
            }
        });
    }

    /** The formatted text: each token after what stands between it and the one before it, laid out. */
    #write() {
        let written = '';

        this.#tokens.forEach((token, index) => {
            written += this.#writeGap(index === 0 ? null : this.#tokens[index - 1], token);

            if (token.type !== 'end') {
                written += SyntaxTree.wordOf(token, this.#text);
                this.#passToken(token, index);
            }
        });

        return written;
    }

    /**
     * What stands between the two tokens: the comments the text writes there, each on its line or after the code on its line, a line break wherever the text breaks one, at most one blank line between two lines and none
     * at the start or the end of the text, and the token's indentation where it begins a line; or the space canonical text writes between the two where nothing stands between them.
     * @param {Token | null} previous The token before, null at the start of the text.
     * @param {Token} token
     */
    #writeGap(previous, token) {
        let written = '';
        let breaks = 0;
        let last = previous;

        for (const piece of this.#gapOf(token)) {
            if (piece.kind === 'break') {
                breaks++;
                continue;
            }

            // A comment begins the text, begins a line at the level of the lines within the constructs open, or follows what is before it on its line.
            if (last !== null && breaks > 0) {
                this.#lineLevel = this.#contentLevel();
                written += this.#lineBreaks(breaks) + INDENTATION.repeat(this.#lineLevel);
            } else if (last !== null) {
                written += ATTACHED_TO_NEXT.has(last.type) ? '' : ' ';
            }

            written += piece.text;
            breaks = 0;
            last = COMMENT;
        }

        if (token.type === 'end') {
            return written + (last !== null && /[\n\r]$/.test(this.#text) ? this.#lineBreak : '');
        }

        if (last === null) {
            this.#beginLine(token, null);

            return INDENTATION.repeat(this.#lineLevel);
        }

        if (breaks > 0) {
            this.#beginLine(token, previous);

            return written + this.#lineBreaks(breaks) + INDENTATION.repeat(this.#lineLevel);
        }

        if (last === COMMENT) {
            return written + (ATTACHED_TO_PREVIOUS.has(token.type) ? '' : ' ');
        }

        return this.#spaceBetween(previous, token);
    }

    /** The line breaks a run of the count writes: one, or two for a blank line between two lines, however many the text has. */
    #lineBreaks(count) {
        return this.#lineBreak.repeat(Math.min(count, 2));
    }

    /**
     * The gap before the token as pieces, each a line break or a comment: a line comment's text without the line break that ends it, which counts as a line break, and the whitespace before that; and a block comment's as
     * it is, line breaks within it among it.
     * @returns {({ kind: 'break' } | { kind: 'comment', text: string })[]}
     */
    #gapOf(token) {
        const pieces = [];

        for (const piece of SyntaxTree.triviaOf(token, this.#text)) {
            const written = this.#text.slice(piece.start, piece.end);

            if (piece.kind === 'whitespace') {
                for (let count = (written.match(/\r\n|\r|\n/g) ?? []).length; count > 0; count--) {
                    pieces.push({ kind: 'break' });
                }
            } else if (piece.kind === 'line-comment') {
                pieces.push({ kind: 'comment', text: written.replace(/\s+$/u, '') });

                if (/[\n\r]$/.test(written)) {
                    pieces.push({ kind: 'break' });
                }
            } else {
                pieces.push({ kind: 'comment', text: written });
            }
        }

        return pieces;
    }

    /**
     * Sets the level of the line the token begins: the level of the line its opener stands on where it closes a construct, and otherwise the level of the lines within the constructs open, a level more where it continues
     * a value.
     */
    #beginLine(token, previous) {
        if (CLOSERS.has(SourceFormatter.#keyOf(token)) && this.#open.length > 0) {
            this.#lineLevel = this.#open.at(-1).line;
        } else {
            this.#lineLevel = this.#contentLevel() + (this.#continues(token, previous) ? 1 : 0);
        }
    }

    /** The level of the lines within the constructs open, none at the text's own level. */
    #contentLevel() {
        return this.#open.at(-1)?.content ?? 0;
    }

    /** Whether the token, beginning a line, continues the value the line before it holds: a member's joiner, a binary operator, or what follows an `=` or a `=>` that ends its line. */
    #continues(token, previous) {
        const place = this.#places.get(token);

        if (previous !== null && CONTINUED_AFTER.has(previous.type)) {
            return true;
        }

        if (OPERATOR_KINDS.has(place.parent.kind) && place.index % 2 === 1) {
            return true;
        }

        return JOINERS.has(token.type) && STEP_KINDS.has(place.parent.kind);
    }

    /** Passes the token at the index: a closer closes the construct opened last, and an opener opens one, which indents its lines where it ends its line. */
    #passToken(token, index) {
        const key = SourceFormatter.#keyOf(token);

        if (CLOSERS.has(key)) {
            this.#open.pop();
        }

        // A function's head ends at its `)`, after which its body is open until its `end`.
        if (OPENERS.has(key) || (key === ')' && this.#places.get(token).parent.kind === 'function-expression')) {
            const next = this.#tokens[index + 1];
            const endsLine = /[\n\r]/.test(this.#text.slice(token.end, next.start));

            this.#open.push({ line: this.#lineLevel, content: endsLine ? this.#lineLevel + 1 : this.#contentLevel() });
        }
    }

    /**
     * The space canonical text writes between two tokens on one line: none against a token written directly against another, before a call's `(` and an indexer's `[`, after a negation's `-` but before another, and
     * within an empty dictionary's `[=]`; one otherwise.
     */
    #spaceBetween(previous, token) {
        if (ATTACHED_TO_NEXT.has(previous.type) || ATTACHED_TO_PREVIOUS.has(token.type)) {
            return '';
        }

        const place = this.#places.get(token);

        if ((token.type === '(' && CALL_KINDS.has(place.parent.kind) && place.index > 0) || (token.type === '[' && place.parent.kind === 'indexer')) {
            return '';
        }

        if (previous.type === '-' && this.#places.get(previous).parent.kind === 'arithmetic-negation') {
            return token.type === '-' ? ' ' : '';
        }

        return token.type === '=' && place.parent.kind === 'dictionary-expression' ? '' : ' ';
    }

    /** What a token is opened or closed by: a keyword's word, and any other token's type. */
    static #keyOf(token) {
        return token.type === 'keyword' ? token.value : token.type;
    }
}
