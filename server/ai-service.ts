import OpenAI from 'openai';
import { supabase } from './supabase-admin';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error(
    '⚠️  Missing OpenAI API key. AI Summary feature will not work.\n' +
    '   Please set OPENAI_API_KEY environment variable.\n' +
    '   Get your key at: https://platform.openai.com/api-keys'
  );
}

const openai = apiKey ? new OpenAI({ apiKey }) : null as any;

// Rate limiting: Store last regeneration time per company
const regenerationCache = new Map<string, number>();
const RATE_LIMIT_HOURS = 1;

interface Company {
  id: string;
  name: string;
  one_line_pitch: string | null;
  description: string | null;
  stage: string | null;
  sector: string[] | null;
  location: string | null;
  updated_at: string | null;
}

interface Post {
  content: string;
  milestone_tag: string | null;
  created_at: string;
}

export async function generateCompanySummary(companyId: string) {
  // Validate configuration
  if (!openai || !supabase) {
    throw new Error(
      'AI Summary service is not configured. Please set OPENAI_API_KEY and SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  // 1. Fetch company data
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (companyError || !company) {
    throw new Error(`Failed to fetch company: ${companyError?.message || 'Company not found'}`);
  }

  // 2. Fetch recent posts (last 15)
  const { data: posts } = await supabase
    .from('posts')
    .select('content, milestone_tag, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(15);

  // 3. Build prompt
  const prompt = buildPrompt(company as Company, posts || []);

  // 4. Call OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert at analyzing startups and creating concise, compelling summaries. You provide actionable insights based on company data and recent activities.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  // 5. Parse response
  const response = completion.choices[0].message.content;
  if (!response) {
    throw new Error('No response from OpenAI');
  }

  const parsed = parseAIResponse(response);

  // 6. Store in database
  const { data: summary, error } = await supabase
    .from('company_summaries')
    .upsert(
      {
        company_id: companyId,
        summary_pitch: parsed.pitch,
        summary_bullets: parsed.bullets,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'company_id',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save summary: ${error.message}`);
  }

  return summary;
}

function buildPrompt(company: Company, posts: Post[]): string {
  const postsText = posts.length > 0
    ? posts.map(p => `- ${p.content.substring(0, 200)}${p.content.length > 200 ? '...' : ''} ${p.milestone_tag ? `[${p.milestone_tag}]` : ''}`).join('\n')
    : '- No recent posts available';

  return `
Analyze this startup and create a compelling summary.

Company Profile:
- Name: ${company.name}
- Pitch: ${company.one_line_pitch || 'N/A'}
- Description: ${company.description || 'N/A'}
- Stage: ${company.stage || 'N/A'}
- Sector: ${company.sector?.join(', ') || 'N/A'}
- Location: ${company.location || 'N/A'}

Recent Updates:
${postsText}

Generate:
1. One compelling one-line pitch (max 150 characters) that captures the essence of what makes this company unique
2. 3-5 bullet points highlighting key achievements, traction, unique value proposition, and any notable milestones

Format your response as JSON:
{
  "pitch": "...",
  "bullets": ["...", "...", "..."]
}
`;
}

function parseAIResponse(response: string): { pitch: string; bullets: string[] } {
  try {
    const parsed = JSON.parse(response);
    
    if (!parsed.pitch || !Array.isArray(parsed.bullets)) {
      throw new Error('Invalid response format');
    }

    return {
      pitch: parsed.pitch.substring(0, 150), // Enforce max length
      bullets: parsed.bullets.slice(0, 5), // Max 5 bullets
    };
  } catch (error) {
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function shouldRegenerateSummary(companyId: string): Promise<boolean> {
  if (!supabase) {
    return false;
  }

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

  if (!company) return false;

  const companyUpdated = company.updated_at && new Date(company.updated_at) > lastUpdated;

  return (newPosts || 0) > 0 || companyUpdated;
}

export function checkRateLimit(companyId: string): { allowed: boolean; waitTime?: number } {
  const lastRegeneration = regenerationCache.get(companyId);
  
  if (!lastRegeneration) {
    return { allowed: true };
  }

  const hoursSinceLastRegeneration = (Date.now() - lastRegeneration) / (1000 * 60 * 60);
  
  if (hoursSinceLastRegeneration < RATE_LIMIT_HOURS) {
    const waitTime = Math.ceil((RATE_LIMIT_HOURS - hoursSinceLastRegeneration) * 60); // Minutes
    return { allowed: false, waitTime };
  }

  return { allowed: true };
}

export function setRateLimit(companyId: string): void {
  regenerationCache.set(companyId, Date.now());
}
