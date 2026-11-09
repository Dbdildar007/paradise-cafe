import { computeScale } from '../src/utils/responsive';

describe('computeScale', () => {
  it('is ~1 on the 390 reference device', () => expect(computeScale(390)).toBeCloseTo(1, 2));
  it('clamps tiny phones (320dp, 280dp fold cover)', () => {
    expect(computeScale(320)).toBeGreaterThanOrEqual(0.82);
    expect(computeScale(280)).toBe(0.82);
  });
  it('clamps tablets', () => {
    expect(computeScale(1024)).toBe(1.3);
    expect(computeScale(2000)).toBe(1.3);
  });
  it('is monotonic', () => {
    const w = [280, 320, 360, 390, 430, 600, 768];
    const sc = w.map(computeScale);
    expect([...sc].sort((a, b) => a - b)).toEqual(sc);
  });
});
