import React, { useCallback, useState } from 'react';
import { DefaultTheme, NavigationContainer, Theme, useNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DevRouteBadge } from '../components/DevRouteBadge';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { linking } from '../navigation/linking';
import { RootNavigator } from '../navigation/RootNavigator';
import type { RootStackParamList } from '../navigation/types';
import { NetworkGate } from '../services/network/NetworkGate';
import { NetworkProvider } from '../services/network/NetworkProvider';
import { colors } from '../theme';

const navTheme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.canvas, card: colors.canvas, primary: colors.primary, text: colors.tertiary, border: colors.divider },
};

const App: React.FC = () => {
  const navRef = useNavigationContainerRef<RootStackParamList>();
  const [route, setRoute] = useState('');
  const sync = useCallback(() => setRoute(navRef.getCurrentRoute()?.name ?? ''), [navRef]);
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NetworkProvider>
          <NetworkGate>
            <NavigationContainer ref={navRef} theme={navTheme} linking={linking} onReady={sync} onStateChange={sync}>
              <RootNavigator />
            </NavigationContainer>
            <DevRouteBadge name={route} />
          </NetworkGate>
        </NetworkProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

export default App;
