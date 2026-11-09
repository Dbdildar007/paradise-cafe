import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Splash: undefined;
  WelcomeAsGuest: undefined;
  MobileOtpAccess: undefined;
  Home: undefined;
  MenuAndOrder: undefined;
  BrowseLocations: undefined;
  SecurityBlocked: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
