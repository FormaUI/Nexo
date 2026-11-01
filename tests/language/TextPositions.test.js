import { describe, it, expect } from 'vitest';
import { TextPositions } from '#nexo/language/TextPositions.mjs';

describe('TextPositions', () => {
    it('gives an offset its line and column from 1, each LF, CRLF or lone CR beginning a line, CRLF once and both its characters counted', () => {
        expect(TextPositions.locate('abc', 0)).toEqual({ offset: 0, line: 1, column: 1 });
        expect(TextPositions.locate('a\nbc', 3)).toEqual({ offset: 3, line: 2, column: 2 });
        expect(TextPositions.locate('a\r\nbc', 4)).toEqual({ offset: 4, line: 2, column: 2 });
        expect(TextPositions.locate('a\rb\r\nc', 5)).toEqual({ offset: 5, line: 3, column: 1 });
        expect(TextPositions.locate('a\r\n', 2)).toEqual({ offset: 2, line: 1, column: 3 });
    });
});
