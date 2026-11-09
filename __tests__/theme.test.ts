import fs from 'fs';
import path from 'path';
import { colors, withAlpha } from '../src/theme';

const md = fs.readFileSync(path.join(__dirname, '../docs/DESIGN.md'), 'utf8').toLowerCase();

describe('design tokens match docs/DESIGN.md', () => {
  const brand: Array<keyof typeof colors> = ['primary', 'secondary', 'tertiary', 'neutral', 'canvas', 'silk', 'divider', 'cream', 'success', 'error'];
  it.each(brand)('%s exists in DESIGN.md', token => {
    expect(md).toContain(colors[token].toLowerCase());
  });
  it('front-matter tonal values exist in DESIGN.md', () => {
    ['night', 'peach', 'peachDim', 'goldSoft', 'blush', 'outlineVariant', 'surface', 'surfaceLow', 'surfaceContainer', 'surfaceHigh', 'goldDeep', 'primaryDeep', 'onSurface', 'secondaryContainer'].forEach(k => {
      expect(md).toContain((colors as Record<string, string>)[k]!.toLowerCase());
    });
  });
  it('withAlpha converts and clamps', () => {
    expect(withAlpha('#6F4E37', 0.5)).toBe('rgba(111, 78, 55, 0.5)');
    expect(withAlpha('#FFFFFF', 5)).toBe('rgba(255, 255, 255, 1)');
    expect(withAlpha('#FFFFFF', -1)).toBe('rgba(255, 255, 255, 0)');
  });
});
