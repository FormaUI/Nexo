/**
 * TextPositions — where an offset stands in a text: its line and its column, as a location gives them
 */

export class TextPositions {
    /** The offset's line and column in the text, each line break, LF, CRLF or a lone CR, beginning a line, so CRLF advances it once and its two characters count toward the offset. */
    static locate(text, offset) {
        let line = 1;
        let lineStart = 0;

        for (let index = 0; index < offset; index++) {
            const character = text[index];

            // A carriage return before a line feed is one line break with it, which the line feed ends.
            if (character === '\n' || (character === '\r' && text[index + 1] !== '\n')) {
                line++;
                lineStart = index + 1;
            }
        }

        return { offset, line, column: offset - lineStart + 1 };
    }
}
