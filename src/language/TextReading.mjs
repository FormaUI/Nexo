/**
 * TextReading — a text read tolerantly, as tooling reads text being written: its syntax tree, recovered where the text breaks the grammar, its definition lowered with a hole where the text lacks a part, and the
 * diagnostics of its syntax, its structure and, against a registry and the types of its bindings, its resolution, each stage recovering from each failure rather than throwing
 */

import { DefinitionValidator } from './DefinitionValidator.mjs';
import { LanguageResolver } from './LanguageResolver.mjs';
import { Lowering } from './Lowering.mjs';
import { NexoError } from './NexoError.mjs';
import { ParameterBindings } from './ParameterBindings.mjs';
import { Parser } from './Parser.mjs';
import { RecoveryRecord } from './RecoveryRecord.mjs';
import { SyntaxTree } from './SyntaxTree.mjs';
import { TextLocations } from './TextLocations.mjs';

/** @typedef {{ code: string, kind: string, message: string, location: object, range?: { start: number, end: number } }} Diagnostic */

export class TextReading {
    #text;

    /** The imports a host supplies, in a definition's shape, checked already. */
    #suppliedImports;

    /** @type {import('./SyntaxTree.mjs').ScriptNode} */
    #tree;

    /** @type {NexoError[]} */
    #syntaxDiagnostics;

    /** The definition the tree lowers to, a hole where the text lacks a part, with the span of each part and the parameters the text wrote alone. */
    #lowered;

    /** Where in the text each part of the lowered definition came from, by its pointer. @type {TextLocations} */
    #locations;

    /** The pointer of each hole the lowered definition holds. @type {string[]} */
    #holes;

    /** The structure the definition was validated to, once asked for: its copy, holes where the text lacks a part or validation recovered, or null where its imports were refused, and what validation recorded. */
    #validated = null;

    /**
     * @param {string} text
     * @param {readonly object[]} suppliedImports The imports a host supplies, in a definition's shape, checked already.
     */
    constructor(text, suppliedImports) {
        const parser = new Parser(text, suppliedImports, true);

        this.#text = text;
        this.#suppliedImports = suppliedImports;
        this.#tree = parser.parse();
        this.#syntaxDiagnostics = parser.diagnostics;
        this.#lowered = Lowering.lower(this.#tree, suppliedImports);
        this.#locations = new TextLocations(text, suppliedImports, this.#lowered);
        this.#holes = TextReading.#holesOf(this.#lowered.definition.expression, '/expression');
    }

    /** The text read. */
    get text() {
        return this.#text;
    }

    /** Its syntax tree, which holds every character of the text, a token it lacks missing in its place and the tokens recovery skipped held by the token after them. */
    get tree() {
        return this.#tree;
    }

    /** Its syntax diagnostics, in the order of the text. */
    get syntaxDiagnostics() {
        return TextReading.#inTextOrder(this.#syntaxDiagnostics);
    }

    /** The definition its tree lowers to, before validation, a hole where the text lacks a part. */
    get definition() {
        return this.#lowered.definition;
    }

    /** Where in the text each part of the definition came from, by its pointer, a hole's where the text lacks it. */
    get locations() {
        return this.#locations;
    }

    /**
     * The definition validated as tooling validates it, a hole in place of each node whose validation failed, with its structure diagnostics, in the order of the text; the copy is null where validation could not
     * recover, its imports refused.
     * @returns {{ definition: object | null, diagnostics: NexoError[], recovery: RecoveryRecord }}
     */
    validate() {
        if (this.#validated === null) {
            const recovery = new RecoveryRecord(this.#holes);
            let definition = null;

            try {
                definition = new DefinitionValidator(this.#locations, this.#lowered.scriptParametersWrittenAlone, recovery).validate(this.#lowered.definition);
            } catch (error) {
                // A failure outside every node, at the definition's imports, leaves nothing to resolve.
                if (!(error instanceof NexoError)) {
                    throw error;
                }

                recovery.record(error);
            }

            this.#validated = { definition, diagnostics: TextReading.#inTextOrder(recovery.diagnostics), recovery };
        }

        return this.#validated;
    }

    /**
     * The definition resolved as tooling resolves it, against the registry and bindings of the types declared, each node whose resolution failed read as a value of `Any`: its validation diagnostics, in the order of
     * the text, and the refusals of the bindings' types, and the resolver, which holds what tooling reads of each node, null where the definition could not be validated. Where an import is refused, the diagnostics
     * of its body are left out, since what its names read depends on its imports.
     * @param {import('./vocabulary/NexoRegistry.mjs').NexoRegistry} registry
     * @param {Record<string, string>} typeNames Each binding's name and the notation of the type declared for it.
     * @returns {{ resolver: LanguageResolver | null, diagnostics: NexoError[], bindingDiagnostics: NexoError[] }}
     */
    resolve(registry, typeNames) {
        const bindingDiagnostics = [];
        const bindings = ParameterBindings.declare(registry, typeNames, error => bindingDiagnostics.push(error));
        const { definition, recovery: validation } = this.validate();

        if (definition === null) {
            return { resolver: null, diagnostics: [], bindingDiagnostics };
        }

        const recovery = new RecoveryRecord(validation.holes);
        const resolver = new LanguageResolver(registry, bindings, this.#locations, recovery);

        resolver.resolveDefinition(definition);

        const refusedImport = recovery.diagnostics.some(error => error.location.pointer?.startsWith('/imports/'));
        const diagnostics = refusedImport ? recovery.diagnostics.filter(error => error.location.pointer?.startsWith('/imports/')) : recovery.diagnostics;

        return { resolver, diagnostics: TextReading.#inTextOrder(diagnostics), bindingDiagnostics };
    }

    /**
     * Every diagnostic of the text, in the order of the stages, syntax, structure and resolution, each stage's in the order of the text, the refusals of the bindings' types before the definition's structure diagnostics;
     * the resolution's where a registry is given alone.
     * @param {import('./vocabulary/NexoRegistry.mjs').NexoRegistry | null} registry
     * @param {Record<string, string>} typeNames
     * @returns {Diagnostic[]}
     */
    getDiagnostics(registry, typeNames) {
        const resolved = registry === null ? null : this.resolve(registry, typeNames);
        const errors = [...this.syntaxDiagnostics, ...(resolved?.bindingDiagnostics ?? []), ...this.validate().diagnostics, ...(resolved?.diagnostics ?? [])];

        return errors.map(error => this.createDiagnostic(error));
    }

    /**
     * The diagnostic of the error, as tooling answers it: its code, its kind, its message and its location, as the error holds them, and the range of text it stands at, where it stands in the text: a syntax error's
     * from its offset to the end of the token there, and a script's the span of the part its pointer names.
     * @param {NexoError} error
     * @returns {Diagnostic}
     */
    createDiagnostic(error) {
        const { code, kind, message, location } = error;
        const range = this.#rangeOf(location);

        return Object.freeze({ code, kind, message, location: Object.freeze({ ...location }), ...(range === null ? {} : { range: Object.freeze(range) }) });
    }

    /** The range of text a location stands at, or null for one that stands nowhere in it. */
    #rangeOf(location) {
        if (location.pointer !== undefined) {
            const span = this.#locations.getSpan(location.pointer);

            return span === null ? null : { start: span.start, end: span.end };
        }

        if (location.offset === undefined) {
            return null;
        }

        const token = [...SyntaxTree.tokensOf(this.#tree)].find(each => each.start === location.offset && each.end > each.start);

        return { start: location.offset, end: token?.end ?? location.offset };
    }

    /** The errors in the order of the text, by where each stands, those that stand nowhere in it first, each kept in its order among those that stand alike. */
    static #inTextOrder(errors) {
        return errors.map((error, index) => ({ error, index })).sort((one, other) => (one.error.location.offset ?? -1) - (other.error.location.offset ?? -1) || one.index - other.index).map(({ error }) => error);
    }

    /** The pointer of each hole the node holds, itself among them. */
    static #holesOf(node, pointer, holes = []) {
        if (Array.isArray(node)) {
            node.forEach((item, index) => TextReading.#holesOf(item, `${pointer}/${index}`, holes));

            return holes;
        }

        if (node === null || typeof node !== 'object') {
            return holes;
        }

        if (node.kind === 'hole') {
            holes.push(pointer);
        }

        for (const key of Object.keys(node)) {
            TextReading.#holesOf(node[key], `${pointer}/${key}`, holes);
        }

        return holes;
    }
}
