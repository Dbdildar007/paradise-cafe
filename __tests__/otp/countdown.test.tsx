import { act, renderHook } from '@testing-library/react-native';
import { formatCountdown, formatRetryAfter, remainingSeconds } from '../../src/features/otp/countdown';
import { useCountdown } from '../../src/features/otp/useCountdown';

describe('countdown helpers', () => {
  it('remainingSeconds rounds up and never goes negative', () => {
    expect(remainingSeconds(10_000, 0)).toBe(10);
    expect(remainingSeconds(10_001, 0)).toBe(11);
    expect(remainingSeconds(0, 5_000)).toBe(0);
  });
  it('formatCountdown', () => {
    expect(formatCountdown(60)).toBe('1:00');
    expect(formatCountdown(62)).toBe('1:02');
    expect(formatCountdown(9)).toBe('0:09');
    expect(formatCountdown(-4)).toBe('0:00');
  });
  it('formatRetryAfter', () => {
    expect(formatRetryAfter(30_000)).toBe('1m');
    expect(formatRetryAfter(5 * 3600_000)).toBe('5h 0m');
    expect(formatRetryAfter(90 * 60_000)).toBe('1h 30m');
  });
});

describe('useCountdown', () => {
  // Keep setImmediate real: RNTL's cleanup awaits it.
  beforeEach(() => jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] }));
  afterEach(() => jest.useRealTimers());

  it('counts down to zero and stops', () => {
    let now = 1_000_000;
    const clock = () => now;
    const target = now + 3000;
    const { result } = renderHook(() => useCountdown(target, clock));
    expect(result.current).toBe(3);
    now += 1000;
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(2);
    now += 2500;
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(0);
  });
  it('is 0 immediately when the target is in the past', () => {
    const { result } = renderHook(() => useCountdown(1, () => 5000));
    expect(result.current).toBe(0);
  });
});
