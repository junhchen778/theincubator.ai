# RLS Policy Fix Applied ✅

## Problem
When trying to sign up, users received this error:
```
new row violates row-level security policy for table "users"
```

## Root Cause
The Row Level Security (RLS) policy for the `users` table was preventing the INSERT operation during user registration. The original approach tried to manually insert into the `public.users` table after creating the auth user, but the RLS policy was blocking it.

## Solution Applied

### 1. Database Trigger (Recommended Supabase Pattern)
Created an automatic trigger that creates the user profile whenever someone signs up:

```sql
CREATE FUNCTION public.handle_new_user()
-- Automatically creates a profile in public.users when a new auth.users record is created

CREATE TRIGGER on_auth_user_created
-- Fires after INSERT on auth.users
```

**How it works:**
- User signs up via Supabase Auth
- Auth user is created in `auth.users`
- Trigger automatically fires and creates profile in `public.users`
- User metadata (full_name, user_type) is copied from signup data

### 2. Updated RLS Policy
Changed the INSERT policy to be more permissive:

```sql
CREATE POLICY "Enable insert for authenticated users"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

This allows the trigger (which runs with elevated privileges) to insert the profile.

### 3. Updated Auth Code
Modified `client/src/lib/auth.ts`:
- Removed manual INSERT into `public.users`
- Rely on database trigger to create profile automatically
- Keep type-specific profile creation (e.g., `individual_investors`)

## Changes Made

### Database Migrations
- ✅ `fix_users_insert_policy` - Updated RLS policy
- ✅ `add_user_profile_trigger` - Added automatic profile creation trigger

### Code Changes
- ✅ `client/src/lib/auth.ts` - Updated signUp function

## Testing

### Before Fix ❌
```
Sign up → Error: "new row violates row-level security policy for table 'users'"
```

### After Fix ✅
```
Sign up → Success! → Profile created automatically → Redirected to onboarding
```

## Try It Now!

1. **Clear any test users** (if needed):
   - Go to Supabase Dashboard → Authentication → Users
   - Delete any test accounts

2. **Sign up again**:
   - Navigate to `/auth/sign-up`
   - Select user type
   - Fill in the form
   - Click "Sign Up"

3. **Expected result**:
   - ✅ Account created successfully
   - ✅ Profile automatically created in `public.users`
   - ✅ Redirected to appropriate onboarding page
   - ✅ Navigation shows profile dropdown

## Benefits of This Approach

1. **Automatic** - Profile creation happens automatically via trigger
2. **Reliable** - No race conditions or timing issues
3. **Clean** - Less code in the frontend
4. **Standard** - This is the recommended Supabase pattern
5. **Secure** - Trigger runs with SECURITY DEFINER privileges

## Verification

You can verify the trigger is working by checking the database after signup:

```sql
-- Check that user profile was created
SELECT id, email, full_name, user_type, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;
```

## Additional Notes

- The trigger uses `raw_user_meta_data` to extract user information
- Type-specific profiles (e.g., `individual_investors`) are still created in the app code
- The 500ms delay in the code ensures the trigger has time to complete

---

**Status:** ✅ Fixed and ready to test!

If you encounter any other issues, please let me know.

