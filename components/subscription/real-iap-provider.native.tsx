import { useIAP } from 'expo-iap';
import React from 'react';
import type { UseIAPResult } from './iap-wrapper';

// Composant wrapper qui utilise le vrai useIAP hook
interface RealIAPProviderProps {
  children: (iapData: UseIAPResult) => React.ReactNode;
}

export const RealIAPProvider: React.FC<RealIAPProviderProps> = ({ children }) => {
  const iapData = useIAP();
  return <>{children(iapData as UseIAPResult)}</>;
};