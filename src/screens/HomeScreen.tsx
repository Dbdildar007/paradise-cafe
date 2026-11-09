import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PlaceholderScreen } from './PlaceholderScreen';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            // Fallback if there is no previous screen (e.g., navigate to another screen or log it)
            console.log('No screen to go back to');
          }
        }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      
      <PlaceholderScreen testID="screen-home" name="home screen" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingVertical: 10,
    zIndex: 10,
    backgroundColor: 'red',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF', // Added white text so it's readable on the red background
  },
});