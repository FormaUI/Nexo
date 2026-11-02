/**
 * Hover — what a name at an offset of a text reads, as a tool describes it: the declaration of a member, its signature and its qualified name, or the local, the parameter or the namespace a name reads, each with the type
 * of the value it gives there
 */

import { Signatures } from './Signatures.mjs';
import { TextReading } from './TextReading.mjs';

/** @typedef {{ name: string, kind: string, range: { start: number, end: number }, detail?: string, qualifiedName?: string, type?: string }} HoverInformation */

/** The kinds of node a name a script writes is, each standing for its one token. */
const NAME_KINDS = new Set(['local', 'scriptParameter', 'namespace', 'it', 'root']);

export class Hover {
    /**
     * What the name at the offset reads, the text read tolerantly and resolved against the registry with bindings of the types declared: a member's declaration, by the kind it is, with its signature, its qualified name
     * and the type of what it answers there; a local, an object field, a conditional binding, a function parameter, a script parameter, the implicit parameter or the object root, with its type; or a namespace, with its
     * module. Null where the offset stands on no name, or on a name nothing the resolution selected reads, as an access selected as it is evaluated.
     * @param {string} text
     * @param {number} offset
     * @param {readonly object[]} suppliedImports The imports a host supplies, in a definition's shape, checked already.
     * @param {import('./vocabulary/NexoRegistry.mjs').NexoRegistry} registry
     * @param {Record<string, string>} typeNames Each binding's name and the notation of the type declared for it.
     * @returns {HoverInformation | null}
     */
    static describe(text, offset, suppliedImports, registry, typeNames) {
        const reading = new TextReading(text, suppliedImports);
        const named = Hover.#nameAt(reading, reading.definition.expression, '/expression', offset, null);

        if (named === null) {
            return null;
        }

        const { resolver, resolved } = reading.resolve(registry, typeNames);

        if (resolver === null) {
            return null;
        }

        const { node, pointer, range } = named;
        const type = resolver.nodeTypes.get(pointer);
        const typed = type === undefined ? {} : { type: String(type) };

        switch (node.kind) {
            case 'memberAccess': {
                // A call's member is used where the call stands, which gives what it answers.
                const usePointer = pointer.endsWith('/callee') ? pointer.slice(0, -'/callee'.length) : pointer;
                const use = resolved.usedDeclarations.find(each => each.pointer === usePointer);

                if (use === undefined) {
                    return null;
                }

                const answered = resolver.nodeTypes.get(usePointer);

                return Object.freeze({
                    name: node.name,
                    kind: use.declaration.kind,
                    range: Object.freeze(range),
                    detail: Signatures.format(use.declaration),
                    qualifiedName: use.qualifiedName,
                    ...(answered === undefined ? {} : { type: String(answered) }),
                });
            }
            case 'namespace':
                return Object.freeze({ name: node.name, kind: 'namespace', range: Object.freeze(range), detail: resolver.importedVocabulary.getNamespaceModule(node.name) });
            case 'it':
                return Object.freeze({ name: 'it', kind: 'implicitParameter', range: Object.freeze(range), ...typed });
            case 'root':
                return Object.freeze({ name: 'root', kind: 'objectRoot', range: Object.freeze(range), ...typed });
            case 'scriptParameter':
                return Object.freeze({ name: node.name, kind: 'scriptParameter', range: Object.freeze(range), ...typed });
            default:
                return Object.freeze({ name: node.name, kind: reading.getDeclarationKind(pointer, node.name) ?? 'local', range: Object.freeze(range), ...typed });
        }
    }

    /**
     * The innermost node beneath the pointer whose name the offset stands in or directly after: a member's name, the end of its access, or a name a script writes, its one token; with its pointer and its name's range,
     * or the one found already where none beneath is.
     */
    static #nameAt(reading, node, pointer, offset, found) {
        if (Array.isArray(node)) {
            return node.reduce((innermost, item, index) => Hover.#nameAt(reading, item, `${pointer}/${index}`, offset, innermost), found);
        }

        if (node === null || typeof node !== 'object') {
            return found;
        }

        let innermost = found;
        const range = typeof node.kind === 'string' ? Hover.#nameRangeOf(reading, node, pointer) : null;

        if (range !== null && range.start <= offset && offset <= range.end && (innermost === null || range.end - range.start <= innermost.range.end - innermost.range.start)) {
            innermost = { node, pointer, range };
        }

        for (const key of Object.keys(node)) {
            innermost = Hover.#nameAt(reading, node[key], `${pointer}/${key}`, offset, innermost);
        }

        return innermost;
    }

    /** The range of text the node's name stands at: a member's name at the end of its access, and a name a script writes its whole token; null for a node of no name. */
    static #nameRangeOf(reading, node, pointer) {
        const span = reading.getSpan(pointer);

        if (span === null) {
            return null;
        }

        if (node.kind === 'memberAccess' && typeof node.name === 'string') {
            return { start: span.end - node.name.length, end: span.end };
        }

        return NAME_KINDS.has(node.kind) ? { start: span.start, end: span.end } : null;
    }
}
