#!/usr/bin/env node
/**
 * Finds files and npm packages that the code imports but the project does not have.
 *   node scripts/check-imports.js        (or: npm run check:imports)
 * Exit code 1 + an exact list when something is missing - run it after copying any update pack.
 */
const fs = require('fs');
const path = require('path');
const { builtinModules } = require('module');

const ROOT = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const declared = new Set([...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})]);
const builtins = new Set([...builtinModules, ...builtinModules.map(m => `node:${m}`)]);

const SCAN = ['src', '__tests__', 'jest', 'index.js'];
const EXT = ['', '.ts', '.tsx', '.js', '.jsx', '.json', '/index.ts', '/index.tsx', '/index.js'];
const RE = /(?:^|[\s;])(?:import|export)\s+(?:type\s+)?(?:[^'"`;]*?\s+from\s+)?['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)|jest\.(?:mock|requireActual)\(\s*['"]([^'"]+)['"]/g;

const walk = p => {
  if (!fs.existsSync(p)) {return [];}
  const st = fs.statSync(p);
  if (st.isFile()) {return /\.(tsx?|jsx?)$/.test(p) ? [p] : [];}
  return fs.readdirSync(p).flatMap(f => (f === 'node_modules' ? [] : walk(path.join(p, f))));
};

const missingFiles = [];
const missingPkgs = new Map();

for (const file of SCAN.flatMap(s => walk(path.join(ROOT, s)))) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (/^\s*(\/\/|\*)/.test(line)) {return;}
    RE.lastIndex = 0;
    let m;
    while ((m = RE.exec(line))) {
      const spec = m[1] || m[2] || m[3];
      if (!spec) {continue;}
      if (spec.startsWith('.')) {
        const base = path.resolve(path.dirname(file), spec);
        if (!EXT.some(e => fs.existsSync(base + e) && fs.statSync(base + e).isFile())) {
          missingFiles.push({ from: path.relative(ROOT, file), line: i + 1, spec, expected: path.relative(ROOT, base) + '.tsx (or .ts)' });
        }
      } else if (!builtins.has(spec)) {
        const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
        if (!declared.has(name) && !fs.existsSync(path.join(ROOT, 'node_modules', name))) {
          missingPkgs.set(name, (missingPkgs.get(name) || 0) + 1);
        }
      }
    }
  });
}

if (!missingFiles.length && !missingPkgs.size) {
  console.log('check-imports: OK - every import resolves to a file or a declared package.');
  process.exit(0);
}
if (missingFiles.length) {
  console.error(`\nMISSING FILES (${missingFiles.length}) - create/copy these:\n`);
  const byTarget = new Map();
  missingFiles.forEach(f => byTarget.set(f.expected, [...(byTarget.get(f.expected) || []), `${f.from}:${f.line}`]));
  for (const [target, users] of byTarget) {console.error(`  ${target}\n      imported by ${users.slice(0, 3).join(', ')}${users.length > 3 ? ` (+${users.length - 3} more)` : ''}`);}
}
if (missingPkgs.size) {
  console.error(`\nMISSING NPM PACKAGES - run:\n  npm install ${[...missingPkgs.keys()].join(' ')}\n`);
}
process.exit(1);
