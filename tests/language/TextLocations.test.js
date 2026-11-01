import { describe, it, expect } from 'vitest';
import { Lowering } from '#nexo/language/Lowering.mjs';
import { TextLocations } from '#nexo/language/TextLocations.mjs';
import { TextReading } from '#nexo/language/TextReading.mjs';

describe('TextLocations', () => {
    const text = 'let total = items.sum(it.price)\nreturn {\n    total = total,\n    label = $"{total} due"\n}';

    it('locates each part of the definition the text reads into, by its pointer, at its line and column', () => {
        const locations = new TextLocations(text);

        expect(locations.locate('/expression/locals/0/value')).toEqual({ pointer: '/expression/locals/0/value', offset: 12, line: 1, column: 13 });
        expect(locations.locate('/expression/locals/0/value/arguments/0')).toEqual({ pointer: '/expression/locals/0/value/arguments/0', offset: 22, line: 1, column: 23 });
        expect(locations.locate('/expression/result/objectFields/1/value')).toEqual({ pointer: '/expression/result/objectFields/1/value', offset: 72, line: 4, column: 13 });
    });

    it('locates a pointer that names no part of its own at the nearest part enclosing it, and one beneath none with its pointer alone', () => {
        const locations = new TextLocations(text);

        expect(locations.locate('/expression/result/objectFields/0/value/name')).toEqual({ pointer: '/expression/result/objectFields/0/value/name', offset: 53, line: 3, column: 13 });
        expect(locations.locate('/version')).toEqual({ pointer: '/version' });
    });

    it('reads the text with the imports a host supplied to it, which decide which names are namespaces', () => {
        const locations = new TextLocations('Home.rooms.count', [{ module: 'Home' }]);

        expect(locations.locate('/expression/receiver')).toEqual({ pointer: '/expression/receiver', offset: 0, line: 1, column: 1 });
        expect(locations.locate('/imports/0')).toEqual({ pointer: '/imports/0' });
    });

    it('takes the spans of a definition a tolerant reading lowered, rather than reading a text that breaks the grammar again, and answers the span of a pointer\'s nearest part', () => {
        const reading = new TextReading('{ a = room., b = 2 }', []);
        const locations = new TextLocations(reading.text, [], Lowering.lower(reading.tree));

        expect(locations.getSpan('/expression/objectFields/1/value')).toEqual({ start: 17, end: 18 });
        expect(locations.getSpan('/expression/objectFields/0/value/receiver')).toEqual({ start: 6, end: 10 });
        expect(locations.getSpan('/version')).toBeNull();
        expect(locations.locate('/expression/objectFields/1/value')).toEqual({ pointer: '/expression/objectFields/1/value', offset: 17, line: 1, column: 18 });
    });

    it('locates a written import at its declaration', () => {
        const locations = new TextLocations('import Home\n\nHome.rooms.count');

        expect(locations.locate('/imports/0')).toEqual({ pointer: '/imports/0', offset: 0, line: 1, column: 1 });
        expect(locations.locate('/expression/receiver/receiver')).toEqual({ pointer: '/expression/receiver/receiver', offset: 13, line: 3, column: 1 });
    });

    it('gives the text it reads from', () => {
        expect(new TextLocations(text).text).toBe(text);
    });
});
