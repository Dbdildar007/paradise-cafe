import { logger } from '../src/utils/logger';

describe('logger', () => {
  const g = globalThis as { __DEV__?: boolean };
  it('logs in dev', () => {
    const spy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    logger.info('hi');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
  it('is silent in production', () => {
    g.__DEV__ = false;
    const spies = (['debug', 'info', 'warn', 'error'] as const).map(l => jest.spyOn(console, l).mockImplementation(() => undefined));
    logger.debug('x');
    logger.info('x');
    logger.warn('x');
    logger.error('x');
    spies.forEach(s => {
      expect(s).not.toHaveBeenCalled();
      s.mockRestore();
    });
    g.__DEV__ = true;
  });
});
