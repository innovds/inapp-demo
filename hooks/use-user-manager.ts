/**
 * Hook React pour la gestion des utilisateurs et des achats Apple IAP
 *
 * Ce hook fournit une interface simple pour :
 * - Gérer l'ID utilisateur actuel
 * - Générer des appAccountToken
 * - Enregistrer les mappings d'achats
 * - Récupérer l'historique des achats
 */

import { useCallback, useEffect, useState } from "react";
import {
  userManager,
  type UserMapping,
  type UserPurchaseHistory,
} from "../services/user-manager";

export interface UseUserManagerResult {
  // État de l'utilisateur
  currentUserId: string;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions utilisateur
  generateAppAccountToken: () => Promise<string>;
  savePurchaseMapping: (
    originalTransactionId: string,
    appAccountToken: string,
    productId: string
  ) => Promise<void>;

  // Récupération de données
  getUserMapping: (userId?: string) => Promise<UserMapping>;
  getPurchaseHistory: (userId?: string) => Promise<UserPurchaseHistory | null>;
  findUserByTransactionId: (
    originalTransactionId: string
  ) => Promise<string | null>;

  // Utilitaires
  createNewUser: () => Promise<string>;
  clearAllData: () => Promise<void>;
  getDebugData: () => Promise<{
    currentUserId: string;
    mappings: Record<string, UserMapping>;
    purchaseHistory: Record<string, UserPurchaseHistory>;
  }>;

  // Helpers
  decodeAppAccountToken: (token: string) => string | null;
}

export const useUserManager = (): UseUserManagerResult => {
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialisation du user manager
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await userManager.initialize();
        const userId = userManager.getCurrentUserId();

        setCurrentUserId(userId);
        setIsInitialized(true);

        console.log("[useUserManager] Initialized with userId:", userId);
      } catch (initError) {
        const errorMessage =
          initError instanceof Error
            ? initError.message
            : "Failed to initialize user manager";
        console.error("[useUserManager] Initialization failed:", initError);
        setError(errorMessage);

        // Fallback: utiliser un ID temporaire
        const fallbackUserId = userManager.getCurrentUserId();
        setCurrentUserId(fallbackUserId);
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Génération d'appAccountToken
  const generateAppAccountToken = useCallback(async (): Promise<string> => {
    try {
      setError(null);
      return await userManager.generateAppAccountToken();
    } catch (tokenError) {
      const errorMessage =
        tokenError instanceof Error
          ? tokenError.message
          : "Failed to generate appAccountToken";
      console.error("[useUserManager] Token generation failed:", tokenError);
      setError(errorMessage);
      throw tokenError;
    }
  }, []);

  // Enregistrement d'un mapping d'achat
  const savePurchaseMapping = useCallback(
    async (
      originalTransactionId: string,
      appAccountToken: string,
      productId: string
    ): Promise<void> => {
      try {
        setError(null);
        await userManager.savePurchaseMapping(
          originalTransactionId,
          appAccountToken,
          productId
        );
        console.log("[useUserManager] Purchase mapping saved successfully");
      } catch (saveError) {
        const errorMessage =
          saveError instanceof Error
            ? saveError.message
            : "Failed to save purchase mapping";
        console.error("[useUserManager] Save mapping failed:", saveError);
        setError(errorMessage);
        throw saveError;
      }
    },
    []
  );

  // Récupération du mapping d'un utilisateur
  const getUserMapping = useCallback(
    async (userId?: string): Promise<UserMapping> => {
      try {
        setError(null);
        const targetUserId = userId || currentUserId;
        return await userManager.getUserMapping(targetUserId);
      } catch (mappingError) {
        const errorMessage =
          mappingError instanceof Error
            ? mappingError.message
            : "Failed to get user mapping";
        console.error("[useUserManager] Get mapping failed:", mappingError);
        setError(errorMessage);
        throw mappingError;
      }
    },
    [currentUserId]
  );

  // Récupération de l'historique des achats
  const getPurchaseHistory = useCallback(
    async (userId?: string): Promise<UserPurchaseHistory | null> => {
      try {
        setError(null);
        return await userManager.getPurchaseHistory(userId);
      } catch (historyError) {
        const errorMessage =
          historyError instanceof Error
            ? historyError.message
            : "Failed to get purchase history";
        console.error("[useUserManager] Get history failed:", historyError);
        setError(errorMessage);
        throw historyError;
      }
    },
    []
  );

  // Recherche d'utilisateur par transaction ID
  const findUserByTransactionId = useCallback(
    async (originalTransactionId: string): Promise<string | null> => {
      try {
        setError(null);
        return await userManager.findUserByTransactionId(originalTransactionId);
      } catch (findError) {
        const errorMessage =
          findError instanceof Error
            ? findError.message
            : "Failed to find user by transaction ID";
        console.error("[useUserManager] Find user failed:", findError);
        setError(errorMessage);
        throw findError;
      }
    },
    []
  );

  // Création d'un nouvel utilisateur
  const createNewUser = useCallback(async (): Promise<string> => {
    try {
      setError(null);
      const newUserId = await userManager.createNewUser();
      setCurrentUserId(newUserId);
      return newUserId;
    } catch (createError) {
      const errorMessage =
        createError instanceof Error
          ? createError.message
          : "Failed to create new user";
      console.error("[useUserManager] Create user failed:", createError);
      setError(errorMessage);
      throw createError;
    }
  }, []);

  // Suppression de toutes les données
  const clearAllData = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await userManager.clearAllData();
      setCurrentUserId("");
      setIsInitialized(false);
      console.log("[useUserManager] All data cleared");
    } catch (clearError) {
      const errorMessage =
        clearError instanceof Error
          ? clearError.message
          : "Failed to clear data";
      console.error("[useUserManager] Clear data failed:", clearError);
      setError(errorMessage);
      throw clearError;
    }
  }, []);

  // Récupération des données de debug
  const getDebugData = useCallback(async () => {
    try {
      setError(null);
      return await userManager.getDebugData();
    } catch (debugError) {
      const errorMessage =
        debugError instanceof Error
          ? debugError.message
          : "Failed to get debug data";
      console.error("[useUserManager] Get debug data failed:", debugError);
      setError(errorMessage);
      throw debugError;
    }
  }, []);

  // Décodage d'appAccountToken
  const decodeAppAccountToken = useCallback((token: string): string | null => {
    try {
      setError(null);
      return userManager.decodeAppAccountToken(token);
    } catch (decodeError) {
      const errorMessage =
        decodeError instanceof Error
          ? decodeError.message
          : "Failed to decode appAccountToken";
      console.error("[useUserManager] Decode token failed:", decodeError);
      setError(errorMessage);
      return null;
    }
  }, []);

  return {
    // État
    currentUserId,
    isInitialized,
    isLoading,
    error,

    // Actions
    generateAppAccountToken,
    savePurchaseMapping,

    // Récupération
    getUserMapping,
    getPurchaseHistory,
    findUserByTransactionId,

    // Utilitaires
    createNewUser,
    clearAllData,
    getDebugData,

    // Helpers
    decodeAppAccountToken,
  };
};

export default useUserManager;
