# Testing Guide - Incubator.ai Authentication

## Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

The app should be running at `http://localhost:5000`

## Test Scenarios

### ✅ Test 1: Sign Up as Founder

1. Navigate to `http://localhost:5000/auth/sign-up`
2. Click on **"Founder"** card
3. Fill in the form:
   - Full Name: `John Founder`
   - Email: `john@startup.com`
   - Password: `password123`
   - Confirm Password: `password123`
4. Click **"Sign Up"**

**Expected Result:**
- User account created in Supabase Auth
- Profile created in `public.users` table with `user_type = 'founder'`
- Redirected to `/onboarding/company`
- Navigation shows profile avatar dropdown

### ✅ Test 2: Sign Out

1. Click on the profile avatar in the top-right
2. Click **"Sign Out"**

**Expected Result:**
- Session cleared
- Redirected to home page
- Navigation shows "Sign In" and "Sign Up" buttons

### ✅ Test 3: Sign In

1. Navigate to `http://localhost:5000/auth/sign-in`
2. Enter credentials:
   - Email: `john@startup.com`
   - Password: `password123`
3. Click **"Sign In"**

**Expected Result:**
- Successfully authenticated
- Redirected to `/feed`
- Navigation shows profile dropdown with user info

### ✅ Test 4: Sign Up as Individual Investor

1. Sign out (if logged in)
2. Go to `/auth/sign-up`
3. Select **"Individual Investor"**
4. Fill in form:
   - Full Name: `Jane Investor`
   - Email: `jane@investor.com`
   - Password: `password123`
   - Confirm Password: `password123`
5. Click **"Sign Up"**

**Expected Result:**
- User account created with `user_type = 'individual_investor'`
- Profile created in `individual_investors` table
- Redirected to `/onboarding/investor`

### ✅ Test 5: Sign Up as VC Firm Member

1. Sign out
2. Go to `/auth/sign-up`
3. Select **"VC Firm Member"**
4. Fill in form:
   - Full Name: `Bob VC`
   - Email: `bob@vc.com`
   - Password: `password123`
   - Confirm Password: `password123`
5. Click **"Sign Up"**

**Expected Result:**
- User account created with `user_type = 'firm_member'`
- Redirected to `/onboarding/firm`

### ✅ Test 6: Protected Routes

1. Sign out (if logged in)
2. Try to navigate directly to:
   - `http://localhost:5000/feed`
   - `http://localhost:5000/onboarding/company`
   - `http://localhost:5000/profile`

**Expected Result:**
- All protected routes redirect to `/auth/sign-in`

### ✅ Test 7: Navigation State

**When Logged Out:**
- Shows "Sign In" button
- Shows "Sign Up" button
- Search bar is hidden

**When Logged In:**
- Shows profile avatar
- Search bar is visible
- Clicking avatar shows dropdown with:
  - User's name and email
  - User type (capitalized)
  - "Profile" link
  - "Feed" link
  - "Sign Out" button

## Verify Database

You can verify the database using Supabase Studio or by running SQL queries:

```sql
-- Check users table
SELECT * FROM public.users;

-- Check individual investors
SELECT * FROM public.individual_investors;

-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Common Issues

### Issue: "User already registered"
**Solution:** Use a different email or check Supabase Auth dashboard to delete test users

### Issue: "Invalid login credentials"
**Solution:** Verify email and password are correct, or reset password

### Issue: Protected routes not redirecting
**Solution:** Clear browser cache and localStorage, then try again

### Issue: Profile dropdown not showing
**Solution:** Check browser console for errors, verify Supabase connection

## Database Verification Checklist

- [ ] 12 tables created in Supabase
- [ ] RLS enabled on all tables
- [ ] Can create user of each type (founder, investor, firm member)
- [ ] Auth state persists on page reload
- [ ] Sign out clears session properly
- [ ] Protected routes redirect when not authenticated

## Next Steps After Testing

Once all tests pass, you can proceed with:

1. **Complete Onboarding Flows** - Build out the company/investor/firm setup forms
2. **Feed Implementation** - Create post creation, feed display, likes, comments
3. **Company Profiles** - Build company detail pages
4. **Search Functionality** - Implement search for founders and investors
5. **Matching System** - Connect founders with relevant investors

## Support

If you encounter any issues:
1. Check browser console for errors
2. Check Supabase logs in the dashboard
3. Verify environment variables are set correctly
4. Review `SETUP_SUMMARY.md` for configuration details

