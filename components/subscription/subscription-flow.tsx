import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { IAPProvider, isIAPAvailable } from './iap-wrapper';
import { SubscriptionFlowContent } from './subscription-flow-content';

export default function SubscriptionFlow() {
  // Check if IAP is available on this platform
  if (!isIAPAvailable()) {
    return (
      <View style={styles.unavailableContainer}>
        <Text style={styles.unavailableTitle}>In-App Purchases Unavailable</Text>
        <Text style={styles.unavailableText}>
          {Platform.OS === 'web' 
            ? 'In-app purchases are not supported on web platform. This is a mock interface for development purposes.'
            : 'In-app purchases are not available on this platform or in Expo Go development environment.'
          }
        </Text>
        <Text style={styles.platformInfo}>
          Platform: {Platform.OS}
        </Text>
      </View>
    );
  }

  return (
    <IAPProvider>
      {(iapData) => <SubscriptionFlowContent iapData={iapData} />}
    </IAPProvider>
  );
}

const styles = StyleSheet.create({
  unavailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
  },
  unavailableTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 20,
    textAlign: 'center',
  },
  unavailableText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  platformInfo: {
    fontSize: 14,
    color: '#495057',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#e9ecef',
    padding: 8,
    borderRadius: 4,
  },
});
