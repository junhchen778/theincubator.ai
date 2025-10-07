# Entity Extraction Feature - Deployment Guide

## Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Supabase project linked to your local environment
- OpenAI API key with access to GPT-4o-mini

## Step 1: Link Your Supabase Project (If Not Already Linked)

```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# You can find your project ref in Supabase Dashboard > Settings > General
```

## Step 2: Set Environment Secrets

The Edge Function requires the OpenAI API key to be set as a secret in Supabase.

```bash
# Set your OpenAI API key
supabase secrets set OPENAI_API_KEY=your-openai-api-key-here

# Verify the secret was set
supabase secrets list
```

**Note**: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available in Edge Functions.

## Step 3: Deploy the Edge Function

```bash
# Deploy the function (--no-verify-jwt allows database webhooks to call it)
supabase functions deploy extract-entities --no-verify-jwt

# Verify deployment
supabase functions list
```

You should see `extract-entities` in the list of deployed functions.

## Step 4: Configure Database Webhook

Set up automatic invocation when posts are created using Supabase Dashboard.

### Via Supabase Dashboard (Recommended):

1. **Navigate to Database → Webhooks** in your Supabase Dashboard

2. **Click "Create a new hook"**

3. **Configure the webhook**:
   - **Name**: `extract-entities-on-post-create`
   - **Table**: `posts`
   - **Events**: Check `INSERT` only (uncheck UPDATE and DELETE)
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/extract-entities`
     - Replace `YOUR_PROJECT_REF` with your actual project reference
   - **HTTP Headers**:
     - Click "Add new header"
     - **Name**: `Authorization`
     - **Value**: `Bearer YOUR_SUPABASE_ANON_KEY`
     - You can find your anon key in: Settings → API → Project API keys → `anon` `public`

4. **Enable the webhook** and click "Create webhook"

### Alternative: Via SQL (Advanced):

If you prefer to set up the webhook via SQL, run this in the SQL Editor:

```sql
-- Create the webhook for post creation
SELECT supabase_functions.create_webhook(
  name => 'extract-entities-on-post-create',
  table_name => 'posts',
  events => ARRAY['INSERT'],
  url => 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/extract-entities',
  headers => jsonb_build_object(
    'Authorization', 'Bearer YOUR_SUPABASE_ANON_KEY'
  )
);
```

## Step 5: Test the Implementation

### Test with Sample Post

Create a test post with metrics to verify extraction works:

```sql
-- Insert a test post via Supabase SQL Editor
INSERT INTO posts (author_id, company_id, content, milestone_tag)
VALUES (
  'YOUR_USER_ID',
  'YOUR_COMPANY_ID',
  'Excited to announce we just hit $50k MRR! 🎉 We also crossed 10,000 users today and grew 200% month-over-month. Our team has grown to 15 people!',
  'revenue_milestone'
);
```

### Verify Extraction

After creating the post, wait a few seconds then check the metadata:

```sql
-- Check the extracted metadata
SELECT id, content, metadata, created_at
FROM posts
WHERE content LIKE '%$50k MRR%'
ORDER BY created_at DESC
LIMIT 1;
```

You should see the `metadata` field populated with extracted entities like:

```json
{
  "revenue": { "amount": 50000, "type": "MRR", "currency": "USD" },
  "users": 10000,
  "growth_percentage": 200,
  "team_size": 15,
  "extracted_at": "2025-10-06T10:30:00.000Z"
}
```

## Step 6: Monitor Function Logs

View real-time logs to debug any issues:

```bash
# Watch logs in real-time
supabase functions logs extract-entities --follow

# View recent logs (last 50 invocations)
supabase functions logs extract-entities --limit 50
```

## Troubleshooting

### Function Not Triggering
- Verify webhook is enabled in Dashboard → Database → Webhooks
- Check that the URL includes your correct project reference
- Verify the Authorization header has the correct anon key

### Extraction Errors
- Check function logs: `supabase functions logs extract-entities`
- Verify OPENAI_API_KEY is set: `supabase secrets list`
- Check OpenAI API key has sufficient credits

### Database Update Errors
- Verify `metadata` column exists in `posts` table
- Check that the column type is `jsonb`

### Empty Metadata
- This is normal if the post doesn't contain explicit metrics
- Try with posts that include numbers, currency symbols, or milestone keywords

## Success Criteria

✅ Function deploys successfully  
✅ Webhook triggers on post creation  
✅ Metadata is extracted and saved to database  
✅ No errors in function logs  
✅ Post creation remains fast (extraction happens async)

## Next Steps

Once the feature is working:

1. **Display metrics in UI**: Show badges for extracted metrics on post cards
2. **Add filtering**: Allow users to filter posts by metrics (e.g., "Show all posts with >$100k MRR")
3. **Analytics dashboard**: Track company growth over time using extracted metrics
4. **Manual editing**: Allow founders to confirm/edit extracted metrics

## Support

If you encounter issues:
- Check Edge Function logs: `supabase functions logs extract-entities`
- Verify secrets are set: `supabase secrets list`
- Test the function manually via Supabase Dashboard → Edge Functions → extract-entities → Invoke
