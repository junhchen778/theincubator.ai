import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface CompanyRow {
  id: string;
}

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5000';
    const cronSecret = Deno.env.get('CRON_SECRET');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Verify cron secret if provided in request
    const authHeader = req.headers.get('Authorization');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Import Supabase client dynamically
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get all companies
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .limit(1000);

    if (companiesError) {
      throw companiesError;
    }

    let regenerated = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process companies in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < (companies?.length || 0); i += batchSize) {
      const batch = companies!.slice(i, i + batchSize);
      
      const promises = batch.map(async (company: CompanyRow) => {
        try {
          const response = await fetch(`${appUrl}/api/company/${company.id}/generate-summary`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed for company ${company.id}: ${errorText}`);
          }

          regenerated++;
        } catch (error) {
          failed++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(errorMsg);
          console.error(`Failed to regenerate summary for ${company.id}:`, errorMsg);
        }
      });

      await Promise.all(promises);
      
      // Small delay between batches
      if (i + batchSize < (companies?.length || 0)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        regenerated,
        failed,
        total: companies?.length || 0,
        errors: errors.slice(0, 10), // Only return first 10 errors to avoid huge response
      }),
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
