import React from 'react';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { BrowseLocationsScreen } from '../screens/BrowseLocationsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MenuAndOrderScreen } from '../screens/MenuAndOrderScreen';
import { MobileOtpAccessScreen } from '../screens/MobileOtpAccessScreen';
import { SecurityBlockedScreen } from '../screens/SecurityBlockedScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeAsGuestScreen } from '../screens/WelcomeAsGuestScreen';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Transition map (native, 60fps, identical feel on iOS & Android):
 *  Splash -> Welcome/Home   cross-fade (no slide, brand moment dissolves into the app)
 *  Welcome -> OTP           push: slide from right, iOS full-screen swipe-back
 *  OTP -> Home              fade-from-bottom, stack reset (no back to login)
 */
export const screenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  animationDuration: 320,
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  contentStyle: { backgroundColor: colors.canvas },
  statusBarTranslucent: true,
};

export const RootNavigator: React.FC = () => (
  <Stack.Navigator initialRouteName="Splash" screenOptions={screenOptions}>
    <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'none', gestureEnabled: false, contentStyle: { backgroundColor: colors.night } }} />
    <Stack.Screen name="WelcomeAsGuest" component={WelcomeAsGuestScreen} options={{ animation: 'default', gestureEnabled: false }} />
    <Stack.Screen name="MobileOtpAccess" component={MobileOtpAccessScreen} />
    <Stack.Screen name="Home" component={HomeScreen} options={{ animation: 'fade_from_bottom', gestureEnabled: false }} />
    <Stack.Screen name="MenuAndOrder" component={MenuAndOrderScreen} />
    <Stack.Screen name="BrowseLocations" component={BrowseLocationsScreen} />
    <Stack.Screen name="SecurityBlocked" component={SecurityBlockedScreen} options={{ animation: 'fade', gestureEnabled: false }} />
  </Stack.Navigator>
);
