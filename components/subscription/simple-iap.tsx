import {
  finishTransaction,
  useIAP
} from 'expo-iap';
import { useEffect, useState } from 'react';

interface Purchase {
  transactionId: string;
  productId: string;
  transactionReceipt?: string;
  purchaseToken?: string;
  platform?: string;
  applicationUsername?: string;
  // 🎯 Ajout des champs pour récupérer l'userId
  appAccountToken?: string; // iOS - contient votre userId
  obfuscatedAccountIdAndroid?: string; // Android - contient votre userId
}

// Hook personnalisé pour gérer les achats
export const usePurchaseManager = (userId: string) => {
  const { products, requestPurchase } = useIAP();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState<Purchase | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Gérer automatiquement les achats terminés
  useEffect(() => {
    if (currentPurchase && !isProcessing) {
      handlePurchaseCompletion(currentPurchase, userId);
    }
  }, [currentPurchase, userId, isProcessing]);

  // Fonction pour initier un achat
  const purchaseProduct = async (productId: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Utilisation correcte du requestPurchase avec userId via appAccountToken
      const result = await requestPurchase({
        type: 'in-app',
        request: {
          ios: {
            sku: productId,
            appAccountToken: userId, // 🎯 Voici où vous passez l'userId !
            quantity: 1
          },
          android: {
            skus: [productId],
            obfuscatedAccountIdAndroid: userId // 🎯 Et ici pour Android !
          }
        }
      });
      
      setCurrentPurchase(result as any);
      console.log(`Achat initié pour ${productId} avec userId: ${userId}`);
      
    } catch (error: any) {
      console.error('Erreur lors de l\'achat:', error);
      setError(error.message || 'Erreur lors de l\'achat');
      setIsProcessing(false);
      throw error;
    }
  };

  // Traiter la finalisation d'un achat
  const handlePurchaseCompletion = async (purchaseData: Purchase, userId: string) => {
    try {
      console.log('Achat détecté:', purchaseData);
      console.log('Application Username:', purchaseData.applicationUsername);

      // 1. Valider côté serveur
      const isValid = await validatePurchaseOnServer(purchaseData, userId);
      
      if (isValid) {
        // 2. Finaliser la transaction
        await finishTransaction(purchaseData as any);
        console.log('✅ Transaction finalisée avec succès');
        
        // 3. Mettre à jour l'UI ou l'état local
        await activatePremiumFeatures(userId, purchaseData.productId);
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Erreur finalisation:', error);
      setIsProcessing(false);
    }
  };

  return {
    products,
    currentPurchase,
    error,
    isProcessing,
    purchaseProduct
  };
};

// Validation côté serveur
const validatePurchaseOnServer = async (purchase: Purchase, userId: string): Promise<boolean> => {
  try {
    const response = await fetch('https://votre-backend.com/api/validate-purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        transactionId: purchase.transactionId,
        productId: purchase.productId,
        applicationUsername: purchase.applicationUsername,
        // 🎯 Envoyer l'userId récupéré depuis l'achat
        appAccountToken: purchase.appAccountToken, // iOS
        obfuscatedAccountId: purchase.obfuscatedAccountIdAndroid, // Android
        receipt: purchase.transactionReceipt || purchase.purchaseToken,
        platform: purchase.platform || 'ios'
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Erreur validation serveur:', error);
    return false;
  }
};

const activatePremiumFeatures = async (userId: string, productId: string) => {
  console.log(`Activation premium pour ${userId} - produit: ${productId}`);
  // Votre logique d'activation
};