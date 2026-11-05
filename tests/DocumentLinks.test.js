import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { repositoryRoot } from './support/paths.mjs';

/** The folders that hold no document of Nexo's: Git's, dependencies, build outputs, and the notes Git ignores. */
const SKIPPED = new Set(['.git', '.local', '.vs', '.idea', 'artifacts', 'bin', 'node_modules', 'obj', 'wwwroot']);

/** A link into Nexo's own repository by its address, as the README gives one for a reader on npm or NuGet: the ref, the file's path in it, and the anchor in that file, if one is given. */
const OWN_ADDRESS = /^https:\/\/github\.com\/FormaUI\/Nexo\/blob\/([^/]+)\/([^#]+)(?:#(.+))?$/;

/** A link into FormaUI Versioning's documents, by the tag of the release it names. */
const VERSIONING_ADDRESS = /https:\/\/github\.com\/FormaUI\/Versioning\/blob\/([^/]+)\//g;

/** An action of FormaUI Versioning's a workflow calls, by the commit it pins and the release its comment names. */
const VERSIONING_ACTION = /uses: FormaUI\/Versioning\/\S+@(\S+) # (\S+)/g;

/** The commits of Nexo's that a record of the past links to, each with what it holds; every other link reaches the documents as this commit holds them. */
const RECORDED = new Map([
    ['76ddb3f39d58b0fb1327013c2a8c9690a5c4fb1e', 'the tooling draft, before it was withdrawn from main'],
    ['c9db3adc838ab8d16a6aa1626ce6df5a61b50f79', "the checklists of DOMQL's migration, before they were removed once done"],
]);

/** Every Markdown document under a folder, by its path from the repository's root. */
const documentsOf = folder =>
    readdirSync(resolve(repositoryRoot, folder), { withFileTypes: true }).flatMap(entry => {
        const path = join(folder, entry.name);

        if (entry.isDirectory()) {
            return SKIPPED.has(entry.name) ? [] : documentsOf(path);
        }

        return extname(entry.name) === '.md' ? [path] : [];
    });

/** The lines of a text outside its fenced code blocks, each with its number. */
const proseOf = text => {
    let fenced = false;

    return text.split(/\r?\n/).flatMap((line, index) => {
        if (/^\s*(```|~~~)/.test(line)) {
            fenced = !fenced;

            return [];
        }

        return fenced ? [] : [{ line, number: index + 1 }];
    });
};

/** The anchor GitHub gives a heading: its text in lower case, a link's text alone, every character but a letter, a mark, a digit, a connector, a space or a hyphen removed, and each space a hyphen. */
const slugOf = heading =>
    heading
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .toLowerCase()
        .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
        .replace(/ /g, '-');

/** The anchors of a Markdown text: each `<a id>` it gives, and each heading's, a repeated heading's numbered as GitHub numbers it. */
const anchorsOf = text => {
    const anchors = new Set();
    const seen = new Map();

    proseOf(text).forEach(({ line }) => {
        [...line.matchAll(/<a\s+(?:id|name)="([^"]+)"/g)].forEach(([, id]) => anchors.add(id));

        const heading = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);

        if (heading) {
            const slug = slugOf(heading[1]);
            const count = seen.get(slug) ?? 0;

            anchors.add(count === 0 ? slug : `${slug}-${count}`);
            seen.set(slug, count + 1);
        }
    });

    return anchors;
};

/** A document as a ref holds it, or undefined where it holds none: as this commit holds it, for `main`, and from the history, for a recorded commit. Each is read once for the run, since no document changes while the tests read them. */
const texts = new Map();
const textAt = (ref, path) => {
    const key = `${ref}:${path}`;

    if (!texts.has(key)) {
        const file = resolve(repositoryRoot, path);

        if (ref === 'main') {
            texts.set(key, existsSync(file) ? readFileSync(file, 'utf8') : undefined);
        } else {
            try {
                texts.set(key, execFileSync('git', ['-C', repositoryRoot, 'show', `${ref}:${path}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
            } catch {
                texts.set(key, undefined);
            }
        }
    }

    return texts.get(key);
};

/** What is wrong with a link to a path of Nexo's at a ref, or undefined where nothing is: a ref other than `main` or a recorded commit, a path the ref doesn't hold, or an anchor its document doesn't give. */
const problemOf = (ref, path, anchor) => {
    if (ref !== 'main' && !RECORDED.has(ref)) {
        return `names ${ref}, where a link names main, or a commit a record of the past names`;
    }

    const isDocument = extname(path) === '.md';
    const held = isDocument ? textAt(ref, path) !== undefined : ref === 'main' ? existsSync(resolve(repositoryRoot, path)) : textAt(ref, path) !== undefined;

    if (!held) {
        return `names ${path}, which ${ref} does not hold`;
    }

    return anchor !== undefined && isDocument && !anchorsOf(textAt(ref, path)).has(decodeURIComponent(anchor)) ? `names #${anchor}, which ${path} at ${ref} does not give` : undefined;
};

/** What is wrong with each link a document gives within Nexo, inline or as a reference's definition, outside its code, as where it stands and what is wrong with it. */
const problemsOf = file => {
    const where = number => `${file.replaceAll('\\', '/')}:${number}`;

    return proseOf(readFileSync(resolve(repositoryRoot, file), 'utf8')).flatMap(({ line, number }) =>
        [...line.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)|^\[[^\]]+\]:\s*(\S+)/g)].flatMap(([, inline, reference]) => {
            const target = inline ?? reference;
            const address = target.match(OWN_ADDRESS);

            if (address === null && /^[a-z]+:/i.test(target)) {
                return [];
            }

            const [ref, path, anchor] = address === null ? ['main', ...linkedFrom(file, target)] : address.slice(1);
            const problem = problemOf(ref, path, anchor);

            return problem === undefined ? [] : [`${where(number)}: ${problem}`];
        }),
    );
};

/** A relative link's path from the repository's root, and its anchor: a link of a document's own anchor alone names the document itself. */
const linkedFrom = (file, target) => {
    const [path, anchor] = decodeURIComponent(target).split('#');
    const linked = path === '' ? file : join(dirname(file), path);

    return [relative(repositoryRoot, resolve(repositoryRoot, linked)).replaceAll('\\', '/'), anchor];
};

describe('the links of Nexo\'s documents', () => {
    it('reach each document and anchor they name, as this commit holds them, or as a commit a record of the past names holds them', () => {
        const documents = documentsOf('.');

        expect(documents.length).toBeGreaterThan(30);
        expect(documents.flatMap(problemsOf)).toEqual([]);
    });

    it('name one release of FormaUI Versioning, the one Nexo follows: a document by its tag, and a workflow by its full commit, with the tag beside it', () => {
        const read = path => readFileSync(resolve(repositoryRoot, path), 'utf8');
        const tags = documentsOf('.').flatMap(file => [...read(file).matchAll(VERSIONING_ADDRESS)].map(([, tag]) => tag));
        const actions = readdirSync(resolve(repositoryRoot, '.github/workflows')).flatMap(name => [...read(join('.github/workflows', name)).matchAll(VERSIONING_ACTION)].map(([, commit, tag]) => ({ commit, tag })));
        const [tag] = tags;

        expect(new Set(tags)).toEqual(new Set([tag]));
        expect(actions.length).toBeGreaterThan(0);
        expect(new Set(actions.map(({ commit }) => commit)).size).toBe(1);
        actions.forEach(action => expect(action).toEqual({ commit: expect.stringMatching(/^[0-9a-f]{40}$/), tag }));
    });

    it('read a heading\'s anchor as GitHub writes it, a repeated heading\'s numbered', () => {
        expect([...anchorsOf('# Nexo `1.0` and DOMQL\n\n## Queries\n\n## Queries\n\n<a id="d76"></a>\n\n```md\n## Not a heading\n```')]).toEqual(['nexo-10-and-domql', 'queries', 'queries-1', 'd76']);
        expect(slugOf('[Selecting](queries.md) a result')).toBe('selecting-a-result');
    });
});
