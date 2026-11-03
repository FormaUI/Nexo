/**
 * ResultPath — a path into an expression's result, of field names and list indices: its shape, the type it reaches and the value it reads
 */

import { NexoErrors } from './NexoError.mjs';
import { Names } from './Names.mjs';
import { Type } from './Type.mjs';

export class ResultPath {
    /** Validates a path's shape before anything reads it: a list, each of its items a name or a list index, a whole number that is not negative, and any other is refused. */
    static validateShape(path) {
        if (!Array.isArray(path)) {
            throw NexoErrors.structure('NEXO2646', `A path is a list of the names of fields and of list indices, and ${JSON.stringify(path) ?? String(path)} is none`, {});
        }

        for (const item of path) {
            const isIndex = Number.isInteger(item) && item >= 0;

            // A field a result holds is named by any word, a reserved word among them.
            if (!isIndex && !Names.isIdentifier(item)) {
                throw NexoErrors.structure('NEXO2646', `A path holds the names of fields and list indices that are whole numbers and not negative, and ${JSON.stringify(item) ?? String(item)} is neither`, {});
            }
        }
    }

    /**
     * The type the path reaches in the result's type, nullable where a step it passes is; a type that says nothing of its value takes any path, which is checked once its type is known. The path's shape is its
     * caller's to validate first.
     * @param {Type} resultType The result's type.
     * @param {(string | number)[]} path
     * @param {import('./vocabulary/NexoRegistry.mjs').NexoRegistry} registry Where a structured type's fields are declared.
     * @param {() => object} locationOf Where a path that does not fit the result is refused, found only when one is.
     */
    static typeAt(resultType, path, registry, locationOf) {
        let type = resultType;
        let isNullable = false;

        for (const item of path) {
            if (type.kind === 'null' || type.kind === 'never') {
                return Type.null;
            }

            isNullable ||= type.isNullable;

            if (typeof item === 'number') {
                if (!type.isList) {
                    throw NexoErrors.validation('NEXO3601', `The path indexes ${type.toNonNullable()}, which is no list`, locationOf());
                }

                // An index out of range gives null.
                type = type.itemType;
                isNullable = true;
                continue;
            }

            // A dictionary exports its entries, and a pair its key and its value, so a path steps through them as through the result's exported form.
            if (type.isDictionary && item === 'entries') {
                const [keyType, valueType] = type.typeArguments;

                type = Type.createListType(Type.createObjectType(new Map([['key', keyType], ['value', valueType]])));
                continue;
            }

            if (type.isPair && (item === 'key' || item === 'value')) {
                type = type.typeArguments[item === 'key' ? 0 : 1];
                continue;
            }

            // An object type's object field, or a property of a structured type's data, each type's lookup its own.
            const nextType = type.kind === 'object' ? type.getObjectFieldType(item) : (registry.getDataShape(type)?.get(item) ?? null);

            if (nextType === null) {
                throw NexoErrors.validation('NEXO3602', `The path names '${item}', which ${type.toNonNullable()} does not hold`, locationOf());
            }

            type = nextType;
        }

        return isNullable ? type.toNullable() : type;
    }

    /**
     * The value the path reaches in the result: a name steps to an object field the value holds, and an index to a list's item; null where a step it passes is null or holds nothing at the step, an object field it
     * lacks, an index out of range, and a name of a list or an index of an object among them. The path's shape is its caller's to validate first.
     */
    static valueAt(value, path) {
        let current = value;

        for (const item of path) {
            const holds = typeof item === 'number' ? Array.isArray(current) && item < current.length : current !== null && typeof current === 'object' && !Array.isArray(current) && Object.hasOwn(current, item);

            if (!holds) {
                return null;
            }

            current = current[item] ?? null;
        }

        return current;
    }
}
