# Onboarding Button Implementation

## Overview

The onboarding system has been updated to use a **persistent onboarding button** in the navigation instead of auto-redirecting users. This gives users more control over when they complete their profile setup.

## 🎯 Key Changes

### Before (Auto-Redirect)
```
Sign Up → Email Verification → Auto-redirect to onboarding
```

### After (Onboarding Button)
```
Sign Up → Email Verification → Feed (with onboarding button if incomplete)
```

## 🔧 Implementation Details

### 1. New File: `/client/src/lib/onboarding.ts`

Created a progress checker that determines:
- Whether onboarding is complete
- Progress percentage (0-100%)
- Next step URL to redirect to

**Logic by User Type:**

**Founders:**
- ✅ Complete: Has a record in `company_founders` table
- ❌ Incomplete: No company created yet
- Next step: `/onboarding/company`

**Individual Investors:**
- ✅ Complete: Has `investment_thesis` in `individual_investors` table
- ❌ Incomplete: No investment thesis set
- Next step: `/onboarding/investor`

**Firm Members:**
- ✅ Complete: Has a record in `firm_members` table
- ❌ Incomplete: Not part of any firm
- Next step: `/onboarding/firm`

### 2. Updated Files

#### `auth-handler.tsx`
**Changed:**
```typescript
// OLD: Redirect based on user type
if (user.user_type === 'founder') {
  setLocation('/onboarding/company');
} else if ...

// NEW: Always redirect to feed
setLocation('/feed');
```

#### `callback.tsx`
**Changed:**
```typescript
// OLD: Redirect based on user type after verification
setTimeout(() => {
  if (user.user_type === 'founder') {
    setLocation('/onboarding/company');
  } ...
}, 1500);

// NEW: Always redirect to feed
setTimeout(() => {
  setLocation('/feed');
}, 1500);
```

#### `navigation.tsx`
**Added:**
1. Import onboarding progress checker
2. State for tracking onboarding progress
3. useEffect to check progress on location change
4. Conditional "Complete Setup" button

```typescript
{onboardingProgress && !onboardingProgress.isComplete && (
  <Button
    onClick={() => setLocation(onboardingProgress.nextStep)}
    className="bg-gradient-to-r from-purple-600 to-blue-600 ..."
  >
    <Sparkles className="h-4 w-4 mr-2" />
    Complete Setup
  </Button>
)}
```

## 🎨 Visual Appearance

### Navigation with Onboarding Button
```
┌────────────────────────────────────────────────────┐
│ 🔥 incubator.ai    [Search...]  [✨ Complete Setup] 👤│
└────────────────────────────────────────────────────┘
```

### Navigation after Onboarding Complete
```
┌────────────────────────────────────────────────────┐
│ 🔥 incubator.ai    [Search...]                    👤│
└────────────────────────────────────────────────────┘
```

**Button Styling:**
- Gradient background: Purple-to-blue gradient
- Icon: ✨ Sparkles icon
- Text: "Complete Setup"
- Position: Between search bar and profile avatar
- Size: Small
- Visible: Only when onboarding incomplete

## 📋 Updated User Flow

### Founder Flow
```
1. Sign Up as Founder
   ↓
2. Verify Email
   ↓
3. Redirected to /feed
   ↓
4. See "Complete Setup" button in nav
   ↓
5. Click button → /onboarding/company
   ↓
6. Complete 3-step onboarding
   ↓
7. Redirected to /feed
   ↓
8. Button disappears ✓
```

### Investor Flow
```
1. Sign Up as Investor
   ↓
2. Verify Email
   ↓
3. Redirected to /feed
   ↓
4. See "Complete Setup" button in nav
   ↓
5. Click button → /onboarding/investor
   ↓
6. Complete single-page form
   ↓
7. Redirected to /feed
   ↓
8. Button disappears ✓
```

### Firm Member Flow
```
1. Sign Up as Firm Member
   ↓
2. Verify Email
   ↓
3. Redirected to /feed
   ↓
4. See "Complete Setup" button in nav
   ↓
5. Click button → /onboarding/firm
   ↓
6. Complete 3-step onboarding
   ↓
7. Redirected to /feed
   ↓
8. Button disappears ✓
```

## 🔄 Progress Detection Logic

The system automatically detects onboarding status by checking:

### On Initial Load
- When user first logs in
- Progress checked immediately

### On Auth State Change
- When user signs in/out
- Progress recalculated

### On Location Change
- After completing onboarding
- After navigation to different pages
- Button updates automatically

## ✨ Benefits

1. **User Control** - Users can explore the feed before completing onboarding
2. **Non-intrusive** - Button appears in navigation but doesn't block access
3. **Persistent Reminder** - Button stays visible until onboarding complete
4. **Automatic Detection** - System knows when onboarding is done
5. **Visual Appeal** - Gradient button stands out without being aggressive

## 🧪 Testing the Feature

### Test Incomplete Onboarding
1. Sign up as any user type
2. Verify email
3. Land on feed
4. **✓ Should see "Complete Setup" button**
5. Click other nav items
6. **✓ Button should persist**

### Test Onboarding Completion
1. Click "Complete Setup" button
2. Complete onboarding flow
3. Redirected to feed
4. **✓ Button should disappear**
5. Refresh page
6. **✓ Button should stay hidden**

### Test Already Completed Users
1. User who already completed onboarding
2. Sign in
3. **✓ Button should never appear**

## 🔍 Technical Notes

### Progress Calculation
```typescript
export async function checkOnboardingProgress(user: User) {
  // Check database for completion indicators
  // Returns: { isComplete, progress, nextStep }
}
```

### Database Queries
- **Founders:** Query `company_founders` table
- **Investors:** Query `individual_investors` table for `investment_thesis`
- **Firm Members:** Query `firm_members` table

### Performance
- Progress checked on auth state change
- Cached in component state
- Re-checked on location change (for immediate updates)

## 🚀 Future Enhancements

Potential improvements:
1. **Progress Percentage** - Show "30% complete" instead of just button
2. **Progress Tooltip** - Hover to see what's missing
3. **Multi-step Progress** - Show individual steps completed
4. **Skip Option** - Allow users to dismiss reminder temporarily
5. **Profile Completion** - Extend to track optional profile fields

## 📊 Status

✅ **Implemented:**
- Onboarding progress checker
- Conditional button in navigation
- Auto-hide when complete
- Works for all user types
- Auto-refresh on location change

✅ **Tested:**
- No linting errors
- All files updated correctly
- Logic matches requirements

---

**Status:** ✅ Complete and ready for testing
**Last Updated:** October 1, 2025


