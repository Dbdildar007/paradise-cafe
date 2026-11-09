import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { NetworkGate } from '../src/services/network/NetworkGate';
import { isStateOffline, NetworkProvider } from '../src/services/network/NetworkProvider';

type Listener = (s: { isConnected: boolean | null; isInternetReachable: boolean | null }) => void;

describe('network handling', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('isStateOffline', () => {
    expect(isStateOffline({ isConnected: false, isInternetReachable: null })).toBe(true);
    expect(isStateOffline({ isConnected: true, isInternetReachable: false })).toBe(true);
    expect(isStateOffline({ isConnected: true, isInternetReachable: true })).toBe(false);
    expect(isStateOffline({ isConnected: true, isInternetReachable: null })).toBe(false);
  });

  it('shows the overlay after the debounce when offline and hides on recovery', () => {
    let emit: Listener = () => undefined;
    (NetInfo.addEventListener as jest.Mock).mockImplementationOnce((cb: Listener) => {
      emit = cb;
      return jest.fn();
    });
    const { queryByTestId, getByText } = render(
      <NetworkProvider>
        <NetworkGate>
          <Text>app</Text>
        </NetworkGate>
      </NetworkProvider>,
    );
    expect(getByText('app')).toBeTruthy();
    act(() => emit({ isConnected: false, isInternetReachable: false }));
    expect(queryByTestId('network-gate-overlay')).toBeNull(); // debounced
    act(() => {
      jest.advanceTimersByTime(900);
    });
    expect(queryByTestId('network-gate-overlay')).toBeTruthy();
    expect(queryByTestId('no-internet-screen')).toBeTruthy();
    act(() => emit({ isConnected: true, isInternetReachable: true }));
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(queryByTestId('network-gate-overlay')).toBeNull();
  });

  it('does not flash the overlay for a brief blip', () => {
    let emit: Listener = () => undefined;
    (NetInfo.addEventListener as jest.Mock).mockImplementationOnce((cb: Listener) => {
      emit = cb;
      return jest.fn();
    });
    const { queryByTestId } = render(
      <NetworkProvider>
        <NetworkGate>
          <Text>app</Text>
        </NetworkGate>
      </NetworkProvider>,
    );
    act(() => emit({ isConnected: false, isInternetReachable: false }));
    act(() => {
      jest.advanceTimersByTime(300);
    });
    act(() => emit({ isConnected: true, isInternetReachable: true }));
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(queryByTestId('network-gate-overlay')).toBeNull();
  });
});
