import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { nexo, NexoError } from '#nexo/nexo.js';
import { repositoryRoot } from './support/paths.mjs';

const guide = readFileSync(resolve(repositoryRoot, 'docs/embedding-guide.md'), 'utf8');

/** The guide's JavaScript blocks, in order, each with its lines and the line of the guide its first stands on. */
const blocks = [...guide.matchAll(/^```js\n([\s\S]*?)\n```$/gm)].map(match => ({ line: guide.slice(0, match.index).split('\n').length + 1, lines: match[1].split('\n') }));

/** What a comment states, where it is a JavaScript value, as `// 'Number'`, and undefined where it is prose, as `// the same definition`. */
const statedBy = comment => {
    try {
        return { text: comment, value: new Function(`return (${comment});`)() };
    } catch {
        return undefined;
    }
};

/**
 * The guide's code as one program, its blocks in order, each statement whose comment states a value, on its line or on the line after it, written as a check of that value, which `check` receives with the line of
 * the guide the statement stands on. Each statement whose comment is prose runs as it is written.
 */
const program = () => {
    const checks = [];
    const prose = [];
    const code = blocks.flatMap(({ line, lines }) => {
        const written = [];

        lines.forEach((text, index) => {
            const inline = text.match(/^(\s*)(.+?);\s*\/\/ (.+)$/);
            const alone = text.match(/^\s*\/\/ (.+)$/);
            const comment = (inline ?? alone)?.at(-1);
            const stated = comment === undefined ? undefined : statedBy(comment);
            const previous = written.at(-1)?.match(/^(\s*)(.+);$/);

            if (comment !== undefined && stated === undefined) {
                prose.push(comment);
            }

            if (inline && stated) {
                checks.push(line + index);
                written.push(`${inline[1]}check(${line + index}, () => (${inline[2]}), ${stated.text});`);
            } else if (alone && stated && previous) {
                checks.push(line + index - 1);
                written[written.length - 1] = `${previous[1]}check(${line + index - 1}, () => (${previous[2]}), ${stated.text});`;
            } else {
                written.push(text);
            }
        });

        return written;
    });

    return { code: code.join('\n'), checks, prose };
};

describe('the embedding guide', () => {
    it('gives each value its comments state, running its JavaScript in order as a host would', () => {
        const { code, checks } = program();
        const checked = [];
        const check = (line, actual, expected) => {
            checked.push(line);
            expect(actual(), `the guide's line ${line}`).toEqual(expected);
        };

        new Function('nexo', 'NexoError', 'check', code)(nexo, NexoError, check);

        expect(checks).toHaveLength(22);
        expect(checked).toEqual(checks);
    });

    it('states a value in every comment but one, the definition a host\'s import gives, which is the one the script\'s own import gives', () => {
        expect(program().prose).toEqual(['the same definition']);
        expect(guide).toContain("nexo.parse('Shop.open', { imports: ['Shop'] });  // the same definition");
        expect(nexo.parse('Shop.open', { imports: ['Shop'] })).toEqual(nexo.parse('import Shop\nShop.open'));
    });
});
