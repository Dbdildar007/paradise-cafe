import { formatIndianMobile, isValidIndianMobile, maskPhone, normalizeIndianMobile, toE164 } from '../../src/features/otp/phone';

describe('phone helpers', () => {
  it.each([
    ['9876543210', '9876543210'],
    ['98765 43210', '9876543210'],
    ['+91 98765-43210', '9876543210'],
    ['919876543210', '9876543210'],
    ['09876543210', '9876543210'],
    ['(987) 654-3210', '9876543210'],
    ['9123456789', '9123456789'], // starts with 91 but is a plain 10-digit number
    ['98765432101234', '9876543210'],
    ['abc', ''],
    ['', ''],
  ])('normalizes %p -> %p', (input, expected) => expect(normalizeIndianMobile(input)).toBe(expected));

  it('validates Indian mobiles (6-9 start, 10 digits)', () => {
    expect(isValidIndianMobile('9876543210')).toBe(true);
    expect(isValidIndianMobile('6000000000')).toBe(true);
    expect(isValidIndianMobile('5876543210')).toBe(false);
    expect(isValidIndianMobile('987654321')).toBe(false);
    expect(isValidIndianMobile('98765432100')).toBe(false);
    expect(isValidIndianMobile('')).toBe(false);
  });
  it('formats progressively', () => {
    expect(formatIndianMobile('98')).toBe('98');
    expect(formatIndianMobile('98765')).toBe('98765');
    expect(formatIndianMobile('987654')).toBe('98765 4');
    expect(formatIndianMobile('9876543210')).toBe('98765 43210');
  });
  it('builds E.164 and masks', () => {
    expect(toE164('9876543210')).toBe('+919876543210');
    expect(maskPhone('9876543210')).toBe('+91 98•••••210');
    expect(maskPhone('12')).toBe('+91 ••••••••••');
  });
});
