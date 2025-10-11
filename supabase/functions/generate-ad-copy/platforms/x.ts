// X (Twitter) Ads platform module

import type { GenerateRequest, GenerateResult, PlatformHandler } from "../types.ts";
import { sanitizeList } from "../utils/sanitize.ts";
import { formatKeywords, buildContextSection } from "../utils/format.ts";

const MAX_TWEET_CHARS = 280;
const MAX_HEADLINE_CHARS = 70;

export const XPlatform: PlatformHandler = {
  key: "x",

  systemPrompt: `You are a social media copywriter specializing in X (Twitter) Ads.
Your job: write concise, engaging ad copy optimized for X's fast-paced environment.

OUTPUT FORMAT (critical):
- Return STRICT JSON with exactly two top-level arrays: "tweets" and "headlines".
- Each array contains ONLY strings (no objects).
- No markdown, no code fences, no comments, no trailing commas.

ASSET LIMITS:
- Tweets: max 280 characters (including hashtags).
- Headlines: max 70 characters (for website cards).

QUALITY RULES:
- Get to the point immediately - no fluff.
- Use a conversational, authentic tone that matches the platform.
- Include relevant hashtags naturally (2-3 max).
- Reference trending topics or timely themes when appropriate.
- Create engagement hooks (questions, bold statements, surprising facts).
- Match specified tone (professional, casual, witty, inspirational).
- Use line breaks for readability when needed.
- Avoid promotional language that feels salesy.

Ensure every tweet ≤280 chars; every headline ≤70 chars.
Ensure JSON is valid: { "tweets": [...], "headlines": [...] }`,

  buildUserPrompt(req: GenerateRequest): string {
    const wantTweets = req.limits?.descriptions ?? 10;
    const wantHeadlines = req.limits?.headlines ?? 5;
    
    const context = buildContextSection(req.productContext);
    const keywords = formatKeywords(req.keywords);

    return `CONTEXT
------
Brand/Campaign Notes:
${context}

Keywords/Themes:
${keywords}

Locale: ${req.locale || 'en-GB'}

TASK
----
Create:
- ${wantTweets} Tweet texts (each ≤ ${MAX_TWEET_CHARS} characters)
- ${wantHeadlines} Short headlines (each ≤ ${MAX_HEADLINE_CHARS} characters)

REQUIREMENTS
------------
1) **Character limits are hard caps**: Follow the exact character limits specified above.
2) **Authenticity**: Sound like a real person having a conversation, not a brand broadcasting.
3) **Engagement**: Use hooks that make people want to reply, retweet, or click.
4) **Hashtags**: Include 1-3 relevant hashtags per tweet when appropriate.
5) **Variety**: Mix questions, statements, facts, and CTAs.
6) **Uniqueness**: No duplicates or near-duplicates.

OUTPUT FORMAT (JSON ONLY)
-------------------------
{
  "tweets": [
    "Tweet 1 (≤${MAX_TWEET_CHARS} chars)",
    "... up to ${wantTweets}"
  ],
  "headlines": [
    "H1 (≤${MAX_HEADLINE_CHARS} chars)",
    "... up to ${wantHeadlines}"
  ]
}`;
  },

  openAISchema: {
    type: "object",
    properties: {
      tweets: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 30,
      },
      headlines: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 30,
      },
    },
    required: ["tweets", "headlines"],
    additionalProperties: false,
  },

  geminiSchema: {
    type: "OBJECT",
    properties: {
      tweets: {
        type: "ARRAY",
        items: { type: "STRING" },
        minItems: 1,
        maxItems: 30,
      },
      headlines: {
        type: "ARRAY",
        items: { type: "STRING" },
        minItems: 1,
        maxItems: 30,
      },
    },
    required: ["tweets", "headlines"],
  },

  postprocess(raw: any, req: GenerateRequest): GenerateResult {
    const wantTweets = req.limits?.descriptions ?? 10;
    const wantHeadlines = req.limits?.headlines ?? 5;

    const tweets = sanitizeList(raw?.tweets, {
      maxChars: MAX_TWEET_CHARS,
      maxItems: wantTweets,
      locale: req.locale,
    });

    const headlines = sanitizeList(raw?.headlines, {
      maxChars: MAX_HEADLINE_CHARS,
      maxItems: wantHeadlines,
      locale: req.locale,
    });

    return { tweets, headlines };
  },
};
