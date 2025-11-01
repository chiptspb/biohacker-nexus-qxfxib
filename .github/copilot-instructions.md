# BioHacker Nexus - AI Agent Guide

## Project Overview
BioHacker Nexus is a React Native/Expo app for tracking biohacking protocols and supplements. The app follows a freemium model with in-app purchases (IAP) for premium features.

## Key Architecture Components

### State Management
- Central state managed by `contexts/AppContext.tsx`
- Persisted to AsyncStorage using defined keys
- Main state includes: user profile, products, inventory, dose logs, scheduled doses
- Premium status tracked via `user.isPremium`

### Navigation & Flow
- Uses Expo Router with layout structure in `app/_layout.tsx`
- Flow: Disclaimer → Onboarding → Dashboard/Tabs
- Protected routes handled by segment checking in RootLayoutNav

### IAP Integration
- Core logic in `services/iapService.ts`
- Premium features:
  - Multiple products (free tier: 1 product)
  - Advanced scheduling features
- Products defined in `SUBSCRIPTION_SKUS` constant

### Data Models
Important types defined in `types/index.ts`:
```typescript
interface UserProfile {
  isPremium: boolean;
  // other user fields...
}

interface Product {
  id: string;
  name: string;
  // product details...
}

interface ScheduledDose {
  id: string;
  productId: string;
  scheduledDate: string;
  // dose details...
}
```

## Developer Workflows

### Testing In-App Purchases
1. Run in TestFlight/Debug (uses sandbox automatically)
2. Watch logs for `🚀 Initializing IAP service`
3. Test scenarios from `TESTING_IAP.md`

### Adding Features
1. Check premium status via `useApp().canAddProduct()`
2. Use `<PremiumModal>` for upsells
3. Follow patterns in `app/(tabs)/*` for new screens

## Project Conventions

### Error Handling
- Use `utils/errorLogger.ts` for consistent logging
- Include emoji prefixes: 🚨 for errors, ✅ for success
- Stack traces auto-processed to extract source location

### State Updates
- Use AppContext methods for data mutations
- Always use setters from context, never modify directly
- State changes trigger auto-save to AsyncStorage

### File Structure
- Screens in `app/` using Expo Router conventions
- Reusable components in `components/`
- Business logic in `services/`
- Styles in `styles/commonStyles.ts`

## Integration Points

### External Services
- App Store/Play Store via react-native-iap
- AsyncStorage for persistence
- Expo updates and config in `app.json`

### Navigation
```typescript
// Protected route example
if (!hasSeenDisclaimer || !hasCompletedOnboarding) {
  router.replace('/onboarding');
} else {
  router.replace('/(tabs)/(home)/dashboard');
}
```

### Premium Features
```typescript
// Check before allowing premium action
const canProceed = useApp().canAddProduct();
if (!canProceed) {
  setShowPremiumModal(true);
  return;
}
```