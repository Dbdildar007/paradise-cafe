import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PlaceholderScreen } from './PlaceholderScreen';

export const HomeScreen: React.FC = () => {

  return (
    <View style={styles.container}>
      <PlaceholderScreen testID="screen-home" name="home screen" />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});