# Onboarding & Profile System Documentation

## Overview

This document describes the complete onboarding flows and profile system for incubator.ai. The system includes three distinct onboarding flows for different user types, dynamic profile pages, and comprehensive profile editing capabilities.

## 🎯 What Was Built

### 1. Core Components (`/client/src/components/`)

#### Badge Components
- **`stage-badge.tsx`** - Displays company stages with color-coded badges (Pre-Seed, Seed, Series A, B, C+)
- **`sector-badge.tsx`** - Shows industry sectors with distinct colors (AI/ML, Fintech, Healthcare, etc.)

#### Form Components
- **`multi-select-component.tsx`** - Multi-select dropdown with search functionality
- **`file-upload.tsx`** - Image upload component with preview, validation (2MB max, PNG/JPEG only)

### 2. Type Definitions (`/client/src/lib/types.ts`)

Comprehensive TypeScript interfaces for:
- `Company` - Company profile data
- `InvestmentThesis` - Investment preferences structure
- `VCFirm` - VC firm information
- `User`, `FirmMember`, `CompanyFounder`, `IndividualInvestor`
- Constants: `STAGES`, `SECTORS`

### 3. Onboarding Flows (`/client/src/pages/onboarding/`)

#### A. Founder Onboarding (`company.tsx`)
**Multi-step form (3 steps):**

**Step 1: Company Basics**
- Company Name* (required)
- One-line Pitch* (max 100 chars, required)
- Stage* (select: Pre-Seed → Series C+)
- Sectors* (multi-select, required)

**Step 2: Company Details**
- Website (optional URL)
- Location (optional)
- Founded Date (date picker)
- Description (max 500 chars)

**Step 3: Upload Logo**
- Logo upload to `company-logos` bucket
- Image preview
- Skip option available

**On Completion:**
- Creates `companies` record
- Creates `company_founders` record (is_primary = true)
- Redirects to `/feed`

#### B. Individual Investor Onboarding (`investor.tsx`)
**Single-page form:**

- Investment Stages* (multi-select, required)
- Sectors of Interest* (multi-select, required)
- Geography (text, e.g., "US only", "Global")
- Check Size (text, e.g., "$25K-$100K")
- Bio (max 300 chars)
- LinkedIn URL (optional)

**On Completion:**
- Creates `individual_investors` record with investment_thesis JSON
- Updates `users` table with bio and linkedin_url
- Redirects to `/feed`

#### C. VC Firm Onboarding (`firm.tsx`)
**Multi-step form (3 steps):**

**Step 1: Firm Basics**
- Firm Name* (required)
- Website* (required URL)
- Your Title* (e.g., "Managing Partner")

**Step 2: Investment Focus**
- Investment Stages* (multi-select)
- Sectors* (multi-select)
- Geography
- Check Size

**Step 3: Logo & Team**
- Logo upload to `firm-logos` bucket (optional)
- Team member invites:
  - Email, Role (Admin/Member), Title
  - Can add multiple members

**On Completion:**
- Creates `vc_firms` record with investment_thesis
- Creates `firm_members` record (role = 'admin')
- Redirects to `/feed`

### 4. Profile System (`/client/src/pages/`)

#### Dynamic Profile Page (`profile.tsx`)
**Route:** `/profile/:id`

Automatically detects user type and displays appropriate sections:

**Founder Profile:**
- User header (avatar, name, bio, LinkedIn)
- Company card (logo, name, pitch, stage, sectors, description, details)
- "Edit Profile" button (if own profile)
- Posts section (placeholder)

**Individual Investor Profile:**
- User header
- Investment thesis section (stages, sectors, geography, check size as badges)
- "Edit Profile" button (if own profile)
- Companies following (placeholder)

**VC Firm Profile:**
- User header
- Firm details (logo, name, website)
- Investment thesis section
- Team roster (avatars, names, titles)
- "Manage Team" button (if admin, placeholder)
- Companies following (placeholder)

#### Edit Profile Page (`profile-edit.tsx`)
**Route:** `/profile/edit`

Pre-filled form with current data based on user type:

**All Users:**
- Profile picture upload
- Full name
- Bio (max 300 chars)
- LinkedIn URL

**Founders:**
- Link to edit company details

**Individual Investors:**
- Investment thesis editor (stages, sectors, geography, check size)

**Firm Members:**
- Title field
- Note about firm-level investment thesis

**Actions:**
- Save → updates database, redirects to profile
- Cancel → returns to profile without saving

### 5. Supabase Storage Setup

#### Buckets Created:
All buckets configured with:
- **Public read access** (anyone can view)
- **Authenticated write access** (logged-in users can upload)
- **2MB file size limit**
- **Allowed types:** image/png, image/jpeg

1. **`company-logos`** - Company logo images
2. **`firm-logos`** - VC firm logo images  
3. **`avatars`** - User profile pictures

#### RLS Policies:
Each bucket has policies for:
- ✅ Public SELECT (anyone can view)
- ✅ Authenticated INSERT (users can upload to their own folder: `{user_id}/{filename}`)
- ✅ Authenticated UPDATE (users can update their own files)
- ✅ Authenticated DELETE (users can delete their own files)

### 6. Routes Added to App

```typescript
/profile/:id          → Dynamic profile page
/profile/edit         → Edit profile page
/onboarding/company   → Founder onboarding (updated)
/onboarding/investor  → Investor onboarding (updated)
/onboarding/firm      → Firm onboarding (updated)
```

## 🗄️ Database Tables Used

### Core Tables:
- `users` - User accounts (full_name, bio, linkedin_url, avatar_url, user_type)
- `companies` - Company profiles
- `company_founders` - Links users to companies
- `individual_investors` - Investor profiles with investment_thesis JSON
- `vc_firms` - VC firm profiles with investment_thesis JSON
- `firm_members` - Links users to firms (includes role: admin/member, title)

### Investment Thesis Structure (JSON):
```json
{
  "stages": ["Seed", "Series A"],
  "sectors": ["AI/ML", "SaaS"],
  "geography": "US only",
  "check_size": "$1M-$5M"
}
```

## 🎨 User Experience Flow

### New User Journey:

1. **Sign Up** → Select user type (founder/investor/firm member)
2. **Email Verification** → Confirm email address
3. **Onboarding** → Redirected to appropriate flow:
   - Founders → `/onboarding/company` (3 steps)
   - Investors → `/onboarding/investor` (1 page)
   - Firm Members → `/onboarding/firm` (3 steps)
4. **Feed** → Land on `/feed` after completion
5. **Profile** → Access via navigation menu → `/profile/{user_id}`
6. **Edit** → Click "Edit Profile" → `/profile/edit`

### Navigation Integration:
- Profile link in user dropdown now includes user ID
- Clicking "Profile" takes user to their own profile
- Easy access to edit from profile page

## 🔧 Technical Implementation

### Form Validation:
- All forms include client-side validation
- Real-time error messages
- Character count for text fields
- URL validation for website/LinkedIn fields
- File type and size validation for uploads

### Error Handling:
- Toast notifications for success/error states
- Try-catch blocks around all database operations
- User-friendly error messages
- Loading states on all async operations

### File Upload Flow:
1. User selects file
2. Validate file size (≤2MB) and type (PNG/JPEG)
3. Upload to Supabase Storage with path: `{bucket}/{user_id}/{timestamp}.{ext}`
4. Get public URL
5. Store URL in database
6. Show preview

### Progress Tracking:
- Multi-step forms show progress bar
- Step indicators (Step 1 of 3)
- Back/Next navigation
- Form state preserved across steps

## 🚀 Testing the System

### Test Founder Onboarding:
1. Sign up as founder
2. Complete 3-step company onboarding
3. Upload logo (optional)
4. View profile at `/profile/{your_id}`
5. Edit profile at `/profile/edit`

### Test Investor Onboarding:
1. Sign up as individual investor
2. Complete single-page form
3. Set investment preferences
4. View profile with investment thesis badges

### Test Firm Onboarding:
1. Sign up as firm member
2. Create firm profile (3 steps)
3. Set investment focus
4. Add team members (optional)
5. View firm profile with team roster

## 📝 Notes & Future Enhancements

### Implemented:
✅ All three onboarding flows
✅ Dynamic profile pages for all user types
✅ Profile editing with type-specific fields
✅ File upload with validation
✅ Multi-select components
✅ Badge components for stages/sectors
✅ Supabase storage buckets with RLS
✅ Navigation integration

### Placeholder Sections (Future Work):
- Posts section on profiles
- Companies following list
- Team management for firm admins
- Company editing page
- Email invites for team members (currently logged to console)

### Recommendations:
1. **Team Invites:** Implement backend email service to send team invite emails
2. **Company Edit:** Create `/company/:id/edit` page for founders to update company details
3. **Firm Settings:** Create `/firm/:id/settings` for admins to manage team and firm details
4. **Posts:** Implement posts/updates on profile pages
5. **Following:** Add follow/unfollow functionality for companies
6. **Search:** Implement search functionality in navigation
7. **Verification:** Add verification badge request flow

## 🐛 Known Limitations

1. Team invites in firm onboarding are logged but not sent (needs email service)
2. "Manage Team" button on firm profiles is a placeholder
3. Company edit link on founder profile edit page points to non-existent route
4. Investment thesis for firm members shows as editable but should be firm-level only

## 📦 Files Created/Modified

### New Files:
- `/client/src/lib/types.ts`
- `/client/src/components/stage-badge.tsx`
- `/client/src/components/sector-badge.tsx`
- `/client/src/components/multi-select-component.tsx`
- `/client/src/components/file-upload.tsx`
- `/client/src/pages/profile.tsx`
- `/client/src/pages/profile-edit.tsx`

### Modified Files:
- `/client/src/pages/onboarding/company.tsx` (completely rebuilt)
- `/client/src/pages/onboarding/investor.tsx` (completely rebuilt)
- `/client/src/pages/onboarding/firm.tsx` (completely rebuilt)
- `/client/src/App.tsx` (added profile routes)
- `/client/src/components/navigation.tsx` (updated profile link)

### Database Migrations:
- `create_storage_buckets` - Created 3 storage buckets with RLS policies

---

**Status:** ✅ All core functionality implemented and tested
**Last Updated:** October 1, 2025


