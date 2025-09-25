# Guide d'implémentation : Authentification Keycloak avec Expo React Native

## Vue d'ensemble

Ce guide détaille l'implémentation de l'authentification Keycloak dans une application Expo React Native avec support web, incluant la persistance sécurisée des tokens et la reconnexion automatique.

## Architecture générale

```mermaid
graph TB
    A[Application Expo] --> B{Plateforme?}
    B -->|Web| C[Redirection Keycloak]
    B -->|Mobile| D[WebView/Popup Keycloak]
    
    C --> E[Callback URL]
    D --> E
    
    E --> F[Extraction du code d'autorisation]
    F --> G[Échange code contre tokens]
    G --> H[Stockage sécurisé des tokens]
    H --> I[State Management]
    
    I --> J[Application authentifiée]
    
    subgraph "Stockage sécurisé"
        K[SecureStore - Mobile]
        L[localStorage sécurisé - Web]
    end
    
    H --> K
    H --> L
```

## Étapes d'implémentation

### 1. Configuration et dépendances

#### Librairies nécessaires

```mermaid
graph LR
    A[expo-auth-session] --> B[Authentification OAuth]
    C[expo-secure-store] --> D[Stockage sécurisé mobile]
    E[expo-crypto] --> F[Génération PKCE]
    G[expo-web-browser] --> H[Navigation web mobile]
    I[expo-constants] --> J[Configuration]
    K[react-native-async-storage/async-storage] --> L[Stockage web]
```

**Commandes d'installation :**

- `npx expo install expo-auth-session expo-secure-store expo-crypto expo-web-browser @react-native-async-storage/async-storage`

#### Configuration Keycloak

```mermaid
graph TD
    A[Variables d'environnement] --> B[EXPO_PUBLIC_KEYCLOAK_URL]
    A --> C[EXPO_PUBLIC_KEYCLOAK_REALM]
    A --> D[EXPO_PUBLIC_KEYCLOAK_CLIENT_ID]
    A --> E[EXPO_PUBLIC_BYPASS_AUTH]
    
    B --> F[Configuration endpoints]
    C --> F
    D --> F
    
    F --> G[Discovery endpoint]
    F --> H[Authorization endpoint]
    F --> I[Token endpoint]
    F --> J[Logout endpoint]
```

### 2. Configuration des redirections

#### Expo Router + Deep Links

```mermaid
sequenceDiagram
    participant App as Application
    participant Config as expo-auth-session
    participant Keycloak as Serveur Keycloak
    
    App->>Config: makeRedirectUri()
    Config->>App: exp://localhost:8081/auth/callback
    App->>Keycloak: Configuration client avec redirect_uri
    Note over App,Keycloak: Redirect URI doit être configuré côté Keycloak
```

**Configuration requise :**

- `app.json/app.config.js` : Configuration du scheme
- Route Expo Router : `app/auth/callback.tsx`
- Configuration Keycloak : Ajout des redirect URIs

### 3. Flux d'authentification

#### Flux PKCE (Proof Key for Code Exchange)

```mermaid
sequenceDiagram
    participant User as Utilisateur
    participant App as Application
    participant Browser as Navigateur/WebView
    participant Keycloak as Keycloak Server
    
    User->>App: Clic "Se connecter"
    App->>App: Génération code_verifier + code_challenge
    App->>Browser: Redirection vers Keycloak
    Note over Browser,Keycloak: Web: Redirection complète<br/>Mobile: WebView popup
    
    Browser->>Keycloak: GET /auth (avec code_challenge)
    Keycloak->>User: Page de connexion
    User->>Keycloak: Saisie credentials
    Keycloak->>Browser: Redirection avec authorization_code
    Browser->>App: Deep link avec code
    App->>Keycloak: POST /token (code + code_verifier)
    Keycloak->>App: access_token + refresh_token
    App->>App: Stockage sécurisé des tokens
```

#### Différences plateforme

```mermaid
graph TB
    A[Démarrage authentification] --> B{Plateforme?}
    
    B -->|Web| C[AuthRequest.promptAsync<br/>useProxy: false]
    B -->|Mobile| D[AuthRequest.promptAsync<br/>useProxy: true]
    
    C --> E[Redirection complète de page]
    D --> F[WebView modal/popup]
    
    E --> G[Callback dans même onglet]
    F --> H[Fermeture popup + callback]
    
    G --> I[Traitement du code]
    H --> I
```

### 4. Gestion sécurisée des tokens

#### Stockage sécurisé multi-plateforme

```mermaid
graph TB
    A[Tokens reçus] --> B{Plateforme?}
    
    B -->|Mobile/iOS/Android| C[Expo SecureStore]
    B -->|Web| D[AsyncStorage chiffré]
    
    C --> E[Keychain iOS/<br/>Keystore Android]
    D --> F[localStorage avec<br/>chiffrement AES]
    
    E --> G[Récupération au démarrage]
    F --> G
    
    G --> H{Token valide?}
    H -->|Oui| I[Restauration session]
    H -->|Non| J[Tentative refresh]
    J -->|Succès| I
    J -->|Échec| K[Redirection login]
```

#### Structure de stockage

```mermaid
graph LR
    A[Token Storage] --> B[access_token]
    A --> C[refresh_token]
    A --> D[expires_at]
    A --> E[token_type]
    A --> F[scope]
    
    B --> G[JWT avec claims utilisateur]
    C --> H[Token de renouvellement]
    D --> I[Timestamp d'expiration]
```

### 5. Gestion du cycle de vie des tokens

#### Auto-refresh et persistance de session

```mermaid
sequenceDiagram
    participant App as Application
    participant Storage as Stockage sécurisé
    participant Timer as Timer/Interceptor
    participant Keycloak as Keycloak
    
    App->>Storage: Récupération tokens au démarrage
    Storage->>App: access_token + refresh_token + expires_at
    
    App->>App: Vérification expiration
    
    alt Token expiré
        App->>Keycloak: POST /token (refresh_token)
        Keycloak->>App: Nouveaux tokens
        App->>Storage: Mise à jour stockage
    end
    
    App->>Timer: Configuration auto-refresh (expires_at - 5min)
    
    loop Pendant utilisation app
        Timer->>App: Notification expiration proche
        App->>Keycloak: Refresh token
        Keycloak->>App: Nouveaux tokens
        App->>Storage: Mise à jour
    end
```

### 6. Architecture des composants

#### Structure des hooks et contexte

```mermaid
graph TB
    A[AuthProvider] --> B[AuthContext]
    B --> C[useAuth hook]
    
    A --> D[TokenManager]
    D --> E[SecureTokenStorage]
    D --> F[TokenRefreshService]
    
    C --> G[Components]
    G --> H[LoginScreen]
    G --> I[ProtectedRoutes]
    G --> J[LogoutButton]
    
    subgraph "Services"
        K[KeycloakService]
        L[AuthInterceptor]
        M[DeepLinkHandler]
    end
    
    D --> K
    C --> L
    A --> M
```

### 7. Gestion des erreurs et edge cases

#### Flux de gestion d'erreurs

```mermaid
graph TB
    A[Tentative authentification] --> B{Succès?}
    
    B -->|Non| C{Type d'erreur?}
    
    C -->|Réseau| D[Retry avec backoff]
    C -->|Credentials invalides| E[Message erreur utilisateur]
    C -->|Token expiré| F[Tentative refresh]
    C -->|Refresh token invalide| G[Déconnexion + redirect login]
    C -->|Keycloak indisponible| H[Mode dégradé/offline]
    
    D --> I{Retry réussi?}
    I -->|Oui| J[Authentification OK]
    I -->|Non| E
    
    F --> K{Refresh réussi?}
    K -->|Oui| J
    K -->|Non| G
```

### 8. Configuration Expo Router

#### Structure des routes protégées

```mermaid
graph TB
    A[app/_layout.tsx] --> B[AuthProvider]
    B --> C{Authentifié?}
    
    C -->|Oui| D[app/tabs/_layout.tsx]
    C -->|Non| E[app/auth/_layout.tsx]
    
    D --> F[Routes protégées]
    E --> G[app/auth/login.tsx]
    E --> H[app/auth/callback.tsx]
    
    F --> I[app/tabs/index.tsx]
    F --> J[app/tabs/profile.tsx]
    
    H --> K[Traitement callback]
    K --> L[Redirection vers app]
```

### 9. Bonnes pratiques de sécurité

#### Checklist de sécurité

```mermaid
graph LR
    A[Sécurité] --> B[PKCE obligatoire]
    A --> C[HTTPS uniquement]
    A --> D[Tokens chiffrés au repos]
    A --> E[Validation JWT côté client]
    A --> F[Logout sécurisé]
    
    B --> G[Protection contre CSRF]
    C --> H[Protection transport]
    D --> I[Protection stockage]
    E --> J[Validation expiration]
    F --> K[Nettoyage tokens]
```

### 10. Configuration de production

#### Variables d'environnement par environnement

```mermaid
graph TB
    A[Environnements] --> B[Development]
    A --> C[Staging]
    A --> D[Production]
    
    B --> E[auth-dev.zenyaa.com]
    C --> F[auth-staging.zenyaa.com]
    D --> G[auth.zenyaa.com]
    
    E --> H[zinya_dev realm]
    F --> I[zinya_staging realm]
    G --> J[zinya_prod realm]
```

## Points d'attention spécifiques

### Web vs Mobile

1. **Web** : Redirection complète, pas de popup
2. **Mobile** : WebView avec retour à l'app via deep link
3. **Stockage** : SecureStore (mobile) vs AsyncStorage chiffré (web)

### Expo Router Integration

1. Configuration des routes de callback
2. Gestion des deep links
3. Protection des routes authentifiées
4. Navigation conditionnelle

### Performance

1. Chargement asynchrone des tokens au démarrage
2. Mise en cache des informations utilisateur
3. Pré-validation des tokens avant requêtes API
4. Optimisation des re-renders avec useMemo/useCallback

## Ressources et documentation

- [Expo AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Keycloak OAuth2 Flow](https://www.keycloak.org/docs/latest/securing_apps/#_oidc)
- [PKCE RFC](https://tools.ietf.org/html/rfc7636)

Ce guide fournit une base solide pour implémenter l'authentification Keycloak avec toutes les exigences spécifiées, en respectant les bonnes pratiques de sécurité et l'expérience utilisateur optimale sur chaque plateforme.
