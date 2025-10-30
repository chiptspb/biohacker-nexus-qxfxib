
# In-App Purchase Setup Guide for BioHacker Nexus

## Overview
This app implements in-app purchases (IAP) using `react-native-iap` for subscription management. The implementation supports both iOS and Android with TestFlight/sandbox testing enabled.

## Subscription Products

### Monthly Subscription
- **Product ID**: `com.chiptspb.biohackernexus.premium.monthly`
- **Price**: $2.99/month
- **Features**: Unlimited medications, advanced tracking, export reports

### Annual Subscription
- **Product ID**: `com.chiptspb.biohackernexus.premium.annual`
- **Price**: $24.99/year
- **Features**: Same as monthly + 30% savings

## iOS Setup (App Store Connect)

### 1. Create App in App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create a new app with bundle ID: `com.chiptspb.biohackernexus`
3. Fill in required app information

### 2. Create In-App Purchases
1. Navigate to your app → Features → In-App Purchases
2. Click the "+" button to create new subscriptions
3. Create a Subscription Group (e.g., "Premium Subscriptions")

#### Monthly Subscription
- **Reference Name**: Premium Monthly
- **Product ID**: `com.chiptspb.biohackernexus.premium.monthly`
- **Subscription Duration**: 1 Month
- **Price**: $2.99 USD (Tier 3)
- **Localization**: Add display name and description

#### Annual Subscription
- **Reference Name**: Premium Annual
- **Product ID**: `com.chiptspb.biohackernexus.premium.annual`
- **Subscription Duration**: 1 Year
- **Price**: $24.99 USD (Tier 25)
- **Localization**: Add display name and description

### 3. Create Sandbox Test Accounts
1. Go to Users and Access → Sandbox Testers
2. Create test accounts with different Apple IDs
3. Use these accounts to test purchases in TestFlight

### 4. TestFlight Setup
1. Build your app with EAS Build:
   ```bash
   eas build --platform ios --profile preview
   ```
2. Upload to TestFlight
3. Add internal testers
4. Install TestFlight app on device
5. Sign out of App Store (Settings → App Store → Sign Out)
6. Launch app and test purchases
7. When prompted, sign in with sandbox test account

## Android Setup (Google Play Console)

### 1. Create App in Google Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app with package name: `com.chiptspb.biohackernexus`

### 2. Create In-App Products
1. Navigate to Monetize → Products → Subscriptions
2. Create new subscription products

#### Monthly Subscription
- **Product ID**: `com.chiptspb.biohackernexus.premium.monthly`
- **Name**: Premium Monthly
- **Description**: Unlimited medications and features
- **Billing Period**: 1 Month
- **Price**: $2.99 USD

#### Annual Subscription
- **Product ID**: `com.chiptspb.biohackernexus.premium.annual`
- **Name**: Premium Annual
- **Description**: Unlimited medications and features - Best Value!
- **Billing Period**: 1 Year
- **Price**: $24.99 USD

### 3. License Testing
1. Go to Setup → License Testing
2. Add test Gmail accounts
3. These accounts can make test purchases without being charged

### 4. Internal Testing Track
1. Build your app with EAS Build:
   ```bash
   eas build --platform android --profile preview
   ```
2. Upload to Internal Testing track
3. Add testers
4. Install app and test purchases

## Testing IAP in Development

### iOS Sandbox Testing
1. **Sign out of App Store** on your device
2. Launch the app
3. Attempt to purchase a subscription
4. When prompted, sign in with a sandbox test account
5. Complete the purchase (no actual charge)
6. Verify premium features are unlocked

### Android License Testing
1. Ensure your Google account is added to license testers
2. Install the app from Internal Testing track
3. Attempt to purchase a subscription
4. Complete the purchase (no actual charge)
5. Verify premium features are unlocked

### Testing Restore Purchases
1. Make a test purchase
2. Delete and reinstall the app
3. Go to Settings
4. Tap "Restore Purchases"
5. Verify premium status is restored

## Implementation Details

### IAP Service (`services/iapService.ts`)
- Initializes connection to App Store/Play Store
- Fetches available products
- Handles purchase flow
- Manages subscriptions
- Validates receipts
- Restores purchases

### App Context Integration
- Checks subscription status on app launch
- Updates `isPremium` flag in user profile
- Persists premium status to AsyncStorage
- Syncs with IAP service

### Premium Modal
- Displays both subscription tiers
- Shows pricing and features
- Handles purchase initiation
- Shows loading states
- Displays success/error messages

### Settings Screen
- Shows premium status
- Restore purchases button
- Premium badge for active subscriptions

## Freemium Logic

### Free Tier Limits
- Maximum 1 medication/product
- Basic tracking features
- View-only calendar

### Premium Features
- Unlimited medications
- Advanced inventory tracking
- Dose calendar with reminders
- Export reports (PDF/CSV)
- Priority support

### Enforcement
- `canAddProduct()` checks premium status
- Shows upsell modal when limit reached
- Graceful degradation for free users

## Error Handling

### Purchase Errors
- User cancellation (silent)
- Network errors (retry prompt)
- Invalid product (fallback to mock data)
- Receipt validation failures (alert user)

### Restore Errors
- No purchases found (inform user)
- Network errors (retry prompt)
- Invalid receipts (contact support)

## Production Checklist

- [ ] Create app in App Store Connect
- [ ] Create app in Google Play Console
- [ ] Configure in-app products with correct IDs
- [ ] Set up pricing in all regions
- [ ] Create sandbox test accounts (iOS)
- [ ] Add license testers (Android)
- [ ] Test purchase flow on both platforms
- [ ] Test restore purchases
- [ ] Test subscription renewals
- [ ] Test subscription cancellation
- [ ] Verify receipt validation
- [ ] Test offline scenarios
- [ ] Update app bundle IDs in app.json
- [ ] Build and submit to TestFlight/Internal Testing
- [ ] Conduct thorough testing
- [ ] Submit for review

## Troubleshooting

### "Cannot connect to iTunes Store"
- Ensure you're signed out of App Store
- Use a valid sandbox test account
- Check network connection
- Restart device

### "Product not found"
- Verify product IDs match exactly
- Ensure products are approved in App Store Connect
- Wait 24 hours after creating products
- Check bundle ID matches

### "Purchase failed"
- Check sandbox account is valid
- Ensure app is signed correctly
- Verify IAP capability is enabled
- Check console logs for details

### Restore not working
- Ensure previous purchase was completed
- Check same Apple ID/Google account is used
- Verify receipt validation is working
- Check network connection

## Support

For issues with IAP implementation:
1. Check console logs for detailed error messages
2. Verify product IDs match in code and store
3. Test with fresh sandbox accounts
4. Review Apple/Google IAP documentation
5. Contact support with error logs

## References

- [react-native-iap Documentation](https://github.com/dooboolab/react-native-iap)
- [Apple In-App Purchase Guide](https://developer.apple.com/in-app-purchase/)
- [Google Play Billing Guide](https://developer.android.com/google/play/billing)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
