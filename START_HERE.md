# 🎯 START HERE - Quick Fix for Email Redirect

## The Problem
Email confirmation links were going to `http://localhost:5000/?code=...` but the app wasn't handling it, causing "ERR_CONNECTION_REFUSED".

## ✅ The Fix (Applied)
I created a global auth handler that automatically:
- Detects the code in the URL
- Exchanges it for a session  
- Redirects you to onboarding
- Works from ANY path!

## 🚀 Quick Setup (2 Steps)

### Step 1: Update Supabase Redirect URL

**Click this link:**
https://supabase.com/dashboard/project/xmvhinisflafruvzznqq/auth/url-configuration

**In the "Redirect URLs" section, make sure you have:**
```
http://localhost:5000
```

(Just the root URL - no `/auth/callback` needed!)

**Click "Save"**

### Step 2: Test It

**The dev server should be starting now. Wait a moment, then:**

1. Open: http://localhost:5000/auth/sign-up

2. Sign up with your email

3. Check your email and click the verification link

4. **What should happen:**
   - ✅ Opens to `http://localhost:5000/?code=...`
   - ✅ You see loading briefly
   - ✅ Redirected to onboarding
   - ✅ You're logged in!

## 🐛 Troubleshooting

### "ERR_CONNECTION_REFUSED"
→ Check that dev server is running:
```bash
npm run dev
```

### "Invalid redirect URL"  
→ Make sure you saved `http://localhost:5000` in Supabase (Step 1 above)

### Still redirecting to wrong URL
→ Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Want to see what's happening?
→ Open browser console (F12) - you'll see helpful logs

## 🎉 That's It!

Once you update Supabase (Step 1) and the dev server is running, email verification should work perfectly.

The email link will open your app, exchange the code, and log you in automatically. No more connection refused errors!

---

**Need help?** Let me know and I'll debug further!

