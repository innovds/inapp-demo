import React from 'react';
import type { UseIAPParams, UseIAPResult } from './iap-wrapper';

// Mock pour web - retourne des données vides
const createMockIAP = (): UseIAPResult => ({
  connected: false,
  subscriptions: [],
  availablePurchases: [],
  activeSubscriptions: [],
  fetchProducts: () => console.warn('📱 IAP not available on web'),
  getAvailablePurchases: async () => console.warn('📱 IAP not available on web'),
  finishTransaction: async () => console.warn('📱 IAP not available on web'),
  getActiveSubscriptions: async () => console.warn('📱 IAP not available on web'),
});

// Composant mock pour web
interface RealIAPProviderProps {
  children: (iapData: UseIAPResult) => React.ReactNode;
  params: UseIAPParams;
}

export const RealIAPProvider: React.FC<RealIAPProviderProps> = ({ children }) => {
  return <>{children(createMockIAP())}</>;
};