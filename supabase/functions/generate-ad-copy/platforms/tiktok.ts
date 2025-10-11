// TikTok Ads platform module

import type { GenerateRequest, GenerateResult, PlatformHandler } from "../types.ts";
import { sanitizeList } from "../utils/sanitize.ts";
import { formatKeywords, buildContextSection } from "../utils/format.ts";

const MAX_AD_TEXT_CHARS = 100;

export const TikTokPlatform: PlatformHandler = {
  key: "tiktok",

  systemPrompt: `You are a Gen-Z copywriter specializing in TikTok Ads.
Your job: write authentic, trend-aware ad copy that resonates with TikTok's young audience.

OUTPUT FORMAT (critical):
- Return STRICT JSON with exactly one top-level array: "adTexts".
- Array contains ONLY strings (no objects).
- No markdown, no code fences, no comments, no trailing commas.

ASSET LIMITS:
- Ad Text: max 100 characters (appears above video).

QUALITY RULES:
- Sound like a real person, not a brand - authenticity is key.
- Use casual, conversational language that feels native to TikTok.
- Reference video theme/concept to create cohesion.
- Tap into trends, memes, or cultural moments when appropriate.
- Create curiosity or FOMO to drive action.
- Use emojis naturally (not excessively).
- Avoid corporate jargon or overly polished language.
- Focus on entertainment value alongside messaging.
- Keep it short and punchy - TikTok users scroll fast.

Ensure every ad text ≤100 chars.
Ensure JSON is valid: { "adTexts": [...] }`,

  buildUserPrompt(req: GenerateRequest): string {
    const wantAdTexts = req.limits?.headlines ?? 10;
    
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
- ${wantAdTexts} TikTok ad captions (each ≤ ${MAX_AD_TEXT_CHARS} characters)

REQUIREMENTS
------------
1) **Character limits are hard caps**: Follow the exact character limits specified above.
2) **Authenticity**: Sound like a creator, not a brand. Be real, relatable, and conversational.
3) **Hook First**: Make the first 3 words count - TikTok users scroll fast.
4) **Entertainment Value**: Balance messaging with entertainment - this is TikTok, not LinkedIn.
5) **Emojis**: Use naturally where they fit, but don't overdo it.
6) **Variety**: Mix curiosity, FOMO, humor, and value propositions.
7) **Uniqueness**: No duplicates or near-duplicates.

OUTPUT FORMAT (JSON ONLY)
-------------------------
{
  "adTexts": [
    "Caption 1 (≤${MAX_AD_TEXT_CHARS} chars)",
    "... up to ${wantAdTexts}"
  ]
}`;
  },

  openAISchema: {
    type: "object",
    properties: {
      adTexts: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 30,
      },
    },
    required: ["adTexts"],
    additionalProperties: false,
  },

  geminiSchema: {
    type: "OBJECT",
    properties: {
      adTexts: {
        type: "ARRAY",
        items: { type: "STRING" },
        minItems: 1,
        maxItems: 30,
      },
    },
    required: ["adTexts"],
  },

  postprocess(raw: any, req: GenerateRequest): GenerateResult {
    const wantAdTexts = req.limits?.headlines ?? 10;

    const adTexts = sanitizeList(raw?.adTexts, {
      maxChars: MAX_AD_TEXT_CHARS,
      maxItems: wantAdTexts,
      locale: req.locale,
    });

    return { adTexts };
  },
};
