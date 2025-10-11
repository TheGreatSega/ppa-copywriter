// Google Ads RSA platform module

import type { GenerateRequest, GenerateResult, PlatformHandler } from "../types.ts";
import { sanitizeList } from "../utils/sanitize.ts";
import { formatExistingAssets, formatKeywords, buildContextSection } from "../utils/format.ts";

const MAX_HEADLINE_CHARS = 30;
const MAX_DESC_CHARS = 90;

export const GooglePlatform: PlatformHandler = {
  key: "google",

  systemPrompt: `You are a senior performance marketing copywriter specializing in Google Ads Responsive Search Ads (RSAs). 
Your job: write SHORT, highly converting, policy-compliant ad assets that match the user's inputs.

OUTPUT FORMAT (critical):
- Return STRICT JSON with exactly two top-level arrays: "headlines" and "descriptions".
- Each array contains ONLY strings (no objects).
- No markdown, no code fences, no comments, no trailing commas, no extra keys.

ASSET LIMITS:
- Headlines: max 30 characters each (hard limit).
- Descriptions: max 90 characters each (hard limit).

QUALITY RULES:
- Write clear, benefit-led, specific copy. Front-load value.
- Use plain, natural language. Avoid buzzwords and fluff.
- Vary angles: benefits, outcomes, social proof (if provided), urgency (if justified), risk-reversal.
- Include the primary keyword naturally in at least 40% of headlines and 50% of descriptions.
- Prefer active voice and concrete nouns/verbs.
- Avoid duplicate or near-duplicate lines.
- Mobile-first readability: keep lines self-contained.
- Allowed punctuation sparingly; no excessive CAPS; at most one "!" across entire set.
- No clickbait, unverifiable claims, or fake numbers.

Ensure every headline ≤30 chars; every description ≤90 chars.
Remove duplicates/near-duplicates.
Ensure JSON is valid: { "headlines": [...], "descriptions": [...] }`,

  buildUserPrompt(req: GenerateRequest): string {
    const wantHeadlines = req.limits?.headlines ?? 15;
    const wantDescriptions = req.limits?.descriptions ?? 4;

    const context = buildContextSection(req.productContext);
    const keywords = formatKeywords(req.keywords);
    const existingAssets = formatExistingAssets(req.existingAssets?.headlines, req.existingAssets?.descriptions);

    return `CONTEXT
------
Brand/Campaign Notes:
${context}${existingAssets}

Keywords & Search Queries (raw):
${keywords}

Locale: ${req.locale || "en-GB"}

TASK
----
Create:
- ${wantHeadlines} Google Ads RSA headlines (each ≤ ${MAX_HEADLINE_CHARS} characters)
- ${wantDescriptions} Google Ads RSA descriptions (each ≤ ${MAX_DESC_CHARS} characters)

REQUIREMENTS
------------
1) Character limits are hard caps: Follow the exact character limits specified above. Do not exceed.
2) Coverage & Variety: Provide a balanced mix across intent buckets. Include at least some lines that emphasise:
   - Core benefit/value (e.g., save money/time, quality, reliability)
   - Specific features/USPs from the context
   - Social proof or credibility (ratings, awards, scale)
   - Offer/price/promo (if in context)
   - Urgency/scarcity when appropriate (no fake claims)
   - Clear CTA variants (e.g., "Get Quote", "Compare Now")
3) Keyword use: Naturally include relevant head terms from the supplied keywords/search queries where they fit. Avoid awkward stuffing.
4) Compliance & Safety: Avoid prohibited claims, exaggerated superlatives, or medical/financial guarantees unless explicitly allowed. No emojis.
5) Uniqueness: No duplicates or near-duplicates; each line must deliver a distinct angle.
6) Grammar & Casing: Concise sentence or Title Case; avoid ALL CAPS & multiple exclamation marks.

OUTPUT FORMAT (JSON ONLY)
-------------------------
{
  "headlines": [
    "H1 (≤${MAX_HEADLINE_CHARS} chars)",
    "H2 (≤${MAX_HEADLINE_CHARS} chars)",
    "... up to ${wantHeadlines}"
  ],
  "descriptions": [
    "D1 (≤${MAX_DESC_CHARS} chars)",
    "D2 (≤${MAX_DESC_CHARS} chars)",
    "... up to ${wantDescriptions}"
  ]
}

QUALITY CHECK (self-verify before answering)
--------------------------------------------
- Arrays match requested counts.
- No item exceeds the char limits.
- No duplicates/near-duplicates.
- At least some items include key head terms naturally.`;
  },

  openAISchema: {
    type: "object",
    properties: {
      headlines: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 30,
      },
      descriptions: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 30,
      },
    },
    required: ["headlines", "descriptions"],
    additionalProperties: false,
  },

  geminiSchema: {
    type: "OBJECT",
    properties: {
      headlines: {
        type: "ARRAY",
        items: { type: "STRING" },
        minItems: 1,
        maxItems: 30,
      },
      descriptions: {
        type: "ARRAY",
        items: { type: "STRING" },
        minItems: 1,
        maxItems: 30,
      },
    },
    required: ["headlines", "descriptions"],
  },

  postprocess(raw: any, req: GenerateRequest): GenerateResult {
    const wantHeadlines = req.limits?.headlines ?? 15;
    const wantDescriptions = req.limits?.descriptions ?? 4;

    const headlines = sanitizeList(raw?.headlines, {
      maxChars: MAX_HEADLINE_CHARS,
      maxItems: wantHeadlines,
      locale: req.locale,
    });

    const descriptions = sanitizeList(raw?.descriptions, {
      maxChars: MAX_DESC_CHARS,
      maxItems: wantDescriptions,
      locale: req.locale,
    });

    return { headlines, descriptions };
  },
};
