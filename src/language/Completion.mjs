/**
 * Completion — what a script can reach where a tool asks at an offset of its text: the names in scope where a value stands, the members a receiver's type selects after `.`, the extension members it applies to after
 * `:`, a namespace's members after its `.`, and the modules and the types an import names, each with what it inserts and the range of text it replaces
 */

import { Names } from './Names.mjs';
import { Signatures } from './Signatures.mjs';
import { SyntaxTree } from './SyntaxTree.mjs';
import { TextReading } from './TextReading.mjs';
import { Tokenizer } from './Tokenizer.mjs';
import { Vocabulary } from './vocabulary/Vocabulary.mjs';

/** @typedef {{ name: string, kind: string, insert: string, range: { start: number, end: number }, detail?: string, qualifiedName?: string }} CompletionItem */

/** The name a probe writes where a tool asks, one character, which the reading reads as a hole wherever it stands. */
const PROBE = 'x';

/** The order completions of each kind are answered in, the nearest names first. */
const KIND_ORDER = ['local', 'objectField', 'conditionalBinding', 'functionParameter', 'implicitParameter', 'objectRoot', 'scriptParameter', 'namespace', 'property', 'function', 'indexer', 'module', 'type', 'extension'];

export class Completion {
    #text;
    #offset;
    #suppliedImports;

    /** @type {import('./vocabulary/NexoRegistry.mjs').NexoRegistry} */
    #registry;

    /** Each binding's name and the notation of the type declared for it. */
    #typeNames;

    /** The text's tokens, read tolerantly. */
    #tokens;

    /** The text a completion replaces: the word the offset stands in or after, or none at the offset. */
    #range;

    /**
     * @param {string} text
     * @param {number} offset Where the tool asks, an offset into the text.
     * @param {readonly object[]} suppliedImports The imports a host supplies, in a definition's shape, checked already.
     * @param {import('./vocabulary/NexoRegistry.mjs').NexoRegistry} registry The registry the text is resolved against.
     * @param {Record<string, string>} typeNames Each binding's name and the notation of the type declared for it.
     */
    constructor(text, offset, suppliedImports, registry, typeNames) {
        this.#text = text;
        this.#offset = offset;
        this.#suppliedImports = suppliedImports;
        this.#registry = registry;
        this.#typeNames = typeNames;
        this.#tokens = Tokenizer.scan(text);

        const word = this.#tokens.find(token => Completion.#isWord(token) && token.start < offset && offset <= token.end);

        this.#range = word === undefined ? { start: offset, end: offset } : { start: word.start, end: word.end };
    }

    /**
     * The completions at the offset, in the order of their kinds and, within each, of their names: none within a string's text or a comment, the modules and the types an import names after `import`, and otherwise what
     * the text reaches where a probe written in place of the word at the offset stands, read as a hole a tolerant resolution records the scope and the receiver of.
     * @returns {CompletionItem[]}
     */
    complete() {
        return Completion.#inOrder(this.#isWithinTextOrComment() ? [] : this.#completeImport() ?? this.#completeProbed());
    }

    /** What the text reaches where a probe written in place of the word at the offset stands, read as a hole; none where the probe stands where no value or member's name does, or resolution never reached it. */
    #completeProbed() {
        const probed = `${this.#text.slice(0, this.#range.start)}${PROBE}${this.#text.slice(this.#range.end)}`;
        const reading = new TextReading(probed, this.#suppliedImports, this.#range.start);
        const { probe } = reading;

        if (probe === null) {
            return [];
        }

        const { resolver, bindings } = reading.resolve(this.#registry, this.#typeNames);
        const reached = resolver?.holeScopes.get(probe.pointer);

        if (reached === undefined) {
            return [];
        }

        switch (probe.reads) {
            case 'value':
                return this.#completeValue(reading, probe, reached.scope, resolver, bindings);
            case 'namespace':
                return this.#completeNamespace(resolver.importedVocabulary.getNamespaceModule(probe.namespace));
            default:
                return this.#completeMember(probe, reached.receiver, resolver.importedVocabulary);
        }
    }

    /** Whether the offset stands within a string's text or a comment, where no name is written. */
    #isWithinTextOrComment() {
        const offset = this.#offset;

        return this.#tokens.some(token => (
            ((token.type === 'literal' && typeof token.value === 'string') || token.type === 'interpolated-text') && token.start < offset && offset < token.end
        ) || SyntaxTree.triviaOf(token, this.#text).some(piece => piece.kind !== 'whitespace' && piece.start < offset && (offset < piece.end || (piece.kind === 'line-comment' && offset === piece.end && !/[\n\r]$/.test(this.#text.slice(piece.start, piece.end))))));
    }

    /**
     * The completions of an import, where the offset follows `import`, or its alias's `=`, on the import's line, the modules the registry holds but Nexo's own; or the module's name and its dot, its public types and
     * extensions; null where the offset stands in no import.
     */
    #completeImport() {
        const before = this.#tokens.filter(token => token.type !== 'end' && token.end <= this.#range.start);
        const keyword = before.findLastIndex(token => token.type === 'keyword' && token.value === 'import');

        if (keyword === -1 || Tokenizer.holdsLineBreak(this.#text, before[keyword].end, this.#range.start)) {
            return null;
        }

        const words = before.slice(keyword + 1).map(token => (Completion.#isWord(token) ? 'word' : token.type)).join(' ');

        if (words === '' || words === 'word =') {
            return this.#registry.moduleNames.filter(name => name !== Vocabulary.moduleName).map(name => this.#createItem(name, 'module', name, { detail: 'module' }));
        }

        if (words === 'word .' || words === 'word = word .') {
            const module = this.#registry.getModule(SyntaxTree.wordOf(before.at(-2), this.#text));

            // An extension's name is written without the type parameters its declaration writes after it.
            return (module?.types ?? []).filter(type => type.internal !== true).map(type => {
                const name = type.name.split('<')[0];

                return this.#createItem(name, type.kind === 'extension' ? 'extension' : 'type', name, { detail: type.kind });
            });
        }

        return [];
    }

    /**
     * The names in scope where the probe stands for a value: its locals, object fields, conditional bindings and function parameters, each written with `@` where its word alone means something else; the script
     * parameters the bindings declare, with `~` where a name in scope hides one; the namespaces its imports give; and the implicit parameter and the object root where they stand.
     */
    #completeValue(reading, probe, scope, resolver, bindings) {
        const namespaces = resolver.importedVocabulary.namespaceNames;
        const items = [];

        for (const [name, entry] of scope.locals.entries) {
            // An options object's field being written names a parameter, no value.
            if (Object.hasOwn(entry, 'optionKind')) {
                continue;
            }

            const kind = entry.conditional === undefined ? reading.getDeclarationKind(probe.pointer, name) ?? 'local' : 'conditionalBinding';
            const detail = entry.function === undefined ? (entry.result === null ? undefined : String(entry.result.type)) : `function(${entry.function.parameters.join(', ')})`;

            items.push(this.#createItem(name, kind, Names.needsPrefix(name, namespaces) ? `@${name}` : name, detail === undefined ? {} : { detail }));
        }

        for (const name of Object.keys(this.#typeNames)) {
            const type = bindings.getType(name);

            if (type !== undefined) {
                items.push(this.#createItem(name, 'scriptParameter', scope.locals.has(name) || Names.needsPrefix(name, namespaces) ? `~${name}` : name, { detail: String(type) }));
            }
        }

        for (const name of namespaces) {
            items.push(this.#createItem(name, 'namespace', Names.isReservedWord(name) ? `@${name}` : name, { detail: resolver.importedVocabulary.getNamespaceModule(name) }));
        }

        if (scope.contextType !== null) {
            items.push(this.#createItem('it', 'implicitParameter', 'it', { detail: String(scope.contextType) }));
        }

        if (scope.objectRoot !== null) {
            items.push(this.#createItem('root', 'objectRoot', 'root'));
        }

        return items;
    }

    /**
     * The members the probe's receiver reaches: after `.`, those its type selects through `.`, and an object type's fields; after `:`, the extension members that apply to it; after an extension access's later name, the
     * members of the extension it names; each the script's imports make available, an internal one never. A receiver of `Any`, whose members are selected as it is evaluated, or of no value reaches none.
     */
    #completeMember(probe, receiver, imported) {
        if (receiver === null || receiver.kind !== 'value' || receiver.type.kind === 'any') {
            return [];
        }

        const type = receiver.type.toNonNullable();

        if (probe.reads === 'member' && (type.kind === 'object' || type.kind === 'objectRoot')) {
            return [...type.fieldTypes].map(([name, fieldType]) => this.#createItem(name, 'objectField', name, { detail: String(fieldType) }));
        }

        const isExtensionAccess = probe.reads !== 'member';
        const extension = probe.reads === 'extensionName' ? this.#extensionNamed(probe.names, imported) : null;

        if (probe.reads === 'extensionName' && extension === null) {
            return [];
        }

        const items = [];

        for (const name of this.#registry.receiverMemberNames) {
            const candidates = imported.getAvailable(this.#registry.getReceiverMembers(name).filter(declaration => this.#registry.memberSelector.isExtensionMember(declaration) === isExtensionAccess && (extension === null || this.#registry.getContainingType(declaration) === extension)));
            const selection = this.#registry.memberSelector.select(candidates, type);

            if (selection.kind === 'selected') {
                items.push(this.#createMemberItem(selection.declaration));
            }
        }

        return items;
    }

    /** The extension an extension access's names before the probe name, its local name, or a module's local name and the extension's name, which the script's imports make available; null where none is. */
    #extensionNamed(names, imported) {
        if (names.length === 1) {
            const extension = imported.getImportedExtension(names[0]);

            if (extension !== undefined) {
                return extension;
            }

            const found = [Vocabulary.moduleName, ...imported.importedModuleNames].flatMap(moduleName => (this.#registry.getModule(moduleName)?.types ?? []).filter(type => type.kind === 'extension' && type.name.split('<')[0] === names[0] && type.internal !== true));

            return found.length === 1 ? found[0] : null;
        }

        const moduleName = imported.getNamespaceModule(names[0]);
        const found = (this.#registry.getModule(moduleName)?.types ?? []).filter(type => type.kind === 'extension' && type.name.split('<')[0] === names[1] && type.internal !== true);

        return names.length === 2 && found.length === 1 ? found[0] : null;
    }

    /** The members a namespace's module reaches through it: its module members and the members its own types declare, read as their qualified forms, each once by its name, an internal one and an indexer never. */
    #completeNamespace(moduleName) {
        const module = this.#registry.getModule(moduleName);

        if (module === undefined) {
            return [];
        }

        const members = [...module.members, ...module.types.filter(type => type.kind !== 'extension' && type.internal !== true).flatMap(type => type.members ?? [])];
        const named = new Map();

        for (const declaration of members) {
            if (declaration.kind !== 'operator' && declaration.kind !== 'indexer' && declaration.name !== undefined && !this.#registry.isInternal(declaration) && !named.has(declaration.name)) {
                named.set(declaration.name, declaration);
            }
        }

        return [...named.values()].map(declaration => this.#createMemberItem(declaration));
    }

    /** The completion of a member: its name, its kind, its signature and its qualified name. */
    #createMemberItem(declaration) {
        return this.#createItem(declaration.name, declaration.kind, declaration.name, { detail: Signatures.format(declaration), qualifiedName: Signatures.formatQualifiedName(declaration, this.#registry) });
    }

    /** A completion of the name and the kind, what it inserts, and the range it replaces, frozen. */
    #createItem(name, kind, insert, extras = {}) {
        return Object.freeze({ name, kind, insert, range: Object.freeze({ ...this.#range }), ...extras });
    }

    /** The completions in the order of their kinds and, within each, of their names, each name of a kind once. */
    static #inOrder(items) {
        const seen = new Set();

        return Object.freeze(items
            .filter(item => !seen.has(`${item.kind} ${item.name}`) && seen.add(`${item.kind} ${item.name}`))
            .sort((one, other) => KIND_ORDER.indexOf(one.kind) - KIND_ORDER.indexOf(other.kind) || (one.name < other.name ? -1 : one.name > other.name ? 1 : 0)));
    }

    /** Whether the token writes a word, as a name the offset may stand in: an identifier, a keyword, `it`, or a literal's word. */
    static #isWord(token) {
        return token.type === 'identifier' || token.type === 'keyword' || token.type === 'it' || (token.type === 'literal' && (typeof token.value === 'boolean' || token.value === null));
    }
}
