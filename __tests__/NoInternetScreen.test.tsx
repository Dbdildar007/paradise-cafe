import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { NoInternetScreen } from '../src/screens/NoInternetScreen';

describe('NoInternetScreen', () => {
  it('renders copy and actions', () => {
    const { getByText, getByTestId } = render(<NoInternetScreen onRetry={jest.fn()} />);
    expect(getByText('No internet connection')).toBeTruthy();
    expect(getByTestId('retry-button')).toBeTruthy();
    expect(getByTestId('open-settings-button')).toBeTruthy();
  });
  it('calls onRetry', () => {
    const onRetry = jest.fn();
    const { getByTestId } = render(<NoInternetScreen onRetry={onRetry} />);
    fireEvent.press(getByTestId('retry-button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
  it('ignores taps while checking', () => {
    const onRetry = jest.fn();
    const { getByTestId } = render(<NoInternetScreen onRetry={onRetry} isChecking />);
    fireEvent.press(getByTestId('retry-button'));
    expect(onRetry).not.toHaveBeenCalled();
  });
});
