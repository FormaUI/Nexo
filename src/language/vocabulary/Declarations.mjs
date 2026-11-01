/**
 * Declarations — the helpers that write a vocabulary's declarations: its parameters and members, each in the declaration shape with the defaults its contract gives it, constructing a record and registering nothing.
 * Each writes every option it is given over its defaults, leaving none out, so a module refuses an option its declaration doesn't take, where a helper that dropped it would hide the mistake.
 */

export class Declarations {
    /** A value parameter, required unless it is given a default. */
    static createValueParameterDeclaration(name, type, options = {}) {
        return { name, kind: 'value', type, required: options.default === undefined, fixed: false, nulls: 'propagate', ...options };
    }

    /**
     * An expression parameter, evaluated against each item of the collection it follows, a list's item or a dictionary's value, and producing the type. Its null policy says how a body reads a null item: `propagate`, the
     * default, reads each item as a value that is not null, a null item answering null without the body being evaluated, and `accept` evaluates the body against every item, null included, its `it` of the item's type.
     */
    static createExpressionParameterDeclaration(type, options = {}) {
        return { name: 'expression', kind: 'expression', type, context: 'item', required: true, fixed: false, nulls: 'propagate', ...options };
    }

    /**
     * A required predicate parameter, an expression evaluated against each item whose truthiness its implementation receives. Its null policy says how a body reads a null item, as an expression parameter's does:
     * `propagate`, the default, answers null for it, which is falsy, without the body being evaluated, and `accept` evaluates the body against it.
     */
    static createPredicateParameterDeclaration(options = {}) {
        return { name: 'expression', kind: 'predicate', type: 'Boolean', context: 'item', required: true, fixed: false, nulls: 'propagate', ...options };
    }

    /** A function parameter, always required: its callback contract, the types of the arguments the member calls the function with, in order, and the type of the result it takes from it. */
    static createFunctionParameterDeclaration(name, type, parameterTypes) {
        return { name, kind: 'function', type, parameterTypes, required: true };
    }

    /**
     * A property, a member read without arguments: one with updates, which the evaluator invokes, or, without them, a property of a structured type's data where it stands directly in that type, as the contract of
     * where it stands decides.
     */
    static createPropertyDeclaration(name, result, options) {
        return Declarations.#createMemberDeclaration('property', name, result, options);
    }

    /** A function, a member called with its arguments, positional unless it says they are options, or, with `invokedBy: 'host'`, one its host invokes, its result left out where its host supplies nothing. */
    static createFunctionDeclaration(name, result, options) {
        return Declarations.#createMemberDeclaration('function', name, result, options);
    }

    /** An indexer, given its one key in brackets: a named one, `x.name[key]`, or, where its name is null, the unnamed one of its receivers, `x[key]`. */
    static createIndexerDeclaration(name, result, options) {
        return Declarations.#createMemberDeclaration('indexer', name, result, options);
    }

    /**
     * A member of the kind, named unless its name is null, with no receiver of its own: where it stands gives it one, the type or the extension it is declared within, and a module member, among a module's `members`,
     * takes none. A function and an indexer take no parameters unless they are given some, and a function's arguments are positional where it has parameters and is given no argument form.
     */
    static #createMemberDeclaration(kind, name, result, options = {}) {
        const declaration = { ...(name === null ? {} : { name }), kind, result, ...(kind === 'property' ? {} : { parameters: [] }), ...options };

        if (kind === 'function' && declaration.arguments === undefined && Array.isArray(declaration.parameters) && declaration.parameters.length > 0) {
            declaration.arguments = 'positional';
        }

        return declaration;
    }
}
