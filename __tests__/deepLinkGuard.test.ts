import { isSafeDeepLink } from '../src/security/deepLinkGuard';

describe('isSafeDeepLink', () => {
  it.each(['paradisecafe://home', 'paradisecafe://login?x=1', 'paradisecafe://welcome/'])('accepts %s', u =>
    expect(isSafeDeepLink(u)).toBe(true));
  it.each([
    'https://evil.com/home',
    'paradisecafe://admin',
    'paradisecafe://home/../admin',
    // eslint-disable-next-line no-script-url
    'javascript:alert(1)',
    '',
    null,
    undefined,
    `paradisecafe://home?${'a'.repeat(3000)}`,
  ])('rejects %s', u => expect(isSafeDeepLink(u as string)).toBe(false));
});
