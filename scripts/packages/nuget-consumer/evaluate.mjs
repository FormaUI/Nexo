// Loads the nexo.js a published application serves, as a page's module would, and evaluates a script with it, as the package's version.
import { pathToFileURL } from 'node:url';

const [path, version] = process.argv.slice(2);
const { nexo } = await import(pathToFileURL(path).href);
const { value } = nexo.createRegistry([]).resolve('let base = 2\n\nreturn { total = base + 3 }', {}).createEvaluator({}).evaluate();

if (nexo.info.versions.implementation !== version || value.total !== 5) {
    console.error(`The published nexo.js answered ${nexo.info.versions.implementation} and ${JSON.stringify(value)}, where ${version} and { total: 5 } were expected.`);
    process.exit(1);
}

console.log(`formaui-net.Nexo ${version} served nexo.js from a published application, which evaluated a script.`);
