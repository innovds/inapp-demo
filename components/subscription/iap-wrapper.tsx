import React from 'react';
import { Platform, View, Text } from 'react-native';

// Platform detection
export const isIAPAvailable = (): boolean => {
  // IAP is available on native platforms (iOS/Android) but not on web or Expo Go
  if (Platform.OS === 'web') {
    return false;
  }
  
  // In Expo Go, expo-iap is not available
  if (__DEV__ && typeof global !== 'undefined' && (global as any).expo?.modules?.ExpoGo) {
    return false;
  }
  
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

// Types for IAP result
export interface UseIAPResult {
  connected: boolean;
  subscriptions: any[];
  availablePurchases: any[];
  fetchProducts: (params: any) => void;
  getAvailablePurchases: () => Promise<void>;
  getActiveSubscriptions: () => Promise<void>;
  activeSubscriptions: any[];
}

// Safe wrapper functions
export const requestPurchaseSafe = async (params: any) => {
  if (!isIAPAvailable()) {
    console.warn('IAP not available - cannot request purchase');
    throw new Error('In-app purchases not available on this platform');
  }
  
  const { requestPurchase } = await import('expo-iap');
  return requestPurchase(params);
};

export const showManageSubscriptionsIOSSafe = async () => {
  if (!isIAPAvailable() || Platform.OS !== 'ios') {
    console.warn('IAP management not available on this platform');
    throw new Error('Subscription management not available on this platform');
  }
  
  const { showManageSubscriptionsIOS } = await import('expo-iap');
  return showManageSubscriptionsIOS();
};

interface IAPProviderProps {
  children: (iapData: UseIAPResult) => React.ReactElement;
}

export const IAPProvider: React.FC<IAPProviderProps> = ({ children }) => {
  if (!isIAPAvailable()) {
    // Mock implementation for web/unsupported platforms
    const mockData: UseIAPResult = {
      connected: false,
      subscriptions: [],
      availablePurchases: [],
      fetchProducts: () => console.warn('IAP not available - fetchProducts mock'),
      getAvailablePurchases: async () => console.warn('IAP not available - getAvailablePurchases mock'),
      getActiveSubscriptions: async () => console.warn('IAP not available - getActiveSubscriptions mock'),
      activeSubscriptions: [],
    };
    
    return children(mockData);
  }

  // Use dynamic import for real IAP provider
  const RealIAPProvider = React.lazy(() => 
    import('./real-iap-provider.native').then(module => ({ 
      default: module.RealIAPProvider 
    }))
  );

  return (
    <React.Suspense fallback={
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading IAP...</Text>
      </View>
    }>
      <RealIAPProvider>
        {children}
      </RealIAPProvider>
    </React.Suspense>
  );
};