
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';
import iapService, { SubscriptionProduct } from '@/services/iapService';
import { useApp } from '@/contexts/AppContext';
import Toast, { ToastType } from '@/components/Toast';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function PremiumModal({ visible, onClose, onUpgrade }: PremiumModalProps) {
  const { updatePremiumStatus } = useApp();
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    if (visible) {
      loadProducts();
      setupListeners();
    }

    return () => {
      iapService.removePurchaseListeners();
    };
  }, [visible]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const availableProducts = await iapService.getProducts();
      console.log('Loaded products:', availableProducts);
      setProducts(availableProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      showToast('Failed to load subscription options. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const setupListeners = () => {
    iapService.setupPurchaseListeners(
      async (purchase) => {
        console.log('Purchase successful:', purchase);
        setIsPurchasing(false);
        
        // Update premium status
        await updatePremiumStatus(true);
        
        // Show success toast
        showToast('Premium Unlocked! 🎉', 'success');
        
        // Close modal and trigger upgrade callback after short delay
        setTimeout(() => {
          onUpgrade();
          onClose();
        }, 1500);
      },
      (error) => {
        console.error('Purchase error:', error);
        setIsPurchasing(false);
        
        if (error.code !== 'E_USER_CANCELLED') {
          showToast('Purchase failed. Please try again.', 'error');
        }
      }
    );
  };

  const handlePurchase = async (productId: string) => {
    try {
      setIsPurchasing(true);
      setSelectedProduct(productId);
      console.log('Initiating purchase for:', productId);
      
      const success = await iapService.purchaseSubscription(productId);
      
      if (!success) {
        // User cancelled
        setIsPurchasing(false);
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setIsPurchasing(false);
      setSelectedProduct(null);
      showToast('Purchase failed. Please try again.', 'error');
    }
  };

  const getProductByType = (type: 'monthly' | 'annual'): SubscriptionProduct | undefined => {
    return products.find(p => p.productId.includes(type));
  };

  const monthlyProduct = getProductByType('monthly');
  const annualProduct = getProductByType('annual');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Toast
            visible={toastVisible}
            message={toastMessage}
            type={toastType}
            onHide={() => setToastVisible(false)}
          />

          <Pressable style={styles.closeButton} onPress={onClose} disabled={isPurchasing}>
            <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.header}>
            <IconSymbol name="star.fill" size={64} color={colors.highlight} />
            <Text style={styles.title}>Upgrade to Premium</Text>
            <Text style={styles.subtitle}>Unlock unlimited tracking</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.limitBanner}>
              <IconSymbol name="exclamationmark.circle.fill" size={20} color={colors.highlight} />
              <Text style={styles.limitText}>
                Free plan limited to 1 product—upgrade for unlimited.
              </Text>
            </View>

            <View style={styles.feature}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
              <Text style={styles.featureText}>Unlimited products & protocols</Text>
            </View>

            <View style={styles.feature}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
              <Text style={styles.featureText}>Advanced inventory tracking</Text>
            </View>

            <View style={styles.feature}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
              <Text style={styles.featureText}>Dose calendar & reminders</Text>
            </View>

            <View style={styles.feature}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
              <Text style={styles.featureText}>Export reports (PDF/CSV)</Text>
            </View>

            <View style={styles.feature}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
              <Text style={styles.featureText}>Priority support</Text>
            </View>

            {/* Subscription Options */}
            <View style={styles.subscriptionSection}>
              <Text style={styles.subscriptionTitle}>Choose Your Plan</Text>
              
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading subscription options...</Text>
                </View>
              ) : (
                <>
                  {/* Plan Toggle */}
                  <View style={styles.planToggle}>
                    <Pressable
                      style={[
                        styles.toggleButton,
                        selectedPlan === 'monthly' && styles.toggleButtonActive,
                      ]}
                      onPress={() => setSelectedPlan('monthly')}
                      disabled={isPurchasing}
                    >
                      <Text
                        style={[
                          styles.toggleButtonText,
                          selectedPlan === 'monthly' && styles.toggleButtonTextActive,
                        ]}
                      >
                        Monthly
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.toggleButton,
                        selectedPlan === 'annual' && styles.toggleButtonActive,
                      ]}
                      onPress={() => setSelectedPlan('annual')}
                      disabled={isPurchasing}
                    >
                      <View style={styles.savingsBadgeSmall}>
                        <Text style={styles.savingsBadgeSmallText}>Save ~20%</Text>
                      </View>
                      <Text
                        style={[
                          styles.toggleButtonText,
                          selectedPlan === 'annual' && styles.toggleButtonTextActive,
                        ]}
                      >
                        Annual
                      </Text>
                    </Pressable>
                  </View>

                  {/* Selected Plan Card */}
                  {selectedPlan === 'monthly' && monthlyProduct && (
                    <View style={styles.selectedPlanCard}>
                      <View style={styles.planHeader}>
                        <Text style={styles.planName}>Monthly Subscription</Text>
                      </View>
                      
                      <View style={styles.priceContainer}>
                        <Text style={styles.price}>$2.99</Text>
                        <Text style={styles.pricePeriod}>per month</Text>
                      </View>
                      
                      <Text style={styles.billingInfo}>Billed monthly</Text>
                      
                      {isPurchasing && selectedProduct === monthlyProduct.productId ? (
                        <View style={styles.purchasingIndicator}>
                          <ActivityIndicator color={colors.primary} />
                          <Text style={styles.purchasingText}>Processing...</Text>
                        </View>
                      ) : (
                        <Pressable
                          style={styles.selectButton}
                          onPress={() => handlePurchase(monthlyProduct.productId)}
                          disabled={isPurchasing}
                        >
                          <Text style={styles.selectButtonText}>Subscribe Now</Text>
                        </Pressable>
                      )}
                    </View>
                  )}

                  {selectedPlan === 'annual' && annualProduct && (
                    <View style={[styles.selectedPlanCard, styles.recommendedCard]}>
                      <View style={styles.recommendedBadge}>
                        <IconSymbol name="star.fill" size={14} color={colors.text} />
                        <Text style={styles.recommendedText}>BEST VALUE</Text>
                      </View>
                      
                      <View style={styles.planHeader}>
                        <Text style={styles.planName}>Annual Subscription</Text>
                      </View>
                      
                      <View style={styles.priceContainer}>
                        <Text style={styles.price}>$24.99</Text>
                        <Text style={styles.pricePeriod}>per year</Text>
                      </View>
                      
                      <Text style={styles.billingInfo}>Billed annually, save ~20%</Text>
                      
                      {isPurchasing && selectedProduct === annualProduct.productId ? (
                        <View style={styles.purchasingIndicator}>
                          <ActivityIndicator color={colors.primary} />
                          <Text style={styles.purchasingText}>Processing...</Text>
                        </View>
                      ) : (
                        <Pressable
                          style={styles.selectButton}
                          onPress={() => handlePurchase(annualProduct.productId)}
                          disabled={isPurchasing}
                        >
                          <Text style={styles.selectButtonText}>Subscribe Now</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>

            <Text style={styles.disclaimer}>
              • Cancel anytime{'\n'}
              • Subscriptions auto-renew unless cancelled{'\n'}
              • Your data stays private and secure{'\n'}
              • Sandbox testing enabled for TestFlight
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable 
              style={styles.laterButton} 
              onPress={onClose}
              disabled={isPurchasing}
            >
              <Text style={styles.laterText}>Maybe Later</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: colors.highlight,
  },
  limitText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  subscriptionSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  planToggle: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleButtonTextActive: {
    color: colors.text,
  },
  savingsBadgeSmall: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  savingsBadgeSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  selectedPlanCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.border,
  },
  recommendedCard: {
    borderColor: colors.primary,
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  planHeader: {
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 8,
  },
  pricePeriod: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  billingInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  selectButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  purchasingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  purchasingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'left',
    lineHeight: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  laterText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
