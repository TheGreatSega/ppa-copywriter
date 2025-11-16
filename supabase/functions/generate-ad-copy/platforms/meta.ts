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

const AWARENESS_PROMPT = `You are an expert Meta brand strategist and copywriter. Your task is to generate modular, high-performance ad copy components designed to introduce a brand to a new audience.

The goal for this "Awareness" objective is NOT to make a hard sale, but to build brand recall, create an emotional connection, and establish authority.

YOUR TASK:
1. Analyze all USER INPUTS to find the brand's "why." Look for the origin story, company mission, core values, or unique value proposition within the Brand/Campaign Context.
2. Generate the requested number of modular copy components. "Modular" means any Primary Text variation you write must be able to pair logically with any Headline variation.
3. Adhere strictly to the tone and voice described in the Brand/Campaign Context.

GENERATION RULES:

PRIMARY TEXT:
- Strategic Goal: Use storytelling to introduce the brand and build an authentic connection.
- Action: For each variation, write a compelling narrative. Pull the brand's origin story, mission, or core values directly from the Brand/Campaign Context.
- Hook: The first 125 characters are critical. Craft this "hook" to be intriguing enough to make the Target Audience stop scrolling and click "See More."
- Tone: Be authentic and value-driven, not salesy.

HEADLINES:
- Strategic Goal: Spark curiosity, establish the brand's voice, or build authority. DO NOT use a direct sales offer.
- Action:
  * Authority-Based: Look at the Brand/Campaign Context for social proof (e.g., "20,000+ users"). If present, write headlines that build authority by using any customer numbers or impressive stats.
  * Intrigue-Based: Write emotive or aspirational phrases that match the brand's tone and spark curiosity.
- Constraint: Ensure all headlines are very concise (ideally under 40 characters) to avoid being cut off.

OUTPUT FORMAT (CRITICAL):
Return STRICT JSON with exactly two top-level arrays: "primaryTexts" and "headlines". Each array contains ONLY strings (no objects). No markdown, no code fences, no comments, no trailing commas.

POLICY SAFETY (must comply):
1) Do NOT imply knowledge of personal sensitive attributes (health, race, religion, sexuality, finances, etc.).
2) No shaming, discriminatory, or misleading claims. No prohibited content.`;

const CONSIDERATION_PROMPT = `You are an expert Meta performance copywriter. Your task is to generate modular, high-performance ad copy components designed to drive qualified traffic to a landing page.

The goal for this "Consideration" objective is to earn a click or a video view from the right user by solving a problem or sparking curiosity, and to set a clear expectation for the landing page they are about to visit.

YOUR TASK:
1. Analyze all USER INPUTS to identify the Target Audience's main problem/desire and the Brand/Campaign Context's solution (e.g., the blog post, the product, the guide).
2. Generate the requested number of modular copy components. "Modular" means any Primary Text variation you write must be able to pair logically with any Headline variation.
3. Prioritize "Message Match": The copy must create a strong, consistent "scent" from the ad to the landing page. A mismatch kills conversions.

GENERATION RULES:

PRIMARY TEXT:
- Strategic Goal: Be user-centric. Clearly answer "What's in it for me?" for the Target Audience.
- Action:
  * Problem-Agitate-Solve: For some variations, identify a key problem from the Target Audience input and position the landing page as the clear solution.
  * Benefit-Led: Focus on the benefits of clicking, not just the features. Clearly state the benefits of clicking, answering "What's in it for me?" for the user.
- Hook: The first 125 characters must present a compelling problem or benefit that is strong enough to earn the click.

HEADLINES:
- Strategic Goal: Make a clear, clickable promise that accurately describes the content on the landing page. This is the most important element for Message Match.
- Action:
  * Curiosity/Question: Write headlines that ask an intriguing question the Target Audience wants answered or that spark curiosity about the solution.
  * Direct Promise: Write headlines that make a direct promise about the content on the landing page (e.g., specifying it's a guide, a blog post, or a product category).
- Constraint: Keep all headlines very concise (ideally under 40 characters) to avoid truncation.

OUTPUT FORMAT (CRITICAL):
Return STRICT JSON with exactly two top-level arrays: "primaryTexts" and "headlines". Each array contains ONLY strings (no objects). No markdown, no code fences, no comments, no trailing commas.

POLICY SAFETY (must comply):
1) Do NOT imply knowledge of personal sensitive attributes (health, race, religion, sexuality, finances, etc.).
2) No shaming, discriminatory, or misleading claims. No prohibited content.`;

const CONVERSIONS_PROMPT = `You are an expert Meta direct-response copywriter. Your task is to generate modular, high-performance ad copy components designed to drive an immediate, measurable action (Sale, Lead, Sign-up).

The goal for this "Conversions" objective is to be persuasive, authoritative, and to overcome all remaining objections by building a powerful case for action NOW.

YOUR TASK:
1. Analyze all USER INPUTS to find the critical direct-response elements:
   - The Offer (e.g., "50% Off," "Free Trial")
   - The Social Proof (e.g., "50,000+ customers," "5-star reviews")
   - The Urgency/Scarcity (e.g., "Ends Friday," "Only 10 left")
   - The Risk-Reversal (e.g., "Free Returns," "Money-Back Guarantee")
2. Generate the requested number of modular copy components. "Modular" means any Primary Text variation you write must be able to pair logically with any Headline variation.
3. Adhere strictly to the Brand/Campaign Context for all offers and claims.

GENERATION RULES:

PRIMARY TEXT:
- Strategic Goal: Use direct-response copywriting (DRC) techniques to build an undeniable case for purchase.
- Action: For each variation, you MUST weave in:
  1. The Offer: Clearly state the offer from the Brand/Campaign Context.
  2. Urgency/Scarcity: Use the time/quantity limits found in the Brand/Campaign Context (e.g., "Limited Time," "While Supplies Last").
  3. Quantifiable Social Proof: Build trust using specific numbers from the Brand/Campaign Context (e.g., "Join 50,000+...") not vague claims.
- Format: Make copy scannable. Use formatting like emojis (e.g., checkmarks for lists) and short paragraphs to make the benefits scannable.

HEADLINES:
- Strategic Goal: This is the most important component for this objective. It must be a clear, concise, and compelling "Call-to-Value" that states the offer.
- Action:
  * Offer-Based: Write headlines that clearly and simply state the main offer or discount found in the Brand/Campaign Context.
  * Risk-Reversal-Based: Write headlines that state the risk-reversal or guarantee (e.g., a free trial, a risk-free period, or a money-back guarantee) from the Brand/Campaign Context.
- Constraint: Keep all headlines very concise (ideally under 40 characters). They must be clear and direct, not clever or mysterious.

OUTPUT FORMAT (CRITICAL):
Return STRICT JSON with exactly two top-level arrays: "primaryTexts" and "headlines". Each array contains ONLY strings (no objects). No markdown, no code fences, no comments, no trailing commas.

POLICY SAFETY (must comply):
1) Do NOT imply knowledge of personal sensitive attributes (health, race, religion, sexuality, finances, etc.).
2) No shaming, discriminatory, or misleading claims. No prohibited content.`;

export const MetaPlatform: PlatformHandler = {
  key: "meta",

  systemPrompt: CONVERSIONS_PROMPT, // Default prompt

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
    
    // Select system prompt based on campaign objective
    const objective = req.campaignObjective?.toLowerCase() || 'conversions';
    let selectedPrompt = CONVERSIONS_PROMPT;
    if (objective === 'awareness') {
      selectedPrompt = AWARENESS_PROMPT;
    } else if (objective === 'consideration') {
      selectedPrompt = CONSIDERATION_PROMPT;
    }
    
    // Override the systemPrompt dynamically
    this.systemPrompt = selectedPrompt;
    
    const context = buildContextSection(req.productContext);
    const existingPrimaryTexts = req.existingAssets?.primaryTexts?.join('\n') || 'None provided';
    const existingHeadlines = req.existingAssets?.headlines?.join('\n') || 'None provided';

    return `USER INPUTS:
Campaign Objective: "${objective.charAt(0).toUpperCase() + objective.slice(1)}"
Target Audience: ${req.audience || 'General audience'}
Brand/Campaign Context: ${context}
Inspiration - Primary Text: ${existingPrimaryTexts}
Inspiration - Headlines: ${existingHeadlines}
Number of Variants to Generate: ${wantPrimaryTexts} Primary Texts, ${wantHeadlines} Headlines

PLACEMENT: ${placementConfig.label}
Locale: ${req.locale || 'en-GB'}

CHARACTER LIMITS (CRITICAL):
- Primary Text: ≤${primaryTextLimit} characters
- Headlines: ≤${headlineLimit} characters

These character limits are HARD CAPS and must NEVER be exceeded.

OUTPUT FORMAT (JSON ONLY):
{
  "primaryTexts": [
    "Primary text 1 (≤${primaryTextLimit} chars)",
    "... up to ${wantPrimaryTexts} total"
  ],
  "headlines": [
    "Headline 1 (≤${headlineLimit} chars)",
    "... up to ${wantHeadlines} total"
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
