import Constants from "expo-constants";
import { Platform } from "react-native";

// Helper pour détecter Expo Go
const isExpoGo = () => {
  try {
    return Constants?.executionEnvironment === "storeClient";
  } catch {
    return false;
  }
};

// Helper pour vérifier si expo-iap est disponible
export const isIAPAvailable = () => Platform.OS !== "web" && !isExpoGo();

// Types pour maintenir la compatibilité avec expo-iap
export interface IAPProduct {
  id: string;
  title: string;
  description: string;
  displayPrice: string;
  type: string;
  // Propriétés optionnelles pour la compatibilité
  currency?: string;
  displayNameIOS?: string;
  isFamilyShareableIOS?: boolean;
  jsonRepresentationIOS?: string;
  subscriptionOfferDetailsAndroid?: any[];
  subscriptionInfoIOS?: {
    introductoryOffer?: any;
    subscriptionPeriod?: { unit: string };
  };
}

export interface IAPPurchase {
  productId: string;
  id?: string;
  transactionDate: number;
  platform: string;
  purchaseToken?: string;
  // Propriétés pour activeSubscriptions
  isActive?: boolean;
  expirationDateIOS?: number;
  environmentIOS?: string;
  willExpireSoon?: boolean;
  daysUntilExpirationIOS?: number;
  autoRenewingAndroid?: boolean;
  // Propriétés PurchaseIOS
  isAutoRenewing?: boolean;
  purchaseState?: number;
  quantity?: number;
  transactionId?: string;
}

export interface IAPHookResult {
  connected: boolean;
  subscriptions: IAPProduct[];
  availablePurchases: IAPPurchase[];
  activeSubscriptions: IAPPurchase[];
  fetchProducts: (params: { skus: string[]; type: string }) => void;
  getAvailablePurchases: () => Promise<void>;
  finishTransaction: (params: {
    purchase: IAPPurchase;
    isConsumable: boolean;
  }) => Promise<void>;
  getActiveSubscriptions: () => Promise<void>;
}

export interface IAPAdapterConfig {
  onPurchaseSuccess?: (purchase: IAPPurchase) => void;
  onPurchaseError?: (error: any) => void;
  onSyncError?: (error: Error) => void;
}

// Mock implementation pour le web
const createMockIAPHook = (config: IAPAdapterConfig): IAPHookResult => {
  return {
    connected: false,
    subscriptions: [],
    availablePurchases: [],
    activeSubscriptions: [],
    fetchProducts: () => {
      console.warn(
        "[IAP Adapter] fetchProducts called on web - mock implementation"
      );
    },
    getAvailablePurchases: async () => {
      console.warn(
        "[IAP Adapter] getAvailablePurchases called on web - mock implementation"
      );
    },
    finishTransaction: async () => {
      console.warn(
        "[IAP Adapter] finishTransaction called on web - mock implementation"
      );
    },
    getActiveSubscriptions: async () => {
      console.warn(
        "[IAP Adapter] getActiveSubscriptions called on web - mock implementation"
      );
    },
  };
};

// Mock pour requestPurchase
const mockRequestPurchase = () => {
  console.warn(
    "[IAP Adapter] requestPurchase called on web - mock implementation"
  );
  return Promise.resolve();
};

// Mock pour showManageSubscriptionsIOS
const mockShowManageSubscriptionsIOS = () => {
  console.warn(
    "[IAP Adapter] showManageSubscriptionsIOS called on web - mock implementation"
  );
  return Promise.resolve();
};

// Hook adapter simple et efficace avec détection intelligente
export const useIAPAdapter = (config: IAPAdapterConfig = {}): IAPHookResult => {
  if (isIAPAvailable()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("expo-iap").useIAP(config);
    } catch {
      if (__DEV__) {
        console.warn("[IAP Adapter] Fallback to mock implementation");
      }
    }
  }
  return createMockIAPHook(config);
};

// Fonction adapter pour requestPurchase
export const requestPurchaseAdapter = async (params: any) => {
  // if (isIAPAvailable()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { requestPurchase } = require("expo-iap");
      return requestPurchase(params);
    } catch {
      if (__DEV__) {
        console.warn("[IAP Adapter] requestPurchase fallback to mock");
      }
    }
  // }
  return mockRequestPurchase();
};

// Fonction adapter pour showManageSubscriptionsIOS
export const showManageSubscriptionsIOSAdapter = async () => {
  if (Platform.OS === "ios" && isIAPAvailable()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { showManageSubscriptionsIOS } = require("expo-iap");
      return showManageSubscriptionsIOS();
    } catch {
      if (__DEV__) {
        console.warn(
          "[IAP Adapter] showManageSubscriptionsIOS fallback to mock"
        );
      }
    }
  }
  return mockShowManageSubscriptionsIOS();
};
