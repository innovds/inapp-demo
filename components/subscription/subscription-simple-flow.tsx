import { useIAP } from 'expo-iap';
import React, { useEffect } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SUBSCRIPTION_PRODUCT_IDS } from './constants';

export function SimpleStore() {
  const {
    connected,
    products,
    fetchProducts,
    requestPurchase,
  } = useIAP();

  useEffect(() => {
    if (connected) {
      fetchProducts({ skus: SUBSCRIPTION_PRODUCT_IDS, type: 'all' });
    }
  }, [connected, fetchProducts]);

  const handlePurchase = async (productId: string) => {
    try {
      await requestPurchase({
        request: {
          ios: {
            sku: productId,
          },
          android: {
            skus: [productId],
          },
        },
        type: 'subs'
      });
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Simple Store</Text>
        <Text style={styles.status}>
          Store: {connected ? 'Connected ✅' : 'Connecting...'}
        </Text>

        {products.map((product) => (
          <View key={product.id} style={styles.product}>
            <Text style={styles.title}>{product.title}</Text>
            <Text style={styles.price}>{product.displayPrice}</Text>
            <Button title="Buy Now" onPress={() => handlePurchase(product.id)} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  status: { fontSize: 16, marginBottom: 20 },
  product: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  price: { fontSize: 14, color: '#666', marginVertical: 5 },
});