// Fails install if a forbidden storage package sneaks into the dependency tree.
const pkg = require('../package.json');
const banned = ['@react-native-async-storage/async-storage'];
const all = { ...pkg.dependencies, ...pkg.devDependencies };
const hit = banned.filter(b => b in all);
if (hit.length) {
  console.error('Forbidden dependency detected:', hit.join(', '));
  process.exit(1);
}
