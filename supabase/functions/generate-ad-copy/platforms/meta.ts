// Meta Ads (Facebook & Instagram) platform module

import type { GenerateRequest, GenerateResult, PlatformHandler } from "../types.ts";
import { sanitizeList } from "../utils/sanitize.ts";
import { formatKeywords, buildContextSection } from "../utils/format.ts";

const MAX_PRIMARY_TEXT_CHARS = 125;
const MAX_HEADLINE_CHARS = 27;

export const MetaPlatform: PlatformHandler = {
  key: "meta",

  systemPrompt: `You are a social media copywriter specializing in Meta Ads (Facebook & Instagram).
Your job: write engaging, scroll-stopping ad copy that resonates with social media users.

OUTPUT FORMAT (critical):
- Return STRICT JSON with exactly two top-level arrays: "primaryTexts" and "headlines".
- Each array contains ONLY strings (no objects).
- No markdown, no code fences, no comments, no trailing commas.

ASSET LIMITS:
- Primary Text: max 125 characters (optimal for feed).
- Headlines: max 27 characters each (hard limit).

QUALITY RULES:
- Start with a hook that stops the scroll (question, bold statement, relatable pain point).
- Use conversational, friendly tone that feels native to social media.
- Focus on emotional benefits and social proof.
- Create curiosity without being clickbait.
- Use emojis sparingly and only if brand-appropriate.
- Reference target audience demographics and interests when provided.
- Align with campaign objective (awareness, consideration, or conversion).
- No excessive punctuation or ALL CAPS.

Ensure every primary text ≤125 chars; every headline ≤27 chars.
Ensure JSON is valid: { "primaryTexts": [...], "headlines": [...] }`,

  buildUserPrompt(req: GenerateRequest): string {
    const wantPrimaryTexts = req.limits?.primaryTexts ?? 10;
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
- ${wantPrimaryTexts} Primary Texts (each ≤ ${MAX_PRIMARY_TEXT_CHARS} characters)
- ${wantHeadlines} Headlines (each ≤ ${MAX_HEADLINE_CHARS} characters)

REQUIREMENTS
------------
1) **Character limits are hard caps**: Follow the exact character limits specified above.
2) **Hook & Engagement**: Primary texts must grab attention in the first 5 words.
3) **Social Native**: Write like a person, not a corporation. Sound authentic and relatable.
4) **Variety**: Mix emotional triggers, benefits, questions, and social proof angles.
5) **Uniqueness**: No duplicates or near-duplicates.

OUTPUT FORMAT (JSON ONLY)
-------------------------
{
  "primaryTexts": [
    "Primary text 1 (≤${MAX_PRIMARY_TEXT_CHARS} chars)",
    "... up to ${wantPrimaryTexts}"
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
      primaryTexts: {
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
    required: ["primaryTexts", "headlines"],
    additionalProperties: false,
  },

  geminiSchema: {
    type: "OBJECT",
    properties: {
      primaryTexts: {
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
    required: ["primaryTexts", "headlines"],
  },

  postprocess(raw: any, req: GenerateRequest): GenerateResult {
    const wantPrimaryTexts = req.limits?.primaryTexts ?? 10;
    const wantHeadlines = req.limits?.headlines ?? 5;

    const primaryTexts = sanitizeList(raw?.primaryTexts, {
      maxChars: MAX_PRIMARY_TEXT_CHARS,
      maxItems: wantPrimaryTexts,
      locale: req.locale,
    });

    const headlines = sanitizeList(raw?.headlines, {
      maxChars: MAX_HEADLINE_CHARS,
      maxItems: wantHeadlines,
      locale: req.locale,
    });

    return { primaryTexts, headlines };
  },
};
