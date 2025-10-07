/**
 * Service de gestion des utilisateurs pour Apple In-App Purchase
 *
 * Ce service gère :
 * - La génération d'IDs utilisateur
 * - Le mapping userId ↔ originalTransactionId
 * - La génération d'appAccountToken
 * - Le stockage local des associations
 */

import { Platform } from "react-native";

// Storage interface for consistent API
interface StorageInterface {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
  multiRemove(keys: string[]): Promise<void>;
}

// Create platform-specific storage implementation
const createStorage = (): StorageInterface => {
  if (Platform.OS === "web") {
    // Web implementation using localStorage
    return {
      getItem: async (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // Ignore localStorage errors
        }
      },
      removeItem: async (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignore localStorage errors
        }
      },
      getAllKeys: async () => {
        try {
          return Object.keys(localStorage);
        } catch {
          return [];
        }
      },
      multiRemove: async (keys: string[]) => {
        try {
          keys.forEach((key) => localStorage.removeItem(key));
        } catch {
          // Ignore localStorage errors
        }
      },
    };
  } else {
    // Native implementation
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const AsyncStorageNative =
        require("@react-native-async-storage/async-storage").default;
      return {
        getItem: AsyncStorageNative.getItem,
        setItem: AsyncStorageNative.setItem,
        removeItem: AsyncStorageNative.removeItem,
        getAllKeys: AsyncStorageNative.getAllKeys,
        multiRemove: AsyncStorageNative.multiRemove,
      };
    } catch {
      // Fallback memory storage
      const memoryStorage: Record<string, string> = {};
      return {
        getItem: async (key: string) => memoryStorage[key] || null,
        setItem: async (key: string, value: string) => {
          memoryStorage[key] = value;
        },
        removeItem: async (key: string) => {
          delete memoryStorage[key];
        },
        getAllKeys: async () => Object.keys(memoryStorage),
        multiRemove: async (keys: string[]) => {
          keys.forEach((key) => delete memoryStorage[key]);
        },
      };
    }
  }
};

// Initialize storage
const AsyncStorage = createStorage();

export interface UserMapping {
  userId: string;
  originalTransactionId?: string;
  appAccountToken?: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserPurchaseHistory {
  userId: string;
  purchases: {
    productId: string;
    originalTransactionId: string;
    appAccountToken: string;
    purchaseDate: number;
    platform: string;
  }[];
}

const STORAGE_KEYS = {
  CURRENT_USER_ID: "@zenyaa:current_user_id",
  USER_MAPPINGS: "@zenyaa:user_mappings",
  PURCHASE_HISTORY: "@zenyaa:purchase_history",
} as const;

class UserManager {
  private static instance: UserManager;
  private currentUserId: string | null = null;

  private constructor() {}

  static getInstance(): UserManager {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager();
    }
    return UserManager.instance;
  }

  /**
   * Initialise le service utilisateur
   */
  async initialize(): Promise<void> {
    try {
      // Charger l'ID utilisateur actuel
      const storedUserId = await AsyncStorage.getItem(
        STORAGE_KEYS.CURRENT_USER_ID
      );

      if (storedUserId) {
        this.currentUserId = storedUserId;
      } else {
        // Créer un nouvel utilisateur si aucun n'existe
        await this.createNewUser();
      }

      console.log("[UserManager] Initialized with userId:", this.currentUserId);
    } catch (error) {
      console.error("[UserManager] Initialization failed:", error);
      // Fallback: créer un utilisateur temporaire
      this.currentUserId = this.generateUserId();
    }
  }

  /**
   * Crée un nouvel utilisateur avec un ID unique
   */
  async createNewUser(): Promise<string> {
    const userId = this.generateUserId();

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
      this.currentUserId = userId;

      // Initialiser le mapping utilisateur
      await this.saveUserMapping({
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      console.log("[UserManager] New user created:", userId);
      return userId;
    } catch (error) {
      console.error("[UserManager] Failed to create new user:", error);
      // Fallback: utiliser l'ID généré sans persistence
      this.currentUserId = userId;
      return userId;
    }
  }

  /**
   * Génère un ID utilisateur unique
   * Pour l'instant, on utilise "usery" + timestamp comme demandé
   * Plus tard, on peut utiliser un vrai système d'authentification
   */
  private generateUserId(): string {
    // Utilisation temporaire de "usery" comme base
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `usery_${timestamp}_${random}`;
  }

  /**
   * Récupère l'ID utilisateur actuel
   */
  getCurrentUserId(): string {
    if (!this.currentUserId) {
      // Fallback: créer un ID temporaire
      this.currentUserId = this.generateUserId();
      console.warn(
        "[UserManager] No current user ID, generated temporary:",
        this.currentUserId
      );
    }
    return this.currentUserId;
  }

  /**
   * Génère un appAccountToken pour Apple IAP
   * Ce token permettra de lier la transaction à l'utilisateur
   */
  async generateAppAccountToken(): Promise<string> {
    try {
      const userId = this.getCurrentUserId();
      const timestamp = Date.now();

      // Créer un token sécurisé basé sur l'ID utilisateur
      const tokenData = `${userId}:${timestamp}`;

      // Encoder en base64 pour Apple
      const appAccountToken = btoa(tokenData);

      console.log("[UserManager] Generated appAccountToken for user:", userId);
      return appAccountToken;
    } catch (error) {
      console.error("[UserManager] Failed to generate appAccountToken:", error);
      // Fallback: utiliser l'ID utilisateur encodé
      return btoa(this.getCurrentUserId());
    }
  }

  /**
   * Décode un appAccountToken pour récupérer l'ID utilisateur
   */
  decodeAppAccountToken(appAccountToken: string): string | null {
    try {
      const decoded = atob(appAccountToken);
      const [userId] = decoded.split(":");
      return userId;
    } catch (error) {
      console.error("[UserManager] Failed to decode appAccountToken:", error);
      return null;
    }
  }

  /**
   * Enregistre l'association userId ↔ originalTransactionId
   */
  async savePurchaseMapping(
    originalTransactionId: string,
    appAccountToken: string,
    productId: string
  ): Promise<void> {
    try {
      const userId =
        this.decodeAppAccountToken(appAccountToken) || this.getCurrentUserId();

      // Mettre à jour le mapping utilisateur
      const existingMapping = await this.getUserMapping(userId);
      const updatedMapping: UserMapping = {
        ...existingMapping,
        userId,
        originalTransactionId,
        appAccountToken,
        updatedAt: Date.now(),
      };

      await this.saveUserMapping(updatedMapping);

      // Enregistrer dans l'historique des achats
      await this.addToPurchaseHistory(userId, {
        productId,
        originalTransactionId,
        appAccountToken,
        purchaseDate: Date.now(),
        platform: Platform.OS,
      });

      console.log("[UserManager] Purchase mapping saved:", {
        userId,
        originalTransactionId,
        productId,
      });
    } catch (error) {
      console.error("[UserManager] Failed to save purchase mapping:", error);
    }
  }

  /**
   * Récupère le mapping d'un utilisateur
   */
  async getUserMapping(userId: string): Promise<UserMapping> {
    try {
      const mappingsJson = await AsyncStorage.getItem(
        STORAGE_KEYS.USER_MAPPINGS
      );
      const mappings: Record<string, UserMapping> = mappingsJson
        ? JSON.parse(mappingsJson)
        : {};

      return (
        mappings[userId] || {
          userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      );
    } catch (error) {
      console.error("[UserManager] Failed to get user mapping:", error);
      return {
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
  }

  /**
   * Sauvegarde le mapping d'un utilisateur
   */
  private async saveUserMapping(mapping: UserMapping): Promise<void> {
    try {
      const mappingsJson = await AsyncStorage.getItem(
        STORAGE_KEYS.USER_MAPPINGS
      );
      const mappings: Record<string, UserMapping> = mappingsJson
        ? JSON.parse(mappingsJson)
        : {};

      mappings[mapping.userId] = mapping;

      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_MAPPINGS,
        JSON.stringify(mappings)
      );
    } catch (error) {
      console.error("[UserManager] Failed to save user mapping:", error);
    }
  }

  /**
   * Ajoute un achat à l'historique de l'utilisateur
   */
  private async addToPurchaseHistory(
    userId: string,
    purchase: UserPurchaseHistory["purchases"][0]
  ): Promise<void> {
    try {
      const historyJson = await AsyncStorage.getItem(
        STORAGE_KEYS.PURCHASE_HISTORY
      );
      const allHistory: Record<string, UserPurchaseHistory> = historyJson
        ? JSON.parse(historyJson)
        : {};

      if (!allHistory[userId]) {
        allHistory[userId] = {
          userId,
          purchases: [],
        };
      }

      allHistory[userId].purchases.push(purchase);

      await AsyncStorage.setItem(
        STORAGE_KEYS.PURCHASE_HISTORY,
        JSON.stringify(allHistory)
      );
    } catch (error) {
      console.error("[UserManager] Failed to add to purchase history:", error);
    }
  }

  /**
   * Récupère l'historique des achats d'un utilisateur
   */
  async getPurchaseHistory(
    userId?: string
  ): Promise<UserPurchaseHistory | null> {
    try {
      const targetUserId = userId || this.getCurrentUserId();
      const historyJson = await AsyncStorage.getItem(
        STORAGE_KEYS.PURCHASE_HISTORY
      );
      const allHistory: Record<string, UserPurchaseHistory> = historyJson
        ? JSON.parse(historyJson)
        : {};

      return allHistory[targetUserId] || null;
    } catch (error) {
      console.error("[UserManager] Failed to get purchase history:", error);
      return null;
    }
  }

  /**
   * Trouve l'utilisateur associé à une originalTransactionId
   */
  async findUserByTransactionId(
    originalTransactionId: string
  ): Promise<string | null> {
    try {
      const mappingsJson = await AsyncStorage.getItem(
        STORAGE_KEYS.USER_MAPPINGS
      );
      const mappings: Record<string, UserMapping> = mappingsJson
        ? JSON.parse(mappingsJson)
        : {};

      for (const [userId, mapping] of Object.entries(mappings)) {
        if (mapping.originalTransactionId === originalTransactionId) {
          return userId;
        }
      }

      return null;
    } catch (error) {
      console.error(
        "[UserManager] Failed to find user by transaction ID:",
        error
      );
      return null;
    }
  }

  /**
   * Récupère toutes les données utilisateur pour le debug
   */
  async getDebugData(): Promise<{
    currentUserId: string;
    mappings: Record<string, UserMapping>;
    purchaseHistory: Record<string, UserPurchaseHistory>;
  }> {
    try {
      const mappingsJson = await AsyncStorage.getItem(
        STORAGE_KEYS.USER_MAPPINGS
      );
      const historyJson = await AsyncStorage.getItem(
        STORAGE_KEYS.PURCHASE_HISTORY
      );

      return {
        currentUserId: this.getCurrentUserId(),
        mappings: mappingsJson ? JSON.parse(mappingsJson) : {},
        purchaseHistory: historyJson ? JSON.parse(historyJson) : {},
      };
    } catch (error) {
      console.error("[UserManager] Failed to get debug data:", error);
      return {
        currentUserId: this.getCurrentUserId(),
        mappings: {},
        purchaseHistory: {},
      };
    }
  }

  /**
   * Efface toutes les données utilisateur (pour les tests)
   */
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.CURRENT_USER_ID,
        STORAGE_KEYS.USER_MAPPINGS,
        STORAGE_KEYS.PURCHASE_HISTORY,
      ]);

      this.currentUserId = null;
      console.log("[UserManager] All data cleared");
    } catch (error) {
      console.error("[UserManager] Failed to clear data:", error);
    }
  }
}

// Export de l'instance singleton
export const userManager = UserManager.getInstance();
