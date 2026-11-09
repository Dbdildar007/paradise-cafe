import React from 'react';
import { Dimensions } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { WelcomeAsGuestScreen } from '../../src/screens/WelcomeAsGuestScreen';
import { FEATURES, OFFERS, WELCOME_COPY } from '../../src/screens/welcome/welcomeContent';

const makeNav = () => ({ navigate: jest.fn(), replace: jest.fn(), goBack: jest.fn() });
const renderScreen = (nav = makeNav()) => {
  const utils = render(<WelcomeAsGuestScreen navigation={nav as never} route={{ key: 'k', name: 'WelcomeAsGuest' } as never} />);
  return { nav, ...utils };
};
const setWindow = (width: number, height: number) =>
  (Dimensions as unknown as { set: (d: object) => void }).set({
    window: { width, height, scale: 2, fontScale: 1 },
    screen: { width, height, scale: 2, fontScale: 1 },
  });

describe('WelcomeAsGuestScreen - content', () => {
  it('renders every piece of copy from the design', () => {
    const { getByText, getByTestId } = renderScreen();
    expect(getByTestId('screen-welcome-as-guest')).toBeTruthy();
    expect(getByText('EST. 1984 • THE ROYAL KITCHEN')).toBeTruthy();
    expect(getByText('Skip')).toBeTruthy();
    expect(getByText('NAWABI HERITAGE DINING')).toBeTruthy();
    expect(getByText('PARADISE CAFE')).toBeTruthy();
    expect(getByText(WELCOME_COPY.subtitle)).toBeTruthy();
    expect(getByText('4.9')).toBeTruthy();
    expect(getByText('(42k+ Royal Patrons)')).toBeTruthy();
    expect(getByText('FIRST-TIME GUEST PRIVILEGES')).toBeTruthy();
    expect(getByText('Swipe to reveal')).toBeTruthy();
    expect(getByText('Explore Menu & Order')).toBeTruthy();
    expect(getByText('Sign In with Mobile (+91)')).toBeTruthy();
    expect(getByText('Continue as Guest & Browse Locations')).toBeTruthy();
  });

  it('renders offers and features', () => {
    const { getByText, getByTestId } = renderScreen();
    OFFERS.slice(0, 2).forEach(o => {
      expect(getByTestId(`offer-${o.id}`)).toBeTruthy();
      expect(getByText(o.tag)).toBeTruthy();
      expect(getByText(o.headline)).toBeTruthy();
      expect(getByText(o.code)).toBeTruthy();
    });
    FEATURES.forEach(f => {
      expect(getByText(f.title)).toBeTruthy();
      expect(getByText(f.subtitle)).toBeTruthy();
    });
  });

  it('exposes accessible roles and labels', () => {
    const { getByTestId, getByRole } = renderScreen();
    expect(getByRole('header', { name: 'PARADISE CAFE' })).toBeTruthy();
    expect(getByTestId('welcome-explore').props.accessibilityRole).toBe('button');
    expect(getByTestId('welcome-signin').props.accessibilityRole).toBe('button');
    expect(getByTestId('welcome-skip').props.accessibilityRole).toBe('button');
    expect(getByTestId('welcome-guest').props.accessibilityRole).toBe('link');
    expect(getByTestId('welcome-patrons').props.accessibilityLabel).toContain('4.9');
  });
});

describe('WelcomeAsGuestScreen - navigation', () => {
  let now = 1_000_000;
  beforeEach(() => {
    now = 1_000_000; // control the guard's clock without faking every timer (keeps RNTL cleanup on real timers)
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });
  afterEach(() => jest.restoreAllMocks());

  it('Skip -> Home (replaces, so Back does not return to welcome)', () => {
    const { nav, getByTestId } = renderScreen();
    fireEvent.press(getByTestId('welcome-skip'));
    expect(nav.replace).toHaveBeenCalledWith('Home');
  });
  it('Explore Menu & Order -> MenuAndOrder', () => {
    const { nav, getByTestId } = renderScreen();
    fireEvent.press(getByTestId('welcome-explore'));
    expect(nav.navigate).toHaveBeenCalledWith('MenuAndOrder');
  });
  it('Sign In with Mobile -> MobileOtpAccess', () => {
    const { nav, getByTestId } = renderScreen();
    fireEvent.press(getByTestId('welcome-signin'));
    expect(nav.navigate).toHaveBeenCalledWith('MobileOtpAccess');
  });
  it('Continue as Guest -> BrowseLocations', () => {
    const { nav, getByTestId } = renderScreen();
    fireEvent.press(getByTestId('welcome-guest'));
    expect(nav.navigate).toHaveBeenCalledWith('BrowseLocations');
  });
  it('ignores rapid double taps (no duplicate screens), then allows again', () => {
    const { nav, getByTestId } = renderScreen();
    fireEvent.press(getByTestId('welcome-explore'));
    fireEvent.press(getByTestId('welcome-explore'));
    fireEvent.press(getByTestId('welcome-signin'));
    expect(nav.navigate).toHaveBeenCalledTimes(1);
    now += 800;
    fireEvent.press(getByTestId('welcome-signin'));
    expect(nav.navigate).toHaveBeenCalledTimes(2);
  });
});

describe('WelcomeAsGuestScreen - responsive (renders without error at any size)', () => {
  const sizes: Array<[string, number, number]> = [
    ['small phone 320x568', 320, 568],
    ['fold cover 280x653', 280, 653],
    ['standard 390x844', 390, 844],
    ['large 430x932', 430, 932],
    ['landscape 844x390', 844, 390],
    ['tablet 820x1180', 820, 1180],
    ['large tablet 1024x1366', 1024, 1366],
  ];
  afterEach(() => setWindow(750, 1334));
  it.each(sizes)('%s', (_n, w, h) => {
    setWindow(w, h);
    const { getByText, getByTestId } = renderScreen();
    expect(getByText('PARADISE CAFE')).toBeTruthy();
    expect(getByTestId('welcome-explore')).toBeTruthy();
    expect(getByTestId('welcome-features')).toBeTruthy();
  });
});
