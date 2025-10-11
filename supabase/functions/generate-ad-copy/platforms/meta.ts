// Meta Ads (Facebook & Instagram) platform module

import type { GenerateRequest, GenerateResult, PlatformHandler } from "../types.ts";
import { sanitizeList } from "../utils/sanitize.ts";
import { formatKeywords, buildContextSection } from "../utils/format.ts";

// Placement-specific character limits for Meta Ads
export const META_PLACEMENTS = {
  'feed-general': {
    label: 'Facebook & Instagram Feed (General)',
    primaryText: 125,
    headline: 40,
  },
  'facebook-image': {
    label: 'Facebook Image (Feed)',
    primaryText: 150,
    headline: 27,
  },
  'facebook-video': {
    label: 'Facebook Video (Feed)',
    primaryText: 80,
    headline: 27,
  },
  'facebook-reels': {
    label: 'Facebook Reels',
    primaryText: 40,
    headline: 55,
  },
  'facebook-carousel': {
    label: 'Facebook Carousel (Feed)',
    primaryText: 80,
    headline: 45,
  },
  'instagram-feed': {
    label: 'Instagram Feed',
    primaryText: 125,
    headline: 40,
  }
} as const;

export type MetaPlacement = keyof typeof META_PLACEMENTS;

export const MetaPlatform: PlatformHandler = {
  key: "meta",

  systemPrompt: `You are a social-media copywriter specializing in Meta Ads (Facebook & Instagram).
Your job: write engaging, scroll-stopping sales-focused ad copy that converts.

OUTPUT FORMAT (critical):

1) Return STRICT JSON with exactly two top-level arrays: "primaryTexts" and "headlines".
2) Each array contains ONLY strings (no objects).
3) No markdown, no code fences, no comments, no trailing commas.

ASSET LIMITS (hard caps):

1) Primary Text: ≤125 characters (fits most feed placements).
2) Headlines: ≤27 characters (tight headline limit).

COPY FORMULA (apply to every line):

1) Hook → Benefit → Proof/credibility → CTA/urgency (as space allows).
2) Lead with a HOOK in the first 5 words (question, bold claim, relatable pain).
3) State a clear benefit (time/money saved, ease, relief, status).
4) Add one proof element when possible (metric, rating, user count, guarantee).
5) End with a directive (Shop now, Get started, Try it today) and honest urgency if relevant.

QUALITY RULES:

1) Conversational, human, social-native; short sentences; active voice; plain words.
2) Numbers beat adjectives (e.g., “Save £120/yr”, “20,000+ customers”).
3) Use emotion with restraint (pain→relief, aspiration, FOMO) but stay authentic.
4) Create curiosity without clickbait or overpromising.
5) Emojis: optional, sparing, brand-appropriate. No hashtags unless asked.
6) Align with the stated campaign objective (awareness/consideration/conversion) and any provided audience/product/offer/proof.
7) Variety across lines: mix questions, benefits, social proof, urgency, offers.
8) No duplicates or near-duplicates. No excessive punctuation or ALL CAPS.

POLICY SAFETY (must comply):

1) Do NOT imply knowledge of personal sensitive attributes (health, race, religion, sexuality, finances, etc.).
2) No shaming, discriminatory, or misleading claims. No prohibited content.

CONSTRUCTION CHECKS (before output):

1) Every primary text ≤125 chars; every headline ≤27 chars.
2) Hook is front-loaded; one idea per sentence; remove filler.
3) If inputs include target audience, offer, USP, or proof, weave them naturally within limits.
4) Ensure JSON is valid: { "primaryTexts": [...], "headlines": [...] }`,

  buildUserPrompt(req: GenerateRequest): string {
    const wantPrimaryTexts = req.limits?.primaryTexts ?? 10;
    const wantHeadlines = req.limits?.headlines ?? 5;
    
    // Get placement-specific limits or fallback to defaults
    const placement = req.placement as MetaPlacement | undefined;
    const placementConfig = placement && META_PLACEMENTS[placement] 
      ? META_PLACEMENTS[placement] 
      : META_PLACEMENTS['feed-general'];
    
    const primaryTextLimit = placementConfig.primaryText;
    const headlineLimit = placementConfig.headline;
    
    const context = buildContextSection(req.productContext);
    const keywords = formatKeywords(req.keywords);

    return `CONTEXT
------
Brand/Campaign Notes:
${context}

Keywords/Themes:
${keywords}

Locale: ${req.locale || 'en-GB'}
Placement: ${placementConfig.label}

TASK
----
Create:
- ${wantPrimaryTexts} Primary Texts (each ≤ ${primaryTextLimit} characters)
- ${wantHeadlines} Headlines (each ≤ ${headlineLimit} characters)

REQUIREMENTS
------------
1) Character limits are hard caps—never exceed them.
2) Hooks must grab attention within the first 5 words.
3) Sound like a person, not a corporation.
4) Use the formula (Hook→Benefit→Proof→CTA) and include urgency when honest.
5) Provide diverse angles; no repeats.
6) CRITICAL: Respect the placement-specific character limits (Primary Text: ${primaryTextLimit}, Headlines: ${headlineLimit}).

OUTPUT FORMAT (JSON ONLY)
-------------------------
{
  "primaryTexts": [
    "Primary text 1 (≤${primaryTextLimit} chars)",
    "... up to ${wantPrimaryTexts}"
  ],
  "headlines": [
    "H1 (≤${headlineLimit} chars)",
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

    // Get placement-specific limits or fallback to defaults
    const placement = req.placement as MetaPlacement | undefined;
    const placementConfig = placement && META_PLACEMENTS[placement] 
      ? META_PLACEMENTS[placement] 
      : META_PLACEMENTS['feed-general'];

    const primaryTexts = sanitizeList(raw?.primaryTexts, {
      maxChars: placementConfig.primaryText,
      maxItems: wantPrimaryTexts,
      locale: req.locale,
    });

    const headlines = sanitizeList(raw?.headlines, {
      maxChars: placementConfig.headline,
      maxItems: wantHeadlines,
      locale: req.locale,
    });

    return { primaryTexts, headlines };
  },
};
