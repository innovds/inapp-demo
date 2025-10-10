# IAP Adapter - Solution simple et efficace pour expo-iap sur web

## Problème résolu

L'import direct d'`expo-iap` provoque une erreur sur le web :

```
Uncaught Error: Cannot find native module 'ExpoIap'
```

## Solution : Méthode require() + try/catch

### Pourquoi cette méthode est la meilleure ?

#### ✅ **Méthode simple (recommandée) :**

```tsx
export const useIAPAdapter = (config: IAPAdapterConfig = {}): IAPHookResult => {
  try {
    return require('expo-iap').useIAP(config);
  } catch {
    return createMockIAPHook(config);
  }
};
```

#### ❌ **Méthode complexe (ne marche pas) :**

```tsx
export const useIAPAdapter = (config: IAPAdapterConfig = {}): IAPHookResult => {
  const [module, setModule] = useState(null);
  
  if (module) {
    return module.useIAP(config); // ❌ Hook conditionnel = erreur React!
  }
  return mockHook(config);
};
```

### Avantages de require() vs import() dynamique

1. **🔒 Respect des Rules of Hooks** : Pas d'appels conditionnels de hooks
2. **⚡ Synchrone** : Pas d'attente async, résolution immédiate
3. **🎯 Simple** : Moins de code = moins de bugs
4. **📦 Bundler-friendly** : Metro/Webpack gèrent mieux `require()` avec try/catch
5. **🛡️ Fiable** : Fonctionne sur toutes les plateformes sans edge cases

## Comment ça marche

### Sur les plateformes natives (iOS/Android)

```tsx
// ✅ require('expo-iap') réussit
return require('expo-iap').useIAP(config); // Hook natif
```

### Sur le web

```tsx
// ❌ require('expo-iap') échoue
catch {
  return createMockIAPHook(config); // Hook mock compatible
}
```

## Architecture finale

```
iap-adapter.ts
├── useIAPAdapter()           // Hook principal avec require() + try/catch
├── requestPurchaseAdapter()  // Fonction avec require() + try/catch  
├── showManageSubscriptionsIOSAdapter() // Fonction avec require() + try/catch
└── createMockIAPHook()       // Mock qui respecte l'interface hook
```

### 2. Adaptateurs de Types (`type-adapters.ts`)

Convertit les types entre l'adapter et expo-iap :

- ✅ Conversion automatique Purchase ↔ IAPPurchase  
- ✅ Conversion automatique ProductSubscription ↔ IAPProduct
- ✅ Type guards pour la sécurité des types

### 3. Utilisation dans votre code

**Avant :**

```tsx
import { useIAP, requestPurchase, showManageSubscriptionsIOS } from 'expo-iap';

// ❌ Erreur sur web
const { connected, subscriptions } = useIAP({...});
```

**Après :**

```tsx
import { 
  useIAPAdapter, 
  requestPurchaseAdapter, 
  showManageSubscriptionsIOSAdapter 
} from './iap-adapter';
import { adaptPurchase, adaptSubscription } from './type-adapters';

// ✅ Fonctionne sur web ET natif
const { connected, subscriptions } = useIAPAdapter({...});
```

## Fonctionnalités

### Sur les plateformes natives (iOS/Android)

- Import et utilisation normale d'expo-iap
- Toutes les fonctionnalités IAP disponibles
- Types originaux préservés

### Sur le web

- Mocks automatiques pour toutes les fonctions IAP
- Messages de debug dans la console
- Aucune erreur de module manquant
- Développement fluide avec Expo Go

## Intégration dans un projet existant

1. **Copier les fichiers :**
   - `iap-adapter.ts`
   - `type-adapters.ts`

2. **Remplacer les imports :**

   ```tsx
   // Remplacer ceci :
   import { useIAP, requestPurchase, showManageSubscriptionsIOS } from 'expo-iap';
   
   // Par ceci :
   import { 
     useIAPAdapter, 
     requestPurchaseAdapter, 
     showManageSubscriptionsIOSAdapter 
   } from './iap-adapter';
   ```

3. **Utiliser les adaptateurs de types :**

   ```tsx
   // Quand vous passez des données aux fonctions expo-iap
   setLastPurchase(adaptPurchase(purchase));
   getSubscriptionDisplayPrice(adaptSubscription(subscription));
   ```

## Avantages

- 🚀 **Développement rapide :** Plus de blocage sur web
- 🔄 **Zéro changement fonctionnel :** API identique à expo-iap  
- 🎯 **TypeScript safe :** Types préservés et convertis automatiquement
- 📱 **Multi-plateforme :** Web, iOS, Android sans compromis
- 🛠️ **Expo Go friendly :** Développement fluide en mode développement

## Test

Utilisez `IAPAdapterTest.tsx` pour vérifier que l'adapter fonctionne :

```tsx
import IAPAdapterTest from './components/subscription/iap-adapter-test';

// Intégrez dans votre navigation pour tester
```

## Notes techniques

- L'adapter utilise `Platform.OS` pour détecter la plateforme
- Les imports dynamiques évitent les erreurs de bundling web  
- Les hooks restent conformes aux règles React (pas d'appels conditionnels)
- Les mocks reproduisent fidèlement l'API d'expo-iap

---

# Simple Subscription Manager

Un composant React Native simple pour gérer les abonnements avec intégration backend.

## Fonctionnalités

- ✅ Chargement des produits depuis votre backend
- ✅ Interface utilisateur moderne et responsive
- ✅ Gestion des achats iOS/Android
- ✅ Validation côté backend
- ✅ Gestion des abonnements actifs
- ✅ Annulation d'abonnements
- ✅ Support multi-plateforme
- ✅ Mocks pour le développement

## Utilisation

```tsx
import SimpleSubscriptionManager from '@/components/subscription/simple-subscription-manager';

export default function SubscriptionScreen() {
  const handleSubscriptionChanged = (subscription) => {
    console.log('Subscription changed:', subscription);
    // Gérer les changements d'abonnement
  };

  return (
    <SimpleSubscriptionManager 
      userId="user_123456" // Optionnel, utilise le mock par défaut
      onSubscriptionChanged={handleSubscriptionChanged}
    />
  );
}
```

## Intégration Backend

Le composant est conçu pour s'intégrer avec votre backend Spring Boot. Voir [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) pour les détails complets.

### APIs requises

1. `GET /api/products/subscriptions` - Liste des produits
2. `GET /api/users/{userId}/subscription` - Abonnement actif
3. `POST /api/subscriptions/webhook/purchase` - Validation d'achat
4. `POST /api/subscriptions/{id}/cancel` - Annulation

### Données transmises au backend lors d'un achat

```json
{
  "userId": "user_123456",
  "productId": "premium_monthly_backend", 
  "platform": "ios",
  "originalTransactionId": "1000000123456789",
  "purchaseToken": "encrypted_token",
  "transactionDate": 1641024000000,
  "storeProductId": "com.zinya.sub.premium_monthly"
}
```

## Configuration des produits

Les produits sont configurés côté backend avec mapping vers les IDs des stores :

```json
{
  "id": "premium_monthly_backend",
  "name": "Premium Monthly", 
  "price": 9.99,
  "currency": "USD",
  "period": "monthly",
  "storeProductId": "com.zinya.sub.premium_monthly",
  "features": ["Feature 1", "Feature 2"]
}
```

## Développement

Le composant inclut des mocks pour faciliter le développement sans backend :

- Produits mockés dans `MOCK_BACKEND_PRODUCTS`
- Utilisateur mocké dans `MOCK_USER`
- Simulation des appels API avec délais

## Flow d'abonnement

1. **Chargement** : Récupération des produits depuis le backend
2. **Affichage** : Interface avec plans et prix
3. **Achat** : Déclenchement du processus d'achat natif
4. **Validation** : Envoi au backend pour validation et activation
5. **Confirmation** : Finalisation de la transaction et mise à jour UI

## Gestion des erreurs

- Validation des receipts échouée
- Problèmes de réseau
- Abonnements déjà actifs
- Erreurs de store

## Sécurité

- ✅ Validation côté serveur obligatoire
- ✅ Tokens sensibles masqués dans les logs
- ✅ Prévention des doublons d'achat
- ✅ Finalisation appropriée des transactions
