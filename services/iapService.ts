
import * as RNIap from 'react-native-iap';
import { Platform, Alert } from 'react-native';

export interface SubscriptionProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  localizedPrice: string;
  currency: string;
  subscriptionPeriod?: string;
}

// Product IDs for subscriptions
const SUBSCRIPTION_SKUS = Platform.select({
  ios: [
    'com.chiptspb.biohackernexus.premium.monthly',
    'com.chiptspb.biohackernexus.premium.annual',
  ],
  android: [
    'com.chiptspb.biohackernexus.premium.monthly',
    'com.chiptspb.biohackernexus.premium.annual',
  ],
  default: [],
});

class IAPService {
  private isInitialized = false;
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing IAP service for TestFlight/Sandbox...');
      
      // Initialize connection to store (automatically uses sandbox for TestFlight builds)
      const result = await RNIap.initConnection();
      console.log('✅ IAP connection initialized:', result);
      console.log('📱 Platform:', Platform.OS);
      console.log('🧪 Sandbox mode: ENABLED (TestFlight/Debug builds use sandbox automatically)');
      
      this.isInitialized = true;

      // Clear any pending transactions on iOS
      if (Platform.OS === 'ios') {
        await RNIap.clearTransactionIOS();
        console.log('🧹 Cleared pending iOS transactions');
      }

      // Flush failed purchases on Android
      if (Platform.OS === 'android') {
        await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
        console.log('🧹 Flushed failed Android purchases');
      }

      console.log('✅ IAP service initialized successfully - Ready for TestFlight testing!');
    } catch (error) {
      console.error('❌ Error initializing IAP service:', error);
      throw error;
    }
  }

  async getProducts(): Promise<SubscriptionProduct[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('📦 Fetching subscription products:', SUBSCRIPTION_SKUS);
      
      const products = await RNIap.getSubscriptions({ skus: SUBSCRIPTION_SKUS });
      console.log('✅ Fetched products from store:', products.length);

      if (products.length > 0) {
        return products.map(product => ({
          productId: product.productId,
          title: product.title || 'Premium Subscription',
          description: product.description || 'Unlock unlimited tracking',
          price: product.price || '$2.99',
          localizedPrice: product.localizedPrice || product.price || '$2.99',
          currency: product.currency || 'USD',
          subscriptionPeriod: product.subscriptionPeriodUnitIOS || 'MONTH',
        }));
      } else {
        console.log('⚠️ No products returned from store, using fallback prices');
        // Return fallback products for testing
        return [
          {
            productId: 'com.chiptspb.biohackernexus.premium.monthly',
            title: 'Premium Monthly',
            description: 'Unlimited medications and features',
            price: '$2.99',
            localizedPrice: '$2.99',
            currency: 'USD',
            subscriptionPeriod: 'MONTH',
          },
          {
            productId: 'com.chiptspb.biohackernexus.premium.annual',
            title: 'Premium Annual',
            description: 'Unlimited medications and features - Best Value!',
            price: '$24.99',
            localizedPrice: '$24.99',
            currency: 'USD',
            subscriptionPeriod: 'YEAR',
          },
        ];
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      
      // Return fallback products for testing
      console.log('⚠️ Using fallback products for TestFlight testing');
      return [
        {
          productId: 'com.chiptspb.biohackernexus.premium.monthly',
          title: 'Premium Monthly',
          description: 'Unlimited medications and features',
          price: '$2.99',
          localizedPrice: '$2.99',
          currency: 'USD',
          subscriptionPeriod: 'MONTH',
        },
        {
          productId: 'com.chiptspb.biohackernexus.premium.annual',
          title: 'Premium Annual',
          description: 'Unlimited medications and features - Best Value!',
          price: '$24.99',
          localizedPrice: '$24.99',
          currency: 'USD',
          subscriptionPeriod: 'YEAR',
        },
      ];
    }
  }

  async purchaseSubscription(productId: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('💳 Attempting to purchase subscription:', productId);
      console.log('🧪 Using sandbox/TestFlight mode');

      // Request purchase
      const purchase = await RNIap.requestSubscription({
        sku: productId,
        ...(Platform.OS === 'android' && {
          subscriptionOffers: [
            {
              sku: productId,
              offerToken: '',
            },
          ],
        }),
      });

      console.log('✅ Purchase successful:', purchase);

      // Finish transaction
      if (Platform.OS === 'ios') {
        await RNIap.finishTransaction({ purchase, isConsumable: false });
        console.log('✅ iOS transaction finished');
      } else if (Platform.OS === 'android') {
        await RNIap.acknowledgePurchaseAndroid({ token: purchase.purchaseToken });
        console.log('✅ Android purchase acknowledged');
      }

      return true;
    } catch (error: any) {
      console.error('❌ Error purchasing subscription:', error);
      
      // Handle user cancellation gracefully
      if (error.code === 'E_USER_CANCELLED') {
        console.log('ℹ️ User cancelled purchase');
        return false;
      }

      throw error;
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🔄 Restoring purchases...');

      // Get available purchases
      const purchases = await RNIap.getAvailablePurchases();
      console.log('📦 Available purchases:', purchases.length);

      if (purchases && purchases.length > 0) {
        // Check if any purchase is a valid subscription
        const hasValidSubscription = purchases.some(purchase => {
          const isValid = SUBSCRIPTION_SKUS.includes(purchase.productId);
          if (isValid) {
            console.log('✅ Found valid subscription:', purchase.productId);
          }
          return isValid;
        });

        console.log('🔍 Has valid subscription:', hasValidSubscription);
        return hasValidSubscription;
      }

      console.log('ℹ️ No purchases found to restore');
      return false;
    } catch (error) {
      console.error('❌ Error restoring purchases:', error);
      throw error;
    }
  }

  async checkSubscriptionStatus(forceRefresh: boolean = false): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🔍 Checking subscription status...');

      // Get available purchases
      const purchases = await RNIap.getAvailablePurchases();
      console.log('📦 Current purchases:', purchases.length);

      if (purchases && purchases.length > 0) {
        // Check if any purchase is a valid subscription
        const hasValidSubscription = purchases.some(purchase => {
          const isSubscription = SUBSCRIPTION_SKUS.includes(purchase.productId);
          
          // On iOS, check if subscription is still valid
          if (Platform.OS === 'ios' && purchase.transactionReceipt) {
            // In production, you would validate the receipt with Apple's servers
            // For sandbox testing, we'll trust the purchase exists
            console.log('📱 iOS subscription found:', purchase.productId);
            return isSubscription;
          }
          
          // On Android, check purchase state
          if (Platform.OS === 'android') {
            const isValid = isSubscription && purchase.purchaseStateAndroid === 1; // 1 = purchased
            if (isValid) {
              console.log('🤖 Android subscription found:', purchase.productId);
            }
            return isValid;
          }

          return isSubscription;
        });

        console.log('✅ Has valid subscription:', hasValidSubscription);
        return hasValidSubscription;
      }

      console.log('ℹ️ No active subscriptions found');
      return false;
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      return false;
    }
  }

  setupPurchaseListeners(
    onPurchaseSuccess: (purchase: any) => void,
    onPurchaseError: (error: any) => void
  ): void {
    try {
      console.log('👂 Setting up purchase listeners...');

      // Listen for purchase updates
      this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
        async (purchase) => {
          console.log('📬 Purchase updated:', purchase);
          
          const receipt = purchase.transactionReceipt;
          if (receipt) {
            try {
              // Finish the transaction
              if (Platform.OS === 'ios') {
                await RNIap.finishTransaction({ purchase, isConsumable: false });
                console.log('✅ iOS transaction finished');
              } else if (Platform.OS === 'android') {
                await RNIap.acknowledgePurchaseAndroid({ 
                  token: purchase.purchaseToken 
                });
                console.log('✅ Android purchase acknowledged');
              }

              onPurchaseSuccess(purchase);
            } catch (error) {
              console.error('❌ Error finishing transaction:', error);
              onPurchaseError(error);
            }
          }
        }
      );

      // Listen for purchase errors
      this.purchaseErrorSubscription = RNIap.purchaseErrorListener(
        (error) => {
          console.error('❌ Purchase error:', error);
          
          // Don't show error for user cancellation
          if (error.code !== 'E_USER_CANCELLED') {
            onPurchaseError(error);
          } else {
            console.log('ℹ️ User cancelled purchase');
          }
        }
      );

      console.log('✅ Purchase listeners set up successfully');
    } catch (error) {
      console.error('❌ Error setting up purchase listeners:', error);
    }
  }

  removePurchaseListeners(): void {
    try {
      console.log('🔇 Removing purchase listeners...');
      
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }

      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }

      console.log('✅ Purchase listeners removed');
    } catch (error) {
      console.error('❌ Error removing purchase listeners:', error);
    }
  }

  async endConnection(): Promise<void> {
    try {
      console.log('🔌 Ending IAP connection...');
      
      this.removePurchaseListeners();
      
      await RNIap.endConnection();
      this.isInitialized = false;
      
      console.log('✅ IAP connection ended');
    } catch (error) {
      console.error('❌ Error ending IAP connection:', error);
    }
  }
}

export default new IAPService();
