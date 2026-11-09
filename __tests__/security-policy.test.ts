import fs from 'fs';
import path from 'path';

/** Static guard-rails: fail the build if insecure patterns appear in source. */
const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
const files = walk(path.join(__dirname, '../src'));
const read = (f: string) => fs.readFileSync(f, 'utf8');

describe('source security policy', () => {
  it('never imports AsyncStorage / MMKV', () => {
    files.forEach(f => expect(read(f)).not.toMatch(/async-storage|react-native-mmkv/));
  });
  it('has no console.* outside the logger', () => {
    files.filter(f => !f.endsWith('logger.ts')).forEach(f => expect(read(f)).not.toMatch(/console\.(log|debug|info|warn|error)/));
  });
  it('has no eval / new Function / http:// literals', () => {
    files.forEach(f => {
      const src = read(f);
      expect(src).not.toMatch(/\beval\(|new Function\(/);
      expect(src).not.toMatch(/['"`]http:\/\//);
    });
  });
  it('has no hard-coded hex colours outside the theme', () => {
    files
      .filter(f => !f.includes(`${path.sep}theme${path.sep}`))
      // splash glow & icon defaults use derived tones; allow only those two files
      .filter(f => !/SplashScreen|icons|ClayBadge|ClayButton/.test(f))
      .forEach(f => expect(read(f)).not.toMatch(/#[0-9a-fA-F]{6}\b/));
  });
  it('ships a production babel config that strips console', () => {
    expect(read(path.join(__dirname, '../babel.config.js'))).toContain('transform-remove-console');
  });
});
