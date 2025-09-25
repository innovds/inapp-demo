import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'keycloak_access_token',
  REFRESH_TOKEN: 'keycloak_refresh_token',
  EXPIRES_AT: 'keycloak_expires_at',
  USER_INFO: 'keycloak_user_info',
};

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType?: string;
  scope?: string;
}

export interface UserInfo {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
}

class SecureTokenStorage {
  private async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Pour le web, utiliser AsyncStorage avec un préfixe sécurisé
        await AsyncStorage.setItem(`secure_${key}`, value);
      } else {
        // Pour mobile, utiliser SecureStore
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('Error storing item:', error);
      throw error;
    }
  }

  private async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(`secure_${key}`);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error('Error retrieving item:', error);
      return null;
    }
  }

  private async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(`secure_${key}`);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  }

  async storeTokens(tokenData: TokenData): Promise<void> {
    await Promise.all([
      this.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.accessToken),
      this.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refreshToken),
      this.setItem(STORAGE_KEYS.EXPIRES_AT, tokenData.expiresAt.toString()),
    ]);
  }

  async getTokens(): Promise<TokenData | null> {
    try {
      const [accessToken, refreshToken, expiresAt] = await Promise.all([
        this.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        this.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        this.getItem(STORAGE_KEYS.EXPIRES_AT),
      ]);

      if (!accessToken || !refreshToken || !expiresAt) {
        return null;
      }

      return {
        accessToken,
        refreshToken,
        expiresAt: parseInt(expiresAt, 10),
      };
    } catch (error) {
      console.error('Error getting tokens:', error);
      return null;
    }
  }

  async storeUserInfo(userInfo: UserInfo): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
  }

  async getUserInfo(): Promise<UserInfo | null> {
    try {
      const userInfoStr = await this.getItem(STORAGE_KEYS.USER_INFO);
      return userInfoStr ? JSON.parse(userInfoStr) : null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  async clearAll(): Promise<void> {
    await Promise.all([
      this.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      this.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      this.removeItem(STORAGE_KEYS.EXPIRES_AT),
      this.removeItem(STORAGE_KEYS.USER_INFO),
    ]);
  }

  isTokenExpired(expiresAt: number): boolean {
    // Ajouter une marge de 5 minutes pour la sécurité
    return Date.now() >= (expiresAt - 5 * 60 * 1000);
  }
}

export const secureTokenStorage = new SecureTokenStorage();