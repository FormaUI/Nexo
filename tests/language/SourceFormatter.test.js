import { describe, it, expect } from 'vitest';
import { nexo } from '#nexo/nexo.js';
import { SourceFormatter } from '#nexo/language/SourceFormatter.mjs';

describe('SourceFormatter', () => {
    it('spaces the tokens of a line as canonical text does, each written as the text spells it', () => {
        expect(SourceFormatter.format("{ a = 1,   b=2 , c='it''s' , d=items[ 0 ] .. ^ 1 }")).toBe("{ a = 1, b = 2, c = 'it''s', d = items[0]..^1 }");
        expect(SourceFormatter.format('f( (?a.b) , -x , - -1 , [ "k"=1 ] , [=] , room ?: usage , $"a {x+1} b" )')).toBe('f((?a.b), -x, - -1, ["k" = 1], [=], room?:usage, $"a {x + 1} b")');
        expect(SourceFormatter.format('let f = function (x) x end\nreturn if(a)then not(b)else f (1) end')).toBe('let f = function(x) x end\nreturn if (a) then not (b) else f(1) end');
    });

    it('keeps every line break where the text puts one, indenting each line by the constructs open at its start whose openers end their lines, a closer at its opener\'s line', () => {
        expect(SourceFormatter.format('{\na = {\nx = 1\n},\nb = [\n1,\n2\n]\n}')).toBe('{\n    a = {\n        x = 1\n    },\n    b = [\n        1,\n        2\n    ]\n}');
        expect(SourceFormatter.format('if a then\n1\nelseif b then\n  2\nelse\n      3\nend')).toBe('if a then\n    1\nelseif b then\n    2\nelse\n    3\nend');
        expect(SourceFormatter.format('let f = function(x)\nlet y = x\n  return y\n  end\nreturn f(1)')).toBe('let f = function(x)\n    let y = x\n    return y\nend\nreturn f(1)');
    });

    it('indents a line that continues a value a level more: a member step, a binary operator, and a value after its = or =>', () => {
        expect(SourceFormatter.format('let total = items\n.where(it.paid)\n      .sum(it.amount)\nreturn total')).toBe('let total = items\n    .where(it.paid)\n    .sum(it.amount)\nreturn total');
        expect(SourceFormatter.format('{ a = (b\n+ c), d =\n1 }')).toBe('{ a = (b\n    + c), d =\n    1 }');
    });

    it('keeps every comment where the text puts it, a run of blank lines as one and none at the start, and a line break at the end where the text ends with one', () => {
        expect(SourceFormatter.format('\n\n  // leading\n{\n  // the size\n  size = it.size,   // trailing   \n\n\n\n    /* block */ b = 2\n}\n\n\n')).toBe('// leading\n{\n    // the size\n    size = it.size, // trailing\n\n    /* block */ b = 2\n}\n');
        expect(SourceFormatter.format('/* c */ 1')).toBe('/* c */ 1');
    });

    it("keeps each string's written form, a block's lines and its delimiter among it, and the text's line breaks, CRLF among them", () => {
        expect(SourceFormatter.format("{\r\n  a = '''\r\n      raw\r\n      ''',\r\n  b = 2\r\n}\r\n")).toBe("{\r\n    a = '''\r\n      raw\r\n      ''',\r\n    b = 2\r\n}\r\n");
    });

    it('answers a text that breaks the grammar as it is, since where its constructs begin and end is not known', () => {
        for (const text of ['{ a = ', 'x  =>  x+1', '', '   ', 'a /* x\n y */ + 1']) {
            expect(SourceFormatter.format(text)).toBe(text);
        }
    });

    it('formats canonical text as it is, and a text formatted already as it is, and gives a text that reads back as the same definition', () => {
        const texts = [
            'let shown = rows.where(it.visible)\nreturn { count = shown.count, label = $"{shown.count} of {rows.count} shown" }',
            'room {\n  names = it.devices.select(it.name),\n    lastTwo = it.devices[^2..] { name = it.name }\n}',
            '{ let to = "3", value = @to to Number, x = (if a then 1 else 2 end) + ~to }',
        ];

        for (const text of texts) {
            const formatted = SourceFormatter.format(text);
            const canonical = nexo.format(text);

            expect(nexo.parse(formatted)).toEqual(nexo.parse(text));
            expect(SourceFormatter.format(formatted)).toBe(formatted);
            expect(SourceFormatter.format(canonical)).toBe(canonical);
        }
    });
});
