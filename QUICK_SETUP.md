# Quick Setup - Email Verification Fix

## ✅ What I Fixed

1. **Email Verification Screen** - Users now see a clear "Check your email" message after signup
2. **Auth Callback Handler** - Created `/auth/callback` to handle email verification links
3. **Redirect URL** - Configured proper redirect URLs so email links work correctly

## 🚀 Quick Start (2 Steps)

### Step 1: Configure Supabase Redirect URL

You **MUST** add the callback URL to Supabase, otherwise email links won't work.

**Go to Supabase Dashboard:**
1. Visit: https://supabase.com/dashboard/project/xmvhinisflafruvzznqq/auth/url-configuration
2. Scroll to **"Redirect URLs"** section
3. Add this URL:
   ```
   http://localhost:5000/auth/callback
   ```
4. Click **Save**

### Step 2: Test the Flow

```bash
# Make sure dev server is running
npm run dev
```

Then:
1. Go to http://localhost:5000/auth/sign-up
2. Fill in the signup form
3. You should see: **"Check your email"** screen ✅
4. Check your email and click the verification link
5. You should see: **"Verifying your email..."** then success! ✅
6. You'll be redirected to onboarding ✅

## 🎯 What You'll See Now

### After Clicking "Sign Up"
```
┌─────────────────────────────────┐
│   ✉️  Check your email          │
│                                 │
│  We've sent a verification link │
│  to your@email.com              │
│                                 │
│  Next steps:                    │
│  1. Check your email inbox      │
│  2. Click the verification link │
│  3. You'll be redirected back   │
└─────────────────────────────────┘
```

### After Clicking Email Link
```
┌─────────────────────────────────┐
│   ✓  Email verified!            │
│                                 │
│  Your email has been verified   │
│  successfully! Redirecting...   │
└─────────────────────────────────┘
```

## ⚡ Optional: Skip Email Verification (Dev Only)

If you want to skip email verification during development:

1. Go to: https://supabase.com/dashboard/project/xmvhinisflafruvzznqq/auth/providers
2. Click on **Email** provider
3. Turn **OFF** "Confirm email"
4. Click **Save**

Now signups will work immediately without email verification!

⚠️ **Remember to turn it back ON for production!**

## 📁 Files Changed

- ✅ `client/src/pages/auth/sign-up.tsx` - Added email verification screen
- ✅ `client/src/pages/auth/callback.tsx` - New callback handler
- ✅ `client/src/lib/auth.ts` - Added redirect URL
- ✅ `client/src/App.tsx` - Added callback route

## 🐛 Troubleshooting

### "Invalid redirect URL" error
→ Add `http://localhost:5000/auth/callback` to Supabase redirect URLs

### Still seeing old behavior
→ Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Email link shows ERR_CONNECTION_REFUSED
→ Make sure `npm run dev` is running when you click the email link

---

**Ready to test!** Just add the redirect URL to Supabase and try signing up. 🚀

