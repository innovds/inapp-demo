import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../lib/auth/auth.context';
import { keycloakConfig } from '../../lib/auth/keycloak.config';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [loginInProgress, setLoginInProgress] = useState(false);

  const handleLogin = async () => {
    if (keycloakConfig.bypassAuth) {
      Alert.alert('Mode développement', 'Authentification désactivée');
      return;
    }

    try {
      setLoginInProgress(true);
      const result = await login();
      
      if (!result.success) {
        Alert.alert(
          'Erreur de connexion',
          result.error || 'Une erreur est survenue lors de la connexion'
        );
      }
      // Le succès est géré automatiquement par le contexte et la navigation
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Erreur', 'Une erreur inattendue est survenue');
    } finally {
      setLoginInProgress(false);
    }
  };

  const loading = isLoading || loginInProgress;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bienvenue</Text>
        <Text style={styles.subtitle}>
          Connectez-vous pour accéder à votre compte
        </Text>
        
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Se connecter</Text>
          )}
        </TouchableOpacity>
        
        {keycloakConfig.bypassAuth && (
          <Text style={styles.devModeText}>
            Mode développement - Authentification désactivée
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#999',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  devModeText: {
    marginTop: 24,
    fontSize: 14,
    color: '#ff6b35',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});