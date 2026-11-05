// A host that installed @formaui-net/nexo from its feed: it imports the package by its name and evaluates a script, as the package's version.
import { nexo } from '@formaui-net/nexo';

const [version] = process.argv.slice(2);
const registry = nexo.createRegistry([]);
const { value } = registry.resolve('let base = 2\n\nreturn { total = base + 3 }', {}).createEvaluator({}).evaluate();

if (nexo.info.versions.implementation !== version || value.total !== 5) {
    console.error(`The installed package answered ${nexo.info.versions.implementation} and ${JSON.stringify(value)}, where ${version} and { total: 5 } were expected.`);
    process.exit(1);
}

console.log(`@formaui-net/nexo ${version} evaluated a script, installed from its feed.`);
