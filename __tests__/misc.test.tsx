import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { linking } from '../src/navigation/linking';
import { withTimeout } from '../src/utils/delay';

describe('ErrorBoundary', () => {
  it('shows a generic message, never error details', () => {
    const Boom = () => {
      throw new Error('secret stack detail');
    };
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { getByTestId, queryByText } = render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(getByTestId('error-boundary')).toBeTruthy();
    expect(queryByText(/secret/)).toBeNull();
    spy.mockRestore();
  });
  it('renders children normally', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>ok</Text>
      </ErrorBoundary>,
    );
    expect(getByText('ok')).toBeTruthy();
  });
});

describe('linking', () => {
  it('ignores cold-start deep links (they would bypass the Splash security gate)', async () => {
    await expect(linking.getInitialURL!()).resolves.toBeNull();
  });
  it('only accepts the app scheme', () => {
    expect(linking.prefixes).toEqual(['paradisecafe://']);
  });
});

describe('withTimeout', () => {
  it('returns fallback on timeout and value otherwise', async () => {
    await expect(withTimeout(new Promise<string>(r => setTimeout(() => r('slow'), 50)), 5, 'late')).resolves.toBe('late');
    await expect(withTimeout(Promise.resolve('fast'), 50, 'late')).resolves.toBe('fast');
  });
});
