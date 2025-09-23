
export const useIAP = () => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('expo-iap').useIAP;
    } catch {
        console.warn('expo-iap not available - returning mock useIAP');
        return () => ({
            connected: false,
            subscriptions: [],
            availablePurchases: [],
            fetchProducts: () => console.warn('IAP not available - fetchProducts mock'),
            getAvailablePurchases: async () => console.warn('IAP not available - getAvailablePurchases mock'),
            getActiveSubscriptions: async () => console.warn('IAP not available - getActiveSubscriptions mock'),
            activeSubscriptions: [],
        });
    }
}