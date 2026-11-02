import { describe, it, expect } from 'vitest';
import { NexoErrors } from '#nexo/language/NexoError.mjs';
import { RecoveryRecord } from '#nexo/language/RecoveryRecord.mjs';

/** A validation error of the code at the pointer. */
const errorAt = (code, pointer) => NexoErrors.validation(code, 'A failure', { pointer });

describe('RecoveryRecord', () => {
    it('records each diagnostic a stage recovered from, in order, and each node it read as a hole from then on', () => {
        const record = new RecoveryRecord(['/expression/objectFields/1/value']);

        record.record(errorAt('NEXO3001', '/expression/objectFields/0/value'), '/expression/objectFields/0/value');
        record.record(errorAt('NEXO3067', '/expression/objectFields/2/value/right'), '/expression/objectFields/2/value');

        expect(record.diagnostics.map(error => error.code)).toEqual(['NEXO3001', 'NEXO3067']);
        expect([...record.holes]).toEqual(['/expression/objectFields/1/value', '/expression/objectFields/0/value', '/expression/objectFields/2/value']);
    });

    it('leaves out a diagnostic at a hole or at a node holding one, which the hole may explain, but keeps one beneath a hole', () => {
        const record = new RecoveryRecord(['/expression/objectFields/1/value']);

        record.record(errorAt('NEXO3043', '/expression'), '/expression');
        record.record(errorAt('NEXO3048', '/expression/objectFields/1/value'));
        record.record(errorAt('NEXO3001', '/expression/objectFields/1/value/receiver'));
        record.record(errorAt('NEXO3009', '/expression/objectFields/10/value'));

        expect(record.diagnostics.map(error => error.location.pointer)).toEqual(['/expression/objectFields/1/value/receiver', '/expression/objectFields/10/value']);
        expect(record.holdsHole('/expression')).toBe(true);
        expect(record.holdsHole('/expression/objectFields/10')).toBe(false);
    });

    it("leaves out a diagnostic at a key holding no node of a node that holds a hole, as its marks, but keeps one at a node beside a hole", () => {
        const record = new RecoveryRecord(['/expression/receiver', '/expression/right']);

        record.record(NexoErrors.structure('NEXO2000', 'A mark', { pointer: '/expression/continues' }));
        record.record(errorAt('NEXO3067', '/expression/left'));

        expect(record.diagnostics.map(error => error.location.pointer)).toEqual(['/expression/left']);
    });

    it('records a diagnostic of a code at a pointer once, as a function body resolved for each of its calls gives it again, and one of no pointer, as a binding\'s, alike', () => {
        const record = new RecoveryRecord();

        record.record(errorAt('NEXO3001', '/expression/locals/0/value/body'));
        record.record(errorAt('NEXO3001', '/expression/locals/0/value/body'));
        record.record(NexoErrors.structure('NEXO2036', 'No type', { binding: 'count' }));
        record.record(NexoErrors.structure('NEXO2036', 'No type', { binding: 'total' }));

        expect(record.diagnostics.map(error => [error.code, error.location.pointer ?? error.location.binding])).toEqual([['NEXO3001', '/expression/locals/0/value/body'], ['NEXO2036', 'count'], ['NEXO2036', 'total']]);
    });
});
