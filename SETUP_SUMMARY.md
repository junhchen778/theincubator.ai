# Incubator.ai - Database & Authentication Setup

## ✅ Completed Setup

### Part 1: Database Schema

All **12 tables** have been successfully created in Supabase with proper relationships and constraints:

#### Core Tables
1. **users** - Extends auth.users with profile information
2. **companies** - Startup company profiles
3. **company_founders** - Junction table linking founders to companies

#### Investor Tables
4. **individual_investors** - Individual investor profiles
5. **vc_firms** - VC firm profiles
6. **firm_members** - Junction table linking users to VC firms

#### Social Features
7. **posts** - User and company posts/updates
8. **post_likes** - Post engagement tracking
9. **post_comments** - Comments on posts

#### Engagement Tables
10. **company_follows** - Track who follows which companies
11. **company_interests** - Track investor interest in companies
12. **firm_notes** - Private notes VC firms make about companies

### Row Level Security (RLS)

✅ **RLS is enabled on all tables** with the following policies:

- **users**: Public SELECT, own profile UPDATE
- **companies**: Public SELECT, founder UPDATE
- **posts**: Public SELECT, author UPDATE/DELETE
- **firm_notes**: Only firm members can SELECT/INSERT
- **company_interests**: Founders can see interests on their companies
- All other tables have appropriate access policies

### Part 2: Authentication System

#### Files Created

1. **`client/src/lib/supabase.ts`** - Supabase client configuration
2. **`client/src/lib/auth.ts`** - Authentication utilities:
   - `signUp(email, password, fullName, userType)`
   - `signIn(email, password)`
   - `signOut()`
   - `getCurrentUser()`
   - `getSession()`
   - `onAuthStateChange(callback)`

3. **`client/src/pages/auth/sign-up.tsx`** - Sign up page with:
   - User type selection (3 interactive cards)
   - Form validation
   - Password confirmation
   - Automatic profile creation
   - Redirect to appropriate onboarding flow

4. **`client/src/pages/auth/sign-in.tsx`** - Sign in page with:
   - Email/password authentication
   - Error handling
   - Redirect to feed on success

5. **`client/src/pages/feed.tsx`** - Protected feed page

6. **`client/src/pages/onboarding/`** - Onboarding pages for:
   - `company.tsx` - Company setup
   - `investor.tsx` - Investor profile setup
   - `firm.tsx` - VC firm setup

7. **`client/src/components/protected-route.tsx`** - Route protection wrapper

8. **`client/src/components/navigation.tsx`** - Updated navigation with:
   - Auth state detection
   - Profile dropdown when logged in
   - Sign In/Sign Up buttons when logged out

9. **`client/src/App.tsx`** - Updated routing with all auth flows

## 🧪 Testing Checklist

### Database Tests
- [x] All 12 tables created successfully
- [x] RLS enabled on all tables
- [x] Foreign key relationships configured
- [x] Indexes created for performance
- [x] 10 migrations applied successfully

### Authentication Flow Tests

#### 1. Sign Up Flow
```
1. Navigate to /auth/sign-up
2. Select user type (Founder, Individual Investor, or VC Firm Member)
3. Fill in: Full Name, Email, Password, Confirm Password
4. Submit form
5. Should create user in auth.users and public.users
6. Should redirect to appropriate onboarding page:
   - Founder → /onboarding/company
   - Individual Investor → /onboarding/investor
   - VC Firm Member → /onboarding/firm
```

#### 2. Sign In Flow
```
1. Navigate to /auth/sign-in
2. Enter email and password
3. Submit form
4. Should redirect to /feed
5. Navigation should show profile dropdown
```

#### 3. Sign Out Flow
```
1. When logged in, click profile avatar
2. Click "Sign Out"
3. Should redirect to home page
4. Navigation should show Sign In/Sign Up buttons
```

#### 4. Protected Routes
```
Protected routes (should redirect to /auth/sign-in when not authenticated):
- /feed
- /onboarding/company
- /onboarding/investor
- /onboarding/firm
- /profile
```

#### 5. Navigation State
```
- When logged out: Shows "Sign In" and "Sign Up" buttons
- When logged in: Shows profile avatar with dropdown containing:
  - User's name and email
  - User type
  - Profile link
  - Feed link
  - Sign Out button
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd /home/runner/workspace
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Test Authentication

**Create a Founder Account:**
1. Go to http://localhost:5000/auth/sign-up
2. Select "Founder"
3. Fill in details (use a real email format)
4. Sign up and complete onboarding

**Create an Investor Account:**
1. Sign out
2. Go to /auth/sign-up
3. Select "Individual Investor"
4. Create account

**Create a VC Firm Member:**
1. Sign out
2. Go to /auth/sign-up
3. Select "VC Firm Member"
4. Create account

## 📊 Database Schema Overview

### Relationships

```
auth.users (Supabase Auth)
    ↓
users (public)
    ├── company_founders → companies
    ├── individual_investors
    ├── firm_members → vc_firms
    ├── posts → companies
    ├── post_likes → posts
    ├── post_comments → posts
    ├── company_follows → companies
    ├── company_interests → companies
    └── firm_notes → companies, vc_firms
```

### Key Features

- **Automatic UUIDs**: All tables use `gen_random_uuid()` for primary keys
- **Timestamps**: Created_at and updated_at fields where appropriate
- **Cascading Deletes**: Foreign keys configured with ON DELETE CASCADE/SET NULL
- **Indexes**: Created on frequently queried columns
- **JSONB Support**: For flexible data like investment_thesis
- **Array Support**: For tags, sectors, media_urls

## 🔐 Security Configuration

### Supabase Connection
- **Project URL**: https://xmvhinisflafruvzznqq.supabase.co
- **Keys**: Configured in `client/src/lib/supabase.ts`

### Session Management
- Sessions persist in localStorage
- Auto-refresh tokens enabled
- Session detection in URLs enabled

## 📝 Next Steps

1. **Implement Onboarding Flows**: Build out the company/investor/firm onboarding pages
2. **Create Feed Features**: Add post creation, comments, likes
3. **Add Search**: Implement search functionality
4. **Profile Pages**: Create user and company profile pages
5. **Dashboard**: Build analytics and management dashboards
6. **Notifications**: Implement real-time notifications
7. **Matching Algorithm**: Connect founders with relevant investors

## 🎉 Summary

✅ **Database**: 12 tables with full RLS policies  
✅ **Authentication**: Sign up, sign in, sign out flows  
✅ **Protected Routes**: Middleware for auth-only pages  
✅ **Navigation**: Dynamic auth state display  
✅ **User Types**: Support for Founders, Individual Investors, VC Firm Members  
✅ **Type Safety**: TypeScript interfaces for all data models  

Everything is ready for you to start building features! 🚀

