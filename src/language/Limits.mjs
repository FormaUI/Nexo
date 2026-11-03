/**
 * Limits — the bounds Nexo holds a script to, so a text or a definition beyond them is refused with its code, rather than overflowing the stack of whatever reads it.
 */

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
}
