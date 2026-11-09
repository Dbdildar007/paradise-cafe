/** All copy for the Welcome page lives here (single place for i18n / remote-config later). */
export const WELCOME_COPY = {
  badge: 'EST. 1984 • THE ROYAL KITCHEN',
  skip: 'Skip',
  eyebrow: 'NAWABI HERITAGE DINING',
  title: 'PARADISE CAFE',
  subtitle: 'Where 40 years of culinary royalty meets slow-dum artisanal feasts.',
  rating: '4.9',
  patrons: '(42k+ Royal Patrons)',
  offersHeading: 'FIRST-TIME GUEST PRIVILEGES',
  offersHint: 'Swipe to reveal',
  cta: 'Explore Menu & Order',
  signIn: 'Sign In with Mobile (+91)',
  guest: 'Continue as Guest & Browse Locations',
} as const;

export type Offer = {
  id: string;
  tag: string;
  headline: string;
  description: string;
  code: string;
  footnote: string;
  showStar: boolean;
};

export const OFFERS: readonly Offer[] = [
  {
    id: 'welcome-gift',
    tag: 'WELCOME GIFT',
    headline: '₹150 OFF',
    description: 'On your first royal dum handi order',
    code: 'ROYALWELCOME',
    footnote: 'Auto-applied',
    showStar: true,
  },
  {
    id: 'chefs-treat',
    tag: "CHEF'S TREAT",
    headline: 'Free Shahi Tukda',
    description: 'Slow-simmered rabdi\n₹499',
    code: 'SWEETFEAST',
    footnote: 'Auto-applied',
    showStar: true,
  },
];

export type Feature = { id: string; emoji: string; title: string; subtitle: string };

export const FEATURES: readonly Feature[] = [
  { id: 'handi', emoji: '🏺', title: 'Clay Handi Sealed', subtitle: 'Retains royal aroma' },
  { id: 'dum', emoji: '🔥', title: '48-Hr Slow Dum', subtitle: 'Charcoal marinated' },
  { id: 'dispatch', emoji: '⚡', title: '30-Min Dispatch', subtitle: 'Piping hot delivery' },
  { id: 'ghee', emoji: '👑', title: '100% Pure Ghee', subtitle: 'Halal & authentic' },
];

/** Initials + tones for the patron avatars (swap for remote photos when the API exists). */
export const PATRON_AVATARS = [
  { id: 'a', initial: 'A', tone: 'primary' },
  { id: 'r', initial: 'R', tone: 'secondary' },
  { id: 's', initial: 'S', tone: 'peachDim' },
] as const;
