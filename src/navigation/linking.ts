import type { LinkingOptions } from '@react-navigation/native';
import { Linking } from 'react-native';
import { ALLOWED_DEEP_LINK_SCHEMES } from '../config/security';
import { isSafeDeepLink } from '../security/deepLinkGuard';
import type { RootStackParamList } from './types';

/** Deep links are validated against an allow-list before React Navigation sees them. */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [...ALLOWED_DEEP_LINK_SCHEMES],
  config: {
    screens: { WelcomeAsGuest: 'welcome', MobileOtpAccess: 'login', Home: 'home' },
  },
  // Cold-start links are deliberately ignored: they would skip Splash (integrity check + SSL pinning setup).
  // When real auth lands: store the link, finish bootstrap, then replay it.
  async getInitialURL() {
    return null;
  },
  subscribe(listener) {
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (isSafeDeepLink(url)) {
        listener(url);
      }
    });
    return () => sub.remove();
  },
};
