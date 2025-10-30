
# IAP Quick Reference Card

## 🔑 Product IDs

```
Monthly:  com.chiptspb.biohackernexus.premium.monthly  ($2.99)
Annual:   com.chiptspb.biohackernexus.premium.annual   ($24.99)
```

## 📦 Bundle IDs

```
iOS:      com.chiptspb.biohackernexus
Android:  com.chiptspb.biohackernexus
```

## 🎯 Key Functions

### Check if user can add product
```typescript
const { canAddProduct } = useApp();
if (!canAddProduct()) {
  // Show premium modal
}
```

### Check premium status
```typescript
const { isPremium } = useApp();
if (isPremium) {
  // Show premium features
}
```

### Update premium status
```typescript
const { updatePremiumStatus } = useApp();
await updatePremiumStatus(true);
```

### Restore purchases
```typescript
import iapService from '@/services/iapService';
const hasSubscription = await iapService.restorePurchases();
```

## 🧪 Testing Commands

### iOS Build
```bash
eas build --platform ios --profile preview
```

### Android Build
```bash
eas build --platform android --profile preview
```

### Start Dev Server
```bash
npm start
```

## 📱 Test Accounts

### iOS Sandbox
- Create in App Store Connect → Users and Access → Sandbox Testers
- Use separate Apple IDs from production
- Sign out of App Store before testing

### Android License Testing
- Add in Play Console → Setup → License Testing
- Use Gmail accounts
- No need to sign out

## ✅ Test Checklist

- [ ] Free user limited to 1 medication
- [ ] Upsell modal shows on 2nd add attempt
- [ ] Monthly purchase completes
- [ ] Annual purchase completes
- [ ] Premium unlocks unlimited
- [ ] Restore purchases works
- [ ] Premium persists after restart
- [ ] User cancellation handled
- [ ] Network errors handled

## 🐛 Common Issues

### "Cannot connect to iTunes Store"
→ Sign out of App Store, use sandbox account

### "Product not found"
→ Wait 24h after creating products in store

### "Purchase failed"
→ Check console logs, verify product IDs

### Restore not working
→ Ensure same Apple ID/Google account used

## 📊 Premium Features

### Free (1 medication)
- Basic tracking
- Simple inventory
- View calendar
- Log doses

### Premium (Unlimited)
- Unlimited medications
- Advanced inventory
- Full calendar
- Scheduled reminders
- Export reports
- Priority support

## 🔍 Debug Logs

Check console for:
```
"IAP service initialized"
"Fetched products: [...]"
"Purchase successful: [...]"
"Premium status: true/false"
"Restored purchases: true/false"
```

## 📞 Quick Links

- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [react-native-iap Docs](https://github.com/dooboolab/react-native-iap)
- [Apple IAP Guide](https://developer.apple.com/in-app-purchase/)
- [Google Play Billing](https://developer.android.com/google/play/billing)

## 🚨 Emergency Fixes

### Reset IAP state
```typescript
// In AppContext
await AsyncStorage.removeItem('@biohacker_user');
// Restart app
```

### Force refresh products
```typescript
const products = await iapService.getProducts();
console.log('Products:', products);
```

### Manual premium unlock (dev only)
```typescript
const { updatePremiumStatus } = useApp();
await updatePremiumStatus(true);
```

## 📝 File Locations

```
services/iapService.ts          - IAP logic
contexts/AppContext.tsx         - State management
components/PremiumModal.tsx     - Purchase UI
app/(tabs)/settings.tsx         - Restore button
app/(tabs)/medications.tsx      - Limit enforcement
app.json                        - Bundle IDs
```

## 🎨 UI Components

### Show Premium Modal
```typescript
const [showPremiumModal, setShowPremiumModal] = useState(false);

<PremiumModal
  visible={showPremiumModal}
  onClose={() => setShowPremiumModal(false)}
  onUpgrade={() => {
    setShowPremiumModal(false);
    // Handle success
  }}
/>
```

### Show Toast
```typescript
const showToast = (message: string, type: ToastType) => {
  setToastMessage(message);
  setToastType(type);
  setToastVisible(true);
};

showToast('Premium Unlocked! 🎉', 'success');
```

## 💰 Pricing

| Tier | Price | Period | Savings |
|------|-------|--------|---------|
| Monthly | $2.99 | 1 month | - |
| Annual | $24.99 | 1 year | 30% |

## 🔐 Security Notes

- Receipts validated by store
- Premium status in AsyncStorage
- Status checked on launch
- Server validation recommended for production

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
