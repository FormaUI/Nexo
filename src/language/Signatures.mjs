/**
 * Signatures — a declaration as tooling writes it for a script's author: its signature, its name and type parameters, its parameters and its result, and its qualified name, by the type it is read on or its module
 */

/** @typedef {import('./vocabulary/NexoRegistry.mjs').NexoRegistry} NexoRegistry */

export class Signatures {
    /**
     * The member's signature as tooling writes it: a property's name and its result, `count: Number`; a function's name, its type parameters, its parameters in parentheses, each its name and its type, an optional one's
     * name marked `?`, and its result, `select<U>(expression: U): List<U>`, a function its host invokes that supplies nothing written without one; and a named indexer's name and its key in brackets, `setting[key: String]: String?`.
     * @param {object} declaration A member a module declares, as its module's copy holds it.
     */
    static format(declaration) {
        const name = `${declaration.name ?? ''}${(declaration.typeParameters ?? []).length === 0 ? '' : `<${declaration.typeParameters.join(', ')}>`}`;
        const parameters = (declaration.parameters ?? []).map(parameter => `${parameter.name}${parameter.required === false ? '?' : ''}: ${parameter.type}`).join(', ');
        const result = declaration.result === undefined ? '' : `: ${declaration.result}`;

        switch (declaration.kind) {
            case 'property':
                return `${name}${result}`;
            case 'indexer':
                return `${name}[${parameters}]${result}`;
            default:
                return `${name}(${parameters})${result}`;
        }
    }

    /**
     * The name a script's author reads the member by, qualified as a diagnostic qualifies its use: by the type it is read on, the type it is declared within or its extension's target, as `Order.items`, or by its module
     * for a module member, as `Shop.open`; its name alone where it is read on any type.
     * @param {object} declaration
     * @param {NexoRegistry} registry
     */
    static formatQualifiedName(declaration, registry) {
        const [receiverType] = registry.getReceiverTypes(declaration);

        if (receiverType === undefined) {
            return `${registry.getDeclaringModuleName(declaration)}.${declaration.name}`;
        }

        return receiverType.kind === 'named' ? `${receiverType.name}.${declaration.name}` : declaration.name;
    }
}
