// Types compatibles avec expo-iap pour éviter les erreurs de type
import type { ProductSubscription, Purchase } from 'expo-iap';

// Type guard pour vérifier si on a affaire à un vrai Purchase d'expo-iap
export const isExpoPurchase = (purchase: any): purchase is Purchase => {
  return purchase && typeof purchase === 'object' && 'productId' in purchase;
};

// Type guard pour vérifier si on a affaire à un vrai ProductSubscription d'expo-iap
export const isExpoSubscription = (subscription: any): subscription is ProductSubscription => {
  return subscription && typeof subscription === 'object' && 'id' in subscription;
};

// Fonction utilitaire pour convertir IAPPurchase vers Purchase
export const adaptPurchase = (purchase: any): Purchase => {
  if (isExpoPurchase(purchase)) {
    return purchase;
  }
  
  // Conversion basique pour les mocks
  return {
    productId: purchase.productId || '',
    transactionDate: purchase.transactionDate || Date.now(),
    platform: purchase.platform || 'unknown',
    id: purchase.id,
    purchaseToken: purchase.purchaseToken,
    // Propriétés par défaut pour éviter les erreurs TypeScript
    isAutoRenewing: purchase.isAutoRenewing || false,
    purchaseState: purchase.purchaseState || 0,
    quantity: purchase.quantity || 1,
    transactionId: purchase.transactionId || purchase.id || '',
  } as Purchase;
};

// Fonction utilitaire pour convertir IAPProduct vers ProductSubscription
export const adaptSubscription = (subscription: any): ProductSubscription => {
  if (isExpoSubscription(subscription)) {
    return subscription;
  }

  // Conversion basique pour les mocks
  return {
    id: subscription.id || '',
    title: subscription.title || '',
    description: subscription.description || '',
    displayPrice: subscription.displayPrice || '',
    type: subscription.type || 'subscription',
    currency: subscription.currency || 'USD',
    displayNameIOS: subscription.displayNameIOS || subscription.title || '',
    isFamilyShareableIOS: subscription.isFamilyShareableIOS || false,
    jsonRepresentationIOS: subscription.jsonRepresentationIOS || '',
    subscriptionOfferDetailsAndroid: subscription.subscriptionOfferDetailsAndroid || [],
    subscriptionInfoIOS: subscription.subscriptionInfoIOS || {},
    // Ajout des propriétés manquantes
    platform: 'ios' as const,
    typeIOS: 'subscription' as const,
  } as unknown as ProductSubscription;
};