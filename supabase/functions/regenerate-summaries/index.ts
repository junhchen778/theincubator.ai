import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface CompanyRow {
  id: string;
}

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

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const cronSecret = Deno.env.get('CRON_SECRET');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    if (!openaiApiKey) {
      throw new Error('Missing OpenAI API key');
    }

    // Verify cron secret if provided
    const authHeader = req.headers.get('Authorization');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Import Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('Fetching all companies...');

    // Get all companies
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .limit(1000);

    if (companiesError) {
      throw companiesError;
    }

    console.log(`Found ${companies?.length || 0} companies`);

    let regenerated = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process companies in batches
    const batchSize = 10;
    for (let i = 0; i < (companies?.length || 0); i += batchSize) {
      const batch = companies!.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}...`);

      const promises = batch.map(async (company: CompanyRow) => {
        try {
          // Check if summary needs regeneration
          const { data: summary } = await supabaseAdmin
            .from('company_summaries')
            .select('updated_at')
            .eq('company_id', company.id)
            .maybeSingle();

          const lastUpdated = summary ? new Date(summary.updated_at) : null;
          
          // Check for new posts since last update
          let shouldRegenerate = !lastUpdated;
          
          if (lastUpdated) {
            const { count: newPosts } = await supabaseAdmin
              .from('posts')
              .select('id', { count: 'exact', head: true })
              .eq('company_id', company.id)
              .gt('created_at', lastUpdated.toISOString());

            shouldRegenerate = (newPosts || 0) > 0;
          }

          if (!shouldRegenerate) {
            skipped++;
            return;
          }

          // Fetch company details
          const { data: companyData, error: companyError } = await supabaseAdmin
            .from('companies')
            .select('*')
            .eq('id', company.id)
            .single();

          if (companyError || !companyData) {
            throw new Error(`Failed to fetch company: ${companyError?.message}`);
          }

          // Fetch recent posts
          const { data: posts } = await supabaseAdmin
            .from('posts')
            .select('content, milestone_tag, created_at')
            .eq('company_id', company.id)
            .order('created_at', { ascending: false })
            .limit(15);

          // Build prompt
          const prompt = buildPrompt(companyData as Company, posts || []);

          // Call OpenAI
          const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
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
            }),
          });

          if (!openaiResponse.ok) {
            throw new Error(`OpenAI API error: ${openaiResponse.status}`);
          }

          const openaiData = await openaiResponse.json();
          const content = openaiData.choices[0].message.content;

          // Parse response
          const parsed = JSON.parse(content);
          const pitch = parsed.pitch.substring(0, 150);
          const bullets = parsed.bullets.slice(0, 5);

          // Save to database
          const { error: saveError } = await supabaseAdmin
            .from('company_summaries')
            .upsert(
              {
                company_id: company.id,
                summary_pitch: pitch,
                summary_bullets: bullets,
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: 'company_id',
              }
            );

          if (saveError) {
            throw new Error(`Failed to save summary: ${saveError.message}`);
          }

          regenerated++;
          console.log(`✓ Regenerated summary for company ${company.id}`);
        } catch (error) {
          failed++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${company.id}: ${errorMsg}`);
          console.error(`✗ Failed to regenerate summary for ${company.id}:`, errorMsg);
        }
      });

      await Promise.all(promises);
      
      // Small delay between batches
      if (i + batchSize < (companies?.length || 0)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      total: companies?.length || 0,
      regenerated,
      skipped,
      failed,
      errors: errors.slice(0, 10),
    };

    console.log('Summary regeneration complete:', result);

    return new Response(
      JSON.stringify(result),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Connection': 'keep-alive'
        },
      }
    );
  } catch (error) {
    console.error('Error in regenerate-summaries function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Connection': 'keep-alive'
        },
      }
    );
  }
});

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