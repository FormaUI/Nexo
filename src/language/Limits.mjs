/**
 * Limits — the bounds Nexo holds a script to, so a text or a definition beyond them is refused with its code, rather than overflowing the stack of whatever reads it.
 */

export class Limits {
    /**
     * The most levels a script's expressions nest: a definition's nodes, each within the one holding it, and a text's values, each within the brackets, the braces or the parentheses holding it. Reading text, validating,
     * resolving, evaluating and writing a definition each follow its nesting, and each reads 256 levels with room to spare.
     */
    static nesting = 256;
}
