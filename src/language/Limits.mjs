/**
 * Limits — the bounds Nexo holds a script to, so a text or a definition beyond them is refused with its code, rather than overflowing the stack of whatever reads it, and the lower bounds a host sets on the work it evaluates.
 */

import { NexoErrors } from './NexoError.mjs';

export class Limits {
    /**
     * The most levels a script's expressions nest: a definition's nodes, each within the one holding it, and a text's values, each within the brackets, the braces or the parentheses holding it. Reading text, validating,
     * resolving, evaluating and writing a definition each follow its nesting, and each reads 256 levels with room to spare.
     */
    static nesting = 256;

    /**
     * The most levels the data a host gives nests, each list, dictionary, pair, object or structure within another a level deeper: data it binds, data a host call supplies, and a result holding data a member answered.
     * Binding, capturing, typing, checking and copying data each follow its nesting, and each reads 1,000 levels with room to spare; data costs less for each level than a script does, so it nests deeper.
     */
    static dataNesting = 1000;

    /** The most items a list holds, as JavaScript's arrays hold them. */
    static listLength = 2 ** 32 - 1;

    /** The limits of an evaluator its host sets none of: a list one of Nexo's own members makes holds as many items as a list can. */
    static none = Object.freeze({ items: null });

    /**
     * The limits a host sets for the evaluations of an evaluator, frozen, from its options: `items`, the most items a list one of Nexo's own members makes may hold where its size is not its receiver's, a whole number from 0 to
     * the most a list holds, and none where it sets none. Options or limits that are no object, and an `items` that is no such number, are refused (NEXO2049), and a key either takes none of, as any operation's options are (NEXO2048).
     */
    static hostLimitsOf(options) {
        if (options === undefined || options === null) {
            return Limits.none;
        }

        const fail = (message, code = 'NEXO2049') => {
            throw NexoErrors.structure(code, message, {});
        };
        const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

        if (!isObject(options)) {
            fail('createEvaluator takes its options as an object, as { limits: { items: 10000 } }');
        }

        const unknownOption = Object.keys(options).find(key => key !== 'limits');

        if (unknownOption !== undefined) {
            fail(`createEvaluator takes the options 'limits', and '${unknownOption}' is none of them`, 'NEXO2048');
        }

        const { limits } = options;

        if (limits === undefined) {
            return Limits.none;
        }

        if (!isObject(limits)) {
            fail('An evaluator\'s limits are an object, as { items: 10000 }');
        }

        const unknownLimit = Object.keys(limits).find(key => key !== 'items');

        if (unknownLimit !== undefined) {
            fail(`An evaluator's limits are 'items', and '${unknownLimit}' is none of them`, 'NEXO2048');
        }

        const { items } = limits;

        if (items === undefined) {
            return Limits.none;
        }

        if (!Number.isSafeInteger(items) || items < 0 || items > Limits.listLength) {
            fail(`An evaluator's limit of 'items' is a whole number from 0 to ${Limits.listLength}, and is ${typeof items === 'number' ? items : typeof items}`);
        }

        return Object.freeze({ items });
    }
}
