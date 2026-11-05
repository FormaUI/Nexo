// A TypeScript host that installed @formaui-net/nexo from its feed: it type-checks against the declarations the package holds.
import { nexo, NexoError } from '@formaui-net/nexo';
import type { NexoEvaluator, NexoRegistry } from '@formaui-net/nexo';

const registry: NexoRegistry = nexo.createRegistry([]);

export const evaluate = (script: string): unknown => {
    try {
        const evaluator: NexoEvaluator = registry.resolve(script, {}).createEvaluator({});

        return evaluator.evaluate().value;
    } catch (error) {
        if (error instanceof NexoError) {
            return `${error.code}: ${error.message}`;
        }

        throw error;
    }
};

export const version: string = nexo.info.versions.implementation;
