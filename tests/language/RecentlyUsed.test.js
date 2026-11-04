import { describe, it, expect } from 'vitest';
import { RecentlyUsed } from '#nexo/language/RecentlyUsed.mjs';

/** The entries kept of the keys given, `undefined` for each one missing. */
const keptOf = (cache, keys) => keys.map(key => cache.get(key));

describe('RecentlyUsed', () => {
    it('keeps each key it is offered while there is room, and answers nothing for a key it was never offered', () => {
        const cache = new RecentlyUsed(3);

        cache.offer('a', 1);
        cache.offer('b', 2);

        expect(keptOf(cache, ['a', 'b', 'c'])).toEqual([1, 2, undefined]);
    });

    it('lets go of the entry used least recently once full, a key entering at its second miss alone', () => {
        const cache = new RecentlyUsed(2);

        cache.offer('a', 1);
        cache.offer('b', 2);
        cache.get('a');
        cache.offer('c', 3);

        // Reading 'a' and then 'b' leaves 'a' the entry used least recently.
        expect(keptOf(cache, ['a', 'b', 'c'])).toEqual([1, 2, undefined]);

        cache.offer('c', 3);

        expect(keptOf(cache, ['a', 'b', 'c'])).toEqual([undefined, 2, 3]);
    });

    it('keeps the keys met again through a stream of keys met once, and takes them back after a stream that filled it first', () => {
        const common = ['a', 'b'];
        const throughStream = new RecentlyUsed(2);

        common.forEach((key, index) => throughStream.offer(key, index));

        for (let index = 0; index < 100; index++) {
            throughStream.offer(`once${index}`, index);
            common.forEach(key => throughStream.get(key));
        }

        expect(keptOf(throughStream, common)).toEqual([0, 1]);

        const afterStream = new RecentlyUsed(2);

        for (let index = 0; index < 100; index++) {
            afterStream.offer(`once${index}`, index);
        }

        for (let round = 0; round < 2; round++) {
            common.forEach((key, index) => afterStream.get(key) ?? afterStream.offer(key, index));
        }

        expect(keptOf(afterStream, common)).toEqual([0, 1]);
    });

    it('remembers as many missed keys as twice its capacity, the oldest forgotten first', () => {
        const cache = new RecentlyUsed(1);

        cache.offer('kept', 0);
        ['a', 'b', 'c'].forEach(key => cache.offer(key, key));
        cache.offer('a', 'a');

        expect(cache.get('a')).toBeUndefined();

        cache.offer('c', 'c');

        expect(cache.get('c')).toBe('c');
    });
});
