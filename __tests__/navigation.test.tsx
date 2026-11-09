import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from '../src/navigation/RootNavigator';
import * as bootstrap from '../src/app/bootstrap';
import { SECURITY_POLICY } from '../src/config/security';

const renderApp = () =>
  render(
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>,
  );

const finishSplash = async () => {
  await act(async () => {
    jest.advanceTimersByTime(SECURITY_POLICY.minSplashMs + 50);
  });
};

describe('navigation flow', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('shows the splash first with exact brand copy', () => {
    jest.spyOn(bootstrap, 'bootstrapApp').mockResolvedValue({ status: 'ready', hasSession: false });
    const { getByTestId, getByText } = renderApp();
    expect(getByTestId('splash-screen')).toBeTruthy();
    expect(getByText('paradise cafe')).toBeTruthy();
    expect(getByText('EST. 1984 • HYDERABADI DUM & ROASTS')).toBeTruthy();
    expect(getByText('100% ROYAL ARTISANAL FEAST')).toBeTruthy();
    expect(getByText('BENGALURU & HYDERABAD')).toBeTruthy();
    expect(getByText('A NAWABI KITCHENS ENTERPRISE')).toBeTruthy();
  });

  it('signed-out: splash -> welcome page (real UI) -> every button goes to its page', async () => {
    jest.spyOn(bootstrap, 'bootstrapApp').mockResolvedValue({ status: 'ready', hasSession: false });
    const { findByTestId, getByTestId, getByText } = renderApp();
    await finishSplash();
    expect(await findByTestId('screen-welcome-as-guest')).toBeTruthy();
    expect(getByText('PARADISE CAFE')).toBeTruthy();

    fireEvent.press(getByTestId('welcome-signin'));
    expect(await findByTestId('screen-mobile-otp-access')).toBeTruthy();
    expect(getByText('Your cravings, our paradise.')).toBeTruthy();
  });

  it.each([
    ['welcome-explore', 'menu_and_order'],
    ['welcome-guest', 'browse_locations'],
    ['welcome-skip', 'home screen'],
  ])('welcome %s -> %s', async (buttonId, pageName) => {
    jest.spyOn(bootstrap, 'bootstrapApp').mockResolvedValue({ status: 'ready', hasSession: false });
    const { findByText, findByTestId, getByTestId } = renderApp();
    await finishSplash();
    await findByTestId('screen-welcome-as-guest');
    fireEvent.press(getByTestId(buttonId));
    expect(await findByText(pageName)).toBeTruthy();
  });

  it('signed-in: splash -> home_screen', async () => {
    jest.spyOn(bootstrap, 'bootstrapApp').mockResolvedValue({ status: 'ready', hasSession: true });
    const { findByText } = renderApp();
    await finishSplash();
    expect(await findByText('home screen')).toBeTruthy();
  });

  it('compromised device: splash -> security blocked', async () => {
    jest.spyOn(bootstrap, 'bootstrapApp').mockResolvedValue({ status: 'blocked', reason: 'compromised_device' });
    const { findByTestId } = renderApp();
    await finishSplash();
    expect(await findByTestId('security-blocked-screen')).toBeTruthy();
  });
});
