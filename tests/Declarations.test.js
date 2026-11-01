import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, it, expect } from 'vitest';
import { NexoError } from '#nexo/language/NexoError.mjs';
import { repositoryRoot } from './support/paths.mjs';

describe('the declarations', () => {
    it('accept how a TypeScript host uses Nexo, typing each implementation by the declaration it carries out, and refuse its misuse', () => {
        const program = ts.createProgram([resolve(repositoryRoot, 'tests', '_types', 'usage.ts')], {
            strict: true,
            noEmit: true,
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.ESNext,
            moduleResolution: ts.ModuleResolutionKind.Bundler,
            lib: ['lib.es2022.d.ts'],
            types: [],
        });
        const messages = ts.getPreEmitDiagnostics(program).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));

        expect(messages).toEqual([]);
    });

    it('declare the factories a host builds its errors with, each making an error of its kind with the host\'s code, never taken for one Nexo raised', () => {
        const location = { module: 'Pantry', type: 'Shelf', declaration: 'label', declarationKey: 'result' };
        const errors = [NexoError.structure('PANTRY2001', 'No pantry', {}), NexoError.validation('PANTRY3001', 'No shelf', {}), NexoError.module('PANTRY4001', 'A shelf declares its label', location), NexoError.evaluation('PANTRY5001', 'Closed', {})];

        expect(errors.map(error => [error.name, error.kind, error.code])).toEqual([
            ['NexoError', 'structure', 'PANTRY2001'],
            ['NexoError', 'validation', 'PANTRY3001'],
            ['NexoError', 'module', 'PANTRY4001'],
            ['NexoError', 'evaluation', 'PANTRY5001'],
        ]);
        expect(errors[2].location).toEqual(location);
        expect(() => NexoError.module('NEXO2001', 'Out of range', {})).toThrow(TypeError);
        expect(Object.getOwnPropertyNames(NexoError).filter(name => typeof NexoError[name] === 'function')).toEqual(['structure', 'validation', 'evaluation', 'module']);
    });
});
