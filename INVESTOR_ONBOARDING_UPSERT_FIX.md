# Investor Onboarding Duplicate Key Error - Fix

## 🐛 Problem

When trying to complete investor onboarding, users got this error:

```
Error code: 23505
Message: "duplicate key value violates unique constraint \"individual_investors_user_id_key\""
```

The onboarding form would fail to save and show an error toast.

## 🔍 Root Cause

**Sequence of Events:**
1. User signed up as `individual_investor`
2. Sign-up code created base record in `individual_investors` table (with `user_id` but no `investment_thesis`)
3. User went to complete onboarding
4. Onboarding form tried to **INSERT** a new record
5. **Database rejected** it because `user_id` must be unique (constraint: `individual_investors_user_id_key`)

**The Code Issue:**
```typescript
// OLD CODE - Always tried to INSERT
const { error } = await supabase
  .from('individual_investors')
  .insert({
    user_id: user.id,
    investment_thesis: investmentThesis,
  });
```

This fails if a record already exists for that `user_id`.

## ✅ Solution

Changed from **INSERT** to **UPSERT** (update if exists, insert if new):

```typescript
// NEW CODE - Upsert (update or insert)
const { error } = await supabase
  .from('individual_investors')
  .upsert({
    user_id: user.id,
    investment_thesis: investmentThesis,
  }, {
    onConflict: 'user_id',  // If user_id already exists, update instead
  });
```

### How Upsert Works

**If record DOESN'T exist:**
```
INSERT INTO individual_investors (user_id, investment_thesis)
VALUES ('user-123', {...})
```

**If record ALREADY exists:**
```
UPDATE individual_investors
SET investment_thesis = {...}
WHERE user_id = 'user-123'
```

## 🎯 Why This Happened

The relationship between `users` and `individual_investors` is **1-to-1**:
- Each user can have only ONE investor profile
- `user_id` column has UNIQUE constraint
- Sign-up creates the base record
- Onboarding updates it with investment thesis

## 📊 Comparison with Other User Types

### Individual Investors (1-to-1)
```
users → individual_investors
(one user = one investor profile)
✅ FIXED: Use UPSERT
```

### Founders (1-to-many)
```
users → company_founders ← companies
(one user can found multiple companies)
✓ OK: Use INSERT (creates new relationships)
```

### Firm Members (1-to-many)
```
users → firm_members ← vc_firms
(one user can join multiple firms)
✓ OK: Use INSERT (creates new relationships)
```

## 🧪 Testing

### Test Completing Investor Onboarding

1. Sign in as investor
2. Click "Complete Setup" button
3. Fill out investment preferences:
   - Investment Stages: Select 1+ stages
   - Sectors: Select 1+ sectors
   - Geography (optional)
   - Check Size (optional)
   - Bio (optional)
   - LinkedIn URL (optional)
4. Click "Complete Profile"
5. ✅ Should save successfully
6. ✅ Redirected to feed
7. ✅ "Complete Setup" button disappears

### Test Re-running Onboarding (Edge Case)

1. Already completed investor onboarding
2. Manually navigate to `/onboarding/investor`
3. Change investment preferences
4. Click "Complete Profile"
5. ✅ Should update existing record (not error)
6. ✅ Profile reflects new preferences

## 🔧 Technical Details

### Database Constraint

```sql
CREATE UNIQUE INDEX individual_investors_user_id_key 
ON individual_investors(user_id);
```

This ensures one investor profile per user.

### Supabase Upsert Options

```typescript
.upsert(data, {
  onConflict: 'user_id',     // Column to check for conflicts
  ignoreDuplicates: false,   // Update on conflict (default)
})
```

### Alternative Approaches (Not Used)

**Option 1: Check First, Then Update/Insert**
```typescript
const { data: existing } = await supabase
  .from('individual_investors')
  .select('id')
  .eq('user_id', user.id)
  .single();

if (existing) {
  await supabase.from('individual_investors').update({...});
} else {
  await supabase.from('individual_investors').insert({...});
}
```
❌ More code, two database calls

**Option 2: Try INSERT, Catch Error, Then UPDATE**
```typescript
try {
  await supabase.from('individual_investors').insert({...});
} catch (error) {
  if (error.code === '23505') {
    await supabase.from('individual_investors').update({...});
  }
}
```
❌ Relies on catching errors, less clean

**✅ Option 3: UPSERT (Chosen)**
```typescript
await supabase.from('individual_investors').upsert({...}, {
  onConflict: 'user_id'
});
```
✅ Clean, single database call, handles both cases

## 📂 Files Changed

| File | Changes |
|------|---------|
| `pages/onboarding/investor.tsx` | Changed `.insert()` to `.upsert()` with `onConflict` |

## ✅ Status

- ✅ Upsert implemented
- ✅ Handles both new and existing records
- ✅ No duplicate key errors
- ✅ No linting errors
- ✅ Ready for testing

---

**Fixed:** October 1, 2025  
**Issue:** Duplicate key error when completing investor onboarding  
**Resolution:** Changed INSERT to UPSERT to handle existing records


