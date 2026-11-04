/**
 * RecentlyUsed — the entries kept for the keys used most recently, as many as its capacity, which a key enters while there is room and otherwise at its second miss among the misses it remembers, so a stream of keys
 * met once never displaces the keys met again, and the entry used least recently leaves to make room
 */

export class RecentlyUsed {
    #capacity;

    /** The entries, the most recently used last. @type {Map<string, unknown>} */
    #entries = new Map();

    /** The keys that missed while the entries were full, the most recent last, as many as twice the capacity, each entering at its next miss. @type {Set<string>} */
    #missed = new Set();

    /** @param {number} capacity The most entries it keeps. */
    constructor(capacity) {
        this.#capacity = capacity;
    }

    /** The entry of the key, which becomes the most recently used, or undefined where none is kept. */
    get(key) {
        const value = this.#entries.get(key);

        if (value !== undefined) {
            this.#entries.delete(key);
            this.#entries.set(key, value);
        }

        return value;
    }

    /** Offers the entry of a key that missed: it is kept while there is room or at the key's second miss, letting the entry used least recently go, and only remembered otherwise. */
    offer(key, value) {
        if (this.#entries.size < this.#capacity || this.#missed.delete(key)) {
            this.#entries.set(key, value);

            if (this.#entries.size > this.#capacity) {
                this.#entries.delete(this.#entries.keys().next().value);
            }

            return;
        }

        this.#missed.add(key);

        if (this.#missed.size > this.#capacity * 2) {
            this.#missed.delete(this.#missed.values().next().value);
        }
    }
}
