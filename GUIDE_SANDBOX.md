# 🧪 Guide Configuration Sandbox Apple

## Étapes pour configurer l'environnement Sandbox

### 1. **Créer un compte Sandbox** ✅ (Déjà fait)

- Vous avez créé votre compte Sandbox sur App Store Connect
- Ce compte est séparé de votre compte Apple principal

### 2. **Configurer Sandbox sur l'iPhone**

#### Option A : Réglages → App Store (iOS 12+)

1. Allez dans **Réglages** → **App Store**
2. Cherchez la section **"SANDBOX ACCOUNT"**
3. Connectez-vous avec votre compte Sandbox (pas votre compte principal)

#### Option B : Réglages → iTunes et App Store (iOS antérieur)

1. **Réglages** → **iTunes et App Store**
2. Section **"SANDBOX ACCOUNT"**
3. Connectez-vous avec le compte Sandbox

### 3. **Vérification**

- Votre compte principal reste connecté pour iCloud, etc.
- Seul l'App Store utilise le compte Sandbox pour les achats de test

### 4. **Test des IAP**

- Ouvrez votre app Zinya
- Les achats utiliseront automatiquement l'environnement Sandbox
- Aucune carte de crédit réelle ne sera débitée

## ⚠️ Important

- **NE PAS** se déconnecter du compte Apple principal
- **Sandbox** est une configuration séparée juste pour l'App Store
- Les deux comptes coexistent sans problème

## 🔄 Après les tests

- Vous pouvez vous déconnecter du Sandbox
- Votre compte principal reste intact
- L'app utilisera automatiquement le vrai App Store en production
