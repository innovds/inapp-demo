import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../lib/auth/auth.context';

export default function AuthCallback() {
  const router = useRouter();
  const { checkAuthState } = useAuth();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Vérifier l'état d'authentification après le callback
        await checkAuthState();
        
        // Si il y a un code d'erreur dans les paramètres
        if (params.error) {
          console.error('Auth callback error:', params.error);
          router.replace('/auth/login' as any);
          return;
        }

        // Rediriger vers l'application principale
        router.replace('/(tabs)');
      } catch (error) {
        console.error('Callback handling error:', error);
        router.replace('/auth/login' as any);
      }
    };

    handleCallback();
  }, [params, checkAuthState, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Finalisation de la connexion...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
});