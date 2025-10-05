import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'generate-ad-copy',
      uptime: Deno.memoryUsage(),
      checks: {
        openai: await checkAPIHealth('https://api.openai.com/v1/models', Deno.env.get('OPENAI_API_KEY')),
        gemini: await checkAPIHealth('https://generativelanguage.googleapis.com/v1beta/models', Deno.env.get('GEMINI_API_KEY')),
      },
    };

    const allHealthy = Object.values(health.checks).every((check: any) => check.status === 'up');
    const statusCode = allHealthy ? 200 : 503;

    return new Response(JSON.stringify(health, null, 2), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function checkAPIHealth(url: string, apiKey: string | undefined): Promise<{ status: string; responseTime?: number; error?: string }> {
  if (!apiKey) {
    return { status: 'down', error: 'API key not configured' };
  }

  const startTime = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return { status: 'up', responseTime };
    } else {
      return { status: 'degraded', responseTime, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return { status: 'down', responseTime, error: error.message };
  }
}
