import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/** DEBUG BUILDS ONLY. If the screen looks blank, this tells you which route is mounted. Renders nothing in release. */
export const DevRouteBadge: React.FC<{ name: string }> = ({ name }) =>
  __DEV__ ? (
    <View pointerEvents="none" style={styles.wrap} testID="dev-route-badge">
      <Text style={styles.text}>route: {name || '...'}</Text>
    </View>
  ) : null;

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 6, bottom: 6, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, zIndex: 9999 },
  text: { color: 'white', fontSize: 10 },
});
