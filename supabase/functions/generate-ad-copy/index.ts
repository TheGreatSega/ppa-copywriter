import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to soft clamp text without cutting words hard
const softClamp = (text: string, limit: number) => {
  if (text.length <= limit) return text;
  const slice = text.slice(0, limit);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 10 ? slice.slice(0, lastSpace) : slice).trim();
};

// OpenAI API call
const generateWithOpenAI = async (prompt: string, model: string, maxTokens: number) => {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: `You are an expert Google Ads copywriter specializing in RSA (Responsive Search Ads). 
          Create compelling, compliant ad copy that:
          - Headlines: Max 30 characters, include keywords naturally
          - Descriptions: Max 90 characters, focus on benefits and CTAs
          - Use action words and emotional triggers
          - Ensure variety in messaging and angles
          - Follow Google Ads policies
          - Return ONLY the requested ad copy as JSON arrays`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI API error:', error);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// Gemini API call
const generateWithGemini = async (prompt: string, maxTokens: number) => {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are an expert Google Ads copywriter specializing in RSA (Responsive Search Ads). 
          Create compelling, compliant ad copy that:
          - Headlines: Max 30 characters, include keywords naturally
          - Descriptions: Max 90 characters, focus on benefits and CTAs
          - Use action words and emotional triggers
          - Ensure variety in messaging and angles
          - Follow Google Ads policies
          - Return ONLY the requested ad copy as JSON arrays
          
          ${prompt}`
        }]
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API error:', error);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
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
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limit
    const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_endpoint: 'generate-ad-copy',
      p_daily_limit: 50 // 50 requests per day
    });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      return new Response(JSON.stringify({ error: 'Rate limit check failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!rateLimitOk) {
      return new Response(JSON.stringify({ 
        error: 'Daily rate limit exceeded (50 requests per day)' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate request body
    const requestBody = await req.json();
    const {
      existingHeadlines = '',
      existingDescriptions = '',
      keywords = '',
      context = '',
      numHeadlines = 10,
      numDescriptions = 4,
      model = 'gpt-4o',
      softLimitClamp = true
    } = requestBody;

    // Input validation
    if (numHeadlines > 30 || numDescriptions > 30) {
      return new Response(JSON.stringify({ error: 'Too many items requested' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build comprehensive prompt
    const prompt = `Generate Google Ads RSA copy based on:

    EXISTING HEADLINES (for reference):
    ${existingHeadlines || 'None provided'}

    EXISTING DESCRIPTIONS (for reference):
    ${existingDescriptions || 'None provided'}

    TARGET KEYWORDS:
    ${keywords || 'None provided'}

    CONTEXT/OFFER:
    ${context || 'General business promotion'}

    REQUIREMENTS:
    - Generate ${numHeadlines} unique headlines (max 30 chars each)
    - Generate ${numDescriptions} unique descriptions (max 90 chars each)
    - Include keywords naturally where possible
    - Vary messaging angles and CTAs
    - Ensure compliance with Google Ads policies
    
    Return response as JSON with this exact format:
    {
      "headlines": ["headline1", "headline2", ...],
      "descriptions": ["description1", "description2", ...]
    }`;

    console.log('Generating with model:', model);
    console.log('User ID:', user.id);
    
    let generatedContent: string;

    // Generate content based on model selection
    if (model.includes('gpt') || model.includes('openai')) {
      generatedContent = await generateWithOpenAI(prompt, model, 2000);
    } else if (model.includes('gemini')) {
      generatedContent = await generateWithGemini(prompt, 2000);
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported model' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the generated content
    let parsedContent;
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse generated content:', parseError);
      console.log('Raw content:', generatedContent);
      
      // Fallback: create structured response from raw text
      const lines = generatedContent.split('\n').filter(line => line.trim());
      parsedContent = {
        headlines: lines.slice(0, numHeadlines).map(h => softClamp(h.replace(/^\d+\.?\s*/, ''), 30)),
        descriptions: lines.slice(numHeadlines, numHeadlines + numDescriptions).map(d => softClamp(d.replace(/^\d+\.?\s*/, ''), 90))
      };
    }

    // Apply soft clamping if enabled
    if (softLimitClamp) {
      parsedContent.headlines = parsedContent.headlines?.map((h: string) => softClamp(h, 30)) || [];
      parsedContent.descriptions = parsedContent.descriptions?.map((d: string) => softClamp(d, 90)) || [];
    }

    // Ensure we have the right number of items
    const headlines = parsedContent.headlines?.slice(0, numHeadlines) || [];
    const descriptions = parsedContent.descriptions?.slice(0, numDescriptions) || [];

    console.log(`Generated ${headlines.length} headlines and ${descriptions.length} descriptions`);

    return new Response(JSON.stringify({
      headlines,
      descriptions,
      usage: {
        model,
        timestamp: new Date().toISOString(),
        userId: user.id
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-ad-copy function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});