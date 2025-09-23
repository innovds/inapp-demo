import { SimpleStore } from '@/components/subscription/subscription-simple-flow';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { StyleSheet } from 'react-native';

export default function SubscriptionScreen() {
  return (
    <ThemedView style={styles.container}>
      <SimpleStore />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});