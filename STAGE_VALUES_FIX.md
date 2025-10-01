# Stage Values Database Constraint Fix

## 🐛 Problem

Users were getting a database error when completing company onboarding:

```
Error code: 23514
Message: "new row for relation \"companies\" violates check constraint \"companies_stage_check\""
```

## 🔍 Root Cause

**Database Constraint:**
```sql
CHECK (stage = ANY (ARRAY[
  'pre-seed'::text,
  'seed'::text, 
  'series-a'::text,
  'series-b'::text,
  'series-c+'::text
]))
```

**Form Values (Wrong):**
```typescript
STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+']
```

**Mismatch:**
- ❌ Database expects: lowercase, hyphenated (`'pre-seed'`, `'series-a'`)
- ❌ Form was sending: capitalized, with spaces (`'Pre-Seed'`, `'Series A'`)

## ✅ Solution

### 1. Updated Constants (`lib/types.ts`)

**Before:**
```typescript
export const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+'];
```

**After:**
```typescript
export const STAGES = ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c+'];

// Display names for UI
export const STAGE_DISPLAY_NAMES: Record<string, string> = {
  'pre-seed': 'Pre-Seed',
  'seed': 'Seed',
  'series-a': 'Series A',
  'series-b': 'Series B',
  'series-c+': 'Series C+',
};
```

### 2. Updated StageBadge Component

Now uses display names for showing badges:
```typescript
const displayName = STAGE_DISPLAY_NAMES[stage] || stage;
return <Badge>{displayName}</Badge>;
```

### 3. Updated MultiSelect Component

Added `displayNames` prop to show user-friendly labels:
```typescript
interface MultiSelectProps {
  displayNames?: Record<string, string>;
  // ... other props
}
```

### 4. Updated All Onboarding Pages

**Company Onboarding:**
```typescript
<SelectItem key={stage} value={stage}>
  {STAGE_DISPLAY_NAMES[stage]}  // Shows "Series A"
</SelectItem>
// But stores "series-a" in database ✓
```

**Investor Onboarding:**
```typescript
<MultiSelect
  options={STAGES}
  displayNames={STAGE_DISPLAY_NAMES}
/>
```

**Firm Onboarding:**
```typescript
<MultiSelect
  options={STAGES}
  displayNames={STAGE_DISPLAY_NAMES}
/>
```

**Profile Edit:**
```typescript
<MultiSelect
  options={STAGES}
  displayNames={STAGE_DISPLAY_NAMES}
/>
```

## 🎯 Result

### Database Storage (Internal)
```
stage: 'pre-seed'    ✓
stage: 'series-a'    ✓
stage: 'series-c+'   ✓
```

### UI Display (User-facing)
```
Badge: "Pre-Seed"    ✓
Badge: "Series A"    ✓
Badge: "Series C+"   ✓
```

## 📋 Files Changed

| File | Changes |
|------|---------|
| `lib/types.ts` | Updated STAGES values, added STAGE_DISPLAY_NAMES |
| `components/stage-badge.tsx` | Uses display names for badges |
| `components/multi-select-component.tsx` | Added displayNames prop |
| `pages/onboarding/company.tsx` | Uses display names in select |
| `pages/onboarding/investor.tsx` | Uses display names in multi-select |
| `pages/onboarding/firm.tsx` | Uses display names in multi-select |
| `pages/profile-edit.tsx` | Uses display names in multi-select |

## 🧪 Testing

### Test Company Onboarding
1. Sign up as founder
2. Click "Complete Setup" button
3. Fill out company form
4. Select any stage (e.g., "Series A")
5. Complete onboarding
6. ✅ Should save successfully
7. ✅ Profile shows "Series A" badge

### Test Investor Onboarding
1. Sign up as investor
2. Select investment stages
3. Complete onboarding
4. ✅ Should save successfully
5. ✅ Profile shows stage badges with proper names

### Verify Database
```sql
SELECT name, stage FROM companies;
-- Should show: 'pre-seed', 'seed', 'series-a', etc.
```

## ✅ Status

- ✅ All files updated
- ✅ No linting errors
- ✅ Database constraint matches code
- ✅ UI displays user-friendly names
- ✅ Ready for testing

---

**Fixed:** October 1, 2025
**Issue:** Database constraint violation on company stage
**Resolution:** Aligned code values with database constraint, added display name mapping


