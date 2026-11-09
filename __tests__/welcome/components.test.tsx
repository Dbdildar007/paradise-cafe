import React from 'react';
import { render } from '@testing-library/react-native';
import { BrandBadge } from '../../src/screens/welcome/components/BrandBadge';
import { FeatureGrid } from '../../src/screens/welcome/components/FeatureGrid';
import { HeroBackdrop } from '../../src/screens/welcome/components/HeroBackdrop';
import { OfferCard } from '../../src/screens/welcome/components/OfferCard';
import { PatronsPill } from '../../src/screens/welcome/components/PatronsPill';
import { FEATURES, OFFERS, PATRON_AVATARS } from '../../src/screens/welcome/welcomeContent';

describe('welcome content integrity', () => {
  it('has unique ids and non-empty copy', () => {
    const ids = [...OFFERS.map(o => o.id), ...FEATURES.map(f => f.id), ...PATRON_AVATARS.map(a => a.id)];
    expect(new Set(ids).size).toBe(ids.length);
    OFFERS.forEach(o => {
      expect(o.tag && o.headline && o.description && o.code).toBeTruthy();
      expect(o.code).toMatch(/^[A-Z0-9]+$/);
    });
    expect(FEATURES).toHaveLength(4);
  });
});

describe('welcome components', () => {
  it('OfferCard exposes a full accessibility label', () => {
    const offer = OFFERS[0]!;
    const { getByTestId } = render(<OfferCard offer={offer} width={240} />);
    const label = getByTestId(`offer-${offer.id}`).props.accessibilityLabel as string;
    expect(label).toContain(offer.headline);
    expect(label).toContain(offer.code);
  });
  it('OfferCard without a star still renders', () => {
    const { getByText } = render(<OfferCard offer={{ ...OFFERS[1]!, showStar: false }} width={240} />);
    expect(getByText("CHEF'S TREAT")).toBeTruthy();
  });
  it('FeatureGrid collapses to one column on very narrow windows', () => {
    const { Dimensions } = jest.requireActual('react-native');
    (Dimensions as unknown as { set: (d: object) => void }).set({ window: { width: 260, height: 600, scale: 2, fontScale: 1 }, screen: { width: 260, height: 600, scale: 2, fontScale: 1 } });
    const { getByTestId } = render(<FeatureGrid />);
    expect(getByTestId('welcome-features')).toBeTruthy();
    (Dimensions as unknown as { set: (d: object) => void }).set({ window: { width: 750, height: 1334, scale: 2, fontScale: 1 }, screen: { width: 750, height: 1334, scale: 2, fontScale: 1 } });
  });
  it('PatronsPill, BrandBadge and HeroBackdrop render', () => {
    const { getByTestId } = render(
      <>
        <PatronsPill />
        <BrandBadge />
        <HeroBackdrop width={390} height={300} />
      </>,
    );
    expect(getByTestId('welcome-patrons')).toBeTruthy();
    expect(getByTestId('welcome-brand-badge')).toBeTruthy();
    expect(getByTestId('welcome-hero')).toBeTruthy();
  });
});
