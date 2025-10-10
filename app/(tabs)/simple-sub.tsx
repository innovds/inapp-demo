import SimpleSubscriptionManager from '@/components/subscription/simple-subscription-manager';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { StyleSheet } from 'react-native';

export default function SubscriptionScreen() {
  const handleSubscriptionChanged = (subscription: any) => {
    console.log('Subscription changed:', subscription);
    // Ici vous pouvez gérer les changements d'abonnement
    // Par exemple, rafraîchir l'interface utilisateur ou synchroniser avec votre état global
  };

  return (
    <ThemedView style={styles.container}>
      <SimpleSubscriptionManager 
        onSubscriptionChanged={handleSubscriptionChanged}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});