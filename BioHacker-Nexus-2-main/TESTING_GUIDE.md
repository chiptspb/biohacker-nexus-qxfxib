
# BioHacker Nexus - Testing Guide

## 🧪 Quick Test Scenarios

### Scenario 1: Free User Flow
1. **Launch app** → Should see onboarding
2. **Complete profile** → Navigate to dashboard
3. **Add first product** → Should work without issues
4. **Try to add second product** → Should see premium upsell modal
5. **View premium modal** → Should show $2.99/month and $24.99/year options
6. **Close modal** → Should return to medications screen
7. **Check Settings** → Should show "Free Plan limited to 1 product"

### Scenario 2: Premium Purchase Flow
1. **Trigger premium modal** → Try to add 2nd product
2. **Select Annual plan** → Should highlight with "BEST VALUE" badge
3. **Tap Subscribe Now** → Should initiate purchase
4. **Complete sandbox purchase** → Should show green toast "Premium Unlocked! 🎉"
5. **Check Settings** → Should show "Premium Member" with active badge
6. **Add multiple products** → Should work without limits

### Scenario 3: Restore Purchases
1. **Delete and reinstall app** → Fresh install
2. **Complete onboarding** → Navigate to Settings
3. **Tap "Restore Purchases"** → Should validate with App Store
4. **If subscription exists** → Green toast "Premium Restored! 🎉"
5. **If no subscription** → Info toast "No purchases found"
6. **Check premium status** → Should reflect restored state

### Scenario 4: Daily Dose Schedule
1. **Add product**: "Test Peptide"
2. **Set frequency**: Daily
3. **Set start date**: Today
4. **Save product** → Should generate 365 doses
5. **Check dashboard** → Should show 1 dose due today
6. **Check calendar** → Should show dots for every day for 1 year

### Scenario 5: Weekly Schedule with Specific Days
1. **Add product**: "TRT Testosterone"
2. **Set frequency**: Weekly
3. **Select days**: Monday, Thursday
4. **Set start date**: Next Monday
5. **Save product** → Should generate ~104 doses (52 weeks × 2 days)
6. **Check calendar** → Should show dots only on Mon/Thu
7. **Check dashboard** → Should show dose on Mon/Thu only

### Scenario 6: AM/PM Daily Schedule
1. **Add product**: "BPC-157"
2. **Select frequencies**: AM Daily AND PM Daily
3. **Set start date**: Today
4. **Save product** → Should generate 730 doses (365 days × 2)
5. **Check dashboard** → Should show 2 doses due today (AM and PM)
6. **Check calendar** → Should show 2 dots per day

### Scenario 7: Edit Protocol
1. **Select existing product** → Navigate to edit screen
2. **Change frequency**: From Daily to Weekly
3. **Select days**: Monday, Wednesday, Friday
4. **Save changes** → Should recalculate doses
5. **Check calendar** → Should show new schedule
6. **Verify completed doses** → Should preserve completion status

### Scenario 8: Future Start Date
1. **Add product**: "Future Protocol"
2. **Set frequency**: Daily
3. **Set start date**: 1 week from today
4. **Save product** → Should generate doses starting from future date
5. **Check dashboard today** → Should show 0 doses due
6. **Check calendar** → Should show dots starting from future date

## 🔍 What to Look For

### IAP Testing
- ✅ Products load without errors
- ✅ Prices display correctly ($2.99 and $24.99)
- ✅ Purchase flow completes without crashes
- ✅ Success toast appears after purchase
- ✅ Premium status updates immediately
- ✅ Restore purchases works correctly
- ✅ Free limit enforced (1 product)
- ✅ Premium users unlimited

### Dose Calendar Testing
- ✅ Doses generate for full year (365 days)
- ✅ Today is included if start date is today
- ✅ Future start dates work correctly
- ✅ Weekly schedules respect selected days
- ✅ AM/PM Daily creates 2 doses per day
- ✅ Dashboard shows only today's doses
- ✅ Overdue doses show red badge
- ✅ Upcoming doses show green badge
- ✅ Calendar shows all scheduled doses
- ✅ Edit recalculates correctly

### UI/UX Testing
- ✅ All buttons respond to taps
- ✅ Loading states show during operations
- ✅ Toast notifications appear and auto-hide
- ✅ Modal animations smooth
- ✅ Text is readable and properly formatted
- ✅ No white text on white background
- ✅ No crashes or freezes
- ✅ Scrolling is smooth

## 🐛 Common Issues to Check

### IAP Issues
- **Products not loading**: Check internet connection and App Store Connect setup
- **Purchase fails**: Verify sandbox account is signed in
- **Restore doesn't work**: Check if subscription exists in sandbox account
- **Premium status not updating**: Check console logs for errors

### Calendar Issues
- **No doses showing**: Check if product has valid start date and frequency
- **Wrong days showing**: Verify day of week selection
- **Doses not on calendar**: Check if doses were generated (console logs)
- **Dashboard empty**: Verify today's date matches scheduled dates

### General Issues
- **App crashes on launch**: Check console for errors
- **Data not persisting**: Verify AsyncStorage is working
- **Navigation broken**: Check router paths
- **Styling issues**: Verify colors and styles are applied

## 📊 Console Logs to Monitor

### IAP Logs
```
Initializing IAP service...
IAP connection initialized: true
Fetching subscription products: [...]
Loaded products: [...]
Initiating purchase for: com.chiptspb.biohackernexus.premium.monthly
Purchase successful: {...}
Subscription status check: true
```

### Calendar Logs
```
=== CALCULATING SCHEDULED DOSES ===
Product: Test Peptide
Frequencies: ['Daily']
Starting Date (local): 2024-01-15
Generated 365 doses for Daily
=== TOTAL: Generated 365 doses for 1 year ===
```

### Dashboard Logs
```
=== FILTERING DOSES DUE TODAY ===
Current time: 2024-01-15T14:30:00.000Z
Today date string: 2024-01-15
Total scheduled doses: 365
Found 1 doses due today
```

## 🎯 Success Criteria

### IAP Success
- [ ] Free users limited to 1 product
- [ ] Premium modal shows both plans
- [ ] Purchase completes successfully
- [ ] Premium status updates in Settings
- [ ] Restore purchases works
- [ ] Premium users can add unlimited products

### Calendar Success
- [ ] All frequency types work correctly
- [ ] Day of week restrictions work
- [ ] 1 year of doses generated
- [ ] Dashboard shows today's doses only
- [ ] Calendar shows all future doses
- [ ] Edit protocol recalculates correctly

### Overall Success
- [ ] No crashes or errors
- [ ] All features work as expected
- [ ] UI is clean and responsive
- [ ] Toast notifications work
- [ ] Data persists across app restarts
- [ ] Ready for TestFlight distribution

## 📱 Device Testing

### Test On
- [ ] iPhone (iOS 15+)
- [ ] iPad (iOS 15+)
- [ ] Android phone (Android 10+)
- [ ] Android tablet (Android 10+)

### Test In
- [ ] Expo Go (development)
- [ ] TestFlight (iOS sandbox)
- [ ] Internal testing (Android)
- [ ] Production (after approval)

## 🚀 Pre-Release Checklist

- [ ] All test scenarios pass
- [ ] No console errors or warnings
- [ ] IAP products configured in App Store Connect
- [ ] Sandbox testing completed
- [ ] Screenshots updated
- [ ] App Store description mentions IAP
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Support email configured
- [ ] Ready for submission
