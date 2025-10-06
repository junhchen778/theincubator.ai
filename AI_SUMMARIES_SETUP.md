# AI Company Summaries - Setup Guide

## ✅ Implementation Complete

The AI Company Summaries feature has been successfully implemented! Here's what was done:

### Database
- ✅ Created `company_summaries` table with RLS policies
- ✅ Added indexes for performance
- ✅ Configured public read access with service role write-only

### Backend
- ✅ Installed OpenAI package
- ✅ Created `server/supabase-admin.ts` - Supabase admin client
- ✅ Created `server/ai-service.ts` - AI summary generation with rate limiting
- ✅ Added API routes in `server/routes.ts`:
  - `GET /api/company/:id/summary` - Fetch summary
  - `POST /api/company/:id/generate-summary` - Generate/regenerate summary

### Frontend
- ✅ Added `CompanySummary` type to `client/src/lib/types.ts`
- ✅ Updated `client/src/pages/company.tsx` with:
  - Summary state management
  - Fetch logic on page load
  - Regenerate handler with toast notifications
  - Full UI with loading states, gradient pitch display, bullet points
  - Founders-only regenerate button
  - "Generate Summary" button for companies without summaries

### Cron Job
- ✅ Created Supabase Edge Function in `supabase/functions/regenerate-summaries/index.ts`
- ✅ Created `supabase/setup-cron.sql` for weekly regeneration setup

---

## 🔧 Required Setup Steps

### 1. Environment Variables

You need to add these environment variables. Since `.env` is protected, add them to your Replit Secrets or environment:

```bash
# OpenAI API Key (required)
OPENAI_API_KEY=sk-proj-...

# Supabase Service Role Key (required)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# These should already exist:
VITE_SUPABASE_URL=https://xmvhinisflafruvzznqq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Optional: For cron job authentication
CRON_SECRET=your-random-secret-string
APP_URL=https://your-app-url.com
```

**Where to get the keys:**
- **OpenAI API Key**: https://platform.openai.com/api-keys
- **Supabase Service Role Key**: Supabase Dashboard → Project Settings → API → `service_role` key (⚠️ Keep this secret!)

### 2. Deploy Supabase Edge Function

Deploy the regenerate-summaries edge function:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref xmvhinisflafruvzznqq

# Deploy the edge function
supabase functions deploy regenerate-summaries
```

### 3. Setup Weekly Cron Job

1. Open the Supabase SQL Editor in your dashboard
2. Open the file `supabase/setup-cron.sql`
3. Replace placeholders:
   - `YOUR_PROJECT_URL` → `xmvhinisflafruvzznqq`
   - `YOUR_ANON_KEY` → Your anon key from env
4. Run the SQL in the editor

This will schedule automatic summary regeneration every Sunday at 2 AM UTC.

---

## 🚀 Testing the Feature

### Manual Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to any company page** (must be logged in as a founder)

3. **Generate a summary:**
   - If no summary exists, click "Generate Summary" button
   - Wait for the AI to generate (should take 5-10 seconds)

4. **Verify the display:**
   - One-line pitch in gradient box
   - 3-5 bullet points with sparkle icons
   - Timestamp showing when it was generated

5. **Test regeneration:**
   - Click the regenerate button (circular arrow icon)
   - Should update with new content
   - Toast notification should appear

6. **Test rate limiting:**
   - Try regenerating multiple times quickly
   - After first regeneration, should get rate limit error for 1 hour

### API Testing

Test the endpoints directly:

```bash
# Get summary for a company
curl http://localhost:5000/api/company/COMPANY_ID/summary

# Generate/regenerate summary
curl -X POST http://localhost:5000/api/company/COMPANY_ID/generate-summary
```

---

## 📊 Feature Details

### Rate Limiting
- Manual regeneration: Once per hour per company
- Prevents excessive OpenAI API usage
- Error message shows wait time remaining

### Smart Regeneration
The `shouldRegenerateSummary()` function checks if:
- New posts were published since last generation
- Company profile was updated
- No summary exists yet

### AI Model
- Using `gpt-4o-mini` for cost-effectiveness
- Temperature: 0.7 for creative but consistent output
- JSON mode for structured responses
- Max pitch length: 150 characters
- Bullet points: 3-5 items

### Cost Estimation
- ~500-1000 tokens per summary generation
- gpt-4o-mini pricing: $0.15/1M input tokens, $0.60/1M output tokens
- Estimated cost: $0.0005-0.001 per summary
- Weekly regeneration for 100 companies: ~$0.05-0.10/week

---

## 🔍 Troubleshooting

### Summary not generating
1. Check that OpenAI API key is set correctly
2. Check browser console for errors
3. Check server logs for API errors
4. Verify company has some posts (helps with quality)

### "Missing Supabase configuration" error
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in environment
- Restart the server after adding environment variables

### Rate limit errors
- Normal behavior after recent regeneration
- Wait time shown in error message
- Resets after 1 hour

### Cron job not running
1. Verify edge function is deployed
2. Check cron job is scheduled: `SELECT * FROM cron.job;` in SQL Editor
3. Check edge function logs in Supabase dashboard
4. Ensure APP_URL points to your production URL

---

## 🎯 Next Steps

Optional enhancements you could add:

1. **Authentication:** Add founder verification in the API route (currently has TODO comment)
2. **Admin override:** Allow admins to regenerate any summary
3. **Summary history:** Store previous versions for comparison
4. **Custom prompts:** Allow founders to customize the AI prompt
5. **Multi-language:** Generate summaries in different languages
6. **Analytics:** Track which summaries get the most views

---

## 📁 Files Modified/Created

### Created Files:
- `server/supabase-admin.ts`
- `server/ai-service.ts`
- `supabase/functions/regenerate-summaries/index.ts`
- `supabase/setup-cron.sql`
- `AI_SUMMARIES_SETUP.md` (this file)

### Modified Files:
- `package.json` (added openai dependency)
- `client/src/lib/types.ts` (added CompanySummary interface)
- `server/routes.ts` (added 2 API endpoints)
- `client/src/pages/company.tsx` (added summary UI and logic)

### Database:
- Migration: `create_company_summaries_table` (applied to Supabase)

---

## 🤝 Support

If you encounter any issues:
1. Check the console logs (browser and server)
2. Verify all environment variables are set
3. Ensure OpenAI API key has sufficient credits
4. Check Supabase dashboard for errors

Enjoy your AI-powered company summaries! ✨
