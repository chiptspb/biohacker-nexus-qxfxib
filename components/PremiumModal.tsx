import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "./IconSymbol";
import iapService, { SubscriptionProduct } from "@/services/iapService";
import { useApp } from "@/contexts/AppContext";
import Toast, { ToastType } from "@/components/Toast";

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function PremiumModal({
  visible,
  onClose,
  onUpgrade,
}: PremiumModalProps) {
  const { updatePremiumStatus } = useApp();
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">(
    "annual"
  );

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");

  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    if (visible) {
      setSelectedPlan("annual");
      setSelectedProduct(null);
      loadProducts();
      setupListeners();
    }
    return () => {
      iapService.removePurchaseListeners();
    };
  }, [visible]);

  useEffect(() => {
    iapService.setupPurchaseListeners(
      (purchase) => console.log("✅ Purchase success:", purchase),
      (error) => console.log("❌ Purchase error:", error)
    );
    return () => iapService.removePurchaseListeners();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const availableProducts = await iapService.getProducts();
      console.log("Loaded products:", availableProducts);
      setProducts(availableProducts);
    } catch (error) {
      console.error("Error loading products:", error);
      showToast(
        "Failed to load subscription options. Please try again.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const setupListeners = () => {
    iapService.setupPurchaseListeners(
      async (purchase) => {
        console.log("Purchase successful:", purchase);
        setIsPurchasing(false);
        await updatePremiumStatus(true);
        showToast("Premium Unlocked! 🎉", "success");
        setTimeout(() => {
          onUpgrade();
          onClose();
        }, 1200);
      },
      (error) => {
        console.error("Purchase error:", error);
        setIsPurchasing(false);
        if (error.code !== "E_USER_CANCELLED") {
          showToast("Purchase failed. Please try again.", "error");
        }
      }
    );
  };

  const handlePurchase = async (productId: string) => {
    try {
      setIsPurchasing(true);
      setSelectedProduct(productId);
      console.log("Initiating purchase for:", productId);
      const success = await iapService.purchaseSubscription(productId);
      if (!success) {
        setIsPurchasing(false);
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error("Purchase error:", error);
      setIsPurchasing(false);
      setSelectedProduct(null);
      showToast("Purchase failed. Please try again.", "error");
    }
  };

  const getProductByType = (
    type: "monthly" | "annual"
  ): SubscriptionProduct | undefined =>
    products.find((p) => p.productId.endsWith(`premium.${type}`));

  const monthlyProduct = getProductByType("monthly");
  const annualProduct = getProductByType("annual");
  const monthlyPrice =
    monthlyProduct?.localizedPrice || monthlyProduct?.price || "$2.99";
  const annualPrice =
    annualProduct?.localizedPrice || annualProduct?.price || "$24.99";

  const hasProducts = products.length > 0 && (monthlyProduct || annualProduct);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
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

          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            disabled={isPurchasing}
          >
            <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.header}>
            <IconSymbol name="star.fill" size={64} color={colors.highlight} />
            <Text style={styles.title}>Upgrade to Premium</Text>
            <Text style={styles.subtitle}>Unlock unlimited tracking</Text>
          </View>

          <View style={styles.body}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>
                    Loading subscription options...
                  </Text>
                </View>
              ) : !hasProducts ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>
                    Plans are preparing — they’ll appear as soon as Apple
                    finishes syncing.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Plan Toggle */}
                  <View style={styles.planToggle}>
                    <Pressable
                      style={[
                        styles.toggleButton,
                        selectedPlan === "monthly" && styles.toggleButtonActive,
                      ]}
                      onPress={() => setSelectedPlan("monthly")}
                      disabled={isPurchasing}
                    >
                      <Text
                        style={[
                          styles.toggleButtonText,
                          selectedPlan === "monthly" &&
                            styles.toggleButtonTextActive,
                        ]}
                      >
                        Monthly
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.toggleButton,
                        selectedPlan === "annual" && styles.toggleButtonActive,
                      ]}
                      onPress={() => setSelectedPlan("annual")}
                      disabled={isPurchasing}
                    >
                      <View style={styles.savingsBadgeSmall}>
                        <Text style={styles.savingsBadgeSmallText}>
                          Save ~20%
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.toggleButtonText,
                          selectedPlan === "annual" &&
                            styles.toggleButtonTextActive,
                        ]}
                      >
                        Annual
                      </Text>
                    </Pressable>
                  </View>

                  {/* Monthly Plan */}
                  {selectedPlan === "monthly" && monthlyProduct && (
                    <View style={styles.selectedPlanCard}>
                      <Text style={styles.planName}>Monthly Subscription</Text>
                      <Text style={styles.price}>{monthlyPrice}</Text>
                      <Text style={styles.pricePeriod}>per month</Text>

                      {isPurchasing &&
                      selectedProduct === monthlyProduct.productId ? (
                        <View style={styles.purchasingIndicator}>
                          <ActivityIndicator color={colors.primary} />
                          <Text style={styles.purchasingText}>
                            Processing...
                          </Text>
                        </View>
                      ) : (
                        <Pressable
                          style={styles.selectButton}
                          onPress={() =>
                            handlePurchase(monthlyProduct.productId)
                          }
                          disabled={isPurchasing}
                        >
                          <Text style={styles.selectButtonText}>
                            Subscribe Now
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )}

                  {/* Annual Plan */}
                  {selectedPlan === "annual" && annualProduct && (
                    <View
                      style={[styles.selectedPlanCard, styles.recommendedCard]}
                    >
                      <View style={styles.recommendedBadge}>
                        <IconSymbol
                          name="star.fill"
                          size={14}
                          color={colors.text}
                        />
                        <Text style={styles.recommendedText}>BEST VALUE</Text>
                      </View>
                      <Text style={styles.planName}>Annual Subscription</Text>
                      <Text style={styles.price}>{annualPrice}</Text>
                      <Text style={styles.pricePeriod}>per year</Text>

                      {isPurchasing &&
                      selectedProduct === annualProduct.productId ? (
                        <View style={styles.purchasingIndicator}>
                          <ActivityIndicator color={colors.primary} />
                          <Text style={styles.purchasingText}>
                            Processing...
                          </Text>
                        </View>
                      ) : (
                        <Pressable
                          style={styles.selectButton}
                          onPress={() =>
                            handlePurchase(annualProduct.productId)
                          }
                          disabled={isPurchasing}
                        >
                          <Text style={styles.selectButtonText}>
                            Subscribe Now
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>

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
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    maxHeight: "85%",
    overflow: "hidden",
    minHeight: 540,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  header: {
    alignItems: "center",
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
  },
  debug: {
    alignItems: "center",
    paddingBottom: 4,
  },
  debugText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  body: {
    flexGrow: 1,
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: "center",
  },
  planToggle: {
    flexDirection: "row",
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
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  toggleButtonTextActive: {
    color: colors.text,
  },
  savingsBadgeSmall: {
    position: "absolute",
    top: -8,
    right: 8,
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  savingsBadgeSmallText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text,
  },
  selectedPlanCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 16,
  },
  recommendedCard: {
    borderColor: colors.primary,
    position: "relative",
  },
  recommendedBadge: {
    position: "absolute",
    top: -12,
    left: "50%",
    transform: [{ translateX: -60 }],
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
  },
  planName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
  },
  pricePeriod: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  selectButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  purchasingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  purchasingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  laterText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
