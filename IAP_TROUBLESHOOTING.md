
# IAP Troubleshooting Guide

## 🔍 Diagnostic Steps

### Step 1: Check Console Logs
Look for these key messages:
```
✅ "IAP service initialized"
✅ "Fetched products: [...]"
✅ "Purchase successful: [...]"
❌ "Error initializing IAP service"
❌ "Error fetching products"
❌ "Purchase error"
```

### Step 2: Verify Configuration
```bash
# Check bundle IDs in app.json
cat app.json | grep bundleIdentifier
cat app.json | grep package

# Should show:
# "bundleIdentifier": "com.chiptspb.biohackernexus"
# "package": "com.chiptspb.biohackernexus"
```

### Step 3: Test IAP Service
```typescript
// Add to any screen for testing
import iapService from '@/services/iapService';

const testIAP = async () => {
  try {
    await iapService.initialize();
    console.log('✅ IAP initialized');
    
    const products = await iapService.getProducts();
    console.log('✅ Products:', products);
    
    const status = await iapService.checkSubscriptionStatus();
    console.log('✅ Premium status:', status);
  } catch (error) {
    console.error('❌ IAP test failed:', error);
  }
};
```

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to iTunes Store"

**Symptoms:**
- Purchase dialog doesn't appear
- Error message about iTunes Store
- Sandbox login prompt doesn't show

**Solutions:**
1. **Sign out of App Store**
   - Settings → App Store → Sign Out
   - Don't sign back in yet

2. **Use valid sandbox account**
   - Create in App Store Connect
   - Use different email than production
   - Must be verified email

3. **Check network**
   - Ensure WiFi/cellular is on
   - Try different network
   - Restart device

4. **Clear app data**
   ```bash
   # Delete app and reinstall
   # Or reset simulator
   xcrun simctl erase all
   ```

### Issue 2: "Product not found" / Empty product list

**Symptoms:**
- Products array is empty
- Modal shows mock products
- Console shows "Error fetching products"

**Solutions:**
1. **Wait 24 hours**
   - Products need time to propagate
   - Check App Store Connect status
   - Ensure products are "Ready to Submit"

2. **Verify product IDs**
   ```typescript
   // In iapService.ts, check:
   const SUBSCRIPTION_SKUS = [
     'com.chiptspb.biohackernexus.premium.monthly',
     'com.chiptspb.biohackernexus.premium.annual',
   ];
   ```

3. **Check bundle ID matches**
   - App Store Connect app bundle ID
   - app.json bundleIdentifier
   - Must be exact match

4. **Verify IAP capability**
   - In Xcode: Signing & Capabilities
   - Add "In-App Purchase" capability
   - Rebuild app

### Issue 3: Purchase completes but premium not unlocked

**Symptoms:**
- Purchase dialog completes
- No error shown
- isPremium still false
- Features still locked

**Solutions:**
1. **Check receipt validation**
   ```typescript
   // Add logging in iapService.ts
   console.log('Purchase receipt:', purchase.transactionReceipt);
   console.log('Purchase state:', purchase.purchaseStateAndroid);
   ```

2. **Verify transaction finish**
   ```typescript
   // Ensure this runs after purchase
   if (Platform.OS === 'ios') {
     await RNIap.finishTransaction({ purchase, isConsumable: false });
   }
   ```

3. **Force status update**
   ```typescript
   const { updatePremiumStatus } = useApp();
   await updatePremiumStatus(true);
   ```

4. **Check AsyncStorage**
   ```typescript
   const userData = await AsyncStorage.getItem('@biohacker_user');
   console.log('User data:', JSON.parse(userData));
   // Should show isPremium: true
   ```

### Issue 4: Restore purchases not working

**Symptoms:**
- "No purchases found" message
- Premium not restored
- Previous purchase not detected

**Solutions:**
1. **Verify same account**
   - iOS: Same Apple ID used for purchase
   - Android: Same Google account
   - Check in device settings

2. **Check purchase completion**
   ```typescript
   const purchases = await RNIap.getAvailablePurchases();
   console.log('Available purchases:', purchases);
   ```

3. **Clear transaction queue**
   ```typescript
   // iOS only
   await RNIap.clearTransactionIOS();
   ```

4. **Wait and retry**
   - Purchases may take time to sync
   - Wait 5-10 minutes
   - Try restore again

### Issue 5: App crashes on purchase attempt

**Symptoms:**
- App closes when tapping purchase
- No error message
- Console shows native crash

**Solutions:**
1. **Check native dependencies**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules
   npm install
   
   # iOS: Reinstall pods
   cd ios && pod install && cd ..
   
   # Rebuild
   npm run ios
   ```

2. **Verify react-native-iap version**
   ```bash
   npm list react-native-iap
   # Should show: react-native-iap@14.4.34
   ```

3. **Check for conflicts**
   ```bash
   # Look for duplicate dependencies
   npm ls react-native-iap
   ```

4. **Clean build**
   ```bash
   # iOS
   cd ios && rm -rf build && cd ..
   
   # Android
   cd android && ./gradlew clean && cd ..
   ```

### Issue 6: Sandbox purchases charge real money

**Symptoms:**
- Credit card charged
- Real receipt received
- Not using sandbox

**Solutions:**
1. **STOP IMMEDIATELY**
   - Contact Apple/Google support
   - Request refund
   - Don't make more purchases

2. **Verify sandbox mode**
   - iOS: Must be signed out of App Store
   - iOS: Must use sandbox test account
   - Android: Must be in license testers list

3. **Check build type**
   - TestFlight builds use sandbox
   - App Store builds use production
   - Ensure using TestFlight

### Issue 7: "User cancelled" errors shown

**Symptoms:**
- Error alert when user cancels
- Annoying for users
- Should be silent

**Solutions:**
1. **Check error handling**
   ```typescript
   // In iapService.ts
   if (error.code === 'E_USER_CANCELLED') {
     console.log('User cancelled purchase');
     return false; // Don't throw
   }
   ```

2. **Update purchase listener**
   ```typescript
   purchaseErrorListener((error) => {
     if (error.code !== 'E_USER_CANCELLED') {
       onPurchaseError(error);
     }
   });
   ```

### Issue 8: Products show wrong prices

**Symptoms:**
- Prices don't match store
- Currency is wrong
- Localization issues

**Solutions:**
1. **Check store configuration**
   - Verify prices in App Store Connect
   - Check all regions/currencies
   - Ensure prices are approved

2. **Use localized price**
   ```typescript
   // Always use localizedPrice
   <Text>{product.localizedPrice}</Text>
   // Not: <Text>${product.price}</Text>
   ```

3. **Test in different regions**
   - Change device region
   - Verify prices update
   - Check currency symbols

## 🔧 Advanced Debugging

### Enable verbose logging
```typescript
// In iapService.ts, add at top:
import { Platform } from 'react-native';

if (__DEV__) {
  console.log('IAP Debug Mode Enabled');
}

// Add logging to every method:
async initialize() {
  console.log('[IAP] Initializing...');
  try {
    const result = await RNIap.initConnection();
    console.log('[IAP] Connection result:', result);
    // ...
  } catch (error) {
    console.error('[IAP] Initialize error:', error);
    throw error;
  }
}
```

### Test with mock data
```typescript
// In iapService.ts, add flag:
const USE_MOCK_DATA = __DEV__ && false; // Set to true for testing

async getProducts() {
  if (USE_MOCK_DATA) {
    return [
      {
        productId: 'com.chiptspb.biohackernexus.premium.monthly',
        title: 'Premium Monthly (MOCK)',
        price: '$2.99',
        // ...
      },
    ];
  }
  // Normal flow...
}
```

### Monitor purchase state
```typescript
// Add to AppContext
useEffect(() => {
  console.log('[App] Premium status changed:', isPremium);
  console.log('[App] Products count:', products.length);
  console.log('[App] Can add product:', canAddProduct());
}, [isPremium, products]);
```

## 📊 Health Check Script

Create a test function to verify IAP health:

```typescript
// Add to Settings screen or create test screen
const runIAPHealthCheck = async () => {
  console.log('=== IAP HEALTH CHECK ===');
  
  try {
    // 1. Check initialization
    await iapService.initialize();
    console.log('✅ IAP initialized');
    
    // 2. Check products
    const products = await iapService.getProducts();
    console.log('✅ Products loaded:', products.length);
    products.forEach(p => {
      console.log(`  - ${p.title}: ${p.localizedPrice}`);
    });
    
    // 3. Check subscription status
    const status = await iapService.checkSubscriptionStatus();
    console.log('✅ Subscription status:', status);
    
    // 4. Check available purchases
    const purchases = await RNIap.getAvailablePurchases();
    console.log('✅ Available purchases:', purchases.length);
    
    // 5. Check app state
    const { isPremium, products: appProducts } = useApp();
    console.log('✅ App premium status:', isPremium);
    console.log('✅ App products count:', appProducts.length);
    
    console.log('=== HEALTH CHECK PASSED ===');
    Alert.alert('Health Check', 'All IAP systems operational!');
  } catch (error) {
    console.error('❌ HEALTH CHECK FAILED:', error);
    Alert.alert('Health Check Failed', error.message);
  }
};
```

## 🆘 When All Else Fails

1. **Complete reset**
   ```bash
   # Delete app
   # Clear all data
   rm -rf node_modules ios/Pods
   npm install
   cd ios && pod install && cd ..
   npm run ios
   ```

2. **Create new sandbox account**
   - Sometimes accounts get corrupted
   - Create fresh test account
   - Try purchase again

3. **Test on different device**
   - Physical device vs simulator
   - Different iOS/Android version
   - Different region

4. **Check Apple/Google status**
   - [Apple System Status](https://www.apple.com/support/systemstatus/)
   - [Google Play Status](https://status.cloud.google.com/)

5. **Contact support**
   - Apple Developer Support
   - Google Play Developer Support
   - Include console logs
   - Include screenshots

## 📞 Support Resources

- **react-native-iap Issues**: https://github.com/dooboolab/react-native-iap/issues
- **Apple Developer Forums**: https://developer.apple.com/forums/
- **Google Play Support**: https://support.google.com/googleplay/android-developer/
- **Stack Overflow**: Tag with `react-native-iap`

## 📝 Reporting Issues

When reporting issues, include:
1. Platform (iOS/Android)
2. Device/simulator details
3. Console logs (full output)
4. Steps to reproduce
5. Expected vs actual behavior
6. Screenshots/videos
7. Product IDs being used
8. Bundle ID configuration

---

**Remember**: Most IAP issues are configuration problems, not code bugs. Double-check all IDs, accounts, and settings before diving into code changes.
