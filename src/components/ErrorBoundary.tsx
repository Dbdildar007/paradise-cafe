import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { logger } from '../utils/logger';
import { AppText } from './AppText';

/** Last line of defence: shows a generic message - never stack traces or error details to the user. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: Error) {
    logger.error('render error', error.message); // wire to Crashlytics/Sentry with PII scrubbing here
  }
  override render() {
    if (this.state.failed) {
      return (
        <View style={styles.root} testID="error-boundary">
          <AppText variant="headlineMd" color={colors.tertiary}>
            Something went wrong
          </AppText>
          <AppText variant="bodyMd" style={styles.body}>
            Please close and reopen the app.
          </AppText>
        </View>
      );
    }
    return this.props.children;
  }
}
const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  body: { marginTop: 8 },
});
