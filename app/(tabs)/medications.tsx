
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useApp } from '@/contexts/AppContext';
import PremiumModal from '@/components/PremiumModal';

export default function MedicationsScreen() {
  const { products, doseLogs, canAddProduct, isPremium, deleteProduct } = useApp();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const handleAddProduct = () => {
    if (!canAddProduct()) {
      setShowPremiumModal(true);
      return;
    }
    router.push('/(tabs)/add-product');
  };

  const handleViewProduct = (productId: string) => {
    router.push({
      pathname: '/(tabs)/product-details',
      params: { productId },
    });
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${productName}"? This will also delete all associated logs and inventory.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProduct(productId);
            Alert.alert('Deleted', 'Product deleted successfully.');
          },
        },
      ]
    );
  };

  const getProductStats = (productId: string) => {
    const logs = doseLogs.filter(log => log.productId === productId);
    const lastLog = logs.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    
    return {
      totalLogs: logs.length,
      lastDose: lastLog ? new Date(lastLog.date).toLocaleDateString() : 'Never',
    };
  };

  const handleUpgradePremium = () => {
    Alert.alert(
      'Premium Upgrade',
      'In-app purchases will be available in the production version.',
      [{ text: 'OK' }]
    );
    setShowPremiumModal(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Medications',
          headerShown: true,
        }}
      />
      <View style={commonStyles.container}>
        <ScrollView style={commonStyles.content} contentContainerStyle={commonStyles.scrollContent}>
          {/* Disclaimer */}
          <View style={styles.disclaimerBanner}>
            <IconSymbol name="exclamationmark.triangle" size={16} color={colors.highlight} />
            <Text style={styles.disclaimerText}>
              Always consult your healthcare provider before starting or modifying any protocol.
            </Text>
          </View>

          {/* Add Product Button */}
          <Pressable style={[buttonStyles.highlight, { marginBottom: 24 }]} onPress={handleAddProduct}>
            <View style={styles.buttonContent}>
              <IconSymbol name="plus.circle.fill" size={20} color={colors.text} />
              <Text style={[buttonStyles.buttonText, { marginLeft: 8 }]}>Add Product</Text>
            </View>
          </Pressable>

          {/* Products List */}
          {products.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="pills" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>No Products Yet</Text>
              <Text style={styles.emptyStateText}>
                Add your first product to start tracking your biohacking protocols.
              </Text>
            </View>
          ) : (
            <View style={commonStyles.section}>
              <Text style={commonStyles.sectionTitle}>
                Your Products ({products.length}{!isPremium && '/2'})
              </Text>
              {products.map(product => {
                const stats = getProductStats(product.id);
                return (
                  <Pressable
                    key={product.id}
                    style={commonStyles.card}
                    onPress={() => handleViewProduct(product.id)}
                  >
                    <View style={commonStyles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={commonStyles.cardTitle}>{product.name}</Text>
                        <Text style={commonStyles.cardSubtitle}>
                          {product.doseMg}mg • {product.route} • {product.frequency}
                        </Text>
                      </View>
                      <Pressable
                        style={styles.deleteButton}
                        onPress={() => handleDeleteProduct(product.id, product.name)}
                      >
                        <IconSymbol name="trash" size={20} color={colors.alert} />
                      </Pressable>
                    </View>
                    
                    <View style={styles.statsRow}>
                      <View style={styles.stat}>
                        <Text style={styles.statValue}>{stats.totalLogs}</Text>
                        <Text style={styles.statLabel}>Total Doses</Text>
                      </View>
                      <View style={styles.stat}>
                        <Text style={styles.statValue}>{stats.lastDose}</Text>
                        <Text style={styles.statLabel}>Last Dose</Text>
                      </View>
                    </View>

                    {product.notes && (
                      <View style={styles.notesContainer}>
                        <Text style={styles.notesLabel}>Notes:</Text>
                        <Text style={styles.notesText} numberOfLines={2}>
                          {product.notes}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>

        <PremiumModal
          visible={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          onUpgrade={handleUpgradePremium}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.highlight,
  },
  disclaimerText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  deleteButton: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 24,
  },
  stat: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});
