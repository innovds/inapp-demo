# Simple Subscription Manager - Documentation Backend

## Vue d'ensemble

Ce composant `SimpleSubscriptionManager` est conçu pour s'intégrer facilement avec votre backend Spring Boot pour gérer les abonnements. Il utilise un système de produits unifié où votre backend gère les IDs de produits et les mappe aux IDs des stores (Apple/Google).

## Architecture

### Frontend (React Native)

1. **Chargement des produits** : Le composant charge la liste des produits depuis votre API backend
2. **Achat** : Utilise les APIs native des stores (iOS/Android) pour traiter les paiements
3. **Validation** : Envoie les données d'achat au backend pour validation et activation
4. **Synchronisation** : Maintient l'état des abonnements en sync avec le backend

### Structure des données

#### Produit Backend
```typescript
interface BackendProduct {
  id: string;              // ID unique backend (ex: "premium_monthly_backend")
  name: string;            // Nom affiché à l'utilisateur
  description: string;     // Description du plan
  price: number;           // Prix en devise principale
  currency: string;        // Code devise (USD, EUR, etc.)
  period: 'monthly' | 'yearly';
  storeProductId: string;  // ID du store (ex: "com.zinya.sub.premium_monthly")
  features: string[];      // Liste des fonctionnalités
  isPopular?: boolean;     // Badge "populaire"
}
```

#### Abonnement Actif
```typescript
interface ActiveSubscription {
  id: string;                    // ID unique backend de l'abonnement
  userId: string;                // ID de l'utilisateur
  productId: string;             // ID du produit backend
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: string;             // Date de début (ISO string)
  endDate: string;               // Date d'expiration (ISO string)
  autoRenew: boolean;            // Renouvellement automatique activé
  originalTransactionId?: string; // ID transaction store pour tracking
  platform: 'ios' | 'android';  // Plateforme d'achat
}
```

## APIs Backend à implémenter

### 1. Récupérer les produits d'abonnement
```http
GET /api/products/subscriptions
Authorization: Bearer {token}

Response:
{
  "products": [
    {
      "id": "premium_monthly_backend",
      "name": "Premium Monthly",
      "description": "Access to all premium features",
      "price": 9.99,
      "currency": "USD",
      "period": "monthly",
      "storeProductId": "com.zinya.sub.premium_monthly",
      "features": ["Ad-free experience", "Premium support", "Advanced analytics"],
      "isPopular": false
    }
  ]
}
```

### 2. Récupérer l'abonnement actif de l'utilisateur
```http
GET /api/users/{userId}/subscription
Authorization: Bearer {token}

Response:
{
  "subscription": {
    "id": "sub_123456",
    "userId": "user_123456", 
    "productId": "premium_monthly_backend",
    "status": "active",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-02-01T00:00:00Z",
    "autoRenew": true,
    "originalTransactionId": "1000000123456789",
    "platform": "ios"
  }
}
```

### 3. Webhook d'achat (appelé par le frontend après achat)
```http
POST /api/subscriptions/webhook/purchase
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "userId": "user_123456",
  "productId": "premium_monthly_backend",
  "platform": "ios",
  "originalTransactionId": "1000000123456789",
  "purchaseToken": "encrypted_purchase_token",
  "transactionDate": 1641024000000,
  "storeProductId": "com.zinya.sub.premium_monthly"
}

Response:
{
  "success": true,
  "subscription": {
    "id": "sub_123456",
    "userId": "user_123456",
    "productId": "premium_monthly_backend", 
    "status": "active",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-02-01T00:00:00Z",
    "autoRenew": true,
    "originalTransactionId": "1000000123456789",
    "platform": "ios"
  }
}
```

### 4. Annuler un abonnement
```http
POST /api/subscriptions/{subscriptionId}/cancel
Authorization: Bearer {token}

Response:
{
  "success": true,
  "subscription": {
    "id": "sub_123456",
    "userId": "user_123456",
    "productId": "premium_monthly_backend",
    "status": "cancelled",
    "startDate": "2024-01-01T00:00:00Z", 
    "endDate": "2024-02-01T00:00:00Z",
    "autoRenew": false,
    "originalTransactionId": "1000000123456789",
    "platform": "ios"
  }
}
```

## Webhooks Store (Apple/Google vers votre backend)

### Configuration requise

Pour recevoir les webhooks des stores et traiter automatiquement les événements d'abonnement, vous devez configurer :

#### Apple App Store Server Notifications
- URL de notification : `https://yourdomain.com/api/webhooks/apple`
- Authentification : JWT avec votre clé privée Apple

#### Google Play Developer Notifications  
- URL de notification : `https://yourdomain.com/api/webhooks/google`
- Authentification : Service account Google

### Endpoint webhook unifié
```http
POST /api/webhooks/store
Content-Type: application/json

Body (exemple Apple):
{
  "signedPayload": "eyJ...", // JWT signé par Apple
  "notificationType": "SUBSCRIBED",
  "data": {
    "environment": "Production",
    "bundleId": "com.yourapp.bundle",
    "transactionInfo": {
      "originalTransactionId": "1000000123456789",
      "transactionId": "1000000123456790", 
      "productId": "com.zinya.sub.premium_monthly",
      "purchaseDate": 1641024000000,
      "expiresDate": 1643702400000
    }
  }
}
```

### Types d'événements à gérer

#### Apple Store Events
- `SUBSCRIBED` : Nouvel abonnement activé
- `DID_RENEW` : Abonnement renouvelé avec succès  
- `DID_FAIL_TO_RENEW` : Échec du renouvellement
- `DID_CHANGE_RENEWAL_STATUS` : Changement statut auto-renouvellement
- `EXPIRED` : Abonnement expiré

#### Google Play Events
- `SUBSCRIPTION_PURCHASED` : Abonnement acheté
- `SUBSCRIPTION_RENEWED` : Abonnement renouvelé
- `SUBSCRIPTION_CANCELED` : Abonnement annulé
- `SUBSCRIPTION_EXPIRED` : Abonnement expiré
- `SUBSCRIPTION_REVOKED` : Abonnement révoqué

## Logique métier à implémenter

### 1. Validation des achats
```java
@Service
public class SubscriptionService {
    
    public SubscriptionResult validateAndActivate(PurchaseRequest request) {
        // 1. Valider le receipt avec le store
        if (!validateWithStore(request.getPurchaseToken(), request.getPlatform())) {
            throw new InvalidPurchaseException("Receipt validation failed");
        }
        
        // 2. Vérifier que l'utilisateur n'a pas déjà cet abonnement
        if (hasActiveSubscription(request.getUserId(), request.getProductId())) {
            throw new DuplicateSubscriptionException("User already has active subscription");
        }
        
        // 3. Créer l'abonnement
        Subscription subscription = createSubscription(request);
        
        // 4. Activer les fonctionnalités pour l'utilisateur
        activateFeatures(request.getUserId(), request.getProductId());
        
        // 5. Créer la charge du premier achat
        createInitialCharge(subscription, request);
        
        return new SubscriptionResult(subscription);
    }
}
```

### 2. Gestion des renouvellements
```java
@EventListener
public void handleRenewal(SubscriptionRenewalEvent event) {
    // 1. Valider le renouvellement avec le store
    if (!validateRenewal(event)) {
        handleFailedRenewal(event);
        return;
    }
    
    // 2. Prolonger la période d'abonnement
    extendSubscription(event.getSubscriptionId(), event.getNewExpiryDate());
    
    // 3. Créer la charge de renouvellement
    createRenewalCharge(event);
    
    // 4. Notifier l'utilisateur si nécessaire
    notifySuccessfulRenewal(event.getUserId());
}
```

### 3. Gestion des annulations
```java
public void cancelSubscription(String subscriptionId, boolean immediate) {
    Subscription subscription = findSubscription(subscriptionId);
    
    if (immediate) {
        // Annulation immédiate
        subscription.setStatus(SubscriptionStatus.CANCELLED);
        subscription.setEndDate(Instant.now());
        deactivateFeatures(subscription.getUserId());
    } else {
        // Annulation en fin de période
        subscription.setAutoRenew(false);
        subscription.setStatus(SubscriptionStatus.CANCELLED);
        // Les fonctionnalités restent actives jusqu'à endDate
    }
    
    subscriptionRepository.save(subscription);
}
```

## Sécurité et bonnes pratiques

### 1. Validation des receipts
- **Toujours** valider les receipts côté serveur
- Utiliser les APIs officielles Apple/Google
- Gérer la latence et les timeouts
- Implémenter un cache pour éviter les validations redondantes

### 2. Gestion des doublons
- Utiliser `originalTransactionId` comme clé unique
- Implémenter l'idempotence dans vos webhooks
- Gérer les retries automatiques

### 3. Logging et monitoring
- Logger tous les événements d'abonnement
- Monitorer les taux d'échec de validation
- Alertes sur les anomalies (pics d'annulations, échecs de renouvellement)

### 4. Gestion des erreurs
- Retry automatique pour les erreurs transitoires
- Dead letter queue pour les événements non traités
- Notifications admin pour les erreurs critiques

## Tests

### Tests unitaires frontend
Le composant inclut des mocks pour faciliter les tests sans avoir besoin des vraies APIs des stores.

### Tests d'intégration backend
- Simuler les webhooks des stores
- Tester la validation des receipts
- Vérifier la cohérence des données d'abonnement

## Configuration des environnements

### Développement
- Utiliser les sandbox des stores (iOS Sandbox, Google Play Console Testing)
- Produits de test configurés dans les stores
- Webhooks pointant vers ngrok ou environnement de dev

### Production  
- Certificats et clés de production configurés
- Webhooks pointant vers votre domaine HTTPS
- Monitoring et alertes activés

## Migration des données

Si vous avez des abonnements existants, planifiez la migration :
1. Mapper les anciens IDs vers les nouveaux
2. Migrer les statuts d'abonnement
3. Synchroniser avec les stores
4. Valider la cohérence post-migration