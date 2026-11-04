import { setFlagsFromString } from 'node:v8';
import { runInNewContext } from 'node:vm';
import { describe, it, expect } from 'vitest';
import { nexo } from '#nexo/nexo.js';
import { errorThrownBy } from './support/errors.mjs';
import { extensionDeclaration, hostFunctionDeclaration } from './support/declarations.mjs';

const { createPropertyDeclaration, createFunctionParameterDeclaration, createValueParameterDeclaration } = nexo.declarations;

// A full collection on demand, as the benchmark makes one.
setFlagsFromString('--expose-gc');

const collectGarbage = runInNewContext('gc');

/**
 * Collects garbage six times, each after a macrotask, so a target a weak reference was made or read for in the job that made it is no longer kept for that job, and what one collection leaves for the next is collected
 * by it.
 */
const collect = async () => {
    for (let round = 0; round < 6; round++) {
        await new Promise(resolve => setTimeout(resolve, 0));
        collectGarbage();
    }
};

/** Whether each weak reference's target is collected, by its name, after collecting garbage. */
const releasedOf = async references => {
    await collect();

    return Object.fromEntries(Object.entries(references).map(([name, reference]) => [name, reference.deref() === undefined]));
};

/** The rows a host binds, and the entries of the catalog its environment holds: enough data that keeping it is a cost a host would notice. */
const ROWS = 10_000;

const rowsOf = () => Array.from({ length: ROWS }, (_, n) => ({ n, name: `row ${n}` }));

/** A weak reference to each list the `size` member is given, the latest last, so a test sees whether a list a script's local made outlives what holds it. */
const sized = [];

/**
 * A home's module: `follow`, a host call keeping a test of a room and taking a label; `occupied`, read from the environment as it is read; `broken`, whose implementation throws; and `size`, the length of any list,
 * which records the list it is given.
 */
const home = nexo.createModule('home', {
    types: [
        extensionDeclaration('Rooms', 'String', [
            hostFunctionDeclaration('follow', undefined, { arguments: 'options', parameters: [createFunctionParameterDeclaration('when', 'Boolean', ['String']), createValueParameterDeclaration('label', 'String', { default: 'all' })] }),
            createPropertyDeclaration('occupied', 'Boolean', { updates: { changes: 'unobserved', reads: 'fresh' }, impl: ({ receiver, env }) => env.occupied.includes(receiver) }),
            createPropertyDeclaration('broken', 'String', { updates: { changes: 'constant', reads: 'fresh' }, impl: () => { throw new Error('The label is broken'); } }),
        ]),
        extensionDeclaration('Lists<T>', 'List<T>', [createPropertyDeclaration('size', 'Number', { updates: { changes: 'constant', reads: 'fresh' }, impl: ({ receiver }) => (sized.push(new WeakRef(receiver)), receiver.length) })]),
    ],
});

/** The host's registry, which it keeps for good, as a host keeps the vocabulary it registered. */
const registry = nexo.createRegistry([home]);
const imports = { imports: ['home'] };

/** A call keeping a test that reads a local made of the bound rows, the rows themselves, and a member reading the environment. */
const FOLLOWING = 'let names = rows { name = it.name }\nlet size = names:size\nlet test = room => room:occupied and size > 0 and rows.count > 0\nreturn light:follow({ when = test })';

/** The same call, its label's member failing once its test is made. */
const FAILING = 'let names = rows { name = it.name }\nlet size = names:size\nlet test = room => room:occupied and size > 0\nreturn light:follow({ when = test, label = light:broken })';

/** A script that gives a value, reading the bound rows. */
const EVALUATED = '{ size = rows.count, names = rows { name = it.name } }';

/**
 * A host's data: its own rows, the bindings of them, which hold Nexo's frozen copy, and the environment, which holds a catalog of the rows. Each is made in a call of its own, so no frame of a test holds it.
 */
const createHostData = () => {
    const rows = rowsOf();

    return { rows, bindings: registry.createBindings({ light: 'hall', rows }), env: { occupied: ['hall'], catalog: Object.fromEntries(rowsOf().map(row => [row.name, row])) } };
};

/**
 * What the host keeps of a scenario run over its data, and weak references to what it lets go: its own rows, Nexo's bound copy of them, the environment, and, for a script that made it, the list its local `names`
 * holds, which the `size` member saw. Both are made in a call of its own, so the test's frame holds none of them.
 */
const scenario = (run, { makesLocal = true } = {}) => {
    const { rows, bindings, env } = createHostData();
    const kept = run({ bindings, env });

    return {
        kept,
        references: { host: new WeakRef(rows), bound: new WeakRef(bindings.readValue('rows')), env: new WeakRef(env), ...(makesLocal ? { local: sized.at(-1) } : {}) },
    };
};

/** A call following the hall, prepared over the host's data, and whose test is checked before anything is let go. */
const prepareFollowing = ({ bindings, env }) => {
    const call = registry.resolve(FOLLOWING, bindings, imports).createEvaluator(bindings, env).prepareHostCall();

    expect(call.args.when('hall')).toBe(true);

    return call;
};

const EVERYTHING_RELEASED = { host: true, bound: true, env: true, local: true };

describe('a prepared call\'s kept functions', () => {
    it('keep nothing once their host lets the call go undisposed, with its evaluator and its resolution', async () => {
        const { references } = scenario(data => (prepareFollowing(data), null));

        expect(await releasedOf(references)).toEqual(EVERYTHING_RELEASED);
    });

    it('keep nothing once their host disposes the call and lets it go, with its evaluator and its resolution', async () => {
        const { references } = scenario(data => (prepareFollowing(data).dispose(), null));

        expect(await releasedOf(references)).toEqual(EVERYTHING_RELEASED);
    });

    it('keep what they read while their host keeps one undisposed, so it stays callable, the host\'s own rows apart, which binding copied', async () => {
        const { kept: when, references } = scenario(data => prepareFollowing(data).args.when);

        expect(await releasedOf(references)).toEqual({ host: true, bound: false, env: false, local: false });
        expect([when('hall'), when('porch')]).toEqual([true, false]);
    });

    // A function its host keeps after disposing the call holds nothing of the evaluation: disposing empties what reaches the evaluator, and the function only refuses to be called (NEXO5051).
    it('keep nothing once their host disposes the call, though it keeps a disposed function', async () => {
        const { kept: when, references } = scenario(data => {
            const call = prepareFollowing(data);

            call.dispose();

            return call.args.when;
        });

        expect(await releasedOf(references)).toEqual(EVERYTHING_RELEASED);
        expect(errorThrownBy(() => when('hall'))).toMatchObject({ kind: 'evaluation', code: 'NEXO5051' });
    });

    // Disposing again changes nothing, and the function still refuses to be called.
    it('keep nothing once their host disposes the call twice, though it keeps a disposed function', async () => {
        const { kept: when, references } = scenario(data => {
            const call = prepareFollowing(data);

            call.dispose();
            call.dispose();

            return call.args.when;
        });

        expect(await releasedOf(references)).toEqual(EVERYTHING_RELEASED);
        expect(errorThrownBy(() => when('hall'))).toMatchObject({ kind: 'evaluation', code: 'NEXO5051' });
    });
});

describe('a preparation that fails', () => {
    /** Prepares the failing call over the host's data, answering its evaluator and the error it throws, which a test checks, reading no stack. */
    const prepareFailing = ({ bindings, env }) => {
        const evaluator = registry.resolve(FAILING, bindings, imports).createEvaluator(bindings, env);
        const error = errorThrownBy(() => evaluator.prepareHostCall());

        expect({ code: error.code, kind: error.kind, location: error.location, cause: error.cause.message }).toEqual({
            code: 'NEXO5007',
            kind: 'evaluation',
            location: { pointer: '/expression/result/arguments/0/objectFields/1/value', offset: 147, line: 4, column: 44 },
            cause: 'The label is broken',
        });

        return { evaluator, error };
    };

    it('leaves nothing it made in the evaluator its host keeps, which holds its bindings and its environment alone', async () => {
        const { kept: evaluator, references } = scenario(data => prepareFailing(data).evaluator);

        expect(await releasedOf(references)).toEqual({ host: true, bound: false, env: false, local: true });
        expect(errorThrownBy(() => evaluator.prepareHostCall())).toMatchObject({ code: 'NEXO5007', location: { pointer: '/expression/result/arguments/0/objectFields/1/value' } });
    });

    it('keeps nothing once its host lets the evaluator go, keeping the error, its stack and its cause\'s read', async () => {
        const { kept: error, references } = scenario(data => {
            const { error: thrown } = prepareFailing(data);

            expect([typeof thrown.stack, typeof thrown.cause.stack]).toEqual(['string', 'string']);

            return thrown;
        });

        expect(await releasedOf(references)).toEqual(EVERYTHING_RELEASED);
        expect(error.code).toBe('NEXO5007');
    });

    // An error Nexo raises writes its stack as it is made, and its cause's, so the frames each was raised in, the evaluator among their receivers, are let go of whether or not its host reads either.
    it('keeps nothing once its host lets the evaluator go, keeping the error unread', async () => {
        const { kept: error, references } = scenario(data => prepareFailing(data).error);

        expect(await releasedOf(references)).toEqual(EVERYTHING_RELEASED);
        expect(error.code).toBe('NEXO5007');
    });
});

describe('an evaluator evaluated once', () => {
    /** Evaluates the script once over the host's data, with an evaluator of the resolution given, or of one resolved with those bindings, and checks what it answered. */
    const evaluateOnce = ({ bindings, env }, resolution = registry.resolve(EVALUATED, bindings, imports)) => {
        const evaluation = resolution.createEvaluator(bindings, env).evaluate();

        expect(evaluation.value.size).toBe(ROWS);

        return evaluation;
    };

    /** A scenario of a script that gives a value, which makes no local the `size` member sees. */
    const evaluated = run => scenario(run, { makesLocal: false });

    const ALL_RELEASED = { host: true, bound: true, env: true };
    const RESOLUTION_TYPE = '{ size: Number, names: List<{ name: String }> }';

    it('keeps nothing once its host lets it and its resolution go', async () => {
        const { references } = evaluated(data => (evaluateOnce(data), null));

        expect(await releasedOf(references)).toEqual(ALL_RELEASED);
    });

    it('keeps nothing once its host lets it go, keeping its resolution, which was resolved with other bindings of the same key', async () => {
        const resolution = registry.resolve(EVALUATED, { light: 'hall', rows: [{ n: 0, name: 'row 0' }] }, imports);
        const { references } = evaluated(data => (evaluateOnce(data, resolution), null));

        expect(await releasedOf(references)).toEqual(ALL_RELEASED);
        expect(resolution.type).toBe(RESOLUTION_TYPE);
    });

    it('keeps nothing once its host lets it go, keeping its resolution, which was resolved with the same bindings and holds none of their data', async () => {
        const { kept: resolution, references } = evaluated(data => {
            const resolved = registry.resolve(EVALUATED, data.bindings, imports);

            evaluateOnce(data, resolved);

            return resolved;
        });

        expect(await releasedOf(references)).toEqual(ALL_RELEASED);
        expect(resolution.type).toBe(RESOLUTION_TYPE);
    });

    it('keeps nothing once its host lets it go, keeping the value it answered, which shares nothing with the bindings', async () => {
        const { kept: value, references } = evaluated(data => {
            const answered = evaluateOnce(data).value;

            expect([answered.names[0] === data.bindings.readValue('rows')[0], Object.isFrozen(answered.names[0])]).toEqual([false, true]);

            return answered;
        });

        expect(await releasedOf(references)).toEqual(ALL_RELEASED);
        expect([value.size, value.names[0]]).toEqual([ROWS, { name: 'row 0' }]);
    });

    it('keeps nothing once its host lets it go, keeping its result, whose metadata it read, its sources holding the bound rows themselves and none of the list that held them', async () => {
        const { kept: evaluation, references } = evaluated(data => {
            const result = evaluateOnce(data);

            expect(result.metadata.objectFields.names.sources[0].value === data.bindings.readValue('rows')[0]).toBe(true);

            return result;
        });

        expect(await releasedOf(references)).toEqual(ALL_RELEASED);
        expect(evaluation.metadata.objectFields.names.sources[0]).toEqual({ kind: 'data', value: { n: 0, name: 'row 0' } });
    });

    // A result describes its metadata through the compilation's own evaluator, which holds neither the bindings nor the environment, so one its host keeps unread keeps nothing of the evaluation.
    it('keeps nothing once its host lets it go, keeping its result, whose metadata it never read', async () => {
        const { kept: evaluation, references } = evaluated(data => evaluateOnce(data));

        expect(await releasedOf(references)).toEqual(ALL_RELEASED);
        expect(evaluation.value.size).toBe(ROWS);
    });
});
