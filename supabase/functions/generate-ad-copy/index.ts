import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Platform modules
import { GooglePlatform } from "./platforms/google.ts";
import { MetaPlatform } from "./platforms/meta.ts";
import { XPlatform } from "./platforms/x.ts";
import { TikTokPlatform } from "./platforms/tiktok.ts";

// Model clients
import { callOpenAIJSON } from "./models/openai-client.ts";
import { callGeminiJSON } from "./models/gemini-client.ts";

// Types
import type { GenerateRequest, PlatformHandler } from "./types.ts";

// Infrastructure
import { rateLimiter, ipRateLimiter } from "./rate-limiter.ts";
import { circuitBreaker } from "./circuit-breaker.ts";
import { requestQueue } from "./queue.ts";
import { createLogger } from "./logger.ts";
import { metricsCollector } from "./metrics.ts";
import { alertManager } from "./alerting.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Platform registry
const PLATFORMS: Record<string, PlatformHandler> = {
  google: GooglePlatform,
  meta: MetaPlatform,
  x: XPlatform,
  tiktok: TikTokPlatform,
};

// Convert incoming request to GenerateRequest format
const mapRequestBody = (rawReq: any): GenerateRequest => {
  // Handle both old format (strings) and new format (arrays)
  const existingHeadlines = rawReq.existingHeadlines
    ? rawReq.existingHeadlines.split('\n').map((s: string) => s.trim()).filter(Boolean)
    : (rawReq.existing_headlines || []);
  
  const existingDescriptions = rawReq.existingDescriptions
    ? rawReq.existingDescriptions.split('\n').map((s: string) => s.trim()).filter(Boolean)
    : (rawReq.existing_descriptions || []);
  
  // Parse keywords
  const keywordsRaw = rawReq.keywords || rawReq.keywords_raw || '';
  const keywords = typeof keywordsRaw === 'string'
    ? keywordsRaw.split(/[,\n]/).map((k: string) => k.trim()).filter(Boolean)
    : (keywordsRaw || []);
  
  // Clamp values
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  
  const platform = rawReq.platform || 'google';
  const model = rawReq.model || 'google/gemini-2.5-flash';
  const provider = model.includes('gemini') ? 'gemini' : 'openai';
  
  return {
    platform,
    provider,
    model,
    locale: rawReq.locale || 'en-GB',
    temperature: rawReq.temperature || 0.8,
    placement: rawReq.placement,
    productContext: rawReq.context || '',
    keywords,
    existingAssets: {
      headlines: existingHeadlines,
      descriptions: existingDescriptions,
    },
    limits: {
      headlines: clamp(rawReq.numHeadlines || rawReq.num_headlines || 10, 1, 30),
      descriptions: clamp(rawReq.numDescriptions || rawReq.num_descriptions || 4, 1, 30),
      primaryTexts: clamp(rawReq.numDescriptions || rawReq.num_descriptions || 10, 1, 30),
    },
  };
};

// Start alert monitoring (runs every 5 minutes)
setInterval(async () => {
  const currentMetrics = metricsCollector.getCurrentWindowMetrics();
  await alertManager.checkAndAlert(currentMetrics);
}, 5 * 60 * 1000);

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const logger = createLogger(requestId);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info('Request received', { method: req.method, url: req.url });

    // IP-based rate limiting (DDoS protection)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const ipLimit = ipRateLimiter.checkLimit(ip);
    if (!ipLimit.allowed) {
      logger.warn('IP rate limit exceeded', { ip, reason: ipLimit.reason });
      return new Response(
        JSON.stringify({
          error: ipLimit.reason || 'Too many requests from this IP address',
        }),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '3600', // 1 hour
          },
        }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.warn('Request missing authorization header');
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      logger.error('Authentication failed', authError || undefined, { jwt: jwt.substring(0, 20) + '...' });
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update logger with user context
    const userLogger = logger.child({ userId: user.id });
    userLogger.info('User authenticated successfully');

    // Check rate limit using in-memory cache
    const rateLimitResult = await rateLimiter.checkLimit(user.id, supabase);
    
    if (!rateLimitResult.allowed) {
      userLogger.warn('Rate limit exceeded', { remaining: rateLimitResult.remaining });
      metricsCollector.recordRateLimitBreach();
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. You have reached your daily limit of 50 requests.',
          remaining: rateLimitResult.remaining,
        }),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          },
        }
      );
    }

    // Parse and map request to GenerateRequest format
    const rawRequestBody = await req.json();
    userLogger.debug('Raw request received', { bodyKeys: Object.keys(rawRequestBody) });
    
    const generateRequest = mapRequestBody(rawRequestBody);
    userLogger.info('Request mapped', { 
      platform: generateRequest.platform,
      provider: generateRequest.provider, 
      model: generateRequest.model,
    });

    // Input validation
    const maxHeadlines = generateRequest.limits?.headlines || 0;
    const maxDescriptions = generateRequest.limits?.descriptions || 0;
    if (maxHeadlines > 30 || maxDescriptions > 30) {
      userLogger.warn('Request validation failed: too many items', { 
        headlines: maxHeadlines, 
        descriptions: maxDescriptions 
      });
      return new Response(JSON.stringify({ error: 'Too many items requested (max 30 each)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get platform handler (default to Google if not found)
    const platform = PLATFORMS[generateRequest.platform] || GooglePlatform;
    
    // Build prompts using platform module
    const systemPrompt = platform.systemPrompt;
    const userPrompt = platform.buildUserPrompt(generateRequest);

    const apiStartTime = Date.now();
    userLogger.info('Starting AI generation', { 
      platform: generateRequest.platform,
      provider: generateRequest.provider, 
      model: generateRequest.model 
    });
    
    // Use request queue to manage concurrent operations and circuit breaker for resilience
    const rawGeneratedData = await requestQueue.enqueue(user.id, async () => {
      const apiKey = generateRequest.provider === 'gemini'
        ? Deno.env.get('GEMINI_API_KEY')!
        : Deno.env.get('OPENAI_API_KEY')!;
      
      if (!apiKey) {
        throw new Error(`${generateRequest.provider} API key not configured`);
      }
      
      // Select appropriate model client
      const callModelFn = generateRequest.provider === 'gemini'
        ? () => callGeminiJSON({
            apiKey,
            model: generateRequest.model,
            systemPrompt,
            userPrompt,
            jsonSchema: platform.geminiSchema,
            temperature: generateRequest.temperature,
          })
        : () => callOpenAIJSON({
            apiKey,
            model: generateRequest.model,
            systemPrompt,
            userPrompt,
            jsonSchema: platform.openAISchema,
            temperature: generateRequest.temperature,
          });
      
      // Execute with circuit breaker
      return await circuitBreaker.execute(generateRequest.provider, callModelFn);
    });

    const apiDuration = Date.now() - apiStartTime;
    userLogger.info('AI generation completed', { durationMs: apiDuration });

    // Update circuit breaker metrics
    const circuitStatus = circuitBreaker.getStatus(generateRequest.provider);
    metricsCollector.updateProviderMetrics(
      generateRequest.provider,
      circuitStatus.state,
      circuitStatus.failures
    );

    // Post-process the generated content using platform module
    const processedResult = platform.postprocess(rawGeneratedData, generateRequest);

    // Platform-aware logging
    const logFields = Object.keys(processedResult).filter(k => Array.isArray(processedResult[k]));
    const logCounts = logFields.reduce((acc, field) => {
      acc[field] = processedResult[field].length;
      return acc;
    }, {} as Record<string, number>);
    
    userLogger.info('Response generated successfully', logCounts);

    // Record metrics
    const totalDuration = Date.now() - startTime;
    metricsCollector.recordRequest(totalDuration);

    userLogger.info('Request completed successfully', { totalDurationMs: totalDuration });

    return new Response(JSON.stringify({
      ...processedResult,
      usage: {
        provider: generateRequest.provider,
        model: generateRequest.model,
        locale: generateRequest.locale,
        timestamp: new Date().toISOString(),
        userId: user.id
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    metricsCollector.recordRequest(duration);
    metricsCollector.recordError();
    
    logger.error('Request failed', error as Error, { durationMs: duration });
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
