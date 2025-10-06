# AI Company Summaries - Implementation Plan

## Feature Overview
Auto-generate AI-powered company summaries from profile data and recent posts, displayed on company pages with weekly auto-regeneration.

## Requirements
- Auto-generate company summary from profile + recent posts
- Display summary on company page with sparkles icon
- 1 one-line pitch + 3-5 bullet points
- "Regenerate" button for founders only
- Shows last updated timestamp
- Weekly auto-regeneration via cron job

---

## 1. Database Schema Updates

### New Table: `company_summaries`
Add to Supabase database:

```sql
CREATE TABLE company_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID UNIQUE NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  summary_pitch TEXT NOT NULL,
  summary_bullets TEXT[] NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX idx_company_summaries_company_id ON company_summaries(company_id);

-- Add RLS policies
ALTER TABLE company_summaries ENABLE ROW LEVEL SECURITY;

-- Anyone can read summaries
CREATE POLICY "Summaries are viewable by everyone"
  ON company_summaries FOR SELECT
  USING (true);

-- Only system can insert/update (via service role)
CREATE POLICY "Summaries can only be modified by service role"
  ON company_summaries FOR ALL
  USING (false);
```

### Update TypeScript Types
Location: `client/src/lib/database.types.ts` (auto-generated from Supabase)

Add manual type in `client/src/lib/types.ts`:
```typescript
export interface CompanySummary {
  id: string;
  company_id: string;
  summary_pitch: string;
  summary_bullets: string[];
  generated_at: string;
  updated_at: string;
}
```

---

## 2. AI Integration Setup

### Install Dependencies
```bash
npm install openai
```

### Environment Variables
Add to `.env`:
```env
OPENAI_API_KEY=sk-...
```

### Create AI Service Module
**File**: `server/ai-service.ts`

```typescript
import OpenAI from 'openai';
import { supabase } from './supabase-admin'; // Service role client

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateCompanySummary(companyId: string) {
  // 1. Fetch company data
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  // 2. Fetch recent posts (last 15)
  const { data: posts } = await supabase
    .from('posts')
    .select('content, milestone_tag, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(15);

  // 3. Build prompt
  const prompt = buildPrompt(company, posts);

  // 4. Call OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert at analyzing startups and creating concise, compelling summaries.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
  });

  // 5. Parse response
  const response = completion.choices[0].message.content;
  const parsed = parseAIResponse(response);

  // 6. Store in database
  const { data: summary, error } = await supabase
    .from('company_summaries')
    .upsert({
      company_id: companyId,
      summary_pitch: parsed.pitch,
      summary_bullets: parsed.bullets,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  return summary;
}

function buildPrompt(company: any, posts: any[]) {
  return `
Analyze this startup and create a compelling summary.

Company Profile:
- Name: ${company.name}
- Pitch: ${company.one_line_pitch || 'N/A'}
- Description: ${company.description || 'N/A'}
- Stage: ${company.stage}
- Sector: ${company.sector?.join(', ') || 'N/A'}
- Location: ${company.location || 'N/A'}

Recent Updates:
${posts.map(p => `- ${p.content.substring(0, 200)} ${p.milestone_tag ? `[${p.milestone_tag}]` : ''}`).join('\n')}

Generate:
1. One compelling one-line pitch (max 150 characters)
2. 3-5 bullet points highlighting key achievements, traction, and unique value

Format your response as JSON:
{
  "pitch": "...",
  "bullets": ["...", "...", "..."]
}
`;
}

function parseAIResponse(response: string): { pitch: string; bullets: string[] } {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      pitch: parsed.pitch,
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
    };
  }
  throw new Error('Failed to parse AI response');
}
```

### Create Supabase Admin Client
**File**: `server/supabase-admin.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../client/src/lib/database.types';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
```

Add to `.env`:
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 3. API Routes

### Update `server/routes.ts`

```typescript
import { generateCompanySummary } from './ai-service';
import { supabase } from './supabase-admin';

export async function registerRoutes(app: Express): Promise<Server> {
  // Get company summary
  app.get('/api/company/:id/summary', async (req, res) => {
    try {
      const { id } = req.params;

      const { data: summary, error } = await supabase
        .from('company_summaries')
        .select('*')
        .eq('company_id', id)
        .maybeSingle();

      if (error) throw error;

      res.json({ summary });
    } catch (error) {
      console.error('Error fetching summary:', error);
      res.status(500).json({ error: 'Failed to fetch summary' });
    }
  });

  // Generate/regenerate company summary
  app.post('/api/company/:id/generate-summary', async (req, res) => {
    try {
      const { id } = req.params;

      // TODO: Add authentication check
      // Verify that the user is a founder of this company

      const summary = await generateCompanySummary(id);

      res.json({ summary });
    } catch (error) {
      console.error('Error generating summary:', error);
      res.status(500).json({ error: 'Failed to generate summary' });
    }
  });

  // ... rest of routes
}
```

---

## 4. Frontend Updates

### Update Company Page
**File**: `client/src/pages/company.tsx`

#### Add State Management (around line 60)
```typescript
const [companySummary, setCompanySummary] = useState<CompanySummary | null>(null);
const [loadingSummary, setLoadingSummary] = useState(false);
const [regeneratingSummary, setRegeneratingSummary] = useState(false);
```

#### Fetch Summary (in useEffect, around line 200)
```typescript
// Fetch AI summary
const { data: summaryData } = await fetch(`/api/company/${params.id}/summary`)
  .then(res => res.json());
if (summaryData?.summary) {
  setCompanySummary(summaryData.summary);
}
```

#### Add Regenerate Handler
```typescript
const handleRegenerateSummary = async () => {
  if (!params?.id || regeneratingSummary) return;

  setRegeneratingSummary(true);
  try {
    const response = await fetch(`/api/company/${params.id}/generate-summary`, {
      method: 'POST',
    });

    if (!response.ok) throw new Error('Failed to regenerate summary');

    const { summary } = await response.json();
    setCompanySummary(summary);

    toast({
      title: "Summary Regenerated",
      description: "AI summary has been updated with latest information.",
    });
  } catch (error) {
    console.error('Error regenerating summary:', error);
    toast({
      title: "Error",
      description: "Failed to regenerate summary. Please try again.",
      variant: "destructive",
    });
  } finally {
    setRegeneratingSummary(false);
  }
};
```

#### Replace Placeholder (lines 585-600)
```typescript
<Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle className="flex items-center gap-2">
      <Sparkles className="h-5 w-5 text-yellow-500" />
      AI Summary
    </CardTitle>
    {isFounder && (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRegenerateSummary}
        disabled={regeneratingSummary}
      >
        {regeneratingSummary ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
      </Button>
    )}
  </CardHeader>
  <CardContent>
    {loadingSummary ? (
      <div className="space-y-3">
        <div className="h-4 bg-muted animate-pulse rounded" />
        <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
        <div className="h-3 bg-muted animate-pulse rounded w-5/6" />
      </div>
    ) : companySummary ? (
      <div className="space-y-4">
        <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
          <p className="text-sm font-medium italic">"{companySummary.summary_pitch}"</p>
        </div>
        <ul className="space-y-2">
          {companySummary.summary_bullets.map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <span className="text-yellow-500 mt-1">✦</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
          <Sparkles className="h-3 w-3" />
          <span>
            Updated {formatDistanceToNow(new Date(companySummary.updated_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    ) : (
      <div className="text-center py-8">
        <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No summary generated yet</p>
        {isFounder && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={handleRegenerateSummary}
            disabled={regeneratingSummary}
          >
            Generate Summary
          </Button>
        )}
      </div>
    )}
  </CardContent>
</Card>
```

#### Add Import
```typescript
import { RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
```

---

## 5. Weekly Auto-Regeneration

### Supabase Edge Function + pg_cron

#### Create Edge Function
**File**: `supabase/functions/regenerate-summaries/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Get all companies that have posts
  const { data: companies } = await supabaseAdmin
    .from('companies')
    .select('id');

  let regenerated = 0;

  for (const company of companies || []) {
    try {
      // Call your AI service to regenerate
      // This could be an internal API call or duplicate the logic here
      await fetch(`${Deno.env.get('APP_URL')}/api/company/${company.id}/generate-summary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('CRON_SECRET')}`,
        },
      });
      regenerated++;
    } catch (error) {
      console.error(`Failed to regenerate summary for ${company.id}:`, error);
    }
  }

  return new Response(
    JSON.stringify({ regenerated }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

#### Setup pg_cron in Supabase
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule weekly regeneration (every Sunday at 2 AM UTC)
SELECT cron.schedule(
  'weekly-summary-regeneration',
  '0 2 * * 0',
  $$
  SELECT
    net.http_post(
      url:='https://your-project.supabase.co/functions/v1/regenerate-summaries',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) AS request_id;
  $$
);
```

---

## 6. Optimization & Best Practices

### Caching Strategy
- Cache summaries in memory for 1 hour to reduce database queries
- Invalidate cache when summary is regenerated

### Rate Limiting
- Limit regeneration requests to once per hour per company
- Store last regeneration timestamp in database

### Error Handling
- Graceful fallback if AI service is unavailable
- Retry logic with exponential backoff
- Log all errors for monitoring

### Smart Regeneration
Only regenerate summaries if:
- Company has new posts since last generation
- Company profile has been updated
- Manual regeneration requested by founder

**File**: `server/ai-service.ts` (add function)
```typescript
export async function shouldRegenerateSummary(companyId: string): Promise<boolean> {
  const { data: summary } = await supabase
    .from('company_summaries')
    .select('updated_at')
    .eq('company_id', companyId)
    .maybeSingle();

  if (!summary) return true; // No summary exists

  const lastUpdated = new Date(summary.updated_at);

  // Check for new posts
  const { count: newPosts } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gt('created_at', lastUpdated.toISOString());

  // Check for company updates
  const { data: company } = await supabase
    .from('companies')
    .select('updated_at')
    .eq('id', companyId)
    .single();

  const companyUpdated = new Date(company.updated_at) > lastUpdated;

  return (newPosts || 0) > 0 || companyUpdated;
}
```

---

## 7. Testing Checklist

- [ ] Database table created successfully
- [ ] AI service generates valid summaries
- [ ] API endpoints return correct data
- [ ] Frontend displays summary correctly
- [ ] Regenerate button works for founders only
- [ ] Timestamp displays correctly
- [ ] Loading states work properly
- [ ] Error handling works
- [ ] Cron job runs successfully
- [ ] Summary quality is good (test with real data)

---

## 8. Deployment Steps

1. Create `company_summaries` table in Supabase
2. Add environment variables (API keys)
3. Deploy updated backend code
4. Deploy updated frontend code
5. Set up cron job (Edge Function or node-cron)
6. Generate initial summaries for existing companies
7. Monitor logs for errors
8. Gather user feedback on summary quality

---

## Future Enhancements

- Allow founders to edit AI-generated summaries
- A/B test different prompt templates
- Add summary versioning/history
- Generate summaries in multiple languages
- Include metrics/KPIs in summaries
- Social media integration (pull from Twitter/LinkedIn)
- Sentiment analysis on posts
- Competitor comparison in summaries
