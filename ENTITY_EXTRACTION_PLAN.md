# Entity Extraction from Posts - Implementation Plan

## Overview
Automatically extract business metrics from posts (revenue, users, growth %, milestones, team size, funding) and save to `posts.metadata` field asynchronously.

## Feature Requirements
- Extract metrics when post is created
- Extracts: revenue (MRR/ARR), users, growth %, product milestones, team size, funding
- Saves to `posts.metadata` field (metadata is a jsonb column in posts table in Supabase)
- Runs asynchronously (doesn't block post creation)

## Implementation Steps

### 1. Create Entity Extraction Service
**File**: `server/entity-extraction-service.ts`

Create a new service similar to `ai-service.ts` that:
- Uses OpenAI (GPT-4o-mini) to extract structured data from post content
- Accepts post content as input
- Returns structured JSON with extracted entities

**Extraction Schema**:
```typescript
interface ExtractedEntities {
  revenue?: {
    amount: number;
    type: 'MRR' | 'ARR';
    currency?: string;
  };
  users?: number;
  growth_percentage?: number;
  product_milestones?: string[];
  team_size?: number;
  funding?: {
    amount: number;
    round?: string;
    currency?: string;
  };
  extracted_at: string;
}
```

**Prompt Template**:
```
Analyze this startup post and extract key business metrics.

Post Content:
{content}

Extract the following if mentioned:
1. Revenue (MRR or ARR) - amount and type
2. Number of users/customers
3. Growth percentage (e.g., "grew 50% MoM")
4. Product milestones (launches, releases, achievements)
5. Team size (number of employees)
6. Funding (amount raised, round type)

Return JSON format:
{
  "revenue": { "amount": 50000, "type": "MRR", "currency": "USD" },
  "users": 10000,
  "growth_percentage": 50,
  "product_milestones": ["Launched iOS app", "Hit Product Hunt #1"],
  "team_size": 15,
  "funding": { "amount": 2000000, "round": "Seed", "currency": "USD" }
}

Only include fields that are explicitly mentioned. Return empty object {} if no metrics found.
```

### 2. Define Metadata Type Schema
**File**: `client/src/lib/types.ts`

Add PostMetadata interface to existing types:
```typescript
export interface PostMetadata {
  revenue?: {
    amount: number;
    type: 'MRR' | 'ARR';
    currency?: string;
  };
  users?: number;
  growth_percentage?: number;
  product_milestones?: string[];
  team_size?: number;
  funding?: {
    amount: number;
    round?: string;
    currency?: string;
  };
  extracted_at?: string;
}
```

Update Post interface to use typed metadata:
```typescript
export interface Post {
  // ... existing fields
  metadata: PostMetadata | null;
  // ... rest of fields
}
```

### 3. Create and Deploy Edge Function

**Why Edge Functions?**
- Auto-scales to handle 1000+ posts/minute
- Built-in retry logic and error handling
- Runs serverless on Deno Deploy (globally distributed)
- No infrastructure management needed
- Pay only for actual usage

**Steps**:

1. **Create Edge Function**
   ```bash
   cd supabase/functions
   supabase functions new extract-entities
   ```

2. **Implement function** (`supabase/functions/extract-entities/index.ts`):
   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

   const EXTRACTION_PROMPT = (content: string) => `
Analyze this startup post and extract key business metrics.

Post Content:
${content}

Extract the following if explicitly mentioned:
1. Revenue (MRR or ARR) - amount and type
2. Number of users/customers
3. Growth percentage (e.g., "grew 50% MoM")
4. Product milestones (launches, releases, achievements)
5. Team size (number of employees)
6. Funding (amount raised, round type)

Return JSON format:
{
  "revenue": { "amount": 50000, "type": "MRR", "currency": "USD" },
  "users": 10000,
  "growth_percentage": 50,
  "product_milestones": ["Launched iOS app", "Hit Product Hunt #1"],
  "team_size": 15,
  "funding": { "amount": 2000000, "round": "Seed", "currency": "USD" }
}

Only include fields that are explicitly mentioned. Return empty object {} if no metrics found.
`

   serve(async (req) => {
     try {
       const { record } = await req.json()
       const postId = record.id
       const content = record.content

       console.log(`Extracting entities for post: ${postId}`)

       // Skip if content is too short
       if (!content || content.length < 20) {
         console.log('Content too short, skipping extraction')
         return new Response(JSON.stringify({ success: true, skipped: true }), { status: 200 })
       }

       // Call OpenAI for extraction
       const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           model: 'gpt-4o-mini',
           messages: [
             {
               role: 'system',
               content: 'You extract business metrics from startup posts. Return valid JSON only.'
             },
             {
               role: 'user',
               content: EXTRACTION_PROMPT(content)
             }
           ],
           temperature: 0.3,
           response_format: { type: 'json_object' },
         }),
       })

       if (!openaiResponse.ok) {
         throw new Error(`OpenAI API error: ${openaiResponse.statusText}`)
       }

       const { choices } = await openaiResponse.json()
       const entities = JSON.parse(choices[0].message.content || '{}')

       console.log('Extracted entities:', entities)

       // Update post metadata
       const supabase = createClient(
         Deno.env.get('SUPABASE_URL')!,
         Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
       )

       const { error: updateError } = await supabase
         .from('posts')
         .update({
           metadata: {
             ...entities,
             extracted_at: new Date().toISOString()
           }
         })
         .eq('id', postId)

       if (updateError) {
         throw new Error(`Database update error: ${updateError.message}`)
       }

       console.log(`Successfully extracted entities for post ${postId}`)
       return new Response(
         JSON.stringify({ success: true, entities }),
         { status: 200, headers: { 'Content-Type': 'application/json' } }
       )

     } catch (error) {
       console.error('Extraction error:', error)

       // Return 200 to prevent retries (already logged error)
       return new Response(
         JSON.stringify({
           success: false,
           error: error.message
         }),
         { status: 200, headers: { 'Content-Type': 'application/json' } }
       )
     }
   })
   ```

3. **Set Environment Secrets**:
   ```bash
   # Set OpenAI API key
   supabase secrets set OPENAI_API_KEY=your-api-key-here

   # Verify secrets are set
   supabase secrets list
   ```

4. **Deploy function**:
   ```bash
   # Deploy to Supabase (--no-verify-jwt allows database triggers to call it)
   supabase functions deploy extract-entities --no-verify-jwt

   # Verify deployment
   supabase functions list
   ```

### 4. Configure Database Trigger

Set up automatic invocation when posts are created.

**Using Database Webhooks** (Recommended - Easiest Setup):

1. **Navigate to Supabase Dashboard**
   - Go to: Database → Webhooks

2. **Create New Webhook**:
   - **Name**: `extract-entities-on-post-create`
   - **Table**: `posts`
   - **Events**: Check `INSERT` only
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://your-project-ref.supabase.co/functions/v1/extract-entities`
   - **HTTP Headers**:
     - Header: `Authorization`
     - Value: `Bearer YOUR_SUPABASE_ANON_KEY`

3. **Enable Webhook** and save

### 5. Error Handling & Monitoring

The Edge Function includes built-in error handling:

**Error Handling Strategy**:
- Gracefully handle OpenAI API failures
- Log errors to Supabase Edge Function logs
- Return 200 status even on failure (prevents retry storms)
- Store empty metadata object if extraction fails
- Monitor via Supabase Dashboard → Edge Functions → Logs

**Monitoring & Debugging**:
```bash
# View real-time logs
supabase functions logs extract-entities --follow

# View specific invocation
supabase functions logs extract-entities --limit 50
```

**Retry Logic**:
- Edge Functions automatically retry on network/timeout errors
- HTTP 5xx errors trigger automatic retries (up to 3 times)
- Exponential backoff between retries

## Files to Create/Modify

### New Files
- `supabase/functions/extract-entities/index.ts` - Edge function with extraction logic

### Modified Files
- `client/src/lib/types.ts` - Add PostMetadata interface

### Supabase Configuration
- Deploy Edge Function via CLI
- Configure database trigger on `posts` table to invoke Edge Function
- Set environment secrets (OPENAI_API_KEY)

## Configuration

**Environment Variables** (set in Supabase Edge Functions dashboard):
- `OPENAI_API_KEY` - Your OpenAI API key (copy from `.env`)
- `SUPABASE_URL` - Auto-populated by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-populated by Supabase

**Prerequisites**:
- Supabase CLI installed: `npm install -g supabase`
- Supabase project linked: `supabase link --project-ref your-project-ref`
- OpenAI API key with access to GPT-4o-mini

## Testing Strategy

### 1. Unit Tests
- Test extraction service with sample post content
- Verify correct entity parsing
- Test edge cases (no metrics, malformed content)

### 2. Integration Tests
Create test posts with various content:
```
- "Just hit $50k MRR! 🎉"
- "Crossed 10,000 users today"
- "Grew 200% month-over-month"
- "Raised $2M seed round led by Sequoia"
- "Team grew to 25 people"
- "Launched our iOS app - hit #1 on Product Hunt!"
```

### 3. Verification
- Check `posts.metadata` field in Supabase
- Verify extracted data accuracy
- Test error scenarios (API down, invalid content)
- Ensure post creation isn't blocked by extraction failures

## Future Enhancements

1. **Display Extracted Metrics in UI**
   - Show badges/pills for extracted metrics on post cards
   - Filter/search posts by metrics

2. **Analytics Dashboard**
   - Track company growth over time using extracted metrics
   - Visualize trends (revenue growth, user growth)

3. **Metric Validation**
   - Allow founders to confirm/edit extracted metrics
   - Flag uncertain extractions for review

4. **Enhanced Extraction**
   - Extract more entity types (partnerships, awards, media mentions)
   - Use Claude API for better extraction quality
   - Multi-language support

## Implementation Timeline

- **Step 1**: Add PostMetadata TypeScript types (15 minutes)
- **Step 2**: Create Edge Function with extraction logic (2-3 hours)
- **Step 3**: Deploy Edge Function and set secrets (30 minutes)
- **Step 4**: Configure database trigger (15 minutes)
- **Step 5**: Testing with sample posts (1-2 hours)
- **Step 6**: Monitoring and refinement (1-2 hours)

**Total Estimated Time**: 5-7 hours

## Success Metrics

- 80%+ of milestone posts have entities extracted
- Extraction completes within 5 seconds
- Zero impact on post creation latency
- <1% extraction error rate
