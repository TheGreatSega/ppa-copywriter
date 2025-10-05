import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { SYSTEM_PROMPT } from "./prompt.ts";
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

// Types
interface RequestShape {
  provider: "openai" | "google";
  model: string;
  existing_headlines: string[];
  existing_descriptions: string[];
  keywords_raw: string;
  context: string;
  num_headlines: number;
  num_descriptions: number;
  locale?: string;
}


// User prompt template
const buildUserPrompt = (req: RequestShape) => {
  const existingHeadlinesText = req.existing_headlines.length > 0 
    ? req.existing_headlines.map(h => `- ${h}`).join('\n') 
    : 'None provided';
  
  const existingDescriptionsText = req.existing_descriptions.length > 0 
    ? req.existing_descriptions.map(d => `- ${d}`).join('\n') 
    : 'None provided';

  return `CONTEXT
------
Brand/Campaign Notes:
${req.context || 'General business promotion'}

Existing Headlines (for reference):
${existingHeadlinesText}

Existing Descriptions (for reference):
${existingDescriptionsText}

Keywords & Search Queries (raw):
${req.keywords_raw || 'None provided'}

Locale: ${req.locale || 'en-GB'}

TASK
----
Create:
- ${req.num_headlines} Google Ads RSA headlines (each ≤ 30 characters)
- ${req.num_descriptions} Google Ads RSA descriptions (each ≤ 90 characters)

REQUIREMENTS
------------
1) **Character limits are hard caps**: headlines ≤ 30; descriptions ≤ 90. Do not exceed.
2) **Coverage & Variety**: Provide a balanced mix across intent buckets. Include at least some lines that emphasise:
   - Core benefit/value (e.g., save money/time, quality, reliability)
   - Specific features/USPs from the context
   - Social proof or credibility (ratings, awards, scale)
   - Offer/price/promo (if in context)
   - Urgency/scarcity when appropriate (no fake claims)
   - Clear CTA variants (e.g., "Get Quote", "Compare Now")
3) **Keyword use**: Naturally include relevant head terms from the supplied keywords/search queries where they fit. Avoid awkward stuffing.
4) **Compliance & Safety**: Avoid prohibited claims, exaggerated superlatives, or medical/financial guarantees unless explicitly allowed. No emojis.
5) **Uniqueness**: No duplicates or near-duplicates; each line must deliver a distinct angle.
6) **Grammar & Casing**: Concise sentence or Title Case; avoid ALL CAPS & multiple exclamation marks.

OUTPUT FORMAT (JSON ONLY)
-------------------------
{
  "headlines": [
    "H1 (≤30 chars)",
    "H2 (≤30 chars)",
    "... up to ${req.num_headlines}"
  ],
  "descriptions": [
    "D1 (≤90 chars)",
    "D2 (≤90 chars)",
    "... up to ${req.num_descriptions}"
  ]
}

QUALITY CHECK (self-verify before answering)
--------------------------------------------
- Arrays match requested counts.
- No item exceeds the char limits.
- No duplicates/near-duplicates.
- At least some items include key head terms naturally.`;
};

// Pre-processing helpers
const preprocess = (rawReq: any): RequestShape => {
  const trimLines = (arr: string[]) => (arr || []).map(s => s.trim()).filter(Boolean);
  const dedupe = (arr: string[]) => Array.from(new Set(arr));
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  // Convert old format to new format
  const existing_headlines = rawReq.existingHeadlines 
    ? rawReq.existingHeadlines.split('\n')
    : (rawReq.existing_headlines || []);
  
  const existing_descriptions = rawReq.existingDescriptions 
    ? rawReq.existingDescriptions.split('\n')
    : (rawReq.existing_descriptions || []);

  return {
    platform: rawReq.platform || 'google',
    provider: rawReq.model?.includes('gemini') ? 'google' : 'openai',
    model: rawReq.model || 'google/gemini-2.5-flash',
    existing_headlines: dedupe(trimLines(existing_headlines)),
    existing_descriptions: dedupe(trimLines(existing_descriptions)),
    keywords_raw: rawReq.keywords || rawReq.keywords_raw || '',
    context: rawReq.context || '',
    num_headlines: clamp(rawReq.numHeadlines || rawReq.num_headlines || 10, 1, 30),
    num_descriptions: clamp(rawReq.numDescriptions || rawReq.num_descriptions || 4, 1, 30),
    locale: rawReq.locale || 'en-GB',
    ...rawReq
  };
};

// Simple similarity function for deduplication
const similarity = (a: string, b: string): number => {
  const setA = new Set(a.toLowerCase().split(''));
  const setB = new Set(b.toLowerCase().split(''));
  const intersection = [...setA].filter(x => setB.has(x)).length;
  return intersection / Math.max(setA.size, setB.size);
};

// Post-processing helpers
const postprocess = (data: any, cleaned: RequestShape) => {
  const enforce = (items: string[], maxChars: number, need: number) => {
    const softTrim = (s: string) => {
      if (s.length <= maxChars) return s;
      const slice = s.slice(0, maxChars);
      const lastSpace = slice.lastIndexOf(' ');
      return (lastSpace > 10 ? slice.slice(0, lastSpace) : slice).trim();
    };
    
    const unique: string[] = [];
    for (const s of items || []) {
      const t = softTrim(String(s || "").trim());
      if (!t) continue;
      if (!unique.some(u => similarity(u, t) > 0.92)) {
        unique.push(t);
      }
    }
    return unique.slice(0, need);
  };

  let headlines = enforce(data?.headlines || [], 30, cleaned.num_headlines);
  let descriptions = enforce(data?.descriptions || [], 90, cleaned.num_descriptions);

  // Pad if short with basic fallbacks
  const pad = (arr: string[], need: number, prefix: string) => {
    while (arr.length < need) {
      arr.push(`${prefix} ${arr.length + 1}`);
    }
    return arr;
  };

  headlines = pad(headlines, cleaned.num_headlines, "Headline");
  descriptions = pad(descriptions, cleaned.num_descriptions, "Description");

  // Locale normalisation for en-GB
  if ((cleaned.locale || '').toLowerCase() === 'en-gb') {
    const gbSpelling = (s: string) => s.replace(/optimi(ze|zing|zation)/gi, m => m.replace('z', 's'));
    headlines = headlines.map(gbSpelling);
    descriptions = descriptions.map(gbSpelling);
  }

  return { headlines, descriptions };
};

const safeJsonParse = (s: string) => {
  try { 
    return JSON.parse(s); 
  } catch { 
    return {}; 
  }
};

// OpenAI API call with improved prompt structure and model-specific parameter handling
const generateWithOpenAI = async (req: RequestShape) => {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const userPrompt = buildUserPrompt(req);
  console.log('OpenAI Model:', req.model);
  console.log('User prompt length:', userPrompt.length);

  // Detect if this is a GPT-5, GPT-4.5, GPT-4.1+ model (newer models)
  const isGPT5Family = req.model.includes('gpt-5');
  const isGPT4Point5Plus = req.model.includes('gpt-4.5') || req.model.includes('gpt-4.1');
  const isNewerModel = isGPT5Family || isGPT4Point5Plus;

  // Build request body with model-specific parameters
  const requestBody: any = {
    model: req.model,
    messages: [
      {
        role: 'system',
        content: getPlatformPrompt(req.platform || 'google')
      },
      {
        role: 'user',
        content: userPrompt
      }
    ],
    response_format: { type: "json_object" }
  };

  // GPT-5 and newer models use max_completion_tokens and do NOT support temperature
  if (isNewerModel) {
    requestBody.max_completion_tokens = 2000;
    console.log('Using max_completion_tokens for newer model (no temperature)');
  } else {
    // Legacy models (gpt-4o, gpt-4o-mini) use max_tokens and support temperature
    requestBody.max_tokens = 2000;
    requestBody.temperature = 0.8;
    console.log('Using max_tokens and temperature for legacy model');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI API error:', error);
    
    // Enhanced error messages for model-specific issues
    if (error.includes('temperature') && isNewerModel) {
      throw new Error(`${req.model} does not support temperature parameter. This is a configuration error.`);
    }
    if (error.includes('max_tokens') && isNewerModel) {
      throw new Error(`${req.model} requires max_completion_tokens instead of max_tokens. This is a configuration error.`);
    }
    
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content ?? "{}";
  console.log('OpenAI raw response preview:', rawContent.substring(0, 200));
  
  return safeJsonParse(rawContent);
};

// Gemini API call with improved prompt structure
const generateWithGemini = async (req: RequestShape) => {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  const userPrompt = buildUserPrompt(req);
  console.log('Gemini Model:', req.model);
  console.log('User prompt length:', userPrompt.length);

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${req.model}:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${SYSTEM_PROMPT}\n\n${userPrompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2000,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            headlines: { 
              type: "ARRAY", 
              items: { type: "STRING" },
              minItems: 1,
              maxItems: 30
            },
            descriptions: { 
              type: "ARRAY", 
              items: { type: "STRING" },
              minItems: 1,
              maxItems: 30
            }
          },
          required: ["headlines", "descriptions"]
        }
      }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API error:', error);
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  console.log('Gemini raw response:', rawContent);
  
  return safeJsonParse(rawContent);
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

    // Parse and validate request body with new preprocessing
    const rawRequestBody = await req.json();
    userLogger.debug('Raw request received', { bodyKeys: Object.keys(rawRequestBody) });
    
    // Preprocess request to unified format
    const cleanedRequest = preprocess(rawRequestBody);
    userLogger.info('Request preprocessed', { 
      provider: cleanedRequest.provider, 
      model: cleanedRequest.model,
      numHeadlines: cleanedRequest.num_headlines,
      numDescriptions: cleanedRequest.num_descriptions,
    });

    // Input validation
    if (cleanedRequest.num_headlines > 30 || cleanedRequest.num_descriptions > 30) {
      userLogger.warn('Request validation failed: too many items', { 
        headlines: cleanedRequest.num_headlines, 
        descriptions: cleanedRequest.num_descriptions 
      });
      return new Response(JSON.stringify({ error: 'Too many items requested (max 30 each)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiStartTime = Date.now();
    userLogger.info('Starting AI generation', { 
      provider: cleanedRequest.provider, 
      model: cleanedRequest.model 
    });
    
    // Use request queue to manage concurrent operations and circuit breaker for resilience
    const rawGeneratedData = await requestQueue.enqueue(user.id, async () => {
      // Generate with appropriate provider using circuit breaker
      if (cleanedRequest.provider === 'google') {
        return await circuitBreaker.execute('gemini', () => generateWithGemini(cleanedRequest));
      } else {
        return await circuitBreaker.execute('openai', () => generateWithOpenAI(cleanedRequest));
      }
    });

    const apiDuration = Date.now() - apiStartTime;
    userLogger.info('AI generation completed', { durationMs: apiDuration });

    // Update circuit breaker metrics
    const circuitStatus = circuitBreaker.getStatus(cleanedRequest.provider === 'google' ? 'gemini' : 'openai');
    metricsCollector.updateProviderMetrics(
      cleanedRequest.provider === 'google' ? 'gemini' : 'openai',
      circuitStatus.state,
      circuitStatus.failures
    );

    // Post-process the generated content
    const processedResult = postprocess(rawGeneratedData, cleanedRequest);

    userLogger.info('Response generated successfully', { 
      headlines: processedResult.headlines.length, 
      descriptions: processedResult.descriptions.length 
    });

    // Record metrics
    const totalDuration = Date.now() - startTime;
    metricsCollector.recordRequest(totalDuration);

    userLogger.info('Request completed successfully', { totalDurationMs: totalDuration });

    return new Response(JSON.stringify({
      headlines: processedResult.headlines,
      descriptions: processedResult.descriptions,
      usage: {
        provider: cleanedRequest.provider,
        model: cleanedRequest.model,
        locale: cleanedRequest.locale,
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