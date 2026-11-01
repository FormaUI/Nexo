/**
 * TextLocations — where in a source text each part of its definition came from, by JSON Pointer
 */

import { Lowering } from './Lowering.mjs';
import { Parser } from './Parser.mjs';
import { TextPositions } from './TextPositions.mjs';

/** @typedef {import('./Parser.mjs').Span} Span */

export class TextLocations {
    #text;

    /** The imports a host supplied to the text, which decide how it reads. @type {readonly object[]} */
    #suppliedImports;

    /**
     * The span of each part of the definition by its pointer, collected at the first location asked for, from the text read again, and kept from then on; null until then. A text reads into one definition alone, so the
     * spans read again are the ones it was parsed with. Collecting them as each text was parsed measured a seventh of parsing, for a location most texts are never asked for, and keeping the definition it lowered until
     * then would hold more than the text it reads from.
     * @type {Map<string, Span> | null}
     */
    #spans = null;

    /**
     * @param {string} text The source text, which parsed, or, where the definition it was lowered to is given, which a tolerant reading read.
     * @param {readonly object[]} [suppliedImports] The imports a host supplied to it, in a definition's shape, checked already.
     * @param {{ definition: object, spans: WeakMap<object, Span> } | null} [lowered] The definition the text was lowered to, with the span of each of its parts, whose spans are collected at once rather than from the
     * text read again, which a text that breaks the grammar gives no definition of; null where the text is read again for them.
     */
    constructor(text, suppliedImports = [], lowered = null) {
        this.#text = text;
        this.#suppliedImports = suppliedImports;

        if (lowered !== null) {
            this.#collectAll(lowered.definition, lowered.spans);
        }
    }

    /** The span of each part of the definition by its pointer, collected from the text read again where none was collected yet. */
    #getSpans() {
        if (this.#spans === null) {
            const { definition, spans } = Lowering.lower(new Parser(this.#text, this.#suppliedImports).parse(), this.#suppliedImports);

            this.#collectAll(definition, spans);
        }

        return this.#spans;
    }

    /** Collects the span of each of the definition's imports and of each part of its expression, by its pointer. */
    #collectAll(definition, spans) {
        this.#spans = new Map();
        definition.imports.forEach((entry, index) => {
            const span = spans.get(entry);

            if (span) {
                this.#spans.set(`/imports/${index}`, span);
            }
        });
        this.#collect(definition.expression, '/expression', spans);
    }

    /** The span of text the pointer's part came from, or the nearest enclosing part's; null where none encloses it. */
    getSpan(pointer) {
        const spans = this.#getSpans();

        for (let current = pointer; ; current = current.slice(0, current.lastIndexOf('/'))) {
            const span = spans.get(current);

            if (span) {
                return span;
            }

            if (current === '' || !current.includes('/')) {
                return null;
            }
        }
    }

    /** The text the definition was read from, from which its syntax tree is read again where a tool asks for it, since no definition keeps one. */
    get text() {
        return this.#text;
    }

    /** The text position the pointer's part began at, or the nearest enclosing part's. */
    locate(pointer) {
        const spans = this.#getSpans();

        for (let current = pointer; ; current = current.slice(0, current.lastIndexOf('/'))) {
            const span = spans.get(current);

            if (span) {
                return { pointer, ...TextPositions.locate(this.#text, span.start) };
            }

            if (current === '') {
                return { pointer };
            }
        }
    }

    /** Records the span of the node at the pointer, and of every part beneath it. */
    #collect(node, pointer, spans) {
        const span = spans.get(node);

        if (span) {
            this.#spans.set(pointer, span);
        }

        // A property access, an indexer, a call's member and what an object expression or an optional chain holds, each the node it continues from or ends at.
        for (const property of ['receiver', 'callee', 'context', 'chain']) {
            if (node[property]) {
                this.#collect(node[property], `${pointer}/${property}`, spans);
            }
        }

        if (node.kind === 'memberAccess' && typeof node.name !== 'string') {
            this.#collect(node.name, `${pointer}/name`, spans);
        }

        if (node.argument) {
            this.#collect(node.argument, `${pointer}/argument`, spans);
        }

        if (node.kind === 'conditional') {
            if (node.binding !== undefined) {
                const bindingSpan = spans.get(node.binding);

                if (bindingSpan) {
                    this.#spans.set(`${pointer}/binding`, bindingSpan);
                }

                this.#collect(node.binding.value, `${pointer}/binding/value`, spans);
            }

            for (const branch of ['condition', 'consequent', 'alternative']) {
                if (node[branch] !== undefined) {
                    this.#collect(node[branch], `${pointer}/${branch}`, spans);
                }
            }
        }

        if (node.kind === 'equality') {
            this.#collect(node.left, `${pointer}/left`, spans);
            this.#collect(node.right, `${pointer}/right`, spans);
        }

        if (node.kind === 'arithmetic') {
            this.#collect(node.left, `${pointer}/left`, spans);
            this.#collect(node.right, `${pointer}/right`, spans);
        }

        // A negation's, an arithmetic negation's, a cast's, a conversion's and an attempt's operand.
        if (node.operand) {
            this.#collect(node.operand, `${pointer}/operand`, spans);
        }

        // An index's offset, and a range's boundaries where it holds them.
        for (const property of ['offset', 'start', 'end']) {
            if (node.kind === 'fromEndIndex' || node.kind === 'range') {
                if (node[property] !== undefined) {
                    this.#collect(node[property], `${pointer}/${property}`, spans);
                }
            }
        }

        if (node.kind === 'coalescing') {
            this.#collect(node.value, `${pointer}/value`, spans);
            this.#collect(node.fallback, `${pointer}/fallback`, spans);
        }

        node.operands?.forEach((operand, index) => this.#collect(operand, `${pointer}/operands/${index}`, spans));

        if (node.kind === 'interpolatedString') {
            node.parts.forEach((part, index) => {
                if (part.kind === 'expression') {
                    this.#collect(part.expression, `${pointer}/parts/${index}/expression`, spans);
                }
            });
        }

        if (node.kind === 'body') {
            this.#collect(node.result, `${pointer}/result`, spans);
        }

        if (node.kind === 'function' || node.kind === 'do') {
            this.#collect(node.body, `${pointer}/body`, spans);
        }

        if (node.kind === 'call') {
            node.arguments.forEach((argument, index) => this.#collect(argument, `${pointer}/arguments/${index}`, spans));
        }

        if (node.kind === 'list') {
            node.items.forEach((item, index) => this.#collect(item, `${pointer}/items/${index}`, spans));
        }

        // An object expression's locals and object fields, and a dictionary's entries, each spanning its head and its value.
        for (const entriesProperty of ['locals', 'objectFields', 'entries']) {
            node[entriesProperty]?.forEach((entry, index) => {
                const entryPointer = `${pointer}/${entriesProperty}/${index}`;
                const entrySpan = spans.get(entry);

                if (entrySpan) {
                    this.#spans.set(entryPointer, entrySpan);
                }

                this.#collect(entry.value, `${entryPointer}/value`, spans);
            });
        }
    }
}
