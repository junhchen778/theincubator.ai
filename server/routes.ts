import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Lazy imports to avoid loading services if env vars are missing
let aiServicePromise: Promise<any> | null = null;
let supabaseAdminPromise: Promise<any> | null = null;

async function getServices() {
  if (!aiServicePromise || !supabaseAdminPromise) {
    try {
      aiServicePromise = import("./ai-service.js");
      supabaseAdminPromise = import("./supabase-admin.js");
    } catch (error) {
      throw new Error(
        "AI services not configured. Please set OPENAI_API_KEY and SUPABASE_SERVICE_ROLE_KEY environment variables."
      );
    }
  }
  const [aiService, supabaseAdmin] = await Promise.all([aiServicePromise, supabaseAdminPromise]);
  return { aiService, supabaseAdmin };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Check AI service status
  app.get('/api/ai-summary/status', async (req, res) => {
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasSupabaseUrl = !!process.env.VITE_SUPABASE_URL;
    
    const configured = hasOpenAI && hasSupabaseKey && hasSupabaseUrl;
    
    res.json({
      configured,
      services: {
        openai: hasOpenAI ? 'configured' : 'missing OPENAI_API_KEY',
        supabase_admin: hasSupabaseKey ? 'configured' : 'missing SUPABASE_SERVICE_ROLE_KEY',
        supabase_url: hasSupabaseUrl ? 'configured' : 'missing VITE_SUPABASE_URL',
      },
      message: configured 
        ? 'AI Summary service is ready!' 
        : 'Please configure environment variables. See SETUP_ENV_VARS.md',
    });
  });

  // Get company summary
  app.get('/api/company/:id/summary', async (req, res) => {
    try {
      const { supabaseAdmin } = await getServices();
      const { id } = req.params;

      const { data: summary, error } = await supabaseAdmin.supabase
        .from('company_summaries')
        .select('*')
        .eq('company_id', id)
        .maybeSingle();

      if (error) throw error;

      res.json({ summary });
    } catch (error) {
      console.error('Error fetching summary:', error);
      res.status(500).json({ 
        error: 'Failed to fetch summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate/regenerate company summary
  app.post('/api/company/:id/generate-summary', async (req, res) => {
    try {
      const { aiService } = await getServices();
      const { id } = req.params;

      // TODO: Add authentication check
      // For now, we'll skip auth verification but this should verify the user is a founder

      // Check rate limit
      const rateCheck = aiService.checkRateLimit(id);
      if (!rateCheck.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Please wait ${rateCheck.waitTime} minutes before regenerating again`,
        });
      }

      // Check if regeneration is needed (optional check - can force regenerate)
      const shouldRegenerate = await aiService.shouldRegenerateSummary(id);
      
      // Generate summary
      const summary = await aiService.generateCompanySummary(id);
      
      // Set rate limit
      aiService.setRateLimit(id);

      res.json({ summary, wasStale: shouldRegenerate });
    } catch (error) {
      console.error('Error generating summary:', error);
      res.status(500).json({ 
        error: 'Failed to generate summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
