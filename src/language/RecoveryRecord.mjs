/**
 * RecoveryRecord — what a stage reading a definition tolerantly records as it recovers: each diagnostic once, and the holes, where the text lacks a part or the stage recovered from a failure, which explain the
 * diagnostics of what holds them
 */

/** The character that begins each segment of a JSON Pointer. */
const SLASH = '/'.charCodeAt(0);

export class RecoveryRecord {
    /** @type {import('./NexoError.mjs').NexoError[]} */
    #diagnostics = [];

    /** The pointer of each hole, a part the text lacks or a node a stage recovered from, which reads as a value of `Any` from then on. @type {Set<string>} */
    #holes;

    /** @param {Iterable<string>} [holes] The pointers of the holes the definition holds already, where the text lacks a part. */
    constructor(holes = []) {
        this.#holes = new Set(holes);
    }

    /** The diagnostics recorded, in the order recorded. */
    get diagnostics() {
        return this.#diagnostics;
    }

    /** The pointers of the holes. */
    get holes() {
        return this.#holes;
    }

    /**
     * Records the diagnostic a stage recovered from, and the node at the hole's pointer, where one is given, as a hole from then on. A diagnostic standing at a hole, or at a node that holds one, is left out, since the
     * hole may explain it, as is one of a code and a pointer recorded already, which a function's body resolved for each of its calls gives again.
     * @param {import('./NexoError.mjs').NexoError} error
     * @param {string} [hole]
     */
    record(error, hole = undefined) {
        const { pointer } = error.location;
        const isExplained = pointer !== undefined && [...this.#holes].some(each => RecoveryRecord.#isWithin(each, pointer));
        const isRecorded = this.#diagnostics.some(other => other.code === error.code && other.location.pointer === pointer && other.location.binding === error.location.binding);

        if (!isExplained && !isRecorded) {
            this.#diagnostics.push(error);
        }

        if (hole !== undefined) {
            this.#holes.add(hole);
        }
    }

    /** Whether a hole is recorded at the pointer or within the node it points to. */
    holdsHole(pointer) {
        return [...this.#holes].some(each => RecoveryRecord.#isWithin(each, pointer));
    }

    /** Whether the pointer is the enclosing one's, or one beneath it, whose next segment begins with a slash. */
    static #isWithin(pointer, enclosing) {
        return pointer.startsWith(enclosing) && (pointer.length === enclosing.length || pointer.charCodeAt(enclosing.length) === SLASH);
    }
}
