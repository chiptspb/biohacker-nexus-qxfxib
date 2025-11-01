/* eslint-disable @typescript-eslint/no-explicit-any */
import { Platform } from "react-native";
import {
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getAvailablePurchases,
  endConnection,
} from "react-native-iap";

// Use require for the working purchase() you already have
const IAP: any = require("react-native-iap");

export interface SubscriptionProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  localizedPrice: string;
  currency: string;
  subscriptionPeriod?: string;
}

const SUBSCRIPTION_SKUS: string[] =
  Platform.OS === "ios" || Platform.OS === "android"
    ? [
        "com.chiptspb.biohackernexus.premium.monthly",
        "com.chiptspb.biohackernexus.premium.annual",
      ]
    : [];

class IAPService {
  private isInitialized = false;
  private purchaseUpdateSub: any = null;
  private purchaseErrorSub: any = null;

  // ---------- helpers ----------
  private async safeClearPlatformQueues() {
    if (Platform.OS === "ios") {
      if (typeof IAP.clearTransactionsIOS === "function") {
        await IAP.clearTransactionsIOS();
        console.log("🧹 Cleared pending iOS transactions");
      }
    } else {
      if (
        typeof IAP.flushFailedPurchasesCachedAsPendingAndroid === "function"
      ) {
        await IAP.flushFailedPurchasesCachedAsPendingAndroid();
        console.log("🧹 Flushed failed Android purchases");
      }
    }
  }

  private normalizeProducts(products: any[]): SubscriptionProduct[] {
    return (products || []).map((p: any) => ({
      productId: p.productId ?? p.sku ?? "",
      title: p.title ?? "Premium Subscription",
      description: p.description ?? "Unlock premium features",
      price: p.price ?? p.localizedPrice ?? "$0.00",
      localizedPrice: p.localizedPrice ?? p.price ?? "$0.00",
      currency: p.currency ?? p.priceCurrencyCode ?? "USD",
      subscriptionPeriod:
        p.subscriptionPeriodUnitIOS ??
        p.subscriptionPeriodAndroid ??
        p.subscriptionPeriod ??
        undefined,
    }));
  }

  private async fetchSubscriptions(skus: string[]) {
    try {
      const res = await IAP.getSubscriptions({ skus });
      if (Array.isArray(res)) return this.normalizeProducts(res);
    } catch (_) {
      try {
        const res = await IAP.getProducts(skus);
        if (Array.isArray(res)) return this.normalizeProducts(res);
      } catch {}
    }
    return [];
  }

  // ---------- public API ----------
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      console.log("🚀 Initializing IAP...");
      const ok = await IAP.initConnection?.();
      console.log("✅ IAP connection initialized:", ok);
      this.isInitialized = true;
      await this.safeClearPlatformQueues();
    } catch (e) {
      console.error("❌ Error initializing IAP:", e);
      throw e;
    }
  }

  async getProducts(): Promise<SubscriptionProduct[]> {
    try {
      if (!this.isInitialized) await this.initialize();

      console.log("📦 Fetching subscription products:", SUBSCRIPTION_SKUS);
      const products = await this.fetchSubscriptions(SUBSCRIPTION_SKUS);
      console.log("✅ Fetched products from store:", products.length);

      if (products.length > 0) return products;

      return [
        {
          productId: "com.chiptspb.biohackernexus.premium.monthly",
          title: "Premium Monthly",
          description: "Unlimited medications and features",
          price: "$2.99",
          localizedPrice: "$2.99",
          currency: "USD",
          subscriptionPeriod: "MONTH",
        },
        {
          productId: "com.chiptspb.biohackernexus.premium.annual",
          title: "Premium Annual",
          description: "Unlimited medications and features - Best value",
          price: "$24.99",
          localizedPrice: "$24.99",
          currency: "USD",
          subscriptionPeriod: "YEAR",
        },
      ];
    } catch (e) {
      console.error("❌ Error fetching products:", e);
      return [];
    }
  }

  // ---------- PURCHASE (unchanged) ----------
  async purchaseSubscription(productId: string): Promise<boolean> {
    try {
      if (!this.isInitialized) await this.initialize();
      console.log("💳 Purchasing (subscription):", productId);

      const purchase = await IAP.requestPurchase({
        request: {
          ios: {
            sku: productId,
            quantity: 1,
            andDangerouslyFinishTransactionAutomatically: false,
          },
          android: {
            skus: [productId],
          },
        },
        type: "subs",
      });

      console.log("✅ Purchase initiated:", purchase);
      return true;
    } catch (e: any) {
      console.error("❌ Error purchasing subscription:", e);
      if (e?.code === "E_USER_CANCELLED") {
        console.log("ℹ️ User cancelled purchase");
        return false;
      }
      return false;
    }
  }

  // ---------- PURCHASE LISTENERS (new implementation) ----------
  setupPurchaseListeners(
    onPurchaseSuccess: (purchase: any) => void,
    onPurchaseError: (error: any) => void
  ) {
    console.log("👂 Setting up purchase listeners...");

    // purchaseUpdatedListener
    this.purchaseUpdateSub = purchaseUpdatedListener(async (purchase) => {
      try {
        console.log("🧾 Purchase received:", purchase);

        // ✅ Validate on server if needed
        // const isValid = await validateReceiptOnServer(purchase);
        const isValid = true; // temp stub

        if (isValid) {
          await finishTransaction({ purchase, isConsumable: false });
          console.log("✅ Transaction finished successfully");
          onPurchaseSuccess(purchase);
        } else {
          console.error("❌ Invalid purchase receipt");
        }
      } catch (error) {
        console.error("❌ Error handling purchase:", error);
        onPurchaseError(error);
      }
    });

    // purchaseErrorListener
    this.purchaseErrorSub = purchaseErrorListener((error) => {
      if (error?.code === "E_USER_CANCELLED") {
        console.log("ℹ️ User cancelled purchase");
      } else {
        console.error("❌ Purchase error:", error);
        onPurchaseError(error);
      }
    });

    console.log("✅ Purchase listeners set up successfully");
  }

  removePurchaseListeners() {
    this.purchaseUpdateSub?.remove?.();
    this.purchaseErrorSub?.remove?.();
    this.purchaseUpdateSub = null;
    this.purchaseErrorSub = null;
    console.log("🔇 Purchase listeners removed");
  }

  async restorePurchases(): Promise<boolean> {
    try {
      if (!this.isInitialized) await this.initialize();
      const purchases: any[] = (await getAvailablePurchases()) ?? [];
      const hasSub = purchases.some((p) =>
        SUBSCRIPTION_SKUS.includes(p.productId ?? p.sku ?? "")
      );
      console.log(
        "📦 Restored purchases:",
        purchases.length,
        "Has sub:",
        hasSub
      );
      return hasSub;
    } catch (e) {
      console.error("❌ Error restoring purchases:", e);
      return false;
    }
  }

  async checkSubscriptionStatus(): Promise<boolean> {
    try {
      if (!this.isInitialized) await this.initialize();
      const purchases: any[] = (await getAvailablePurchases()) ?? [];
      const hasSub = purchases.some((p) =>
        SUBSCRIPTION_SKUS.includes(p.productId ?? p.sku ?? "")
      );
      console.log("✅ Active subscription:", hasSub);
      return hasSub;
    } catch (e) {
      console.error("❌ Error checking subscription status:", e);
      return false;
    }
  }

  async endConnection() {
    try {
      this.removePurchaseListeners();
      await endConnection();
      this.isInitialized = false;
      console.log("✅ IAP connection ended");
    } catch (e) {
      console.error("❌ Error ending IAP connection:", e);
    }
  }
}

export default new IAPService();
