# Individual Investor Profile & Onboarding Fix

## 🐛 Problem

Individual investor users were experiencing:
1. ❌ Profile icon not showing in navigation
2. ❌ Onboarding button not visible
3. ✅ Founders had both working correctly

## 🔍 Root Cause

**Missing Database Record:**
- User had a record in `users` table with `user_type = 'individual_investor'`
- But NO corresponding record in `individual_investors` table
- The `checkOnboardingProgress` function looks for a record in `individual_investors`
- If no record exists, the query fails and returns incomplete status
- This caused the navigation to not properly detect the user

## ✅ Solution

### 1. Created Missing Records

**SQL Fix:**
```sql
INSERT INTO individual_investors (user_id, accredited)
SELECT id, false
FROM users
WHERE user_type = 'individual_investor'
AND id NOT IN (SELECT user_id FROM individual_investors);
```

This creates `individual_investors` records for any investor users that were missing them.

### 2. Fixed User Type Import

**File: `lib/onboarding.ts`**

Changed from:
```typescript
import type { User } from './types';
```

To:
```typescript
import type { User } from './supabase';
```

The User type needs to come from supabase.ts to match the type returned by `getCurrentUser()`.

### 3. Improved Sign-Up Process

**File: `lib/auth.ts`**

Added check to prevent duplicate records:
```typescript
if (userType === 'individual_investor') {
  // Check if record already exists
  const { data: existing } = await supabase
    .from('individual_investors')
    .select('id')
    .eq('user_id', authData.user.id)
    .single();

  if (!existing) {
    // Create the record
    await supabase.from('individual_investors').insert({
      user_id: authData.user.id,
      accredited: false,
    });
  }
}
```

### 4. Added Debug Logging

**File: `lib/auth.ts`**

Added logging to `getCurrentUser()`:
```typescript
console.log('Current user loaded:', profile.email, 'type:', profile.user_type);
```

This helps debug if users aren't loading properly.

## 📊 How It Works Now

### Onboarding Progress Check

For Individual Investors:
```typescript
// 1. Check if record exists in individual_investors table
const { data: investorData } = await supabase
  .from('individual_investors')
  .select('investment_thesis')
  .eq('user_id', user.id)
  .single();

// 2. If no record OR no investment_thesis → Incomplete
if (!investorData || !investorData.investment_thesis) {
  return {
    isComplete: false,
    nextStep: '/onboarding/investor',
  };
}

// 3. Has investment_thesis → Complete
return {
  isComplete: true,
  nextStep: '/feed',
};
```

### Navigation Display Logic

```typescript
{user ? (
  <>
    {/* Show onboarding button if incomplete */}
    {onboardingProgress && !onboardingProgress.isComplete && (
      <Button onClick={() => setLocation(onboardingProgress.nextStep)}>
        Complete Setup
      </Button>
    )}
    
    {/* Show profile dropdown */}
    <DropdownMenu>
      <Avatar />
      {/* ... menu items ... */}
    </DropdownMenu>
  </>
) : (
  // Not logged in - show sign in/up buttons
)}
```

## 🔄 User Flow

### New Individual Investor Sign-Up
```
1. Sign up as individual_investor
   ↓
2. Auth record created
   ↓
3. Users table record created (via trigger)
   ↓
4. individual_investors record created ✓
   ↓
5. Email verification
   ↓
6. Sign in
   ↓
7. Navigation loads:
   - User object: ✓
   - Onboarding progress: 0% (no investment_thesis)
   - Shows: Profile icon ✓ + Onboarding button ✓
   ↓
8. Click "Complete Setup"
   ↓
9. Fill out investment preferences
   ↓
10. investment_thesis saved to DB
   ↓
11. Back to feed:
   - Onboarding progress: 100%
   - Shows: Profile icon ✓ (no onboarding button)
```

### Existing Investor (Was Broken)
```
1. Sign in
   ↓
2. getCurrentUser() loads profile ✓
   ↓
3. checkOnboardingProgress() looks for individual_investors record
   ↓
4. Record now exists ✓ (created by fix)
   ↓
5. investment_thesis is null → Incomplete
   ↓
6. Navigation shows: Profile icon ✓ + Onboarding button ✓
```

## 🧪 Testing

### Test Existing Investor User
1. Sign in as investor who couldn't see profile
2. ✅ Should now see profile icon
3. ✅ Should see "Complete Setup" button
4. Click button → Go to onboarding
5. Complete onboarding
6. ✅ Button disappears after completion

### Test New Investor Sign-Up
1. Sign up as new investor
2. Verify email
3. Sign in
4. ✅ Should see profile icon
5. ✅ Should see "Complete Setup" button
6. Complete onboarding
7. ✅ Both work correctly

### Verify Database
```sql
-- Check that all investor users have records
SELECT 
  u.id,
  u.email,
  u.user_type,
  ii.id as investor_id,
  ii.investment_thesis
FROM users u
LEFT JOIN individual_investors ii ON ii.user_id = u.id
WHERE u.user_type = 'individual_investor';

-- Should show NO NULL investor_ids ✓
```

## 📂 Files Changed

| File | Changes |
|------|---------|
| `lib/onboarding.ts` | Fixed User import to use supabase.ts |
| `lib/auth.ts` | Added duplicate check in sign-up, added logging |
| Database | Created missing individual_investors records |

## ✅ Status

- ✅ Missing records created
- ✅ User type import fixed
- ✅ Sign-up process improved
- ✅ Debug logging added
- ✅ No linting errors
- ✅ Ready for testing

---

**Fixed:** October 1, 2025  
**Issue:** Individual investors couldn't see profile icon or onboarding button  
**Resolution:** Created missing database records and fixed User type imports


