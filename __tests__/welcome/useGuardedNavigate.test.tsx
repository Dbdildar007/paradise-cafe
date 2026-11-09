import { act, renderHook } from '@testing-library/react-native';
import { useGuardedNavigate } from '../../src/navigation/useGuardedNavigate';

describe('useGuardedNavigate', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('runs the first action and blocks repeats inside the window', () => {
    const { result } = renderHook(() => useGuardedNavigate(500));
    const a = jest.fn();
    act(() => {
      result.current(a);
      result.current(a);
    });
    expect(a).toHaveBeenCalledTimes(1);
    act(() => {
      jest.advanceTimersByTime(501);
    });
    act(() => result.current(a));
    expect(a).toHaveBeenCalledTimes(2);
  });
});
