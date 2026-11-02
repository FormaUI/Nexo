import { describe, it, expect } from 'vitest';
import { Signatures } from '#nexo/language/Signatures.mjs';
import { Declarations } from '#nexo/language/vocabulary/Declarations.mjs';
import { NexoModule } from '#nexo/language/vocabulary/NexoModule.mjs';
import { NexoRegistry } from '#nexo/language/vocabulary/NexoRegistry.mjs';
import { Vocabulary } from '#nexo/language/vocabulary/Vocabulary.mjs';
import { constantUpdates } from '../support/updates.mjs';

/** A shop's module: a module member, a word's members, a named indexer and a function its host invokes that supplies nothing. */
const shop = new NexoModule('Shop', {
    types: [{
        name: 'Word',
        kind: 'reference',
        isInstance: () => true,
        members: [
            Declarations.createPropertyDeclaration('size', 'Number', { updates: constantUpdates }),
            Declarations.createFunctionDeclaration('pad', 'String', { updates: constantUpdates, parameters: [Declarations.createValueParameterDeclaration('count', 'Number'), Declarations.createValueParameterDeclaration('fill', 'String', { default: ' ' })] }),
            Declarations.createIndexerDeclaration('letter', 'String?', { updates: constantUpdates, parameters: [Declarations.createValueParameterDeclaration('index', 'Number')] }),
            Declarations.createFunctionDeclaration('order', undefined, { invokedBy: 'host' }),
        ],
    }],
    members: [Declarations.createFunctionDeclaration('greet', 'String', { updates: constantUpdates })],
});
const registry = new NexoRegistry([Vocabulary.module, shop]);
const [word] = registry.getModule('Shop').types;
const memberNamed = name => word.members.find(member => member.name === name);

describe('Signatures', () => {
    it("writes a member's signature: a property's result, a function's parameters, an optional one marked, a named indexer's key, and a function that supplies nothing without a result", () => {
        expect(['size', 'pad', 'letter', 'order'].map(name => Signatures.format(memberNamed(name)))).toEqual(['size: Number', 'pad(count: Number, fill?: String): String', 'letter[index: Number]: String?', 'order()']);
        expect(Signatures.format(registry.getReceiverMembers('select')[0])).toBe('select<U>(expression: U): List<U>');
    });

    it('qualifies a member by the type it is read on, and a module member by its module', () => {
        expect(Signatures.formatQualifiedName(memberNamed('size'), registry)).toBe('Word.size');
        expect(Signatures.formatQualifiedName(registry.getModule('Shop').members[0], registry)).toBe('Shop.greet');
        expect(Signatures.formatQualifiedName(registry.getReceiverMembers('count')[0], registry)).toBe('List.count');
    });
});
