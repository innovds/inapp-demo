import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { authConfig, getKeycloakEndpoints } from './keycloak.config';
import { secureTokenStorage, TokenData, UserInfo } from './storage';

// Nécessaire pour le web
WebBrowser.maybeCompleteAuthSession();

export interface AuthResult {
  success: boolean;
  tokens?: TokenData;
  userInfo?: UserInfo;
  error?: string;
}

class KeycloakAuthService {
  private discovery: AuthSession.DiscoveryDocument | null = null;

  async initialize(): Promise<void> {
    try {
      const endpoints = getKeycloakEndpoints();
      this.discovery = await AuthSession.fetchDiscoveryAsync(endpoints.discovery);
    } catch (error) {
      console.error('Failed to initialize Keycloak discovery:', error);
      throw new Error('Failed to initialize authentication service');
    }
  }

  async login(): Promise<AuthResult> {
    if (!this.discovery) {
      await this.initialize();
    }

    if (!this.discovery) {
      return { success: false, error: 'Failed to initialize authentication' };
    }

    try {
      // Configuration de la requête d'autorisation
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'zinyasubscription',
        path: 'auth/callback',
      });

      const request = new AuthSession.AuthRequest({
        clientId: authConfig.clientId,
        scopes: authConfig.scopes,
        responseType: AuthSession.ResponseType.Code,
        redirectUri,
      });

      // Lancer le flux d'authentification
      const result = await request.promptAsync(this.discovery);

      if (result.type === 'success') {
        const { code } = result.params;
        
        if (code) {
          // Échanger le code contre des tokens
          const tokenResult = await this.exchangeCodeForTokens(code, '', redirectUri);
          
          if (tokenResult.success && tokenResult.tokens) {
            // Récupérer les informations utilisateur
            const userInfo = await this.fetchUserInfo(tokenResult.tokens.accessToken);
            
            // Stocker les tokens et informations utilisateur
            await secureTokenStorage.storeTokens(tokenResult.tokens);
            if (userInfo) {
              await secureTokenStorage.storeUserInfo(userInfo);
            }
            
            return {
              success: true,
              tokens: tokenResult.tokens,
              userInfo: userInfo || undefined,
            };
          }
        }
      }

      return { 
        success: false, 
        error: result.type === 'cancel' ? 'User cancelled' : 'Authentication failed' 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Authentication error occurred' };
    }
  }

  private async exchangeCodeForTokens(
    code: string, 
    codeVerifier: string, 
    redirectUri: string
  ): Promise<{ success: boolean; tokens?: TokenData; error?: string }> {
    try {
      const tokenRequest = await AuthSession.exchangeCodeAsync(
        {
          clientId: authConfig.clientId,
          code,
          redirectUri,
          extraParams: {
            code_verifier: codeVerifier,
          },
        },
        this.discovery!
      );

      const expiresAt = Date.now() + (tokenRequest.expiresIn || 3600) * 1000;

      const tokens: TokenData = {
        accessToken: tokenRequest.accessToken,
        refreshToken: tokenRequest.refreshToken || '',
        expiresAt,
        tokenType: tokenRequest.tokenType,
        scope: tokenRequest.scope,
      };

      return { success: true, tokens };
    } catch (error) {
      console.error('Token exchange error:', error);
      return { success: false, error: 'Failed to exchange code for tokens' };
    }
  }

  async refreshTokens(refreshToken: string): Promise<{ success: boolean; tokens?: TokenData; error?: string }> {
    if (!this.discovery) {
      await this.initialize();
    }

    try {
      const tokenRequest = await AuthSession.refreshAsync(
        {
          clientId: authConfig.clientId,
          refreshToken,
        },
        this.discovery!
      );

      const expiresAt = Date.now() + (tokenRequest.expiresIn || 3600) * 1000;

      const tokens: TokenData = {
        accessToken: tokenRequest.accessToken,
        refreshToken: tokenRequest.refreshToken || refreshToken,
        expiresAt,
        tokenType: tokenRequest.tokenType,
        scope: tokenRequest.scope,
      };

      await secureTokenStorage.storeTokens(tokens);
      return { success: true, tokens };
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, error: 'Failed to refresh tokens' };
    }
  }

  private async fetchUserInfo(accessToken: string): Promise<UserInfo | null> {
    try {
      const endpoints = getKeycloakEndpoints();
      const response = await fetch(endpoints.userinfo, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return await response.json();
      }
      
      console.error('Failed to fetch user info:', response.status);
      return null;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      // Récupérer les tokens actuels
      const tokens = await secureTokenStorage.getTokens();
      
      // Nettoyer le stockage local
      await secureTokenStorage.clearAll();
      
      // Si on a un refresh token, tenter de faire un logout côté serveur
      if (tokens?.refreshToken && this.discovery) {
        try {
          const endpoints = getKeycloakEndpoints();
          await fetch(endpoints.logout, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: authConfig.clientId,
              refresh_token: tokens.refreshToken,
            }).toString(),
          });
        } catch (error) {
          console.warn('Server logout failed, but local cleanup completed:', error);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getCurrentSession(): Promise<{ tokens: TokenData; userInfo: UserInfo } | null> {
    try {
      const tokens = await secureTokenStorage.getTokens();
      
      if (!tokens) {
        return null;
      }

      // Vérifier si le token est expiré et tenter un refresh
      if (secureTokenStorage.isTokenExpired(tokens.expiresAt)) {
        const refreshResult = await this.refreshTokens(tokens.refreshToken);
        
        if (!refreshResult.success || !refreshResult.tokens) {
          // Si le refresh échoue, nettoyer et retourner null
          await secureTokenStorage.clearAll();
          return null;
        }
        
        // Utiliser les nouveaux tokens
        tokens.accessToken = refreshResult.tokens.accessToken;
        tokens.refreshToken = refreshResult.tokens.refreshToken;
        tokens.expiresAt = refreshResult.tokens.expiresAt;
      }

      const userInfo = await secureTokenStorage.getUserInfo();
      
      if (!userInfo) {
        // Tenter de récupérer les infos utilisateur si elles ne sont pas en cache
        const fetchedUserInfo = await this.fetchUserInfo(tokens.accessToken);
        if (fetchedUserInfo) {
          await secureTokenStorage.storeUserInfo(fetchedUserInfo);
          return { tokens, userInfo: fetchedUserInfo };
        }
        return null;
      }

      return { tokens, userInfo };
    } catch (error) {
      console.error('Error getting current session:', error);
      await secureTokenStorage.clearAll();
      return null;
    }
  }
}

export const keycloakAuth = new KeycloakAuthService();