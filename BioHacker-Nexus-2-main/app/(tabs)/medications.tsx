
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useApp } from '@/contexts/AppContext';
import PremiumModal from '@/components/PremiumModal';
import Toast, { ToastType } from '@/components/Toast';

export default function MedicationsScreen() {
  const { products, doseLogs, canAddProduct, isPremium, deleteProduct } = useApp();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

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
    setProductToDelete({ id: productId, name: productName });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      // Simulate Firebase deletion delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      deleteProduct(productToDelete.id);
      setShowDeleteModal(false);
      setProductToDelete(null);
      
      showToast('Medication deleted.', 'error');
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Deletion failed—try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
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
    setShowPremiumModal(false);
    showToast('Premium activated!', 'success');
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
        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
        />

        <ScrollView style={commonStyles.content} contentContainerStyle={commonStyles.scrollContent}>
          {/* Disclaimer */}
          <View style={styles.disclaimerBanner}>
            <IconSymbol name="exclamationmark.triangle" size={16} color={colors.highlight} />
            <Text style={styles.disclaimerText}>
              Always consult your healthcare provider before starting or modifying any protocol.
            </Text>
          </View>

          {/* Add Product Button */}
          <Pressable 
            style={[
              buttonStyles.highlight, 
              { marginBottom: 24 },
              !canAddProduct() && { opacity: 0.5 }
            ]} 
            onPress={handleAddProduct}
          >
            <View style={styles.buttonContent}>
              <IconSymbol name="plus.circle.fill" size={20} color={colors.text} />
              <Text style={[buttonStyles.buttonText, { marginLeft: 8 }]}>
                {canAddProduct() ? 'Add Product' : 'Add Product (Upgrade Required)'}
              </Text>
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
                Your Products ({products.length}{!isPremium && products.length >= 1 ? '/1 free' : ''})
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
                        {product.daysOfWeek && product.daysOfWeek.length > 0 && (
                          <Text style={commonStyles.cardSubtitle}>
                            Days: {product.daysOfWeek.join(', ')}
                          </Text>
                        )}
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

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.alert} />
                <Text style={styles.modalTitle}>Delete this medication?</Text>
                <Text style={styles.modalMessage}>
                  This removes all logs and inventory for &quot;{productToDelete?.name}&quot;. This action cannot be undone.
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <Pressable
                  style={[buttonStyles.outline, { flex: 1 }]}
                  onPress={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  <Text style={buttonStyles.buttonTextOutline}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[buttonStyles.alert, { flex: 1 }]}
                  onPress={confirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator color={colors.text} />
                  ) : (
                    <Text style={buttonStyles.buttonText}>Delete</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
});
