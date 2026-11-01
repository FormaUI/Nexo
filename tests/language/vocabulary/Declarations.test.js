import { describe, it, expect } from 'vitest';
import { Declarations } from '#nexo/language/vocabulary/Declarations.mjs';
import { NexoModule } from '#nexo/language/vocabulary/NexoModule.mjs';
import { errorThrownBy } from '../../support/errors.mjs';
import { constantUpdates } from '../../support/updates.mjs';

/** The module error creating a module of the members throws, as its code and location. */
const refusalOf = members => {
    const error = errorThrownBy(() => new NexoModule('shop', { members }));

    return { code: error.code, location: error.location };
};

describe('Declarations', () => {
    it('creates each member with no receiver of its own, where it stands giving it one, a null name leaving an indexer unnamed', () => {
        const key = Declarations.createValueParameterDeclaration('key', 'String');

        expect(Declarations.createPropertyDeclaration('price', 'Number', { updates: constantUpdates })).toEqual({ name: 'price', kind: 'property', result: 'Number', updates: constantUpdates });
        expect(Declarations.createFunctionDeclaration('pad', 'String', { updates: constantUpdates, parameters: [key] })).toEqual({ name: 'pad', kind: 'function', result: 'String', parameters: [key], arguments: 'positional', updates: constantUpdates });
        expect(Declarations.createIndexerDeclaration(null, 'String?', { updates: constantUpdates, parameters: [key] })).toEqual({ kind: 'indexer', result: 'String?', parameters: [key], updates: constantUpdates });
    });

    it('creates a property without updates as a property of a structured type\'s data, which a module member is refused for lacking', () => {
        expect(Declarations.createPropertyDeclaration('price', 'Number')).toEqual({ name: 'price', kind: 'property', result: 'Number' });
        expect(refusalOf([Declarations.createPropertyDeclaration('price', 'Number', { impl: () => 1 })])).toEqual({ code: 'NEXO4032', location: { module: 'shop', declaration: 'price', declarationKey: 'updates' } });
        expect(() => new NexoModule('shop', { types: [{ name: 'Cup', kind: 'structured', members: [Declarations.createPropertyDeclaration('price', 'Number')] }] })).not.toThrow();
        expect(() => new NexoModule('shop', { members: [Declarations.createPropertyDeclaration('price', 'Number', { updates: constantUpdates, impl: () => 1 })] })).not.toThrow();
    });

    it('writes every option it is given over its defaults, leaving none out, so a module refuses one its declaration does not take', () => {
        const key = Declarations.createValueParameterDeclaration('key', 'String');

        expect(Declarations.createPropertyDeclaration('price', 'Number', { updates: constantUpdates, internal: true })).toEqual({ name: 'price', kind: 'property', result: 'Number', updates: constantUpdates, internal: true });
        expect(Declarations.createFunctionDeclaration('pad', 'String', { updates: constantUpdates, parameters: [key], arguments: 'options', internal: false })).toEqual({ name: 'pad', kind: 'function', result: 'String', parameters: [key], arguments: 'options', updates: constantUpdates, internal: false });
        expect(Declarations.createFunctionDeclaration('dim', 'Number', { invokedBy: 'host', updates: constantUpdates })).toEqual({ name: 'dim', kind: 'function', invokedBy: 'host', result: 'Number', parameters: [], updates: constantUpdates });
        expect(refusalOf([Declarations.createFunctionDeclaration('dim', 'Number', { invokedBy: 'host', updates: constantUpdates })])).toEqual({ code: 'NEXO4030', location: { module: 'shop', declaration: 'dim', declarationKey: 'updates' } });
        expect(refusalOf([Declarations.createPropertyDeclaration('price', 'Number', { updates: constantUpdates, invokedBy: 'host' })])).toEqual({ code: 'NEXO4030', location: { module: 'shop', declaration: 'price', declarationKey: 'invokedBy' } });
        expect(refusalOf([Declarations.createPropertyDeclaration('price', 'Number', { updates: constantUpdates, parameters: [key] })])).toEqual({ code: 'NEXO4030', location: { module: 'shop', declaration: 'price', declarationKey: 'parameters' } });
        expect(refusalOf([Declarations.createFunctionDeclaration('pad', 'String', { updates: constantUpdates, arguments: 'positional' })])).toEqual({ code: 'NEXO4534', location: { module: 'shop', declaration: 'pad', declarationKey: 'arguments' } });
    });

    it('keeps a member internal where it is given internal, as a module reads it', () => {
        const module = new NexoModule('shop', { members: [Declarations.createPropertyDeclaration('cost', 'Number', { updates: constantUpdates, internal: true, impl: () => 1 })] });

        expect(module.members[0].internal).toBe(true);
    });

    it('creates the parameters in their declaration shape, each with the defaults its contract gives it', () => {
        expect(Declarations.createValueParameterDeclaration('width', 'Number', { default: 2 })).toEqual({ name: 'width', kind: 'value', type: 'Number', required: false, fixed: false, nulls: 'propagate', default: 2 });
        expect(Declarations.createExpressionParameterDeclaration('Number')).toEqual({ name: 'expression', kind: 'expression', type: 'Number', context: 'item', required: true, fixed: false, nulls: 'propagate' });
        expect(Declarations.createExpressionParameterDeclaration('U', { nulls: 'accept' })).toEqual({ name: 'expression', kind: 'expression', type: 'U', context: 'item', required: true, fixed: false, nulls: 'accept' });
        expect(Declarations.createPredicateParameterDeclaration()).toEqual({ name: 'expression', kind: 'predicate', type: 'Boolean', context: 'item', required: true, fixed: false, nulls: 'propagate' });
        expect(Declarations.createPredicateParameterDeclaration({ nulls: 'accept' })).toEqual({ name: 'expression', kind: 'predicate', type: 'Boolean', context: 'item', required: true, fixed: false, nulls: 'accept' });
        expect(Declarations.createFunctionParameterDeclaration('test', 'Boolean', ['String'])).toEqual({ name: 'test', kind: 'function', type: 'Boolean', parameterTypes: ['String'], required: true });
    });

    it("writes a parameter's options over its defaults, a default left undefined leaving it required, and a selection without fixed for a module to refuse", () => {
        expect(Declarations.createValueParameterDeclaration('width', 'Number', { default: undefined })).toEqual({ name: 'width', kind: 'value', type: 'Number', required: true, fixed: false, nulls: 'propagate', default: undefined });
        expect(Declarations.createValueParameterDeclaration('kind', 'String', { selects: 'type', selector: 'event' })).toEqual({ name: 'kind', kind: 'value', type: 'String', required: true, fixed: false, nulls: 'propagate', selects: 'type', selector: 'event' });
        expect(refusalOf([Declarations.createFunctionDeclaration('on', '@selected', { updates: constantUpdates, parameters: [Declarations.createValueParameterDeclaration('kind', 'String', { selects: 'type', selector: 'event' })] })])).toEqual({
            code: 'NEXO4542',
            location: { module: 'shop', declaration: 'on', declarationKey: 'parameters' },
        });
    });
});
