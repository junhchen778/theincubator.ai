# Onboarding Detection Fix - All User Types

## 🐛 Problem

Users weren't seeing the onboarding button or profile icon for certain user types:
- ✅ Founders: Working
- ❌ Individual Investors: Not showing
- ❌ VC Firm Members: Not showing

## 🔍 Root Cause

**The Bug in `checkOnboardingProgress()`:**

```typescript
// OLD CODE - Using .single()
const { data } = await supabase
  .from('firm_members')
  .select('firm_id')
  .eq('user_id', user.id)
  .single();  // ❌ Throws error if no rows found!
```

**What Happened:**
1. User signs up as firm_member (no firm_members record yet)
2. System checks: `SELECT * FROM firm_members WHERE user_id = ...`
3. Query returns 0 rows
4. `.single()` **throws an error** (expects exactly 1 row)
5. Error caught by outer try-catch
6. Falls through to error handler
7. Returns "incomplete" but with wrong nextStep
8. Navigation doesn't show button properly

**Supabase Query Methods:**
- `.single()` - Expects exactly 1 row, **throws error** if 0 or 2+ rows
- `.maybeSingle()` - Returns null if 0 rows, data if 1 row, **no error**

## ✅ Solution

### 1. Changed to `.maybeSingle()`

```typescript
// NEW CODE - Using .maybeSingle()
const { data, error } = await supabase
  .from('firm_members')
  .select('firm_id')
  .eq('user_id', user.id)
  .maybeSingle();  // ✅ Returns null if no rows (no error)

if (!data) {
  // No record found - onboarding incomplete
  return { isComplete: false, nextStep: '/onboarding/firm' };
}
```

### 2. Added Comprehensive Logging

For debugging, added console logs at each step:
```typescript
console.log('Firm member check:', { memberData, memberError, userId });
console.log('No firm_members record found - onboarding incomplete');
```

### 3. Added Error Handling

Explicitly check for query errors:
```typescript
if (memberError) {
  console.error('Error checking firm member:', memberError);
}
```

### 4. Applied to All User Types

Fixed the same issue for:
- ✅ Founders (company_founders check)
- ✅ Investors (individual_investors check)
- ✅ Firm Members (firm_members check)

## 📊 How It Works Now

### Founder Check
```typescript
.from('company_founders')
.select('company_id')
.eq('user_id', user.id)
.maybeSingle()  // Returns null if no company → Show button
```

### Investor Check
```typescript
.from('individual_investors')
.select('investment_thesis')
.eq('user_id', user.id)
.maybeSingle()  // Returns null if no record → Show button

// Also checks if investment_thesis is null
if (!data || !data.investment_thesis) {
  return { isComplete: false };
}
```

### Firm Member Check
```typescript
.from('firm_members')
.select('firm_id')
.eq('user_id', user.id)
.maybeSingle()  // Returns null if not in firm → Show button
```

## 🎯 Expected Behavior Now

### New User Sign-Up Flow

**All user types should now:**
1. Sign up → Create auth + users record
2. Verify email
3. Sign in
4. **See profile icon** ✓
5. **See "Complete Setup" button** ✓
6. Complete onboarding
7. Button disappears ✓

### Console Output

You'll now see helpful debug logs:
```
Current user loaded: user@example.com type: firm_member
Firm member check: { memberData: null, memberError: null, userId: '...' }
No firm_members record found - onboarding incomplete
```

## 🧪 Testing

### Test Firm Member Flow
1. **Sign in as firm member** (the one that wasn't showing button)
2. Open browser console
3. ✅ Should see: "Current user loaded: ... type: firm_member"
4. ✅ Should see: "No firm_members record found - onboarding incomplete"
5. ✅ Should see profile icon in navigation
6. ✅ Should see "Complete Setup" button
7. Click button → Should go to `/onboarding/firm`

### Test All User Types
Each type should show button before onboarding:
- ✅ Founder → Button shows
- ✅ Investor → Button shows
- ✅ Firm Member → Button shows

After completing onboarding:
- ✅ All types → Button disappears

## 🔧 Technical Details

### Supabase Query Comparison

| Method | 0 Rows | 1 Row | 2+ Rows |
|--------|--------|-------|---------|
| `.single()` | ❌ Error | ✅ Data | ❌ Error |
| `.maybeSingle()` | ✅ null | ✅ Data | ❌ Error |
| `.limit(1)` | ✅ [] | ✅ [Data] | ✅ [Data] |

**Why `.maybeSingle()`?**
- Returns null when no record (expected for new users)
- No error handling needed for 0 rows
- Still validates exactly 1 row (not multiple)
- Perfect for 1-to-1 relationships

### Error Flow Comparison

**Before (with `.single()`):**
```
No record → Error thrown → Catch block → Wrong return value
```

**After (with `.maybeSingle()`):**
```
No record → Returns null → Check null → Correct return value
```

## 📂 Files Changed

| File | Changes |
|------|---------|
| `lib/onboarding.ts` | Changed all `.single()` to `.maybeSingle()`, added logging |

## ✅ Status

- ✅ Changed to `.maybeSingle()` for all user types
- ✅ Added comprehensive logging
- ✅ Added error handling
- ✅ No linting errors
- ✅ Ready for testing

---

**Fixed:** October 1, 2025  
**Issue:** Onboarding button and profile icon not showing for investors and firm members  
**Resolution:** Changed `.single()` to `.maybeSingle()` to handle missing records properly

