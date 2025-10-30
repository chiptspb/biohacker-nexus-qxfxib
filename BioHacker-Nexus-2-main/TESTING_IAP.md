
# Testing In-App Purchases - Quick Guide

## 🚀 Quick Start

### For iOS (TestFlight)

1. **Prepare Device**
   - Open Settings → App Store
   - Sign out of your Apple ID
   - Don't sign back in yet!

2. **Install App**
   - Install via TestFlight
   - Launch BioHacker Nexus

3. **Test Free Tier**
   - Complete onboarding
   - Add 1 medication (should work)
   - Try to add 2nd medication
   - ✅ Should show premium upsell modal

4. **Test Purchase**
   - Tap "Upgrade to Premium" 
   - Select Monthly ($2.99) or Annual ($24.99)
   - When prompted, sign in with sandbox test account
   - Complete purchase
   - ✅ Should see "Premium Unlocked! 🎉" message
   - ✅ Can now add unlimited medications

5. **Test Restore**
   - Delete app
   - Reinstall from TestFlight
   - Complete onboarding
   - Go to Settings
   - Tap "Restore Purchases"
   - ✅ Should restore premium status

### For Android (Internal Testing)

1. **Prepare Device**
   - Ensure your Google account is added as license tester
   - Install app from Internal Testing track

2. **Test Free Tier**
   - Complete onboarding
   - Add 1 medication (should work)
   - Try to add 2nd medication
   - ✅ Should show premium upsell modal

3. **Test Purchase**
   - Tap "Upgrade to Premium"
   - Select subscription tier
   - Complete purchase (test card, no charge)
   - ✅ Should see success message
   - ✅ Can now add unlimited medications

4. **Test Restore**
   - Clear app data or reinstall
   - Complete onboarding
   - Go to Settings
   - Tap "Restore Purchases"
   - ✅ Should restore premium status

## 🧪 Test Scenarios

### Scenario 1: Free User Flow
```
1. Launch app → Complete onboarding
2. Add medication #1 → ✅ Success
3. Try to add medication #2 → ❌ Shows upsell modal
4. Tap "Maybe Later" → Returns to medications screen
5. Verify still limited to 1 medication
```

### Scenario 2: Purchase Flow
```
1. Tap "Upgrade to Premium" (Dashboard or Settings)
2. Modal shows both tiers:
   - Monthly: $2.99/month
   - Annual: $24.99/year (BEST VALUE badge)
3. Tap "Select Plan" on Monthly
4. Complete purchase with sandbox account
5. ✅ See "Premium Unlocked! 🎉" alert
6. Dashboard shows "Premium Member"
7. Can add unlimited medications
```

### Scenario 3: Restore Purchases
```
1. Make a test purchase (Scenario 2)
2. Delete app completely
3. Reinstall app
4. Complete onboarding
5. Go to Settings
6. Tap "Restore Purchases"
7. ✅ See "Premium Restored! 🎉" toast
8. Verify premium features unlocked
```

### Scenario 4: User Cancellation
```
1. Tap "Upgrade to Premium"
2. Select a plan
3. Cancel purchase dialog
4. ✅ No error shown (graceful)
5. Modal remains open
6. Can try again or close
```

### Scenario 5: Network Error
```
1. Turn off WiFi/Data
2. Tap "Upgrade to Premium"
3. Try to purchase
4. ✅ See error: "Unable to complete purchase"
5. Turn on network
6. Try again → Should work
```

## 📱 Expected Behavior

### Free Tier
- ✅ Can add 1 medication
- ❌ Cannot add 2nd medication (shows upsell)
- ✅ Can view calendar (read-only)
- ✅ Can log doses for 1 medication
- ✅ Can view inventory for 1 medication

### Premium Tier
- ✅ Can add unlimited medications
- ✅ Full calendar access
- ✅ Advanced inventory tracking
- ✅ Export reports (coming soon)
- ✅ Priority support

### UI Indicators
- **Dashboard**: Shows "Premium Member" or "Free Plan"
- **Settings**: Shows premium status + restore button
- **Medications**: No limit on adding products
- **Premium Modal**: Shows both subscription tiers

## 🐛 Common Issues

### Issue: "Cannot connect to iTunes Store"
**Solution**: 
- Sign out of App Store in Settings
- Use valid sandbox test account
- Check network connection

### Issue: "Product not found"
**Solution**:
- Products may not be set up in App Store Connect yet
- App falls back to mock products for testing
- Verify product IDs match exactly

### Issue: Purchase completes but premium not unlocked
**Solution**:
- Check console logs for errors
- Verify receipt validation
- Try "Restore Purchases" in Settings

### Issue: Restore says "No purchases found"
**Solution**:
- Ensure purchase was completed successfully
- Use same Apple ID/Google account
- Wait a few minutes and try again

## 📊 Test Checklist

### Pre-Launch Testing
- [ ] Free tier limits to 1 medication
- [ ] Upsell modal shows on 2nd medication attempt
- [ ] Both subscription tiers display correctly
- [ ] Monthly purchase works ($2.99)
- [ ] Annual purchase works ($24.99)
- [ ] Premium unlocks unlimited medications
- [ ] Restore purchases works
- [ ] User cancellation handled gracefully
- [ ] Network errors handled gracefully
- [ ] Premium status persists after app restart
- [ ] Premium status syncs on app launch

### Platform-Specific
#### iOS
- [ ] Sandbox account purchases work
- [ ] TestFlight build installs correctly
- [ ] Receipt validation works
- [ ] Subscription auto-renewal (sandbox)

#### Android
- [ ] License tester purchases work
- [ ] Internal testing build installs
- [ ] Receipt validation works
- [ ] Subscription auto-renewal (test)

## 🎯 Success Criteria

✅ **Free users** are limited to 1 medication
✅ **Upsell modal** appears when limit reached
✅ **Both tiers** are purchasable in sandbox
✅ **Premium unlocks** unlimited features
✅ **Restore** recovers premium status
✅ **No crashes** during purchase flow
✅ **Clear feedback** on success/failure
✅ **Graceful handling** of errors

## 📝 Notes

- Sandbox purchases don't charge real money
- Subscriptions renew faster in sandbox (minutes vs months)
- Test accounts should be separate from production
- Always test restore flow thoroughly
- Check console logs for detailed debugging

## 🆘 Need Help?

If you encounter issues:
1. Check console logs for error messages
2. Verify product IDs in App Store Connect/Play Console
3. Ensure sandbox/test accounts are set up correctly
4. Review IAP_SETUP.md for detailed configuration
5. Contact support with logs and screenshots
