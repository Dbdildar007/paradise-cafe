/** Indian mobile number helpers. The app supports +91 only. */
export const COUNTRY = { code: 'IN', name: 'India', dial: '+91' } as const;

export const digitsOnly = (value: string): string => value.replace(/\D+/g, '');

/**
 * Accepts what users type/paste/autofill ("+91 98765-43210", "09876543210", "919876543210") and
 * returns at most 10 national digits. A leading 91 / 0 is stripped only when the length proves it is a prefix.
 */
export const normalizeIndianMobile = (input: string): string => {
  let d = digitsOnly(input ?? '');
  if (d.length === 12 && d.startsWith('91')) {
    d = d.slice(2);
  } else if (d.length === 11 && d.startsWith('0')) {
    d = d.slice(1);
  }
  return d.slice(0, 10);
};

export const isValidIndianMobile = (digits: string): boolean => /^[6-9]\d{9}$/.test(digits);

/** 9876543210 -> "98765 43210" (progressively while typing) */
export const formatIndianMobile = (digits: string): string =>
  digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;

export const toE164 = (digits: string): string => `${COUNTRY.dial}${digits}`;

/** For logs / UI that must not expose the full number. */
export const maskPhone = (digits: string): string =>
  digits.length === 10 ? `${COUNTRY.dial} ${digits.slice(0, 2)}•••••${digits.slice(7)}` : `${COUNTRY.dial} ••••••••••`;
